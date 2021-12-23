let addresses = {
  sCLAM_ADDRESS: '0xAAc144Dc08cE39Ed92182dd85ded60E5000C9e67',
  CLAM_ADDRESS: '0xC250e9987A032ACAC293d838726C511E6E1C029d',
  OLD_CLAM_ADDRESS: '0x4d6A30EFBE2e9D7A9C143Fce1C5Bb30d9312A465',
  OLD_SCLAM_ADDRESS: '0x3949F058238563803b5971711Ad19551930C8209',
  MAI_ADDRESS: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
  TREASURY_ADDRESS: '0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C',
  CLAM_BONDING_CALC_ADDRESS: '0x651125e097D7e691f3Df5F9e5224f0181E3A4a0E',
  STAKING_ADDRESS: '0xC8B0243F350AA5F8B979b228fAe522DAFC61221a',
  OLD_STAKING_ADDRESS: '0xcF2A11937A906e09EbCb8B638309Ae8612850dBf',
  STAKING_HELPER_ADDRESS: '0x76B38319483b570B4BCFeD2D35d191d3c9E01691',
  MIGRATOR: '0xDaa1f5036eC158fca9E5ce791ab3e213cD1c41df',
  RESERVES: {
    MAI: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
    OLD_MAI_CLAM: '0x8094f4C9a4C8AD1FF4c6688d07Bd90f996C7CA21',
    MAI_CLAM: '0x1581802317f32A2665005109444233ca6E3e2D68',
  },
  BONDS: {
    OLD_MAI: '0x28077992bFA9609Ae27458A766470b03D43dEe8A',
    OLD_MAI_CLAM: '0x64c766f9A4936c3a4b51C55Ea5C4854E19766035',
    MAI: '0x603A74Fd527b85E0A1e205517c1f24aC71f5C263',
    MAI_CLAM: '0x706587BD39322A6a78ddD5491cDbb783F8FD983E',
  },
  CLAM_CIRCULATING_SUPPLY: '0x99ee91871cf39A44E3Fc842541274d7eA05AE4b3',
}

const zeroAddress = '0x0000000000000000000000000000000000000000'
let maticLPAddr = '0x3fcc446c70489610462be9d61528c51151aca49f'
let oracleAddr = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'

await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: ['0x929A27c46041196e1a49C7B459d63eC9A20cd879'] })
let multisig = await ethers.getSigner( '0x929A27c46041196e1a49C7B459d63eC9A20cd879')

await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: ['0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B'] })
let deployer = await ethers.getSigner('0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B')

const Treasury = await ethers.getContractFactory('OtterTreasury')
let treasury = Treasury.attach('0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C').connect(multisig)

const ERC20 = await ethers.getContractFactory('OtterClamERC20V2')
let clam = ERC20.attach(addresses.CLAM_ADDRESS)
let wmatic = ERC20.attach(maticLPAddr)

const StakedOtterClamERC20V2 = await ethers.getContractFactory('StakedOtterClamERC20V2')
let sClam = StakedOtterClamERC20V2.attach(addresses.sCLAM_ADDRESS).connect(deployer)

const Staking = await ethers.getContractFactory('OtterStaking')
let staking = Staking.attach(addresses.STAKING_ADDRESS).connect(deployer)

let Bond = await ethers.getContractFactory('OtterMaticLPBondDepository')
// let bond = Bond.attach('0x53E4DAFF2073f848DC3F7a8D7CC95b3607212A73')//.connect( deployer)
let bond = await Bond.deploy( addresses.CLAM_ADDRESS, addresses.sCLAM_ADDRESS, maticLPAddr, addresses.TREASURY_ADDRESS, addresses.STAKING_ADDRESS, addresses.CLAM_BONDING_CALC_ADDRESS, '0x929a27c46041196e1a49c7b459d63ec9a20cd879' , oracleAddr)

await treasury.queue('8', bond.address)

for (var i = 0; i < 43201; i++) { await hre.network.provider.request({ method: 'evm_mine' }); console.log(i); }

await treasury.toggle('5', maticLPAddr, addresses.CLAM_BONDING_CALC_ADDRESS)
await treasury.toggle('8', bond.address, zeroAddress)
// await treasury.toggle('2', maticAddr, zeroAddress)

const tokenMinPrice = '2000'
await bond.initializeBondTerms( '800', 5 * 86400, tokenMinPrice, '100', '8000000000000000','0')

await hre.network.provider.request({ method: 'evm_increaseTime', params:[86400 * 5] })
await hre.network.provider.request({ method: 'evm_mine' });


await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: ['0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B'] })
let deployer = await ethers.getSigner('0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B')
let Bond = await ethers.getContractFactory('OtterBondStakeDepository')
let bond = Bond.attach('0xda0d7c3d751d00a1ec1c495eF7Cf3db1a202B0B9').connect( deployer)
await bond.initializeBondTerms( '100', 432000, '700', '100', '10000', '8000000000000000', '0')
