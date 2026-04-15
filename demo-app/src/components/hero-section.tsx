import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="pow-section">
      <p className="pow-badge">ZAuth Captcha - HashKey edition</p>
      <h1 className="pow-title">
        Privacy-preserving human verification
        <br />
        for modern apps on HashKey
      </h1>
      <p className="pow-copy">
        ZAuth replaces opaque CAPTCHA tokens with proof-based verification so applications can trust challenge outcomes
        without exposing user-side private inputs.
      </p>
      <div className="pow-actions">
        <Link className="pow-cta" href="/demo">Try demo</Link>
        <a className="pow-ghost" href="https://www.npmjs.com/package/@ethayush/captcha-sdk" target="_blank" rel="noreferrer">
          NPM SDK
        </a>
      </div>
    </section>
  );
}
