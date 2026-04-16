# ZAuth HashKey Circuits (Groth16-first)

HashKey integrations should prefer Groth16 verifier contracts.  
This folder currently contains a Noir starter scaffold for local iteration, but production verification mode in this repo is Groth16-first.

## Recommended production path

1. Build a Groth16 circuit/toolchain (commonly Circom + snarkjs or equivalent).
2. Deploy a Groth16 verifier contract on HashKey.
3. Set `VERIFIER_MODE=groth16` in `verifier-server/.env`.
4. Submit proofs to `/api/verify` in Groth16 shape:
   - `a`, `b`, `c`, `input`

## Current files

- `src/main.nr` - optional local Noir starter (not required for Groth16 mode)
- `Prover.toml` / `Nargo.toml` - optional local Noir setup
