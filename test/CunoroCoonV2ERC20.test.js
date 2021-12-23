const { ethers } = require('hardhat')
const { expect } = require('chai')

describe('CunoroCoonERC20V2', function () {
  let coon2

  beforeEach(async function () {
    const COON2 = await ethers.getContractFactory('CunoroCoonERC20V2')
    coon2 = await COON2.deploy()
  })

  describe('complete migration', function () {
    it('should update symbol to COON', async function () {
      expect(await coon2.symbol()).to.eq('COON2')
      await coon2.completeMigration()
      expect(await coon2.symbol()).to.eq('COON')
    })
  })
})
