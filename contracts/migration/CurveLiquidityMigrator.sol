// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import "../libraries/SafeERC20.sol";

import "../interfaces/ITreasury.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IUniswapV2Router.sol";
import "../interfaces/ICunoroAuthority.sol";

import "../types/CunoroAccessControlled.sol";

interface ICurvePool {
    function add_liquidity(
        uint256[2] memory amounts,
        uint256 min_mint_amount,
        bool use_eth,
        address receiver
    ) external payable returns (uint256);
}

/// @title   Curve Liquidity Migrator
/// @notice  Migrates from NORO/ETH SLP to the NORO/ETH Curve pool
/// @author  JeffX
contract CurveLiquidityMigrator is CunoroAccessControlled {
    using SafeERC20 for IERC20;

    /// STATE VARIABLES ///

    ICurvePool internal immutable curvePool = ICurvePool(0x6ec38b3228251a0C5D491Faf66858e2E23d7728B);
    ITreasury internal immutable treasury = ITreasury(0x9A315BdF513367C0377FB36545857d12e85813Ef);
    IUniswapV2Router internal immutable router = IUniswapV2Router(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

    address internal immutable NOROETHSLP = 0x69b81152c5A8d35A67B32A4D3772795d96CaE4da;
    address internal immutable NORO = 0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5;
    address internal immutable WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    /// CONSTRUCTOR ///

    /// @param _authority  Address of the Cunoro Authority contract
    constructor(ICunoroAuthority _authority) CunoroAccessControlled(_authority) {}

    /// POLICY FUNCTION ///

    /// @notice                 Removes NORO/ETH SLP and adds to Curve pool
    /// @param _amountToRemove  Amount of NORO/ETH SLP to remove
    /// @param _minRemoval      Array of min amounts of NORO and ETH to recieve back
    /// @param _minMintAmount   Min amount of NORO/ETH Curve pool tokens to recieve back.
    function moveLiquidity(
        uint256 _amountToRemove,
        uint256[2] memory _minRemoval,
        uint256 _minMintAmount
    ) external onlyGuardian {
        // Remove LP From Treasury
        treasury.manage(NOROETHSLP, _amountToRemove);

        // Approve LP to be spent by the Sushiswap router
        IERC20(NOROETHSLP).approve(address(router), _amountToRemove);

        // Remove specified liquidity from NORO/ETH SLP
        (uint256 amountNORO, uint256 amountWETH) = router.removeLiquidity(
            NORO,
            WETH,
            _amountToRemove,
            _minRemoval[0],
            _minRemoval[1],
            address(this),
            10000000000000000
        );

        // Approve curve pool vault to spend tokens
        IERC20(NORO).approve(address(curvePool), amountNORO);
        IERC20(WETH).approve(address(curvePool), amountWETH);

        // Add liquidity to the curve pool
        curvePool.add_liquidity([amountNORO, amountWETH], _minMintAmount, false, address(treasury));

        // Send any leftover NORO back to guardian and WETH to treasury
        IERC20(NORO).safeTransfer(authority.guardian(), IERC20(NORO).balanceOf(address(this)));
        IERC20(WETH).safeTransfer(address(treasury), IERC20(WETH).balanceOf(address(this)));
    }
}
