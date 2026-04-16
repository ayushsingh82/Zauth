export function Footer() {
  return (
    <footer className="pow-footer" style={{ padding: '2rem 1.5rem', borderTop: '1px solid var(--line)', marginTop: '4rem' }}>
      <div style={{ maxWidth: '68rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
        <p style={{ margin: 0 }}>© 2026 ZAuth. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="#" className="pow-link" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Privacy</a>
          <a href="#" className="pow-link" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Terms</a>
          <a href="https://github.com" className="pow-link" style={{ fontSize: '0.85rem', color: 'var(--muted)' }} target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
