# ZAuth — Zero-Knowledge Humanness for HashKey Chain

> Prove you're human — without revealing anything else.

ZAuth is a privacy-preserving CAPTCHA replacement. The client mines a small
proof-of-work and produces a Groth16 zk-SNARK that binds the work to a
server-issued challenge. The backend forwards the proof to an on-chain
verifier on HashKey Chain; applications receive a single `valid` / `invalid`
signal without ever seeing the user's secret or behavioral data.

## Live on HashKey Chain Testnet

| | Address | Explorer |
|---|---|---|
| **ZAuthVerifier** (Groth16) | `0xC40c974E6D50D201C93265a9D8423e30D0C551aE` | [view](https://testnet-explorer.hsk.xyz/address/0xC40c974E6D50D201C93265a9D8423e30D0C551aE) |
| **ZAuthAttestor** (replay-guarded wrapper) | `0x0c9CfcfDfDA0317659DEB59d3409D059a0DCe5DB` | [view](https://testnet-explorer.hsk.xyz/address/0x0c9CfcfDfDA0317659DEB59d3409D059a0DCe5DB) |

Sample attestation tx (block 26,660,961):
[`0x2e7914...b125be`](https://testnet-explorer.hsk.xyz/tx/0x2e791493198406c8df6cdcbb39597e8664d8ff31e2ae7296839330d7d3b125be)

Chain: HashKey Chain Testnet · chainId `133` · RPC `https://testnet.hsk.xyz`

## Architecture

```
          ┌──────────┐  1. challenge  ┌───────────────┐
          │  client  │◀───────────────│ verifier-srv  │
          │  (SDK)   │                │ (Node/Express)│
          └────┬─────┘                └───────┬───────┘
               │   2. mine PoW + prove        │
               │   ┌────────────┐             │
               └──▶│  snarkjs   │             │
                   │  + circom  │             │
                   └─────┬──────┘             │
                         │ Groth16 proof      │
                         ▼                    ▼
                   ┌─────────────┐    ┌──────────────────┐
                   │ /api/verify │───▶│ ZAuthVerifier.sol│
                   │             │    │ on HashKey Chain │
                   └─────────────┘    └──────────────────┘
                                        ⇣ on success
                                      ProofAttested event
                                      (via ZAuthAttestor)
```

## Repo layout

| Path | What's inside |
|---|---|
| [`circuits/`](./circuits)                   | Circom 2 circuit + build pipeline (wasm, zkey, vkey, Verifier.sol) |
| [`contracts/`](./contracts)                 | Hardhat project — compiles, tests, deploys the verifier + attestor |
| [`verifier-server/`](./verifier-server)     | Express API: issues challenges, binds public signals, calls verifier |
| [`sdk/`](./sdk)                             | TypeScript SDK — challenge + browser proof generation + verify |
| [`demo-app/`](./demo-app)                   | Next.js demo at `/demo` — one-click prove-in-browser flow |
| [`scripts/e2e.mjs`](./scripts/e2e.mjs)      | Local end-to-end test (Hardhat → server → SDK → verify) |
| [`deployments.json`](./deployments.json)    | Live contract addresses per network |

## Quick start — from zero to a live on-chain proof in 5 steps

```bash
# 1. Compile circuit + trusted setup + generate Solidity verifier
cd circuits && npm install && ./scripts/build.sh && cd ..

# 2. Install and run Hardhat verifier tests
cd contracts && npm install && npm test && cd ..

# 3. Run local end-to-end (spins up Hardhat node + server + prover)
node scripts/e2e.mjs          # ends with "ALL GREEN"

# 4. Run the demo app against live HashKey
cd verifier-server && npm install && cp .env.example .env && npm run dev &
cd ../demo-app && npm install && cp .env.example .env.local && npm run dev
#   open http://localhost:3000/demo

# 5. Deploy your own copy (needs a funded HashKey key)
cd ../contracts && cp .env.example .env   # fill HASHKEY_PRIVATE_KEY
npm run deploy:hashkey
```

## The circuit

Public signals exposed to the Solidity verifier, in order:

| Index | Signal | Meaning |
|---|---|---|
| 0 | `commitment` | `Poseidon(secret, nonce)` — knowledge of a secret bound to the challenge |
| 1 | `powHash`    | `Poseidon(nonce, solution)` — must have top 8 bits = 0 (proof-of-work) |
| 2 | `nonce`      | server-issued challenge id |
| 3 | `expiry`     | unix seconds — freshness bound (checked in `ZAuthAttestor`) |

With `difficulty = 8`, a browser finds a valid `solution` in ~256 hash
iterations and completes the full proof in ~500–700 ms.

Full circuit: [`circuits/circom/zauth.circom`](./circuits/circom/zauth.circom).

## Security notes

- Trusted setup uses Hermez Phase-1 Powers of Tau (`2^14`). Good for demos; do
  fresh contributions before mainnet.
- The client secret never leaves the prover — the server only sees its
  commitment.
- `ZAuthAttestor` enforces single-use semantics on-chain: each `nonce` can be
  attested to exactly once, matching the verifier-server's off-chain single-use
  challenges.
- `expiry` is checked against `block.timestamp` inside `ZAuthAttestor.attest`
  and against wall time inside the verifier-server.

## Licensing

- Circuit + contracts: MIT for the app code, GPL-3.0 for the auto-generated
  `Verifier.sol` (inherited from snarkjs).
- SDK published as [`@ethayush/captcha-sdk`](https://www.npmjs.com/package/@ethayush/captcha-sdk).
