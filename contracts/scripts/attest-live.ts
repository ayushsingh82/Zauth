// Generate a real Groth16 proof and submit it to the deployed ZAuthAttestor
// on HashKey Chain testnet. Emits a ProofAttested event you can inspect at
// https://testnet-explorer.hsk.xyz/tx/<hash>.
//
//   ATTESTOR_CONTRACT=0x... VERIFIER_CONTRACT=0x... \
//     npx hardhat run scripts/attest-live.ts --network hashkey
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { ethers } from 'hardhat';

const EXPLORER = 'https://testnet-explorer.hsk.xyz';

function randomFieldElement(): bigint {
  return BigInt('0x' + randomBytes(31).toString('hex'));
}

async function main() {
  const attestorAddr = process.env.ATTESTOR_CONTRACT;
  const verifierAddr = process.env.VERIFIER_CONTRACT;
  if (!attestorAddr) throw new Error('set ATTESTOR_CONTRACT env');
  if (!verifierAddr) throw new Error('set VERIFIER_CONTRACT env');

  const [signer] = await ethers.getSigners();
  const addr = await signer.getAddress();
  const bal = await ethers.provider.getBalance(addr);
  console.log('signer  :', addr);
  console.log('balance :', ethers.formatEther(bal), 'HSK');

  // 1) Generate a challenge locally. A production server would do this.
  //    We pick expiry 1h out so the on-chain timestamp check passes.
  const nonce = randomFieldElement();
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
  console.log('nonce   :', nonce.toString());
  console.log('expiry  :', expiry.toString(), '(', new Date(Number(expiry) * 1000).toISOString(), ')');

  // 2) Run the snarkjs prover.
  console.log('proving ...');
  const circuitsDir = path.resolve(__dirname, '..', '..', 'circuits');
  const t0 = Date.now();
  const proc = spawnSync('node', [
    'scripts/prove.mjs',
    '--nonce', nonce.toString(),
    '--expiry', expiry.toString(),
    '--difficulty', '8'
  ], { cwd: circuitsDir, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (proc.status !== 0) throw new Error('prove failed: ' + proc.stderr);
  const proofOut = JSON.parse(proc.stdout);
  console.log('proof generated in', Date.now() - t0, 'ms');

  const [a, b, c, input] = proofOut.calldata as [
    [string, string],
    [[string, string], [string, string]],
    [string, string],
    [string, string, string, string]
  ];

  // 3) Sanity: call verifier directly (view) first — cheaper feedback loop.
  const verifier = await ethers.getContractAt(
    ['function verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[4]) view returns (bool)'],
    verifierAddr
  );
  const viewOk = await verifier.verifyProof(
    [BigInt(a[0]), BigInt(a[1])],
    [[BigInt(b[0][0]), BigInt(b[0][1])], [BigInt(b[1][0]), BigInt(b[1][1])]],
    [BigInt(c[0]), BigInt(c[1])],
    [BigInt(input[0]), BigInt(input[1]), BigInt(input[2]), BigInt(input[3])]
  );
  console.log('verifier.verifyProof (view):', viewOk);
  if (!viewOk) throw new Error('verifier returned false; would fail on-chain too');

  // 4) Submit the actual on-chain attestation tx.
  console.log('attesting on-chain ...');
  const attestor = await ethers.getContractAt('ZAuthAttestor', attestorAddr);
  const tx = await attestor.attest(
    [BigInt(a[0]), BigInt(a[1])],
    [[BigInt(b[0][0]), BigInt(b[0][1])], [BigInt(b[1][0]), BigInt(b[1][1])]],
    [BigInt(c[0]), BigInt(c[1])],
    [BigInt(input[0]), BigInt(input[1]), BigInt(input[2]), BigInt(input[3])]
  );
  console.log('tx hash :', tx.hash);
  console.log('explorer:', EXPLORER + '/tx/' + tx.hash);

  const receipt = await tx.wait();
  console.log('block   :', receipt?.blockNumber);
  console.log('gas used:', receipt?.gasUsed?.toString());
  console.log('status  :', receipt?.status === 1 ? 'success' : 'failed');

  // 5) Decode the emitted event.
  const iface = attestor.interface;
  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === 'ProofAttested') {
        console.log('event ProofAttested:');
        console.log('  submitter :', parsed.args.submitter);
        console.log('  nonce     :', parsed.args.nonce.toString());
        console.log('  expiry    :', parsed.args.expiry.toString());
        console.log('  commitment:', parsed.args.commitment.toString());
        console.log('  powHash   :', parsed.args.powHash.toString());
      }
    } catch {
      /* not our event */
    }
  }

  // 6) Replay should now revert with AlreadyAttested.
  console.log('\nchecking replay protection ...');
  try {
    await attestor.attest.staticCall(
      [BigInt(a[0]), BigInt(a[1])],
      [[BigInt(b[0][0]), BigInt(b[0][1])], [BigInt(b[1][0]), BigInt(b[1][1])]],
      [BigInt(c[0]), BigInt(c[1])],
      [BigInt(input[0]), BigInt(input[1]), BigInt(input[2]), BigInt(input[3])]
    );
    throw new Error('expected revert on replay');
  } catch (e: any) {
    const msg = e.shortMessage || e.message || String(e);
    console.log('replay correctly reverted:', msg.slice(0, 160));
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
