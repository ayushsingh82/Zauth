export function UseCasesSection() {
  return (
    <section id="use-cases" className="pow-section">
      <h2 className="pow-kicker">Use cases</h2>
      <p className="pow-copy"><strong>Where ZAuth shines across industries</strong></p>
      <p className="pow-copy">
        Any scenario where you need to verify attributes without collecting or storing sensitive data.
      </p>
      <div className="pow-grid">
        <article className="pow-card">
          <h3>Anti-bot & fraud prevention</h3>
          <p>Replace CAPTCHA with ZK proofs that distinguish humans from bots without invading privacy or frustrating users.</p>
        </article>
        <article className="pow-card">
          <h3>Age verification</h3>
          <p>Verify users are over 18 or 21 without collecting or storing their ID or date of birth.</p>
        </article>
        <article className="pow-card">
          <h3>Sybil resistance</h3>
          <p>Ensure one-person-one-vote or one-person-one-account without collecting personal identifiers.</p>
        </article>
        <article className="pow-card">
          <h3>Credential verification</h3>
          <p>Prove ownership of accounts (GitHub, Twitter, email) without exposing tokens or OAuth tokens.</p>
        </article>
        <article className="pow-card">
          <h3>KYC automation</h3>
          <p>Streamline KYC by verifying attributes (residency, accreditation) without exposing underlying documents.</p>
        </article>
        <article className="pow-card">
          <h3>Exclusive access</h3>
          <p>Grant access to exclusive content or features based on verifiable attributes without data collection.</p>
        </article>
      </div>
    </section>
  );
}
