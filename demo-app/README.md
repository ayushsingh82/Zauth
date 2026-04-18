# ZAuth Demo App

Next.js 14 app with a one-click "Prove I'm human" demo wired to the live
ZAuth deployment on HashKey Chain testnet.

## Run

```bash
cp .env.example .env.local     # defaults are already live-chain-ready
npm install
npm run dev                    # http://localhost:3000/demo
```

A running `verifier-server` on `http://localhost:4000` is required — the
browser SDK posts challenges and proofs there.

## Env

| Var | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_HASHKEY_VERIFIER_API`      | `http://localhost:4000` | where verifier-server is served |
| `NEXT_PUBLIC_ZAUTH_VERIFIER_ADDRESS`    | live testnet address    | displayed in UI links |
| `NEXT_PUBLIC_ZAUTH_ATTESTOR_ADDRESS`    | live testnet address    | displayed in UI links |
| `NEXT_PUBLIC_HASHKEY_EXPLORER`          | `https://testnet-explorer.hsk.xyz` | |

## Routes

- `/` — marketing home
- `/demo` — interactive zk-captcha demo (the important one)
- `/hashkey-demo` — redirect to `/demo`

## What `/demo` does when you click the button

1. `POST /api/challenge` → server hands back a nonce + expiry
2. Client mines ~256 Poseidon hashes to find a PoW solution
3. `snarkjs.groth16.fullProve` produces the Groth16 proof (browser wasm)
4. `POST /api/verify` → server calls `ZAuthVerifier.verifyProof` on HashKey
5. UI renders the challenge, the proof, and the JWT from the server

All timings are shown inline so you can demo the full pipeline in one shot.

## Circuit artifacts

The demo pulls `zauth.wasm` and `zauth_final.zkey` from `/public/zauth/`.
Regenerate them with `../circuits/scripts/build.sh` and copy them back if
you edit the circuit.
