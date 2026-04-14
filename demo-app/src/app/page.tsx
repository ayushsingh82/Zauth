import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '4rem auto', background: '#fff', padding: '2rem', borderRadius: 12 }}>
      <h1>HashKey Hackathon Demo</h1>
      <p>This demo includes a HashKey-compatible CAPTCHA verification flow.</p>
      <Link href="/hashkey-demo">Open verification demo route</Link>
    </main>
  );
}
