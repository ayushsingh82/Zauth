pragma circom 2.1.9;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

// ZAuth humanness circuit (Groth16).
//
// Private signals
//   secret   - user-side entropy, never revealed. Proves knowledge.
//   solution - value found via local compute ("I did work").
//
// Public signals (exposed to verifier contract)
//   nonce      - challenge id from backend, binds proof to this session.
//   expiry     - unix ts; backend rejects when block.timestamp > expiry.
//   commitment - Poseidon(secret, nonce), proves knowledge of secret tied to nonce.
//   powHash    - Poseidon(nonce, solution), forced to have `difficulty` leading zero bits,
//                so the prover must have spent ~2^difficulty trial hashes.
//
// Constraints
//   commitment === Poseidon(secret, nonce)
//   powHash    === Poseidon(nonce, solution)
//   powHash's top `difficulty` bits are 0  (proof-of-work)
//
// Chosen difficulty = 8 -> ~256 trial hashes in browser, sub-second for a human,
// still raises cost for spammers running thousands of sessions.

template ZAuthHumanness(difficulty) {
    signal input secret;
    signal input solution;

    signal input nonce;
    signal input expiry;

    signal output commitment;
    signal output powHash;

    // 1) Commitment binds secret <-> nonce without revealing secret.
    component cHash = Poseidon(2);
    cHash.inputs[0] <== secret;
    cHash.inputs[1] <== nonce;
    commitment <== cHash.out;

    // 2) Proof-of-work binds solution <-> nonce.
    component pHash = Poseidon(2);
    pHash.inputs[0] <== nonce;
    pHash.inputs[1] <== solution;
    powHash <== pHash.out;

    // 3) Top `difficulty` bits of powHash must be zero.
    //    Field fits in 254 bits, so check bits[254-difficulty .. 253] are all 0.
    component bits = Num2Bits(254);
    bits.in <== powHash;
    for (var i = 254 - difficulty; i < 254; i++) {
        bits.out[i] === 0;
    }

    // 4) Expiry is a passthrough public input (no in-circuit time source).
    //    We multiply by 1 so the compiler keeps the signal live.
    signal expiryLive;
    expiryLive <== expiry * 1;
}

component main {public [nonce, expiry]} = ZAuthHumanness(8);
