import Link from 'next/link';

export function Navbar() {
  return (
    <header className="pow-nav">
      <div className="pow-nav-inner">
        <Link href="/" className="pow-brand">ZAuth</Link>
        <nav className="pow-nav-links">
          <Link className="pow-cta" href="/demo">Get Started</Link>
        </nav>
      </div>
    </header>
  );
}
