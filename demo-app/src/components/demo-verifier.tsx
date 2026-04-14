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
    <div className="card" style={{ padding: '1.4rem' }}>
      <p className="section-label">Interactive playground</p>
      <h1 style={{ marginTop: 0, marginBottom: '0.4rem' }}>HashKey verifier demo</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Submit proof and public inputs to your verifier API and inspect the raw JSON response.
      </p>

      <label style={{ display: 'block', marginTop: 12, fontWeight: 600, marginBottom: 6 }}>Proof (hex)</label>
      <textarea className="input" value={proof} onChange={(e) => setProof(e.target.value)} rows={7} />

      <label style={{ display: 'block', marginTop: 12, fontWeight: 600, marginBottom: 6 }}>
        Public inputs (comma separated uint256)
      </label>
      <input className="input" value={inputs} onChange={(e) => setInputs(e.target.value)} />

      <p style={{ marginTop: 8, marginBottom: 0, color: 'var(--muted)', fontSize: '0.92rem' }}>
        Target API: <code>{verifierApi}</code>
      </p>

      <button className="btn btn-primary" onClick={onVerify} disabled={loading} style={{ marginTop: 16 }}>
        {loading ? 'Verifying...' : 'Verify on HashKey'}
      </button>

      {result && (
        <pre
          style={{
            marginTop: 16,
            background: '#0b1220',
            color: '#dbeafe',
            padding: 12,
            borderRadius: 8,
            overflowX: 'auto'
          }}
        >
          {result}
        </pre>
      )}
    </div>
  );
}
