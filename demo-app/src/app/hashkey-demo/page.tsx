'use client';

import { useState } from 'react';

export default function HashkeyDemoPage() {
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
      setResult(JSON.stringify(data));
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', background: '#fff', padding: '2rem', borderRadius: 12 }}>
      <h1>HashKey Testnet Verification Demo</h1>
      <p>Paste proof + public inputs and verify against your on-chain verifier contract.</p>
      <label style={{ display: 'block', marginTop: 12 }}>Proof (hex)</label>
      <textarea value={proof} onChange={(e) => setProof(e.target.value)} rows={6} style={{ width: '100%' }} />
      <label style={{ display: 'block', marginTop: 12 }}>Public inputs (comma separated uint256)</label>
      <input value={inputs} onChange={(e) => setInputs(e.target.value)} style={{ width: '100%' }} />
      <button onClick={onVerify} disabled={loading} style={{ marginTop: 16 }}>
        {loading ? 'Verifying...' : 'Verify on HashKey testnet'}
      </button>
      {result && <pre style={{ marginTop: 16, background: '#111827', color: '#e5e7eb', padding: 12 }}>{result}</pre>}
    </main>
  );
}
