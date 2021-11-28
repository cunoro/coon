const { ethers } = require('hardhat')
const { expect } = require('chai')

describe('CunoroCoonERC20V2', () => {
  let clam2;

  beforeEach(async () => {
    const COON2 = await ethers.getContractFactory('CunoroCoonERC20V2')
    clam2 = await COON2.deploy()
  })

  describe('complete migration', () => {
    it('should update symbol to COON', async () => {
      expect(await clam2.symbol()).to.eq('COON2')
      await clam2.completeMigration()
      expect(await clam2.symbol()).to.eq('COON')
    })
  })
})
