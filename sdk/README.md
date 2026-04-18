# @ethayush/captcha-sdk

TypeScript SDK for the [ZAuth](https://github.com/ayushsingh82/Zauth)
zero-knowledge CAPTCHA on HashKey Chain. Fetches a challenge, generates a
real Groth16 proof **in the browser**, and submits it to an on-chain
verifier.

## Install

```bash
npm i @ethayush/captcha-sdk
```

Peer deps (pulled in automatically): `snarkjs`, `circomlibjs`, `zod`.

## Usage

Serve the circuit artifacts (`zauth.wasm` and `zauth_final.zkey`) somewhere
your browser can `fetch` them. For a Next.js app, drop them into
`public/zauth/`. Grab both from the [`circuits/build/`](https://github.com/ayushsingh82/Zauth/tree/main/circuits)
folder of the main repo.

```ts
import { HashkeyCaptchaSdk } from '@ethayush/captcha-sdk';

const sdk = new HashkeyCaptchaSdk(
  'https://your-verifier-server.example.com', // challenge + verify API
  'https://your-verifier-server.example.com',
  { artifactBaseUrl: '/zauth' }                // where zauth.wasm + zkey live
);

const challenge = await sdk.getChallenge('my-site');
const proof     = await sdk.generateProof(challenge);    // runs snarkjs in-browser
const result    = await sdk.verify(challenge.challengeId, proof, 'my-site');

if (result.success) {
  // result.token is a JWT — pass it to your backend for short-lived trust
}
```

## What `generateProof` actually does

1. Pulls a fresh `secret` via `crypto.getRandomValues`.
2. Mines a `solution` locally so `Poseidon(nonce, solution)` has 8 zero high
   bits (default difficulty; ~256 iterations, <1 s).
3. Runs `snarkjs.groth16.fullProve(...)` against the circuit wasm + zkey.
4. Uses `snarkjs.groth16.exportSolidityCallData` to emit a
   Solidity-ready `[a, b, c, pubSignals]` tuple (handles the G2 coordinate
   swap for you).

The server never sees the secret or the solution.

## API

```ts
new HashkeyCaptchaSdk(
  challengeApiUrl: string,
  verifierApiUrl:  string,
  options?: {
    artifactBaseUrl?: string;   // default: '/zauth'
    difficulty?:      number;   // default: 8  (must match the deployed circuit)
  }
);

getChallenge(siteId: string): Promise<Challenge>;
generateProof(challenge: Challenge): Promise<Proof>;
verify(challengeId: string, proof: Proof, siteId?: string): Promise<VerificationResult>;

// Bytes-mode alternative for generic verifyProof(bytes, uint256[]) ABIs.
verifyOnchain(proofData: string, publicInputs: string[]): Promise<boolean>;
```

## Types

```ts
type Challenge = {
  challengeId: string;
  nonce:       string;    // decimal BN254 field element
  expirySec:   number;    // unix seconds
  difficulty:  number;
  expiresAt:   string;    // ISO
};

type Proof = {
  publicInputs: string[];
  groth16?: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    input: string[];      // 4 public signals for ZAuth
  };
};
```

## Browser bundling

`snarkjs` + `ffjavascript` reference Node builtins. In Next.js 14 add to
`next.config.js`:

```js
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false, path: false, crypto: false, os: false, readline: false
    };
  }
  return config;
}
```

## HashKey Chain Testnet

Live verifier contract used by default in the demo app:
[`0xC40c974E6D50D201C93265a9D8423e30D0C551aE`](https://testnet-explorer.hsk.xyz/address/0xC40c974E6D50D201C93265a9D8423e30D0C551aE)

## Publish checklist

```bash
# 1. Bump version in package.json
# 2. Rebuild dist
npm install
npm run build
npm run pack:check

# 3. Publish
npm login
npm publish --access public
```

## License

MIT. See [LICENSE](./LICENSE).
