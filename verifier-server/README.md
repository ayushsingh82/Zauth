# HashKey CAPTCHA Verifier Server

Express server that verifies proof data against a verifier contract on HashKey testnet.

## Endpoints

- `GET /health` - health and chain config
- `POST /api/challenge` - create a challenge compatible with `zauth-captcha` SDK flow
- `POST /api/verify` - verify proof in `zauth-captcha` request shape and return token response
- `POST /verify` - verify proof using contract read:
  - input: `{ "proof": "0x...", "publicInputs": ["1", "2"] }`
  - output: `{ "success": true | false }`

## Verifier modes

- `VERIFIER_MODE=groth16` (default, recommended for HashKey):
  - `/api/verify` expects Groth16 proof fields in `proof.groth16`:
    - `a`, `b`, `c`, `input`
- `VERIFIER_MODE=bytes`:
  - `/verify` and `/api/verify` use `proofData` + `publicInputs` path.

## Environment

Copy `.env.example` to `.env` and set:

- `HASHKEY_RPC_URL` (default testnet: `https://testnet.hsk.xyz`)
- `HASHKEY_CHAIN_ID` (`133`)
- `VERIFIER_CONTRACT` (deployed verifier address)
- `VERIFIER_MODE` (`groth16` or `bytes`)
- `JWT_SECRET` (token signing secret for `/api/verify`)
- `CHALLENGE_EXPIRY_SECONDS` (defaults to `300`)
- optional wallet values for future write tx paths:
  - `HASHKEY_PRIVATE_KEY`
  - `HASHKEY_PUBLIC_ADDRESS`

## Run

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run start
```
