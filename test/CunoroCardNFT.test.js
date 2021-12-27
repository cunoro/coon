const { ethers } = require('hardhat')
const { expect } = require('chai')

describe('CunoroNoro2021Q4ERC721', function () {
  let nft, deployer, cunoro

  beforeEach(async function () {
    ;[deployer, cunoro] = await ethers.getSigners()
    const NFT = await ethers.getContractFactory('CunoroCardNFT')
    nft = await NFT.deploy('diamond hand cunoro', 'DHO', 'ipfs://metadata')
  })

  it('construct', async function () {
    expect(await nft.cardURI()).to.eq('ipfs://metadata')
    expect(await nft.name()).to.eq('diamond hand cunoro')
    expect(await nft.symbol()).to.eq('DHO')
  })

  describe('claim', function () {
    it('not in whitelist', async function () {
      await expect(nft.connect(cunoro).claim()).to.be.revertedWith(
        'not in whitelist'
      )
    })

    it('claimed', async function () {
      await nft.setWhitelist([cunoro.address])

      expect(await nft.tokenIdCount()).to.eq(0)
      await nft.connect(cunoro).claim()
      expect(await nft.claimed(cunoro.address)).to.eq(1)
      expect(await nft.tokenIdCount()).to.eq(1)
      expect(await nft.tokenURI(1)).to.eq('ipfs://metadata')
    })

    it('auto increment id', async function () {
      await nft.setWhitelist([deployer.address, cunoro.address])

      expect(await nft.tokenIdCount()).to.eq(0)
      await nft.claim()
      expect(await nft.tokenIdCount()).to.eq(1)

      await nft.connect(cunoro).claim()
      expect(await nft.tokenIdCount()).to.eq(2)

      expect(await nft.claimed(deployer.address)).to.eq(1)
      expect(await nft.claimed(cunoro.address)).to.eq(2)
    })

    it('claim twice', async function () {
      await nft.setWhitelist([cunoro.address])

      await nft.connect(cunoro).claim()
      await expect(nft.connect(cunoro).claim()).to.be.revertedWith(
        'already claimed'
      )
    })
  })

  describe('whitelist', function () {
    it('should return false', async function () {
      await expect(await nft.whitelist(cunoro.address)).to.be.false
    })

    it('should return false after unset', async function () {
      await nft.setWhitelist([cunoro.address])
      await nft.unsetWhitelist([cunoro.address])
      await expect(await nft.whitelist(cunoro.address)).to.be.false
    })

    it('should return true', async function () {
      await nft.setWhitelist([cunoro.address])
      await expect(await nft.whitelist(cunoro.address)).to.be.true
    })

    it('only owner can set whitelist', async function () {
      await expect(
        nft.connect(cunoro).setWhitelist([cunoro.address])
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('only owner can unset whitelist', async function () {
      await expect(
        nft.connect(cunoro).unsetWhitelist([cunoro.address])
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })
})
