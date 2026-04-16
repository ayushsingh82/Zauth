import { z } from 'zod';

const challengeSchema = z.object({
  challengeId: z.string(),
  nonce: z.string(),
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

export class HashkeyCaptchaSdk {
  private initialized = false;

  constructor(
    private readonly challengeApiUrl: string,
    private readonly verifierApiUrl: string
  ) {}

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async generateProof(challenge: Challenge): Promise<Proof> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Compatibility-oriented placeholder proof shape, same as zauth-captcha contract between SDK and backend.
    return {
      publicInputs: [String(challenge.difficulty)],
      groth16: {
        a: ['1', '2'],
        b: [['3', '4'], ['5', '6']],
        c: ['7', '8'],
        input: [String(challenge.difficulty)]
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
      body: JSON.stringify({
        challengeId,
        proof,
        siteId
      })
    });
    if (!response.ok) throw new Error(`Verify request failed: ${response.status}`);
    const parsed = verificationResultSchema.parse(await response.json());
    return parsed;
  }

  async verifyOnchain(proofData: string, publicInputs: string[]): Promise<boolean> {
    const response = await fetch(`${this.verifierApiUrl}/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ proof: proofData, publicInputs })
    });
    if (!response.ok) throw new Error(`Onchain verify failed: ${response.status}`);
    const parsed = verifyBooleanSchema.parse(await response.json());
    return parsed.success;
  }
}
