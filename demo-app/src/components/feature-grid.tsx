export function ProductSection() {
  return (
    <section id="product" className="pow-section">
      <h2 className="pow-kicker">Product</h2>
      <div className="pow-grid">
        <article className="pow-card">
          <h3>Abuse reduction</h3>
          <p>Blocks scripted and bot-driven flows with stronger verification semantics than standard CAPTCHA tokens.</p>
        </article>
        <article className="pow-card">
          <h3>Privacy preserving</h3>
          <p>Applications consume verification outcomes without exposing sensitive user-side challenge inputs.</p>
        </article>
        <article className="pow-card">
          <h3>Developer ready</h3>
          <p>Comes with verifier backend, SDK interface, and interactive demo route for faster adoption.</p>
        </article>
      </div>
    </section>
  );
}
