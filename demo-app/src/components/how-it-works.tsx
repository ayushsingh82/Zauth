export function HowItWorksSection() {
  return (
    <section id="how" className="pow-section">
      <h2 className="pow-kicker">How it works</h2>
      <p className="pow-copy">1. Frontend requests challenge from challenge backend.</p>
      <p className="pow-copy">2. User solves interaction and client generates proof payload.</p>
      <p className="pow-copy">3. Verifier server executes contract read on HashKey testnet via `verifyProof(...)`.</p>
      <p className="pow-copy">4. App receives success/failure and continues auth or gating logic.</p>
    </section>
  );
}
