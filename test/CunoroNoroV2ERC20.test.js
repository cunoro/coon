const { ethers } = require('hardhat')
const { expect } = require('chai')

describe('CunoroNoroERC20V2', function () {
  let noro2

  beforeEach(async function () {
    const NORO2 = await ethers.getContractFactory('CunoroNoroERC20V2')
    noro2 = await NORO2.deploy()
  })

  describe('complete migration', function () {
    it('should update symbol to NORO', async function () {
      expect(await noro2.symbol()).to.eq('NORO2')
      await noro2.completeMigration()
      expect(await noro2.symbol()).to.eq('NORO')
    })
  })
})
