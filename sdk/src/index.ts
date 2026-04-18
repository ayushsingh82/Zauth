// ZAuth HashKey SDK
//
// Public flow:
//   1. getChallenge(siteId)       -> { challengeId, nonce, expirySec, difficulty }
//   2. generateProof(challenge)   -> Groth16 proof payload (real snarkjs proof)
//   3. verify(challengeId, proof) -> server forwards to on-chain Groth16 verifier
//
// Proof generation runs in the browser (or Node) via snarkjs' wasm witness +
// Groth16 prover. The artifacts (wasm + final zkey) must be served under
// `artifactBaseUrl`; we ship a helper to pick a sensible default.
import { z } from 'zod';
// snarkjs has no types; we import it dynamically inside generateProof so this
// module stays usable in environments that never call generateProof (e.g. a
// server that only calls verify).
// circomlibjs is only needed on the prover side.

const challengeSchema = z.object({
  challengeId: z.string(),
  nonce: z.string(),
  // Seconds since epoch. Matches the `expiry` public signal in the circuit.
  expirySec: z.number(),
  difficulty: z.number(),
  expiresAt: z.string()
});

const verifyBooleanSchema = z.object({
  success: z.boolean()
});

const proofSchema = z.object({
  proofData: z.string().optional(),
  publicInputs: z.array(z.string()),
  groth16: z.object({
    a: z.tuple([z.string(), z.string()]),
    b: z.tuple([
      z.tuple([z.string(), z.string()]),
      z.tuple([z.string(), z.string()])
    ]),
    c: z.tuple([z.string(), z.string()]),
    input: z.array(z.string())
  }).optional()
});

const verificationResultSchema = z.object({
  success: z.boolean(),
  verificationId: z.string(),
  token: z.string(),
  expiresAt: z.string()
});

export type Challenge = z.infer<typeof challengeSchema>;
export type Proof = z.infer<typeof proofSchema>;
export type VerificationResult = z.infer<typeof verificationResultSchema>;

export interface SdkOptions {
  // Where to fetch zauth.wasm and zauth_final.zkey from. Default:
  // "<challengeApiUrl>/artifacts" (served by the verifier-server) with a
  // fallback to "/zauth" so demo apps can drop artifacts into their own
  // /public folder.
  artifactBaseUrl?: string;
  // Compile-time difficulty of the deployed circuit. Must match the circom
  // `component main = ZAuthHumanness(<n>)` value.
  difficulty?: number;
}

// Top `difficulty` bits of a 254-bit hash must be zero. Mirrors the circuit.
function meetsDifficulty(h: bigint, difficulty: number): boolean {
  return h < (1n << BigInt(254 - difficulty));
}

function randomFieldElement(): bigint {
  // Browser: crypto.getRandomValues. Node: webcrypto polyfill (>=16).
  const cryptoObj: Crypto = (globalThis as any).crypto;
  const bytes = new Uint8Array(31);
  cryptoObj.getRandomValues(bytes);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return BigInt('0x' + hex);
}

export class HashkeyCaptchaSdk {
  private initialized = false;
  private readonly options: Required<SdkOptions>;

  constructor(
    private readonly challengeApiUrl: string,
    private readonly verifierApiUrl: string,
    options: SdkOptions = {}
  ) {
    this.options = {
      artifactBaseUrl: options.artifactBaseUrl ?? '/zauth',
      difficulty: options.difficulty ?? 8
    };
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async generateProof(challenge: Challenge): Promise<Proof> {
    if (!this.initialized) await this.initialize();

    const [snarkjsMod, circomlibMod] = await Promise.all([
      import('snarkjs') as Promise<any>,
      import('circomlibjs') as Promise<any>
    ]);
    const snarkjs = snarkjsMod.default ?? snarkjsMod;
    const buildPoseidon = (circomlibMod.default ?? circomlibMod).buildPoseidon;

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const nonce = BigInt(challenge.nonce);
    const expiry = BigInt(challenge.expirySec);
    const secret = randomFieldElement();
    const difficulty = challenge.difficulty ?? this.options.difficulty;

    // Local PoW mining. Cheap client-side work that raises cost for spammers.
    // Expected iterations: 2^difficulty. For difficulty=8 this is ~256 tries.
    let solution = 0n;
    const maxAttempts = 1 << (difficulty + 6); // generous ceiling
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = randomFieldElement();
      const h = F.toObject(poseidon([nonce, candidate]));
      if (meetsDifficulty(h, difficulty)) {
        solution = candidate;
        break;
      }
    }
    if (solution === 0n) {
      throw new Error('ZAUTH_POW_TIMEOUT: unable to find solution within bounded attempts');
    }

    const input = {
      secret: secret.toString(),
      solution: solution.toString(),
      nonce: nonce.toString(),
      expiry: expiry.toString()
    };

    const wasmUrl = `${this.options.artifactBaseUrl}/zauth.wasm`;
    const zkeyUrl = `${this.options.artifactBaseUrl}/zauth_final.zkey`;

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input, wasmUrl, zkeyUrl
    );

    // snarkjs returns `pi_b` in (x, y) order but the Solidity verifier expects
    // each G2 coordinate with the components swapped. `exportSolidityCallData`
    // applies the swap and returns calldata strings; we parse that back into
    // structured form for the JSON API.
    const callDataRaw: string = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    const [a, b, c, input4] = JSON.parse('[' + callDataRaw + ']') as [
      [string, string],
      [[string, string], [string, string]],
      [string, string],
      string[]
    ];

    return {
      publicInputs: publicSignals,
      groth16: {
        a: [a[0], a[1]],
        b: [
          [b[0][0], b[0][1]],
          [b[1][0], b[1][1]]
        ],
        c: [c[0], c[1]],
        input: input4
      }
    };
  }

  async getChallenge(siteId: string): Promise<Challenge> {
    const response = await fetch(`${this.challengeApiUrl}/api/challenge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteId })
    });
    if (!response.ok) throw new Error(`Challenge request failed: ${response.status}`);
    return challengeSchema.parse(await response.json());
  }

  async verify(challengeId: string, proof: Proof, siteId?: string): Promise<VerificationResult> {
    const response = await fetch(`${this.verifierApiUrl}/api/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ challengeId, proof, siteId })
    });
    if (!response.ok) throw new Error(`Verify request failed: ${response.status}`);
    return verificationResultSchema.parse(await response.json());
  }

  async verifyOnchain(proofData: string, publicInputs: string[]): Promise<boolean> {
    const response = await fetch(`${this.verifierApiUrl}/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ proof: proofData, publicInputs })
    });
    if (!response.ok) throw new Error(`Onchain verify failed: ${response.status}`);
    return verifyBooleanSchema.parse(await response.json()).success;
  }
}
