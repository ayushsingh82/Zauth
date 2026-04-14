# HashKey Hackathon - ZAuth Captcha (No UltraHonk)

This folder contains a HashKey-compatible starter for the ZAuth Captcha idea.

## What is included

- `verifier-server/` - Express API that verifies proofs against an on-chain verifier contract on HashKey testnet.
- `sdk/` - Tiny TypeScript SDK for frontend apps to call challenge + verify APIs.
- `demo-app/` - Next.js demo route (`/hashkey-demo`) that exercises the SDK flow.

## Why this works for HashKey

The original stack used UltraHonk submission to zkVerify. This starter removes that dependency and uses a standard EVM verifier contract call (`verifyProof`) via JSON-RPC on HashKey testnet.

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

## Demo route

- Start the demo app and open `/hashkey-demo`.
- Use `NEXT_PUBLIC_HASHKEY_VERIFIER_API` if your verifier server is not running on localhost.
