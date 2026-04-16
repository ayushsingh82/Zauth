export function ComparisonSection() {
  return (
    <section id="comparison" className="pow-section">
      <h2 className="pow-kicker">Why ZAuth</h2>
      <p className="pow-copy"><strong>Compare to traditional verification methods</strong></p>
      <div className="pow-grid pow-grid-two">
        <article className="pow-card">
          <h3>ZAuth</h3>
          <p>- Privacy-preserving</p>
          <p>- No behavioral tracking</p>
          <p>- No data storage required</p>
          <p>- User-controlled identity</p>
          <p>- Repeatable proofs (no reCAPTCHA)</p>
          <p>- Cross-platform compatible</p>
          <p>- Bot-resistant</p>
          <p>- Easy integration</p>
        </article>
        <article className="pow-card">
          <h3>Traditional</h3>
          <p>Traditional methods include reCAPTCHA, password-based auth, OAuth, and passwordless solutions.</p>
        </article>
      </div>
    </section>
  );
}
