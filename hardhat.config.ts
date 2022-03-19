import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

const FORK_FUJI = true
const FORK_MAINNET = false
const forkingData = FORK_FUJI ? {
  url: 'https://api.avax-test.network/ext/bc/C/rpc',
} : FORK_MAINNET ? {
  url: 'https://api.avax.network/ext/bc/C/rpc'
} : undefined

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    compilers : [
      {
        version : "0.8.0",
        settings : {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
      {
        version : "0.7.5",
        settings : {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
      {
        version : "0.5.16",
        settings : {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
    ],
  },
  networks: {
    hardhat: {
      gasPrice: 225000000000,
      chainId: 31337 // !forkingData ? 43112 : undefined, //Only specify a chainId if we are not forking
    },
    localhost: {
      url: 'http://127.0.0.1:8545/ext/bc/C/rpc', // 'http://127.0.0.1:8545/ext/bc/C/rpc',  // http://127.0.0.1:8545
      accounts: 
      { mnemonic: process.env.LOCAL_MNEMONIC },
    },
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      // gasPrice: 30000000000,
      gas: 3000000,
      chainId: 43113,
      accounts: process.env.PRIVATE_KEY !== undefined ? [ process.env.PRIVATE_KEY ] : []
    },
    mainnet: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      // gasPrice: 1125000000000,
      chainId: 43114,
      accounts: process.env.PRIVATE_KEY !== undefined ? [ process.env.PRIVATE_KEY ] : []
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.SNOWTRACE_API_KEY,
  },
};

export default config;