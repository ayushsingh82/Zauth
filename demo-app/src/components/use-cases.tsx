export function UseCasesSection() {
  return (
    <section id="use-cases" className="pow-section">
      <h2 className="pow-kicker">Use cases</h2>
      <div className="pow-grid">
        <article className="pow-card">
          <h3>Signup/Login protection</h3>
          <p>Protect account creation and authentication paths from scripted abuse.</p>
        </article>
        <article className="pow-card">
          <h3>Form and mint bot mitigation</h3>
          <p>Gate high-risk actions behind private proof-based human verification.</p>
        </article>
        <article className="pow-card">
          <h3>Sybil resistance layer</h3>
          <p>Add lightweight human-interaction checks for community and consumer applications.</p>
        </article>
      </div>
    </section>
  );
}
