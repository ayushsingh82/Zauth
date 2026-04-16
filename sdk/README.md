# @ethayush/captcha-sdk

HashKey-compatible CAPTCHA SDK for frontend apps.

This SDK is designed for the `zauth-captcha` style flow:
- request challenge from your challenge backend
- submit proof to your HashKey verifier backend

## Install

```bash
npm install @ethayush/captcha-sdk
```

## Usage

```ts
import { HashkeyCaptchaSdk } from '@ethayush/captcha-sdk';

const sdk = new HashkeyCaptchaSdk(
  'https://your-challenge-backend.com',
  'https://your-verifier-backend.com'
);

const challenge = await sdk.getChallenge('my-site-id');
const proof = await sdk.generateProof(challenge);
const result = await sdk.verify(challenge.challengeId, proof, 'my-site-id');
console.log(result.success, result.token);
```

## API

### `new HashkeyCaptchaSdk(challengeApiUrl, verifierApiUrl)`
- `challengeApiUrl`: backend base URL exposing `POST /api/challenge`
- `verifierApiUrl`: backend base URL exposing `POST /verify`

### `getChallenge(siteId: string)`
Returns:
- `challengeId`
- `nonce`
- `difficulty`
- `expiresAt`

### `verifyOnchain(proofData: string, publicInputs: string[])`
Returns:
- `boolean` (`true` if backend verification returns success)

### `generateProof(challenge: Challenge)`
Returns a compatibility-oriented proof object:
- `proofData`
- `publicInputs`

### `verify(challengeId: string, proof: Proof, siteId?: string)`
Returns:
- `success`
- `verificationId`
- `token`
- `expiresAt`

## Publish checklist

1. Update version in `package.json`
2. Run:
   - `npm install`
   - `npm run build`
   - `npm run pack:check`
3. Login and publish:
   - `npm login`
   - `npm publish --access public`
