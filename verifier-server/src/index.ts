import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createPublicClient, getAddress, http } from 'viem';
import { z } from 'zod';

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const HASHKEY_RPC_URL = process.env.HASHKEY_RPC_URL;
const HASHKEY_CHAIN_ID = Number(process.env.HASHKEY_CHAIN_ID || 133);
const VERIFIER_CONTRACT = process.env.VERIFIER_CONTRACT;

if (!HASHKEY_RPC_URL || !VERIFIER_CONTRACT) {
  throw new Error('Missing required env: HASHKEY_RPC_URL and VERIFIER_CONTRACT');
}

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

const verifySchema = z.object({
  proof: z.string().min(2),
  publicInputs: z.array(z.string()).default([])
});

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
    rpc: HASHKEY_RPC_URL
  });
});

app.post('/verify', async (req, res) => {
  try {
    const { proof, publicInputs } = verifySchema.parse(req.body);
    const isValid = await client.readContract({
      address: getAddress(VERIFIER_CONTRACT),
      abi: verifierAbi,
      functionName: 'verifyProof',
      args: [proof as `0x${string}`, publicInputs.map((v) => BigInt(v))]
    });

    res.json({ success: Boolean(isValid) });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'VERIFY_FAILED'
    });
  }
});

app.listen(PORT, () => {
  console.log(`HashKey verifier listening on :${PORT}`);
});
