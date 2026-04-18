// Deploy ZAuthVerifier + ZAuthAttestor to the currently configured network.
//   npx hardhat run scripts/deploy.ts --network hashkey
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  console.log('deployer:', address);
  console.log('balance :', ethers.formatEther(balance), 'native');

  const Verifier = await ethers.getContractFactory('ZAuthVerifier');
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddr = await verifier.getAddress();
  console.log('ZAuthVerifier deployed:', verifierAddr);

  const Attestor = await ethers.getContractFactory('ZAuthAttestor');
  const attestor = await Attestor.deploy(verifierAddr);
  await attestor.waitForDeployment();
  const attestorAddr = await attestor.getAddress();
  console.log('ZAuthAttestor deployed:', attestorAddr);

  console.log('\nset these in verifier-server/.env:');
  console.log('  VERIFIER_CONTRACT=' + verifierAddr);
  console.log('  ATTESTOR_CONTRACT=' + attestorAddr);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
