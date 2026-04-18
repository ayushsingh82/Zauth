// End-to-end test for the ZAuth Groth16 verifier.
//
// Runs circuits/scripts/prove.mjs to generate a fresh proof against the
// compiled circuit, deploys the verifier to Hardhat's in-memory EVM, and
// asserts verifyProof returns true for the real proof and false for a
// tampered proof.
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

type Calldata = [
  [string, string],
  [[string, string], [string, string]],
  [string, string],
  [string, string, string, string]
];

function generateProof(): { calldata: Calldata; publicSignals: string[] } {
  const circuitsDir = path.resolve(__dirname, '..', '..', 'circuits');
  const proc = spawnSync('node', ['scripts/prove.mjs', '--difficulty', '8'], {
    cwd: circuitsDir,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });
  if (proc.status !== 0) {
    throw new Error('prove.mjs failed: ' + proc.stderr);
  }
  const parsed = JSON.parse(proc.stdout);
  return { calldata: parsed.calldata as Calldata, publicSignals: parsed.publicSignals };
}

describe('ZAuthVerifier', function () {
  this.timeout(120_000);

  it('accepts a real Groth16 proof and rejects a tampered one', async () => {
    const Verifier = await ethers.getContractFactory('ZAuthVerifier');
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    const { calldata } = generateProof();
    const [a, b, c, input] = calldata;

    const ok = await verifier.verifyProof(a, b, c, input);
    expect(ok).to.equal(true);

    // Flip one public signal -> proof should no longer satisfy verifier.
    const tampered = [...input] as [string, string, string, string];
    tampered[2] = '0x' + (BigInt(tampered[2]) + 1n).toString(16);
    const bad = await verifier.verifyProof(a, b, c, tampered);
    expect(bad).to.equal(false);
  });

  it('rejects a proof where a coordinate has been flipped', async () => {
    const Verifier = await ethers.getContractFactory('ZAuthVerifier');
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    const { calldata } = generateProof();
    const [a, b, c, input] = calldata;

    const badA: [string, string] = [
      '0x' + (BigInt(a[0]) ^ 1n).toString(16),
      a[1]
    ];
    const ok = await verifier.verifyProof(badA, b, c, input);
    expect(ok).to.equal(false);
  });
});
