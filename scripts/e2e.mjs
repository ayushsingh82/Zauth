#!/usr/bin/env node
// Full local end-to-end test:
//   1. Spawn `hardhat node` (local EVM)
//   2. Deploy ZAuthVerifier to it
//   3. Spawn verifier-server pointing at the local chain
//   4. Request a challenge, mine+prove, POST /api/verify
//   5. Assert success, then kill both servers.
//
// This exercises every moving piece that a real HashKey testnet run will,
// except the funded deploy transaction.

import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const log = (tag, ...args) => console.log(`[${tag}]`, ...args);

function waitForHttp(url, timeoutMs = 30_000) {
    const start = Date.now();
    return (async () => {
        while (Date.now() - start < timeoutMs) {
            try {
                const r = await fetch(url);
                if (r.ok) return;
            } catch (_) {
                /* retry */
            }
            await delay(200);
        }
        throw new Error(`timeout waiting for ${url}`);
    })();
}

async function rpc(port, method, params = []) {
    const r = await fetch(`http://127.0.0.1:${port}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });
    const j = await r.json();
    if (j.error) throw new Error(JSON.stringify(j.error));
    return j.result;
}

async function main() {
    // 1) Hardhat node
    log('e2e', 'starting hardhat node');
    const node = spawn('npx', ['hardhat', 'node', '--port', '8545'], {
        cwd: path.join(ROOT, 'contracts'),
        stdio: ['ignore', 'pipe', 'pipe']
    });
    const nodeBuf = [];
    node.stdout.on('data', (d) => nodeBuf.push(d.toString()));
    node.stderr.on('data', (d) => nodeBuf.push(d.toString()));

    try {
        await waitForHttp('http://127.0.0.1:8545');
        log('e2e', 'hardhat node up');

        // 2) Deploy verifier. Use the deterministic account #0 private key
        // Hardhat hands out.
        const accountPk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        log('e2e', 'deploying verifier');
        const deploy = spawnSync('npx', [
            'hardhat', 'run', 'scripts/deploy.ts', '--network', 'localhost'
        ], {
            cwd: path.join(ROOT, 'contracts'),
            encoding: 'utf8',
            env: { ...process.env, HASHKEY_RPC_URL: 'http://127.0.0.1:8545', HASHKEY_PRIVATE_KEY: accountPk }
        });
        if (deploy.status !== 0) throw new Error('deploy failed: ' + deploy.stderr + '\n' + deploy.stdout);
        const match = deploy.stdout.match(/ZAuthVerifier deployed:\s*(0x[a-fA-F0-9]+)/);
        if (!match) throw new Error('could not parse verifier address from deploy output:\n' + deploy.stdout);
        const verifierAddr = match[1];
        log('e2e', 'verifier:', verifierAddr);

        // 3) Start verifier-server pointing at the local chain.
        //    The server checks block.timestamp-style expiry against the
        //    system clock, which on Hardhat may drift from wall time; we
        //    keep expiry far in the future via CHALLENGE_EXPIRY_SECONDS.
        log('e2e', 'starting verifier-server');
        const server = spawn('npx', ['tsx', 'src/index.ts'], {
            cwd: path.join(ROOT, 'verifier-server'),
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PORT: '4100',
                HASHKEY_RPC_URL: 'http://127.0.0.1:8545',
                HASHKEY_CHAIN_ID: '31337',
                VERIFIER_CONTRACT: verifierAddr,
                VERIFIER_MODE: 'groth16',
                JWT_SECRET: 'e2e-secret',
                CHALLENGE_EXPIRY_SECONDS: '3600'
            }
        });
        const serverBuf = [];
        server.stdout.on('data', (d) => serverBuf.push(d.toString()));
        server.stderr.on('data', (d) => serverBuf.push(d.toString()));

        try {
            await waitForHttp('http://127.0.0.1:4100/health');
            log('e2e', 'verifier-server up');

            // 4) Challenge -> prove -> verify.
            log('e2e', 'requesting challenge');
            const challenge = await (await fetch('http://127.0.0.1:4100/api/challenge', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ siteId: 'e2e' })
            })).json();
            log('e2e', 'challenge:', { nonce: challenge.nonce.slice(0, 20) + '...', expirySec: challenge.expirySec });

            log('e2e', 'generating proof');
            const prove = spawnSync('node', [
                'scripts/prove.mjs',
                '--nonce', challenge.nonce,
                '--expiry', String(challenge.expirySec),
                '--difficulty', String(challenge.difficulty)
            ], { cwd: path.join(ROOT, 'circuits'), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
            if (prove.status !== 0) throw new Error('prove failed: ' + prove.stderr);
            const proofOut = JSON.parse(prove.stdout);

            // Convert snarkjs publicSignals + proof into the SDK payload shape.
            const [a, b, c, input] = proofOut.calldata;
            const body = {
                challengeId: challenge.challengeId,
                siteId: 'e2e',
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

            log('e2e', 'posting /api/verify');
            const vResp = await fetch('http://127.0.0.1:4100/api/verify', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(body)
            });
            const vJson = await vResp.json();
            log('e2e', 'verify response:', vJson);

            if (!vResp.ok || vJson.success !== true) {
                throw new Error('expected success:true, got ' + JSON.stringify(vJson));
            }

            log('e2e', 'checking nonce-mismatch rejection against a fresh challenge');
            // Original challenge was consumed on successful verify, so get a
            // new one. Then submit the *old* proof (whose nonce signal no
            // longer matches) -> server should reject with NONCE_MISMATCH
            // before spending gas on-chain.
            const challenge2 = await (await fetch('http://127.0.0.1:4100/api/challenge', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ siteId: 'e2e' })
            })).json();

            const replay = { ...body, challengeId: challenge2.challengeId };
            const bad = await fetch('http://127.0.0.1:4100/api/verify', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(replay)
            });
            const badJson = await bad.json();
            if (bad.ok && badJson.success === true) {
                throw new Error('replayed proof unexpectedly accepted: ' + JSON.stringify(badJson));
            }
            if (badJson.error !== 'NONCE_MISMATCH') {
                throw new Error('expected NONCE_MISMATCH, got ' + JSON.stringify(badJson));
            }
            log('e2e', 'replay on fresh challenge correctly rejected:', badJson.error);

            console.log('\nALL GREEN');
        } finally {
            server.kill('SIGTERM');
            if (serverBuf.length && process.env.DEBUG) {
                fs.writeFileSync('/tmp/zauth_e2e_server.log', serverBuf.join(''));
            }
        }
    } finally {
        node.kill('SIGTERM');
        if (nodeBuf.length && process.env.DEBUG) {
            fs.writeFileSync('/tmp/zauth_e2e_node.log', nodeBuf.join(''));
        }
    }
}

main().catch((e) => {
    console.error('E2E FAILED:', e.message);
    process.exit(1);
});
