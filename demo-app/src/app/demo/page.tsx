import Link from 'next/link';
import { DemoVerifier } from '../../components/demo-verifier';

export default function DemoPage() {
  const halfWidth = '21rem';

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

      <div className="pow-vline" style={{ left: `calc(50% - ${halfWidth})` }} />
      <div className="pow-vline" style={{ right: `calc(50% - ${halfWidth})` }} />

      <main className="pow-main">
        <DemoVerifier />
      </main>
    </div>
  );
}
