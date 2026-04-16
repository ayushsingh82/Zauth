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

const groth16VerifierAbi = [
  {
    type: 'function',
    name: 'verifyProof',
    stateMutability: 'view',
    inputs: [
      { name: 'a', type: 'uint256[2]' },
      { name: 'b', type: 'uint256[2][2]' },
      { name: 'c', type: 'uint256[2]' },
      { name: 'input', type: 'uint256[]' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

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
  nonce: string;
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
        args.groth16.input.map((v) => BigInt(v))
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

app.post('/api/challenge', (req, res) => {
  try {
    const body = challengeRequestSchema.parse(req.body);
    const challengeId = uuidv4();
    const nonce = randomBytes(16).toString('hex');
    const difficulty = 10;
    const expiresAt = Date.now() + CHALLENGE_EXPIRY_SECONDS * 1000;
    const siteId = body.siteId || 'default';

    challenges.set(challengeId, {
      challengeId,
      nonce,
      difficulty,
      siteId,
      expiresAt
    });

    res.json({
      challengeId,
      nonce,
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
