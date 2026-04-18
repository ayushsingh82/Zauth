import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { createPublicClient, getAddress, http } from 'viem';
import { z } from 'zod';

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const HASHKEY_RPC_URL = process.env.HASHKEY_RPC_URL;
const HASHKEY_CHAIN_ID = Number(process.env.HASHKEY_CHAIN_ID || 133);
const VERIFIER_CONTRACT = process.env.VERIFIER_CONTRACT;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const CHALLENGE_EXPIRY_SECONDS = Number(process.env.CHALLENGE_EXPIRY_SECONDS || 300);
const VERIFIER_MODE = (process.env.VERIFIER_MODE || 'groth16').toLowerCase();

if (!HASHKEY_RPC_URL || !VERIFIER_CONTRACT) {
  throw new Error('Missing required env: HASHKEY_RPC_URL and VERIFIER_CONTRACT');
}
const VERIFIER_CONTRACT_ADDRESS = getAddress(VERIFIER_CONTRACT);

const verifierAbi = [
  {
    type: 'function',
    name: 'verifyProof',
    stateMutability: 'view',
    inputs: [
      { name: 'proof', type: 'bytes' },
      { name: 'publicInputs', type: 'uint256[]' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

// snarkjs emits a fixed-size `uint[N] _pubSignals` per circuit. Our ZAuth
// circuit exposes 4 public signals: [commitment, powHash, nonce, expiry].
const groth16VerifierAbi = [
  {
    type: 'function',
    name: 'verifyProof',
    stateMutability: 'view',
    inputs: [
      { name: '_pA', type: 'uint256[2]' },
      { name: '_pB', type: 'uint256[2][2]' },
      { name: '_pC', type: 'uint256[2]' },
      { name: '_pubSignals', type: 'uint256[4]' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

const ZAUTH_PUBLIC_SIGNAL_COUNT = 4;

const verifySchema = z.object({
  proof: z.string().min(2),
  publicInputs: z.array(z.string()).default([])
});

const groth16ProofSchema = z.object({
  a: z.tuple([z.string(), z.string()]),
  b: z.tuple([
    z.tuple([z.string(), z.string()]),
    z.tuple([z.string(), z.string()])
  ]),
  c: z.tuple([z.string(), z.string()]),
  input: z.array(z.string())
});

const challengeRequestSchema = z.object({
  siteId: z.string().optional()
});

const legacyProofSchema = z.object({
  proofData: z.string().optional(),
  publicInputs: z.array(z.string()).default([]),
  groth16: groth16ProofSchema.optional()
});

const legacyVerifySchema = z.object({
  challengeId: z.string(),
  proof: legacyProofSchema,
  siteId: z.string().optional()
});

type ChallengeRecord = {
  challengeId: string;
  // Nonce as decimal string of a BN254 field element. We use decimal because
  // circom/snarkjs consume field inputs as decimal strings.
  nonce: string;
  // Unix seconds; matches the circuit's `expiry` public signal exactly.
  expirySec: number;
  difficulty: number;
  siteId: string;
  expiresAt: number;
};

const challenges = new Map<string, ChallengeRecord>();

async function verifyProofOnchain(args: { proofData?: string; publicInputs: string[]; groth16?: z.infer<typeof groth16ProofSchema> }) {
  if (VERIFIER_MODE === 'groth16') {
    if (!args.groth16) {
      throw new Error('GROTH16_PROOF_REQUIRED');
    }
    if (args.groth16.input.length !== ZAUTH_PUBLIC_SIGNAL_COUNT) {
      throw new Error(
        `INVALID_PUBLIC_SIGNALS: expected ${ZAUTH_PUBLIC_SIGNAL_COUNT}, got ${args.groth16.input.length}`
      );
    }
    const [i0, i1, i2, i3] = args.groth16.input.map((v) => BigInt(v));
    return client.readContract({
      address: VERIFIER_CONTRACT_ADDRESS,
      abi: groth16VerifierAbi,
      functionName: 'verifyProof',
      args: [
        [BigInt(args.groth16.a[0]), BigInt(args.groth16.a[1])],
        [
          [BigInt(args.groth16.b[0][0]), BigInt(args.groth16.b[0][1])],
          [BigInt(args.groth16.b[1][0]), BigInt(args.groth16.b[1][1])]
        ],
        [BigInt(args.groth16.c[0]), BigInt(args.groth16.c[1])],
        [i0, i1, i2, i3]
      ]
    });
  }

  if (!args.proofData) {
    throw new Error('PROOF_DATA_REQUIRED');
  }

  return client.readContract({
    address: VERIFIER_CONTRACT_ADDRESS,
    abi: verifierAbi,
    functionName: 'verifyProof',
    args: [args.proofData as `0x${string}`, args.publicInputs.map((v) => BigInt(v))]
  });
}

const client = createPublicClient({
  chain: {
    id: HASHKEY_CHAIN_ID,
    name: 'hashkey-testnet',
    nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
    rpcUrls: { default: { http: [HASHKEY_RPC_URL] } }
  },
  transport: http(HASHKEY_RPC_URL)
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_, res) => {
  res.json({
    ok: true,
    chainId: HASHKEY_CHAIN_ID,
    rpc: HASHKEY_RPC_URL,
    verifierMode: VERIFIER_MODE
  });
});

// BN254 scalar field modulus. Any nonce must be smaller than this so it
// round-trips through the circuit unchanged.
const BN254_R = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function randomFieldElement(): bigint {
  // 31 bytes = 248 bits -> always < r.
  return BigInt('0x' + randomBytes(31).toString('hex'));
}

app.post('/api/challenge', (req, res) => {
  try {
    const body = challengeRequestSchema.parse(req.body);
    const challengeId = uuidv4();
    // Decimal field element; fits in one uint256 public signal.
    const nonce = randomFieldElement().toString();
    // Circuit uses a compile-time difficulty of 8 bits. Clients should respect it.
    const difficulty = 8;
    const expirySec = Math.floor(Date.now() / 1000) + CHALLENGE_EXPIRY_SECONDS;
    const expiresAt = expirySec * 1000;
    const siteId = body.siteId || 'default';

    challenges.set(challengeId, {
      challengeId,
      nonce,
      expirySec,
      difficulty,
      siteId,
      expiresAt
    });

    res.json({
      challengeId,
      nonce,
      expirySec,
      difficulty,
      expiresAt: new Date(expiresAt).toISOString()
    });
  } catch (error) {
    res.status(400).json({
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Failed to create challenge'
    });
  }
});

app.post('/verify', async (req, res) => {
  try {
    const { proof, publicInputs } = verifySchema.parse(req.body);
    const isValid = await verifyProofOnchain({ proofData: proof, publicInputs });

    res.json({ success: Boolean(isValid) });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'VERIFY_FAILED'
    });
  }
});

app.post('/api/verify', async (req, res) => {
  try {
    const body = legacyVerifySchema.parse(req.body);
    const challenge = challenges.get(body.challengeId);

    if (!challenge) {
      return res.status(404).json({ error: 'CHALLENGE_NOT_FOUND', message: 'Challenge not found' });
    }
    if (Date.now() > challenge.expiresAt) {
      challenges.delete(body.challengeId);
      return res.status(400).json({ error: 'CHALLENGE_EXPIRED', message: 'Challenge expired' });
    }

    // Bind the proof to this specific challenge before spending gas on the
    // on-chain verify. Public signals layout (set by the circuit):
    //   input[0] = commitment, input[1] = powHash,
    //   input[2] = nonce,      input[3] = expiry.
    if (VERIFIER_MODE === 'groth16' && body.proof.groth16) {
      const sig = body.proof.groth16.input;
      if (sig.length !== ZAUTH_PUBLIC_SIGNAL_COUNT) {
        return res.status(400).json({
          error: 'INVALID_PROOF',
          message: `expected ${ZAUTH_PUBLIC_SIGNAL_COUNT} public signals, got ${sig.length}`
        });
      }
      const sigNonce = BigInt(sig[2]);
      const sigExpiry = BigInt(sig[3]);
      if (sigNonce !== BigInt(challenge.nonce)) {
        return res.status(400).json({ error: 'NONCE_MISMATCH', message: 'proof nonce != challenge nonce' });
      }
      if (sigExpiry !== BigInt(challenge.expirySec)) {
        return res.status(400).json({ error: 'EXPIRY_MISMATCH', message: 'proof expiry != challenge expiry' });
      }
      if (sigNonce >= BN254_R) {
        return res.status(400).json({ error: 'NONCE_OUT_OF_FIELD', message: 'nonce must be < BN254 scalar field' });
      }
    }

    const isValid = await verifyProofOnchain({
      proofData: body.proof.proofData,
      publicInputs: body.proof.publicInputs,
      groth16: body.proof.groth16
    });

    if (!isValid) {
      return res.status(400).json({ error: 'INVALID_PROOF', message: 'Proof verification failed' });
    }

    const verificationId = uuidv4();
    const expiresAt = new Date(Date.now() + 3600_000).toISOString();
    const token = jwt.sign(
      {
        siteId: body.siteId || challenge.siteId,
        verificationId,
        challengeId: body.challengeId
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    challenges.delete(body.challengeId);

    return res.json({
      success: true,
      verificationId,
      token,
      expiresAt
    });
  } catch (error) {
    return res.status(400).json({
      error: 'VERIFICATION_FAILED',
      message: error instanceof Error ? error.message : 'Verification failed'
    });
  }
});

app.listen(PORT, () => {
  console.log(`HashKey verifier listening on :${PORT}`);
});
