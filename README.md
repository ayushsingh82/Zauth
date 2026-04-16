# ZAuth Captcha for HashKey (Groth16-first)

This folder contains a HashKey-compatible build of the ZAuth CAPTCHA product.

## What is included

- `verifier-server/` - Express API that verifies proofs against an on-chain verifier contract on HashKey testnet.
- `sdk/` - Tiny TypeScript SDK for frontend apps to call challenge + verify APIs.
- `demo-app/` - Next.js demo route (`/hashkey-demo`) that exercises the SDK flow.
- `circuits/` - Noir starter circuit package for the HashKey-compatible captcha proving flow.

## Relation with existing repos

- `zauth-captcha/` remains your core reference for challenge/proof generation flow.
- `captcha-sdk/` remains your original SDK line.
- `hashkey-hacks/sdk` is the HashKey-specific publishable SDK package for this hackathon build.
- `hashkey-hacks/verifier-server` is the HashKey verification backend.

## Why this works for HashKey

HashKey-friendly flow here is Groth16-first.  
This starter supports verifier contracts that expose Groth16 `verifyProof(...)` and uses JSON-RPC on HashKey testnet.

## Quick start

1. Start verifier server:
   - `cd verifier-server`
   - `npm install`
   - `cp .env.example .env`
   - fill `HASHKEY_RPC_URL` and `VERIFIER_CONTRACT`
   - `npm run dev`
2. Build SDK:
   - `cd ../sdk`
   - `npm install`
   - `npm run build`
3. Run demo app:
   - `cd ../demo-app`
   - `npm install`
   - `npm run dev`

## Important notes

- You must deploy or use an existing Solidity verifier contract on HashKey testnet.
- The API expects proof format compatible with your verifier ABI.
- This is a hackathon-ready foundation, not production hardening.

## HashKey testnet configuration

- Chain: HashKey Chain Testnet
- Chain ID: `133` (`0x85`)
- Currency: `HSK`
- Explorer: `https://testnet-explorer.hsk.xyz`
- RPC: `https://testnet.hsk.xyz`

Use these values in `verifier-server/.env`.

## How proof verification works on HashKey testnet

1. Frontend sends `proof` + `publicInputs` to `POST /verify` on your verifier server.
2. The server calls your deployed verifier contract on HashKey testnet:
   - default mode: Groth16 (`a`, `b`, `c`, `input`)
   - optional fallback mode: `verifyProof(bytes proof, uint256[] publicInputs)`
3. The API returns `{ success: true/false }`.
4. You can cross-check contract activity/state using the HashKey testnet explorer.

This flow uses read-only contract verification. You only need funded wallet keys if you later add on-chain write transactions (for attestations, state updates, or proof submissions that require gas).

## Demo route

- Start the demo app and open `/demo`.
- Use `NEXT_PUBLIC_HASHKEY_VERIFIER_API` if your verifier server is not running on localhost.

## NPM publish (hashkey-hacks/sdk)

Inside `hashkey-hacks/sdk`:

1. `npm install`
2. `npm run build`
3. `npm run pack:check`
4. `npm login`
5. `npm publish --access public`

If package name is already taken, update `name` in `sdk/package.json` before publishing.
