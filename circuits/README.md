# ZAuth Circuits

Circom 2 circuit, build pipeline, and local prover for the ZAuth humanness
proof. The compiled Groth16 Verifier.sol here is what gets deployed to HashKey.

## Layout

```
circom/zauth.circom     - the humanness circuit
scripts/build.sh        - compile + Phase-2 Groth16 setup + Verifier.sol
scripts/prove.mjs       - mine PoW + run snarkjs fullProve, emit JSON
scripts/verify.mjs      - local snarkjs.groth16.verify for sanity checking
build/                  - outputs (zauth.wasm, zauth_final.zkey, vkey.json, Verifier.sol)
bin/                    - circom binary, fetched on demand (gitignored)
```

## What the circuit enforces

```
  Private: secret, solution
  Public : nonce, expiry, commitment, powHash

  commitment === Poseidon(secret, nonce)
  powHash    === Poseidon(nonce, solution)
  topBits(powHash, difficulty)  === 0     // proof-of-work
```

Constraint count: 732 non-linear, 549 linear — small enough for a browser
prover on a mid-range laptop in under a second.

## One-shot build

```bash
npm install          # installs snarkjs, circomlib, circomlibjs
./scripts/build.sh   # installs circom binary, fetches ptau, compiles, proves-key
```

What `build.sh` does:

1. Downloads the `circom v2.2.3` Linux binary into `bin/` if missing.
2. Compiles `circom/zauth.circom` → `build/zauth.r1cs` + `build/zauth_js/zauth.wasm`.
3. Downloads Hermez Phase-1 Powers of Tau (2^14) to `build/pot14_final.ptau`.
4. Runs `snarkjs groth16 setup` + a random contribution → `build/zauth_final.zkey`.
5. Exports the verification key (`build/vkey.json`) and the Solidity verifier
   (`build/Verifier.sol`).

## Generate a proof

```bash
# With a random nonce (default)
node scripts/prove.mjs --difficulty 8 | tee /tmp/proof.json

# Against a specific server challenge
node scripts/prove.mjs \
  --nonce 12345...   \
  --expiry 1776512173 \
  --difficulty 8
```

Output (JSON on stdout) includes:

- `input` — the fields the circuit saw (secret, solution omitted in production)
- `proof` — raw snarkjs groth16 proof
- `publicSignals` — ordered public signals
- `calldata` — Solidity-ready tuple: `[a, b, c, pubSignals]`

Verify locally without a chain:

```bash
node scripts/prove.mjs --difficulty 8 | node scripts/verify.mjs
# {"ok":true}
```

## What to commit vs re-generate

| Committed | Reason |
|---|---|
| `build/zauth_js/zauth.wasm`  | prover artifact, needed by browser SDK |
| `build/zauth_final.zkey`     | proving key |
| `build/vkey.json`            | verification key |
| `build/Verifier.sol`         | source for the deployed contract |

| Gitignored | Reason |
|---|---|
| `bin/circom`                     | 12 MB binary, re-downloaded by `build.sh` |
| `build/pot14_final.ptau`         | 18 MB, re-downloaded by `build.sh` |
| `build/zauth_0.zkey`             | pre-contribution zkey, transient |

## Regenerating after circuit edits

```bash
./scripts/build.sh
cp build/zauth_js/zauth.wasm ../demo-app/public/zauth/zauth.wasm
cp build/zauth_final.zkey     ../demo-app/public/zauth/zauth_final.zkey
cp build/Verifier.sol         ../contracts/contracts/ZAuthVerifier.sol
# re-rename `contract Groth16Verifier` → `contract ZAuthVerifier` in the copy
cd ../contracts && npm test                       # sanity
cd ../contracts && npm run deploy:hashkey         # redeploy if you changed signals
```

Any change to public signal count forces a matching ABI update in
`verifier-server/src/index.ts` (constant `ZAUTH_PUBLIC_SIGNAL_COUNT`).
