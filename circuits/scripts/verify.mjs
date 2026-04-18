// Verify a Groth16 proof locally against vkey.json.
// Usage: cat proof.json | node scripts/verify.mjs
// Expects JSON with { proof, publicSignals }.
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import * as snarkjs from 'snarkjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const BUILD = path.resolve(__dirname, '..', 'build');

async function readStdin() {
    let data = '';
    for await (const chunk of process.stdin) data += chunk;
    return data;
}

async function main() {
    const raw = (await readStdin()).trim();
    if (!raw) throw new Error('no JSON on stdin');
    const { proof, publicSignals } = JSON.parse(raw);
    const vkey = JSON.parse(await fs.readFile(path.join(BUILD, 'vkey.json'), 'utf8'));
    const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    console.log(JSON.stringify({ ok }));
    process.exit(ok ? 0 : 1);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
