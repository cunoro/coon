const { ethers } = require('hardhat')
const IUniswapV2Pair = require('./IUniswapV2Pair.json').abi

const CLAM_MAI_LP = '0x1581802317f32A2665005109444233ca6E3e2D68'
const priceFormatter = Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'usd',
})

async function main() {
  const OtterBondDepository = await ethers.getContractFactory(
    'OtterBondDepository'
  )
  const MaticBondDepository = await ethers.getContractFactory(
    'OtterMaticBondDepository'
  )
  const bonds = [
    { name: 'MAI', address: '0x779CB532e289CbaA3d0692Ae989C63C2B4fBd4d0' },
    { name: 'CLAM-MAI', address: '0xda0d7c3d751d00a1ec1c495eF7Cf3db1a202B0B9' },
    { name: 'FRAX', address: '0x9e1430EB3b56e8953a342BFBBdD2DDC3b6E84d9D' },
    { name: 'CLAM-FRAX', address: '0xd99c8aF24c5E7fd6E292b1682Ec0f0cB3535e002', },
    { name: 'MATIC', address: '0xf57Fb38f57D2a4Fca0ee074A3F3b4e5C570959E4' },
  ]

  for (const { name, address } of bonds) {
    const bond =
      name === 'MATIC'
        ? MaticBondDepository.attach(address)
        : OtterBondDepository.attach(address)
    await fetchBondInfo(name, bond)
    bond.on('BondCreated', async (deposit, payout, _, priceInUSD) => {
      const [terms, debtRatio, adjustment] = await Promise.all([
        bond.terms(),
        bond.standardizedDebtRatio(),
        bond.adjustment(),
      ])
      const marketPrice = Number(
        ethers.utils.formatUnits(await getMarketPrice(), 9)
      )
      console.log(`==== New Bond ${name} created! ==== ` + new Date())
      console.log(
        JSON.stringify(
          {
            deposit: ethers.utils.formatEther(deposit),
            payout: ethers.utils.formatUnits(payout, 9),
            bondPrice: priceFormatter.format(
              ethers.utils.formatEther(priceInUSD)
            ),
            total: priceFormatter.format(
              ethers.utils.formatEther(payout.mul(priceInUSD).div(1e9))
            ),
            marketPrice: priceFormatter.format(marketPrice),
            bcv: terms[0].toString(),
            ROI: Intl.NumberFormat('en', {
              style: 'percent',
              minimumFractionDigits: 2,
            }).format((marketPrice - Number(priceInUSD / 1e18)) / priceInUSD),
            minPrice: terms[2].toString(),
            debtRatio:
              name === 'MAI' || name === 'FRAX' || name === 'MATIC'
                ? ethers.utils.formatUnits(debtRatio, 7) + '%'
                : ethers.utils.formatUnits(debtRatio, 16) + '%',
            adjustment: `${
              adjustment[0] ? '+' : '-'
            }${adjustment[1].toString()} target: ${adjustment[2].toString()} buffer: ${adjustment[3].toString()}`,
          },
          null,
          2
        )
      )
    })
  }

  // setInterval(async () => {
  //   console.log('==== ' + new Date())
  //   for (const { name, address } of bonds) {
  //     const bond = OtterBondDepository.attach(address)
  //     await fetchBondInfo(name, bond)
  //   }
  // }, 60 * 1000)
}

async function fetchBondInfo(name, bond) {
  const marketPrice = Number(
    ethers.utils.formatUnits(await getMarketPrice(), 9)
  )
  const [terms, debtRatio, price, adjustment] = await Promise.all([
    bond.terms(),
    bond.standardizedDebtRatio(),
    bond.bondPriceInUSD(),
    bond.adjustment(),
  ])
  const bondPrice = Number(ethers.utils.formatEther(price))
  console.log(
    JSON.stringify(
      {
        name,
        marketPrice: priceFormatter.format(marketPrice),
        bondPrice: priceFormatter.format(bondPrice),
        bcv: terms[0].toString(),
        adjustment: `${
          adjustment[0] ? '+' : '-'
        }${adjustment[1].toString()} target: ${adjustment[2].toString()} buffer: ${adjustment[3].toString()}`,
        debtRatio:
          name === 'MAI' || name === 'FRAX' || name === 'MATIC'
            ? ethers.utils.formatUnits(debtRatio, 7) + '%'
            : ethers.utils.formatUnits(debtRatio, 16) + '%',
        ROI: Intl.NumberFormat('en', {
          style: 'percent',
          minimumFractionDigits: 2,
        }).format((marketPrice - bondPrice) / bondPrice),
        minPrice: terms[2].toString(),
      },
      null,
      2
    )
  )
}

async function getMarketPrice() {
  const signer = await ethers.getSigner()
  const lp = new ethers.Contract(CLAM_MAI_LP, IUniswapV2Pair, signer)
  const reserves = await lp.getReserves()
  const marketPrice = reserves[0].div(reserves[1])
  return marketPrice
}

main()
  // .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    // process.exit(1)
  })
