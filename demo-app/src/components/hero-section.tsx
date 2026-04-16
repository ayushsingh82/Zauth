import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="pow-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '4rem' }}>
      <p className="pow-badge">ZKcaptcha - Now in Public Beta</p>
      <h1 className="pow-title">
        Confidential Browsing
        <br />
        built on HashKey Chain
      </h1>
      <p className="pow-copy">
        Verify personal attributes or browse privately without exposing emails, IPs, or credentials.
        Zero-knowledge proofs generated locally and verified scalably on HashKey Chain.
      </p>
      <div className="pow-feature-list">
        <span>Replace CAPTCHA with ZK proofs</span>
        <span>Full-stack Confidential Browsing</span>
        <span>Proof-based authentication</span>
      </div>
      <div className="pow-actions">
        <Link className="pow-cta" href="/demo">Try ZK CAPTCHA</Link>
        <a className="pow-ghost" href="#developers">
          NPM Package
        </a>
      </div>
      <p className="pow-copy" style={{ marginTop: '1rem' }}>
        Powered by <strong>HashKey Chain</strong>
      </p>
    </section>
  );
}
