const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const FRAX_ADDRESS = "0x853d955aCEf822Db058eb8505911ED77F175b99e";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const LUSD_ADDRESS = "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0";
const OLD_WSNORO_ADDRESS = "0xCa76543Cf381ebBB277bE79574059e32108e3E65";
const OLD_SNORO_ADDRESS = "0x04F2694C8fcee23e8Fd0dfEA1d4f5Bb8c352111F";
const OLD_NORO_ADDRESS = "0x383518188c0c6d7730d91b2c03a03c837814a899";
const NORO_DAI_LP = "0x34d7d7Aaf50AD4944B70B320aCB24C95fa2def7c";
const NORO_FRAX_LP = "0x2dcE0dDa1C2f98e0F171DE8333c3c6Fe1BbF4877";
const NORO_LUSD_LP = "0xfDf12D1F85b5082877A6E070524f50F6c84FAa6b";
const SUSHI_FACTORY = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const WAVAX_ADDRESS = ""
const BEND_ADDRESS = ""

// TODO(zx): Simulate wallets with assets
const NORO_USER = "0xd1E4b670Ef483a8310b4209a1C7E5c2881006676";
const SNORO_USER = "0xeBAD6df8ffa40c0D764f3Fc217B4028603bC2A26";
const WSNORO_USER = "0x8567d7AaEaDEBd9c3a7583351CC69d35E89Bd6f1";
// TODO(zx): Simulate wallets with assets

const dai_abi = require("../../abis/dai");
const frax_abi = require("../../abis/frax");
const weth_abi = require("../../abis/weth");
const lusd_abi = require("../../abis/lusd");
const wsnoro_abi = require("../../abis/wsnoro");
const snoro_abi = require("../../abis/snoro");
const noro_abi = require("../../abis/noro");
const noro_dai_lp_abi = require("../../abis/noro_dai_lp");
const noro_frax_lp_abi = require("../../abis/noro_frax_lp");
const noro_lusd_lp_abi = require("../../abis/noro_lusd_lp");
const uni = require("../../abis/uni_factory");
const sushi = require("../../abis/sushi_factory");

const { WAVAX, BEND } = require("./config");


const treasury_tokens = [
    {
      name: "wavax",
      address: WAVAX,
      abi: weth_abi,
      isReserve: true,
    },
    {
        name: "bend",
        address: BEND,
        abi: frax_abi,
        isReserve: true,
    },
];

const cunoro_tokens = [
    {
        name: "wsnoro",
        address: OLD_WSNORO_ADDRESS,
        abi: wsnoro_abi,
        migrationType: 2, // WRAPPED
        wallet: WSNORO_USER,
    },
    {
        name: "snoro",
        address: OLD_SNORO_ADDRESS,
        abi: snoro_abi,
        migrationType: 1, // STAKED
        wallet: SNORO_USER,
    },
    {
        name: "noro",
        address: OLD_NORO_ADDRESS,
        abi: noro_abi,
        migrationType: 0, // UNSTAKED
        wallet: NORO_USER,
    },
];

const cunoro_lp_tokens = [
    {
        name: "noro_wavax",
        address: NORO_FRAX_LP,
        token0: FRAX_ADDRESS,
        token1: OLD_NORO_ADDRESS,
        is_sushi: false,
        abi: noro_frax_lp_abi,
        isLP: true,
    },
    {
        name: "noro_usdc",
        address: NORO_LUSD_LP,
        token0: LUSD_ADDRESS,
        token1: OLD_NORO_ADDRESS,
        is_sushi: true,
        abi: noro_lusd_lp_abi,
        isLP: true,
    },
    // {
    //     name: "noro_euroc",
    //     address: NORO_DAI_LP,
    //     token0: DAI_ADDRESS,
    //     token1: OLD_NORO_ADDRESS,
    //     is_sushi: true,
    //     abi: noro_dai_lp_abi,
    //     isLP: true,
    // },
];

const swaps = [
    {
        name: "uni",
        address: UNI_FACTORY,
        abi: uni,
    },
    {
        name: "sushi",
        address: SUSHI_FACTORY,
        abi: sushi,
    },
];

module.exports = { treasury_tokens, cunoro_tokens, cunoro_lp_tokens, swaps };
