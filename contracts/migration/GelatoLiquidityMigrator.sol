// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;
pragma abicoder v2;

import "../libraries/SafeERC20.sol";

import "../interfaces/ITreasury.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IUniswapV2Router.sol";
import "../interfaces/ICunoroAuthority.sol";

import "../types/CunoroAccessControlled.sol";

interface IGUniRouter {
    function addLiquidity(
        address pool,
        uint256 amount0Max,
        uint256 amount1Max,
        uint256 amount0Min,
        uint256 amount1Min,
        address receiver
    ) external;
}

contract GelatoLiquidityMigrator is CunoroAccessControlled {
    using SafeERC20 for IERC20;

    // GUni Router
    IGUniRouter internal immutable gUniRouter = IGUniRouter(0x513E0a261af2D33B46F98b81FED547608fA2a03d);

    // Cunoro Treasury
    ITreasury internal immutable treasury = ITreasury(0x9A315BdF513367C0377FB36545857d12e85813Ef);

    // Uniswap Router
    IUniswapV2Router internal immutable router = IUniswapV2Router(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    address internal immutable NOROFRAXGUniPool = 0x61a0C8d4945A61bF26c13e07c30AF1f1ca67b473;
    address internal immutable NOROFRAXLP = 0xB612c37688861f1f90761DC7F382C2aF3a50Cc39;
    address internal immutable NORO = 0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5;
    address internal immutable FRAX = 0x853d955aCEf822Db058eb8505911ED77F175b99e;

    constructor(ICunoroAuthority _authority) CunoroAccessControlled(_authority) {}

    /**
     * @notice Removes liquidity from NORO/FRAX LP, then adds liquidty to
     * NORO/FRAX GUni
     */
    function moveLiquidity(
        uint256 _amountNOROFRAX,
        uint256[2] calldata _minNOROFRAXLP,
        uint256[2] calldata _minNOROFRAXGUni,
        uint256 _deadline
    ) external onlyGuardian {
        // Manage LP from treasury
        treasury.manage(NOROFRAXLP, _amountNOROFRAX);

        // Approve LP to be spent by the uni router
        IERC20(NOROFRAXLP).approve(address(router), _amountNOROFRAX);

        // Remove specified liquidity from NORO/FRAX LP
        (uint256 amountNORO, uint256 amountFRAX) = router.removeLiquidity(
            NORO,
            FRAX,
            _amountNOROFRAX,
            _minNOROFRAXLP[0],
            _minNOROFRAXLP[1],
            address(this),
            _deadline
        );

        // Approve Balancer vault to spend tokens
        IERC20(NORO).approve(address(gUniRouter), amountNORO);
        IERC20(FRAX).approve(address(gUniRouter), amountFRAX);

        gUniRouter.addLiquidity(
            NOROFRAXGUniPool,
            amountNORO,
            amountFRAX,
            _minNOROFRAXGUni[0],
            _minNOROFRAXGUni[1],
            address(treasury)
        );

        // Send any leftover NORO back to guardian and FRAX to treasury
        IERC20(NORO).safeTransfer(authority.guardian(), IERC20(NORO).balanceOf(address(this)));
        IERC20(FRAX).safeTransfer(address(treasury), IERC20(FRAX).balanceOf(address(this)));
    }
}
