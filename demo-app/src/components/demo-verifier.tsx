'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Challenge, Proof, VerificationResult } from 'zauth-sdk';
import { HashkeyCaptchaSdk } from 'zauth-sdk';

type Step =
  | { kind: 'idle' }
  | { kind: 'challenge' }
  | { kind: 'prove'; message: string }
  | { kind: 'verify' }
  | { kind: 'done'; result: VerificationResult | { success: boolean } }
  | { kind: 'error'; message: string };

const VERIFIER_ADDR =
  process.env.NEXT_PUBLIC_ZAUTH_VERIFIER_ADDRESS || '0xC40c974E6D50D201C93265a9D8423e30D0C551aE';
const ATTESTOR_ADDR =
  process.env.NEXT_PUBLIC_ZAUTH_ATTESTOR_ADDRESS || '0x0c9CfcfDfDA0317659DEB59d3409D059a0DCe5DB';
const EXPLORER =
  process.env.NEXT_PUBLIC_HASHKEY_EXPLORER || 'https://testnet-explorer.hsk.xyz';

export function DemoVerifier() {
  const verifierApi =
    process.env.NEXT_PUBLIC_HASHKEY_VERIFIER_API ||
    'https://zauth-verifier-production.up.railway.app';

  const sdk = useMemo(
    () => new HashkeyCaptchaSdk(verifierApi, verifierApi, { artifactBaseUrl: '/zauth' }),
    [verifierApi]
  );

  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [proof, setProof] = useState<Proof | null>(null);

  const runFullFlow = useCallback(async () => {
    setStep({ kind: 'challenge' });
    setChallenge(null);
    setProof(null);
    try {
      const c = await sdk.getChallenge('zauth-demo');
      setChallenge(c);

      setStep({ kind: 'prove', message: 'Mining PoW + generating Groth16 proof in browser...' });
      const t0 = performance.now();
      const p = await sdk.generateProof(c);
      const t1 = performance.now();
      setProof(p);

      setStep({ kind: 'prove', message: `Proof generated in ${(t1 - t0).toFixed(0)} ms. Verifying on-chain...` });
      await new Promise((r) => setTimeout(r, 50)); // let the UI flush
      setStep({ kind: 'verify' });

      const v = await sdk.verify(c.challengeId, p, 'zauth-demo');
      setStep({ kind: 'done', result: v });
    } catch (e) {
      setStep({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, [sdk]);

  const busy = step.kind === 'challenge' || step.kind === 'prove' || step.kind === 'verify';

  return (
    <div className="verify-panel">
      <div className="verify-header">
        <span className="pow-badge">Zero-Knowledge Humanness Check</span>
        <h2 className="verify-title">ZAuth on HashKey — Live Flow</h2>
        <p className="verify-desc">
          Click once. Your browser mines a tiny proof-of-work, produces a Groth16 proof
          with snarkjs, and submits it to the HashKey on-chain verifier.<br />
          Verifier API: <code>{verifierApi}</code>
        </p>
        <p className="verify-desc" style={{ marginTop: 8 }}>
          On-chain contracts (HashKey Chain Testnet):{' '}
          <a href={`${EXPLORER}/address/${VERIFIER_ADDR}`} target="_blank" rel="noreferrer">
            <code>Verifier</code>
          </a>{' '}
          &middot;{' '}
          <a href={`${EXPLORER}/address/${ATTESTOR_ADDR}`} target="_blank" rel="noreferrer">
            <code>Attestor</code>
          </a>
        </p>
      </div>

      <button className="verify-btn" onClick={runFullFlow} disabled={busy}>
        {busy ? (
          <span className="flex items-center gap-2 justify-center">
            <svg className="spinner" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
            {step.kind === 'challenge' && 'Requesting challenge...'}
            {step.kind === 'prove' && (step as { message: string }).message}
            {step.kind === 'verify' && 'Verifying on HashKey...'}
          </span>
        ) : 'Prove I\u2019m human'}
      </button>

      {challenge && (
        <div className="result-container">
          <div className="result-header">
            <span>Challenge</span>
            <span className="status-success">issued</span>
          </div>
          <pre className="result-box">{JSON.stringify(challenge, null, 2)}</pre>
        </div>
      )}

      {proof && (
        <div className="result-container">
          <div className="result-header">
            <span>Proof (Groth16)</span>
            <span className="status-success">generated</span>
          </div>
          <pre className="result-box">{JSON.stringify({
            publicInputs: proof.publicInputs,
            a: proof.groth16?.a,
            b: proof.groth16?.b,
            c: proof.groth16?.c
          }, null, 2)}</pre>
        </div>
      )}

      {step.kind === 'done' && (
        <div className="result-container">
          <div className="result-header">
            <span>On-chain verification</span>
            <span className="status-success">valid</span>
          </div>
          <pre className="result-box">{JSON.stringify(step.result, null, 2)}</pre>
        </div>
      )}

      {step.kind === 'error' && (
        <div className="result-container">
          <div className="result-header">
            <span>Error</span>
            <span className="status-error">failed</span>
          </div>
          <pre className="result-box">{step.message}</pre>
        </div>
      )}
    </div>
  );
}
