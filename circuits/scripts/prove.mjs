// Generate a Groth16 proof for a given challenge.
// Usage:
//   node scripts/prove.mjs --nonce <dec> --expiry <unix> [--secret <dec>] [--difficulty 8]
// Output: JSON { proof, publicSignals, calldata } on stdout.
//
// Mines a PoW solution such that Poseidon(nonce, solution) has `difficulty`
// leading zero bits, then runs snarkjs.groth16.fullProve against the
// compiled wasm + zkey in ../build/.

import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import crypto from 'node:crypto';
import * as snarkjs from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const BUILD = path.resolve(__dirname, '..', 'build');

function parseArgs(argv) {
    const out = {};
    for (let i = 2; i < argv.length; i += 2) {
        const k = argv[i]?.replace(/^--/, '');
        const v = argv[i + 1];
        if (k && v !== undefined) out[k] = v;
    }
    return out;
}

function randField() {
    // 31-byte random -> always fits in BN254 scalar field (~254 bits).
    const bytes = crypto.randomBytes(31);
    return BigInt('0x' + bytes.toString('hex'));
}

// Check top `difficulty` bits of a 254-bit number are zero.
// Equivalent to h < 2^(254 - difficulty).
function meetsDifficulty(h, difficulty) {
    const limit = 1n << BigInt(254 - difficulty);
    return h < limit;
}

async function main() {
    const args = parseArgs(process.argv);
    const difficulty = Number(args.difficulty ?? 8);
    const nonce = BigInt(args.nonce ?? randField());
    const expiry = BigInt(args.expiry ?? Math.floor(Date.now() / 1000) + 300);
    const secret = BigInt(args.secret ?? randField());

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // Mine a solution.
    let solution = 0n;
    let powHash = 0n;
    while (true) {
        solution = randField();
        const h = poseidon([nonce, solution]);
        const hBig = F.toObject(h);
        if (meetsDifficulty(hBig, difficulty)) {
            powHash = hBig;
            break;
        }
    }

    const commitment = F.toObject(poseidon([secret, nonce]));

    const input = {
        secret: secret.toString(),
        solution: solution.toString(),
        nonce: nonce.toString(),
        expiry: expiry.toString()
    };

    const wasmPath = path.join(BUILD, 'zauth_js', 'zauth.wasm');
    const zkeyPath = path.join(BUILD, 'zauth_final.zkey');

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input, wasmPath, zkeyPath
    );

    // Build a Solidity-ready calldata tuple. Note: snarkjs returns b in
    // little-endian ordering per coordinate; the on-chain verifier expects
    // them swapped. exportSolidityCallData handles that for us.
    const callDataRaw = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    // callDataRaw -> "[\"...\", \"...\"], [[...],[...]], [...], [...]"
    const calldata = JSON.parse('[' + callDataRaw + ']');

    process.stdout.write(JSON.stringify({
        input: {
            nonce: nonce.toString(),
            expiry: expiry.toString(),
            difficulty,
            commitment: commitment.toString(),
            powHash: powHash.toString()
        },
        proof,
        publicSignals,
        calldata
    }, null, 2));
    process.stdout.write('\n');

    // snarkjs keeps a worker pool alive; exit explicitly.
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
