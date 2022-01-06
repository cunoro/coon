const DAI_ADDRESS = "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70";
const FRAX_ADDRESS = "0xD24C2Ad096400B6FBcd2ad8B24E7acBc21A1da64";
const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";

const NORO_ADDRESS = "0x383518188c0c6d7730d91b2c03a03c837814a899";
const SNORO_ADDRESS = "0x04F2694C8fcee23e8Fd0dfEA1d4f5Bb8c352111F";
const WSNORO_ADDRESS = "0xCa76543Cf381ebBB277bE79574059e32108e3E65";

const NORO_DAI_LP = "0x34d7d7Aaf50AD4944B70B320aCB24C95fa2def7c";
const NORO_FRAX_LP = "0x2dcE0dDa1C2f98e0F171DE8333c3c6Fe1BbF4877";

const SUSHI_FACTORY = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const JOE_FACTORY = "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10";

// TODO(zx): Simulate wallets with assets
const NORO_USER = "0xd1E4b670Ef483a8310b4209a1C7E5c2881006676";
const SNORO_USER = "0xeBAD6df8ffa40c0D764f3Fc217B4028603bC2A26";
const WSNORO_USER = "0x8567d7AaEaDEBd9c3a7583351CC69d35E89Bd6f1";
// TODO(zx): Simulate wallets with assets

const dai_abi = require("../../abis/dai");
const frax_abi = require("../../abis/frax");
const wavax_abi = require("../../abis/wavax");
// const weth_abi = require("../../abis/weth");
// const lusd_abi = require("../../abis/lusd");
const wsnoro_abi = require("../../abis/wsnoro");
const snoro_abi = require("../../abis/snoro");
const noro_abi = require("../../abis/noro");
// const noro_dai_lp_abi = require("../../abis/noro_dai_lp");
const noro_frax_lp_abi = require("../../abis/noro_frax_lp");
// const noro_lusd_lp_abi = require("../../abis/noro_lusd_lp");
// const uni = require("../../abis/uni_factory");
const sushi = require("../../abis/sushi_factory");
const joe = require("../../abis/joe_factory");

const treasury_tokens = [
    {
        name: "frax",
        address: FRAX_ADDRESS,
        abi: frax_abi,
        isReserve: true,
    },
    {
        name: "wavax",
        address: WAVAX_ADDRESS,
        abi: wavax_abi,
        isReserve: true,
    },
];

const olympus_tokens = [
    {
        name: "wsnoro",
        address: WSNORO_ADDRESS,
        abi: wsnoro_abi,
        migrationType: 2, // WRAPPED
        wallet: WSNORO_USER,
    },
    {
        name: "snoro",
        address: SNORO_ADDRESS,
        abi: snoro_abi,
        migrationType: 1, // STAKED
        wallet: SNORO_USER,
    },
    {
        name: "noro",
        address: NORO_ADDRESS,
        abi: noro_abi,
        migrationType: 0, // UNSTAKED
        wallet: NORO_USER,
    },
];

const olympus_lp_tokens = [
    {
        name: "noro_frax",
        address: NORO_FRAX_LP,
        token0: FRAX_ADDRESS,
        token1: NORO_ADDRESS,
        is_sushi: false,
        abi: noro_frax_lp_abi,
        isLP: true,
    },
    // {
    //     name: "noro_dai",
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
        name: "joe",
        address: JOE_FACTORY,
        abi: joe,
    },
    // {
    //     name: "uni",
    //     address: UNI_FACTORY,
    //     abi: uni,
    // },
    // {
    //     name: "sushi",
    //     address: SUSHI_FACTORY,
    //     abi: sushi,
    // },
];

module.exports = { treasury_tokens, olympus_tokens, olympus_lp_tokens, swaps };
