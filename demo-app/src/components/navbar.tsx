import Link from 'next/link';

export function Navbar() {
  return (
    <header className="pow-nav">
      <div className="pow-nav-inner">
        <Link href="/" className="pow-brand">ZAuth</Link>
        <nav className="pow-nav-links">
          <a className="pow-link" href="#how">How it works</a>
          <a className="pow-link" href="#developers">Developers</a>
          <Link className="pow-cta" href="/demo">Open demo</Link>
        </nav>
      </div>
    </header>
  );
}
