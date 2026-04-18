import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';
import type { HardhatUserConfig } from 'hardhat/config';

dotenv.config();

const PRIVATE_KEY = process.env.HASHKEY_PRIVATE_KEY || '';
const RPC = process.env.HASHKEY_RPC_URL || 'https://testnet.hsk.xyz';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // HashKey Chain is post-Shanghai; "paris" works everywhere so we pin it
      // to avoid PUSH0 surprises on older EVM forks.
      evmVersion: 'paris'
    }
  },
  networks: {
    hashkey: {
      url: RPC,
      chainId: 133,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};

export default config;
