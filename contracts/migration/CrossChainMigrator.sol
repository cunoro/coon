// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.7.5;

import "../interfaces/IERC20.sol";
import "../interfaces/IOwnable.sol";
import "../types/Ownable.sol";
import "../libraries/SafeERC20.sol";

contract CrossChainMigrator is Ownable {
    using SafeERC20 for IERC20;

    IERC20 internal immutable wsNORO; // v1 token
    IERC20 internal immutable gNORO; // v2 token

    constructor(address _wsNORO, address _gNORO) {
        require(_wsNORO != address(0), "Zero address: wsNORO");
        wsNORO = IERC20(_wsNORO);
        require(_gNORO != address(0), "Zero address: gNORO");
        gNORO = IERC20(_gNORO);
    }

    // migrate wsNORO to gNORO - 1:1 like kind
    function migrate(uint256 amount) external {
        wsNORO.safeTransferFrom(msg.sender, address(this), amount);
        gNORO.safeTransfer(msg.sender, amount);
    }

    // withdraw wsNORO so it can be bridged on ETH and returned as more gNORO
    function replenish() external onlyOwner {
        wsNORO.safeTransfer(msg.sender, wsNORO.balanceOf(address(this)));
    }

    // withdraw migrated wsNORO and unmigrated gNORO
    function clear() external onlyOwner {
        wsNORO.safeTransfer(msg.sender, wsNORO.balanceOf(address(this)));
        gNORO.safeTransfer(msg.sender, gNORO.balanceOf(address(this)));
    }
}
