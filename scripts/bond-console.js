let addresses = {
  sNORO_ADDRESS: '0xAAc144Dc08cE39Ed92182dd85ded60E5000C9e67',
  NORO_ADDRESS: '0xC250e9987A032ACAC293d838726C511E6E1C029d',
  DAI_ADDRESS: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
  TREASURY_ADDRESS: '0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C',
  NORO_BONDING_CALC_ADDRESS: '0x651125e097D7e691f3Df5F9e5224f0181E3A4a0E',
  STAKING_ADDRESS: '0xC8B0243F350AA5F8B979b228fAe522DAFC61221a',
  STAKING_HELPER_ADDRESS: '0x76B38319483b570B4BCFeD2D35d191d3c9E01691',
  MIGRATOR: '0xDaa1f5036eC158fca9E5ce791ab3e213cD1c41df',
  RESERVES: {
    DAI: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
    DAI_NORO: '0x1581802317f32A2665005109444233ca6E3e2D68',
  },
  BONDS: {
    DAI: '0x603A74Fd527b85E0A1e205517c1f24aC71f5C263',
    DAI_NORO: '0x706587BD39322A6a78ddD5491cDbb783F8FD983E',
  },
  NORO_CIRCULATING_SUPPLY: '0x99ee91871cf39A44E3Fc842541274d7eA05AE4b3',
}

const zeroAddress = '0x0000000000000000000000000000000000000000'

let fraxAddr = '0x45c32fa6df82ead1e2ef74d17b76547eddfaff89'

await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: ['0x929A27c46041196e1a49C7B459d63eC9A20cd879'] })
let multisig = await ethers.getSigner( '0x929A27c46041196e1a49C7B459d63eC9A20cd879')

await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: ['0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B'] })
let deployer = await ethers.getSigner('0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B')

const Treasury = await ethers.getContractFactory('CunoroTreasury')
let treasury = Treasury.attach('0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C').connect(multisig)

const ERC20 = await ethers.getContractFactory('CunoroNoroERC20V2')
let noro = ERC20.attach(addresses.NORO_ADDRESS)
let dai = ERC20.attach(addresses.MAI_ADDRESS)

const StakedCunoroNoroERC20V2 = await ethers.getContractFactory('StakedCunoroNoroERC20V2')
let sNoro = StakedCunoroNoroERC20V2.attach(addresses.sNORO_ADDRESS).connect(deployer)

const Staking = await ethers.getContractFactory('CunoroStaking')
let staking = Staking.attach(addresses.STAKING_ADDRESS).connect(deployer)

const DAI = await ethers.getContractFactory("DAI");
const dai = await DAI.deploy(0)
await dai.mint('', ethers.utils.parseEther('10000'))

let Bond = await ethers.getContractFactory('CunoroAvaxLPBondDepository')
let bond = Bond.attach('0x1dAc605bDD4e8F3ab23da9B360e672f4e973A196').connect(deployer)
// let bond = await Bond.deploy( addresses.NORO_ADDRESS, addresses.sNORO_ADDRESS, fraxAddr, addresses.TREASURY_ADDRESS, '0x929a27c46041196e1a49c7b459d63ec9a20cd879', zeroAddress)
// await bond.setStaking(staking.address)

// await treasury.queue('0', bond.address)
// await treasury.queue('2', dai.address)

// for (var i = 0; i < 43201; i++) { await hre.network.provider.request({ method: 'evm_mine' }); console.log(i); }

await treasury.toggle('4', bond.address, zeroAddress)
// await treasury.toggle('2', fraxAddr, zeroAddress)

const tokenMinPrice = '700'
await bond.initializeBondTerms( '300', 5 * 86400, '370', '100', '8000000000000000','0')

await hre.network.provider.request({ method: 'evm_increaseTime', params:[86400 * 2] })
await hre.network.provider.request({ method: 'evm_mine' });


let deployer = await ethers.getSigner('0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B')
await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: ['0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B'] })
let deployer = await ethers.getSigner('0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B')
let Bond = await ethers.getContractFactory('CunoroBondStakeDepository')
let bond = Bond.attach('0x1dAc605bDD4e8F3ab23da9B360e672f4e973A196').connect( deployer)
await bond.initializeBondTerms( '300', 5 * 86400, '370', '100', '8000000000000000','0')
