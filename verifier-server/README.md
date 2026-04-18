# ZAuth Verifier Server

Express API between the client SDK and the on-chain Groth16 verifier on
HashKey Chain. Issues single-use challenges, binds each proof's public
signals to its challenge, and calls `verifyProof(...)` on the deployed
contract via JSON-RPC (read-only, so no gas).

## Run it

```bash
cp .env.example .env    # defaults point at the live HashKey testnet verifier
npm install
npm run dev             # :4000 — hot reload via tsx
```

## Env

| Var | Default | Notes |
|---|---|---|
| `PORT` | `4000` | |
| `HASHKEY_RPC_URL` | `https://testnet.hsk.xyz` | |
| `HASHKEY_CHAIN_ID` | `133` | |
| `VERIFIER_CONTRACT` | `0xC40c974E6D50D201C93265a9D8423e30D0C551aE` | live deployment |
| `ATTESTOR_CONTRACT` | `0x0c9CfcfDfDA0317659DEB59d3409D059a0DCe5DB` | optional |
| `VERIFIER_MODE` | `groth16` | or `bytes` for a generic `verifyProof(bytes, uint256[])` ABI |
| `JWT_SECRET` | `dev-secret` | change in prod |
| `CHALLENGE_EXPIRY_SECONDS` | `300` | how long a challenge stays valid |

## Routes

### `GET /health`

```json
{ "ok": true, "chainId": 133, "rpc": "...", "verifierMode": "groth16" }
```

### `POST /api/challenge`

Request: `{ "siteId": "some-app" }` (optional)

Response:
```json
{
  "challengeId": "uuid",
  "nonce": "<decimal BN254 field element>",
  "expirySec": 1776512173,
  "difficulty": 8,
  "expiresAt": "2026-04-18T11:36:13.000Z"
}
```

- `nonce` is a random 248-bit field element (always fits in one uint256 public signal).
- `expirySec` matches the circuit's `expiry` public input exactly.

### `POST /api/verify`

Request:
```json
{
  "challengeId": "uuid",
  "siteId": "some-app",
  "proof": {
    "publicInputs": ["...", "...", "...", "..."],
    "groth16": {
      "a": ["0x..", "0x.."],
      "b": [["0x..","0x.."],["0x..","0x.."]],
      "c": ["0x..","0x.."],
      "input": ["...", "...", "...", "..."]
    }
  }
}
```

The server:

1. Looks up the challenge by `challengeId`, rejects if missing or expired.
2. Validates `input.length === 4` and checks `input[2] === challenge.nonce`,
   `input[3] === challenge.expirySec`. Mismatch → `NONCE_MISMATCH` or
   `EXPIRY_MISMATCH` before touching the chain.
3. Calls `verifier.verifyProof(a, b, c, input)` on HashKey. Returns JWT on
   success, deletes the challenge (single-use).

### `POST /verify`  (generic / alt-ABI)

For the `VERIFIER_MODE=bytes` fallback path used by some external verifier
contracts. Not used by the ZAuth flow; retained for compatibility.

## Public signal layout expected

Matches the compiled circuit exactly:

```
input[0] = commitment  (Poseidon(secret, nonce))
input[1] = powHash     (Poseidon(nonce, solution); top 8 bits = 0)
input[2] = nonce       (must equal server's stored nonce)
input[3] = expiry      (unix seconds; must equal server's stored expirySec)
```

If you fork the circuit, update `ZAUTH_PUBLIC_SIGNAL_COUNT` and the signal
indexing in `src/index.ts`.

## Build + run in production

```bash
npm run build   # tsc → dist/
npm start       # node dist/index.js
```
