#!/usr/bin/env bash
# Compile zauth.circom -> r1cs + wasm + sym, run Groth16 trusted setup,
# export verification key and Solidity verifier.
#
# Artifacts end up in circuits/build/:
#   zauth.r1cs
#   zauth_js/zauth.wasm
#   zauth_final.zkey
#   vkey.json
#   Verifier.sol
set -euo pipefail

CIRCUITS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$CIRCUITS_DIR"

CIRCOM="$CIRCUITS_DIR/bin/circom"
SNARKJS="npx --yes snarkjs"
BUILD="$CIRCUITS_DIR/build"
PTAU="$BUILD/pot14_final.ptau"

mkdir -p "$BUILD"

echo "[1/6] circom compile"
"$CIRCOM" circom/zauth.circom \
  --r1cs --wasm --sym \
  -o "$BUILD"

echo "[2/6] fetch powers of tau (Hermez, 2^14)"
if [ ! -f "$PTAU" ]; then
  curl -L -o "$PTAU" \
    https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau
fi

echo "[3/6] groth16 setup"
$SNARKJS groth16 setup "$BUILD/zauth.r1cs" "$PTAU" "$BUILD/zauth_0.zkey"

echo "[4/6] contribute randomness"
$SNARKJS zkey contribute "$BUILD/zauth_0.zkey" "$BUILD/zauth_final.zkey" \
  --name="zauth-hashkey" -v -e="$(head -c 64 /dev/urandom | base64)"

echo "[5/6] export verification key"
$SNARKJS zkey export verificationkey "$BUILD/zauth_final.zkey" "$BUILD/vkey.json"

echo "[6/6] export Solidity verifier"
$SNARKJS zkey export solidityverifier "$BUILD/zauth_final.zkey" "$BUILD/Verifier.sol"

echo "done: artifacts in $BUILD"
