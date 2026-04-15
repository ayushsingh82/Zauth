import Link from 'next/link';
import { DemoVerifier } from '../../components/demo-verifier';

export default function DemoPage() {
  return (
    <div className="pow-shell">
      <header className="pow-nav">
        <div className="pow-nav-inner">
          <Link href="/" className="pow-brand">ZAuth</Link>
          <nav className="pow-nav-links">
            <Link className="pow-link" href="/">Home</Link>
            <span className="pow-cta">Demo</span>
          </nav>
        </div>
      </header>

      <main className="pow-main">
        <DemoVerifier />
      </main>
    </div>
  );
}
