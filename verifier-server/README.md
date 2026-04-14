# HashKey CAPTCHA Verifier Server

Express server that verifies proof data against a verifier contract on HashKey testnet.

## Endpoints

- `GET /health` - health and chain config
- `POST /verify` - verify proof using contract read:
  - input: `{ "proof": "0x...", "publicInputs": ["1", "2"] }`
  - output: `{ "success": true | false }`

## Environment

Copy `.env.example` to `.env` and set:

- `HASHKEY_RPC_URL` (default testnet: `https://testnet.hsk.xyz`)
- `HASHKEY_CHAIN_ID` (`133`)
- `VERIFIER_CONTRACT` (deployed verifier address)
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
