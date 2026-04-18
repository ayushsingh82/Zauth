#!/usr/bin/env node
// Exercise the exact flow the browser will run, but from Node, against
// the LIVE HashKey testnet verifier contract. If this succeeds, the
// /demo page button will succeed too — it imports the same SDK and hits
// the same server routes.
//
//   1. Boot the verifier-server with VERIFIER_CONTRACT = live address,
//      HASHKEY_RPC_URL = https://testnet.hsk.xyz.
//   2. POST /api/challenge -> { challengeId, nonce, expirySec }.
//   3. Run the snarkjs prover with those values.
//   4. POST /api/verify -> the server forwards to live HashKey.
//   5. Assert success.

import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const log = (...a) => console.log('[live-check]', ...a);

async function waitForHttp(u, ms = 30_000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
        try { const r = await fetch(u); if (r.ok) return; } catch (_) {}
        await delay(250);
    }
    throw new Error('timeout ' + u);
}

async function main() {
    log('starting verifier-server against live HashKey');
    const server = spawn('npx', ['tsx', 'src/index.ts'], {
        cwd: path.join(ROOT, 'verifier-server'),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
            ...process.env,
            PORT: '4101',
            HASHKEY_RPC_URL: 'https://testnet.hsk.xyz',
            HASHKEY_CHAIN_ID: '133',
            VERIFIER_CONTRACT: '0xC40c974E6D50D201C93265a9D8423e30D0C551aE',
            VERIFIER_MODE: 'groth16',
            JWT_SECRET: 'live-check',
            CHALLENGE_EXPIRY_SECONDS: '600'
        }
    });
    const buf = [];
    server.stdout.on('data', (d) => buf.push(d.toString()));
    server.stderr.on('data', (d) => buf.push(d.toString()));

    try {
        await waitForHttp('http://127.0.0.1:4101/health');
        const health = await (await fetch('http://127.0.0.1:4101/health')).json();
        log('server up:', health);

        log('requesting challenge');
        const challenge = await (await fetch('http://127.0.0.1:4101/api/challenge', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ siteId: 'live-check' })
        })).json();
        log('challenge.challengeId:', challenge.challengeId);
        log('challenge.nonce     :', challenge.nonce.slice(0, 24) + '...');
        log('challenge.expirySec :', challenge.expirySec);

        log('generating Groth16 proof (snarkjs fullProve)');
        const t0 = Date.now();
        const prove = spawnSync('node', [
            'scripts/prove.mjs',
            '--nonce', challenge.nonce,
            '--expiry', String(challenge.expirySec),
            '--difficulty', String(challenge.difficulty)
        ], { cwd: path.join(ROOT, 'circuits'), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
        if (prove.status !== 0) throw new Error('prove failed: ' + prove.stderr);
        const proofOut = JSON.parse(prove.stdout);
        log('proof generated in', Date.now() - t0, 'ms');

        const [a, b, c, input] = proofOut.calldata;
        const body = {
            challengeId: challenge.challengeId,
            siteId: 'live-check',
            proof: {
                publicInputs: proofOut.publicSignals,
                groth16: {
                    a: [a[0], a[1]],
                    b: [[b[0][0], b[0][1]], [b[1][0], b[1][1]]],
                    c: [c[0], c[1]],
                    input
                }
            }
        };

        log('POST /api/verify (this makes a live eth_call to HashKey)');
        const t1 = Date.now();
        const resp = await fetch('http://127.0.0.1:4101/api/verify', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body)
        });
        const json = await resp.json();
        log('verify roundtrip in', Date.now() - t1, 'ms');
        log('verify response:', json);

        if (!resp.ok || json.success !== true) {
            throw new Error('live verify did not return success:true — ' + JSON.stringify(json));
        }

        console.log('\nLIVE FRONTEND-PATH GREEN');
    } finally {
        server.kill('SIGTERM');
        if (process.env.DEBUG) console.error(buf.join(''));
    }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
