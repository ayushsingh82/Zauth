import Link from 'next/link';

export function DeveloperSection() {
  return (
    <section id="developers" className="pow-section">
      <h2 className="pow-kicker">Developers</h2>
      <p className="pow-copy">- SDK: <a href="https://www.npmjs.com/package/@ethayush/captcha-sdk" target="_blank" rel="noreferrer"><u>@ethayush/captcha-sdk</u></a></p>
      <p className="pow-copy">- Demo route: <Link href="/demo"><u>/demo</u></Link></p>
      <p className="pow-copy">- Explorer: <a href="https://testnet-explorer.hsk.xyz" target="_blank" rel="noreferrer"><u>testnet-explorer.hsk.xyz</u></a></p>
      <p className="pow-copy">- RPC: <code>https://testnet.hsk.xyz</code></p>
    </section>
  );
}
