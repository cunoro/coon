import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";

import { resolve } from "path";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
    mainnet: 43114,
    fuji: 43113,
    hardhat: 31337,
};

// Ensure that we have all the environment variables we need.
//const mnemonic: string | undefined = process.env.MNEMONIC ?? "NO_MNEMONIC";
const privateKey: string | undefined = process.env.PRIVATE_KEY ?? "NO_PRIVATE_KEY";

// function getChainConfig(network: keyof typeof chainIds): NetworkUserConfig {
//     const url = `https://eth-${network}.alchemyapi.io/v2/${alchemyApiKey}`;
//     return {
//         //accounts: {
//         //    count: 10,
//         //    mnemonic,
//         //    path: "m/44'/60'/0'/0",
//         //},
//         accounts: [`${privateKey}`],
//         chainId: chainIds[network],
//         url,
//     };
// }

const FORK_FUJI = true
const FORK_MAINNET = false
const forkingData = FORK_FUJI ? {
  url: 'https://api.avax-test.network/ext/bc/C/rpc',
} : FORK_MAINNET ? {
  url: 'https://api.avax.network/ext/bc/C/rpc',
} : undefined

const config: any = {
    defaultNetwork: "hardhat",
    gasReporter: {
        currency: "USD",
        enabled: process.env.REPORT_GAS ? true : false,
        excludeContracts: [],
        src: "./contracts",
    },
    networks: {
        hardhat: {
          networkId: !forkingData ? chainIds.mainnet : undefined, // Only specify a chainId if we are not forking
          forking: forkingData,
          // accounts: [
          //   {
          //     privateKey,
          //   }
          // ],
            // chainId: chainIds.hardhat,
        },
    },
    paths: {
        artifacts: "./artifacts",
        cache: "./cache",
        sources: "./contracts",
        tests: "./test",
        deploy: "./scripts/deploy",
        deployments: "./deployments",
    },
    solidity: {
        compilers: [
            {
                version: "0.7.5",
                settings: {
                    metadata: {
                        bytecodeHash: "none",
                    },
                    optimizer: {
                        enabled: true,
                        runs: 800,
                    },
                },
            },
            {
                version: "0.5.0",
            },
            {
                version: "0.5.16",
            },
        ],
        settings: {
            outputSelection: {
                "*": {
                    "*": ["storageLayout"],
                },
            },
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        daoMultisig: {
            // mainnet
            1: "", // TODO Gnosis Proxy
        },
    },
    typechain: {
        outDir: "types",
        target: "ethers-v5",
    },
};

export default config;
