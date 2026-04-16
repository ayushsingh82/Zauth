import Link from 'next/link';

export function DeveloperSection() {
  return (
    <section id="developers" className="pow-section">
      <h2 className="pow-kicker">For developers</h2>
      <p className="pow-copy"><strong>Build with ZAuth without being a ZK expert</strong></p>
      <p className="pow-copy">
        We handle the complex ZK stuff. You just integrate simple APIs and get verifiable attestations back.
      </p>
      <div className="pow-grid pow-grid-two">
        <article className="pow-card">
          <h3>Drop-in SDK</h3>
          <p>Install via npm, integrate in minutes. Full TypeScript support with type-safe APIs.</p>
        </article>
        <article className="pow-card">
          <h3>Simple REST API</h3>
          <p>Request proofs, check status, fetch attestations - standard REST endpoints, no ZK expertise needed.</p>
        </article>
        <article className="pow-card">
          <h3>Comprehensive docs</h3>
          <p>Guides, tutorials, API reference, and example apps. From hello world to production fast.</p>
        </article>
        <article className="pow-card">
          <h3>Fast verification</h3>
          <p>HashKey Chain handles proof verification in under 1 second. Your app just checks attestation state.</p>
        </article>
      </div>

      <article className="pow-card" style={{ marginTop: '1rem' }}>
        <h3>example.js</h3>
        <pre className="result-box">{`// Request a proof
const proofRequest = await Zauth.proofs.request({
  type: "github-account",
  params: { owner: "user" }
});

// Check status
const status = await Zauth.proofs.status(proofRequest.id);

// Get attestation
const attestation = await Zauth.attestations.get(proofRequest.id);
console.log(attestation.valid); // true`}</pre>
      </article>


    </section>
  );
}
