export function ProductSection() {
  return (
    <section id="product" className="pow-section">
      <h2 className="pow-kicker">The Stack</h2>
      <p className="pow-copy"><strong>Full-stack Confidential Browsing</strong></p>
      <p className="pow-copy">
        Everything you need to build private, proof-based verification into your app.
        From CAPTCHA to authentication - one stack.
      </p>
      <div className="pow-grid">
        <article className="pow-card">
          <h3>Live - ZK CAPTCHA</h3>
          <p>Human verification, zero-knowledge proof.</p>
          <p>No more clicking traffic lights.</p>
          <p>Privacy-preserving (no behavioral tracking).</p>
          <p>Single proof, unlimited verifications.</p>
          <p>Fallback for edge cases.</p>
        </article>
        <article className="pow-card">
          <h3>Coming Soon - ZAuth Identity</h3>
          <p>Proof-based authentication.</p>
          <p>Login without passwords.</p>
          <p>Reusable identity proofs.</p>
          <p>No data silos or identity databases.</p>
          <p>Cross-app identity portability.</p>
        </article>
        <article className="pow-card">
          <h3>Coming Soon - Proof SDK & Gateway</h3>
          <p>APIs for proof requests.</p>
          <p>Drop-in SDK for any stack.</p>
          <p>Automatic proof generation.</p>
          <p>Real-time attestation status.</p>
          <p>Multi-chain settlement.</p>
        </article>
        <article className="pow-card">
          <h3>Coming Soon - Browser Extension</h3>
          <p>Seamless proof generation.</p>
          <p>Auto-prompt for proof requests.</p>
          <p>Local proof generation (WASM).</p>
          <p>Proof caching & reuse.</p>
          <p>Privacy dashboard for users.</p>
        </article>
      </div>
    </section>
  );
}
