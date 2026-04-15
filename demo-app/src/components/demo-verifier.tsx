'use client';

import { useState } from 'react';

export function DemoVerifier() {
  const [proof, setProof] = useState('0x');
  const [inputs, setInputs] = useState('1,2,3');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const verifierApi = process.env.NEXT_PUBLIC_HASHKEY_VERIFIER_API || 'http://localhost:4000';

  const onVerify = async () => {
    setLoading(true);
    setResult('');
    try {
      const publicInputs = inputs
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      const response = await fetch(`${verifierApi}/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ proof, publicInputs })
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-panel">
      <div className="verify-header">
        <span className="pow-badge">Interactive Playground</span>
        <h2 className="verify-title">HashKey Verifier Demo</h2>
        <p className="verify-desc">
          Submit proof and public inputs to your verifier API and inspect the raw JSON response.<br/>
          Target API: <code>{verifierApi}</code>
        </p>
      </div>

      <div className="input-group">
        <label>Proof (hex)</label>
        <textarea className="input" value={proof} onChange={(e) => setProof(e.target.value)} rows={4} placeholder="0x..." />
      </div>

      <div className="input-group">
        <label>Public inputs (comma separated uint256)</label>
        <input className="input" value={inputs} onChange={(e) => setInputs(e.target.value)} placeholder="1, 2, 3" />
      </div>

      <button className="verify-btn" onClick={onVerify} disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <svg className="spinner" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
            Verifying proof...
          </span>
        ) : 'Verify on HashKey'}
      </button>

      {result && (
        <div className="result-container">
          <div className="result-header">
            <span>Response</span>
            <span className={result.includes('error') ? 'status-error' : 'status-success'}>
              {result.includes('error') ? 'Failed' : 'Success'}
            </span>
          </div>
          <pre className="result-box">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
