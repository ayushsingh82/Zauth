import Link from 'next/link';
import { LandingFacehash } from '../components/landing-facehash';

export default function Home() {
  const halfWidth = '21rem';

  return (
    <div className="pow-shell">
      <header className="pow-nav">
        <div className="pow-nav-inner">
          <Link href="/" className="pow-brand">ZAuth</Link>
          <nav className="pow-nav-links">
            <a className="pow-link" href="#overview">Overview</a>
            <a className="pow-link" href="#how">How it works</a>
            <Link className="pow-cta" href="/demo">Open demo</Link>
          </nav>
        </div>
      </header>

      <div className="pow-vline" style={{ left: `calc(50% - ${halfWidth})` }} />
      <div className="pow-vline" style={{ right: `calc(50% - ${halfWidth})` }} />

      <div className="pow-main-wrap">
        <LandingFacehash />
        <main className="pow-main">
          <section className="pow-section">
            <h1 className="pow-title">
              ZAuth CAPTCHA for HashKey Testnet
              <br />
              powered by verifier contract calls
            </h1>
            <p className="pow-copy">
              We are building the same ZAuth product direction with HashKey compatibility:
              challenge flow, proof flow, SDK integration, and reusable verification backend.
            </p>
          </section>

          <section id="overview" className="pow-section">
            <h2 className="pow-kicker">Overview</h2>
            <p className="pow-copy">
              <strong>What we use instead of UltraHonk:</strong> standard EVM verifier contract call via
              <code> verifyProof(bytes proof, uint256[] publicInputs) </code>
              on HashKey testnet.
            </p>
            <p className="pow-copy">
              <strong>Why:</strong> this is HashKey-native, easier to demo, and directly compatible with EVM contract tooling.
            </p>
            <p className="pow-copy">
              <strong>Architecture:</strong> frontend requests challenge, proof is generated, backend verifies against chain RPC,
              and app receives a final verdict.
            </p>
          </section>

          <section id="how" className="pow-section">
            <h2 className="pow-kicker">How it works</h2>
            <p className="pow-copy">1. Frontend requests challenge from challenge backend.</p>
            <p className="pow-copy">2. User solves captcha and client generates proof + public inputs.</p>
            <p className="pow-copy">3. Verifier server calls HashKey contract `verifyProof(...)` through RPC.</p>
            <p className="pow-copy">4. API responds success/failure and app continues auth/session flow.</p>
          </section>

          <section className="pow-section">
            <h2 className="pow-kicker">Why this is hackathon-ready</h2>
            <p className="pow-copy">- Minimal backend surface (`/health`, `/verify`) for easy deployment.</p>
            <p className="pow-copy">- Publishable npm SDK for frontend integration (`@ethayush/captcha-sdk`).</p>
            <p className="pow-copy">- Dedicated `/demo` route for judges to test proof payloads quickly.</p>
          </section>

          <section>
            <h2 className="pow-kicker">Try it live</h2>
            <p className="pow-copy">
              Open <Link href="/demo"><u>/demo</u></Link> and test your verifier against HashKey testnet with live payloads.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
