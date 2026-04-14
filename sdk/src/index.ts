import { z } from 'zod';

const challengeSchema = z.object({
  challengeId: z.string(),
  nonce: z.string(),
  difficulty: z.number(),
  expiresAt: z.string()
});

const verifySchema = z.object({
  success: z.boolean()
});

export type Challenge = z.infer<typeof challengeSchema>;

export class HashkeyCaptchaSdk {
  constructor(
    private readonly challengeApiUrl: string,
    private readonly verifierApiUrl: string
  ) {}

  async getChallenge(siteId: string): Promise<Challenge> {
    const response = await fetch(`${this.challengeApiUrl}/api/challenge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteId })
    });
    if (!response.ok) throw new Error(`Challenge request failed: ${response.status}`);
    return challengeSchema.parse(await response.json());
  }

  async verify(proof: string, publicInputs: string[]): Promise<boolean> {
    const response = await fetch(`${this.verifierApiUrl}/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ proof, publicInputs })
    });
    if (!response.ok) throw new Error(`Verify request failed: ${response.status}`);
    const parsed = verifySchema.parse(await response.json());
    return parsed.success;
  }
}
