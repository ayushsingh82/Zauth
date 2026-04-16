export function HowItWorksSection() {
  return (
    <section id="how" className="pow-section">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 className="pow-kicker">How it works</h2>
        <p className="pow-copy" style={{ margin: '0 auto' }}><strong>From request to verification in four simple steps</strong></p>
      </div>
      <div className="pow-grid pow-grid-two">
        <article className="pow-card">
          <h3>01 App requests a proof</h3>
          <p>Your app requests a specific proof (e.g., "prove you own this GitHub account") via our SDK.</p>
        </article>
        <article className="pow-card">
          <h3>02 User generates proof locally</h3>
          <p>The user&apos;s browser generates a ZK proof locally using our SDK or extension. No data leaves their device.</p>
        </article>
        <article className="pow-card">
          <h3>03 HashKey Chain verifies in &lt;1s</h3>
          <p>The proof is submitted to HashKey Chain, which verifies it ultra-fast and creates an on-chain attestation.</p>
        </article>
        <article className="pow-card">
          <h3>04 App receives attestation</h3>
          <p>Your app queries a simple API to check the attestation. No need to handle complex ZK logic.</p>
        </article>
      </div>
    </section>
  );
}
