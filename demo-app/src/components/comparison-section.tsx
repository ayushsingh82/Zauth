export function ComparisonSection() {
  return (
    <section id="comparison" className="pow-section">
      <h2 className="pow-kicker">Comparison</h2>
      <div className="pow-grid pow-grid-two">
        <article className="pow-card">
          <h3>Traditional CAPTCHA</h3>
          <p>- Centralized trust model</p>
          <p>- Opaque response tokens</p>
          <p>- Weaker composability for on-chain or proof-native systems</p>
        </article>
        <article className="pow-card">
          <h3>ZAuth on HashKey</h3>
          <p>- Contract-verifiable decision path</p>
          <p>- Proof-aware integration model</p>
          <p>- Cleaner anti-bot primitive for modern app stacks</p>
        </article>
      </div>
    </section>
  );
}
