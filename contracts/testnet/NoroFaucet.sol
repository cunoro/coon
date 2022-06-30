// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.7.5;

import "../interfaces/IERC20.sol";
import "../types/Ownable.sol";

contract NoroFaucet is Ownable {
    IERC20 public noro;

    constructor(address _noro) {
        noro = IERC20(_noro);
    }

    function setNoro(address _noro) external onlyOwner {
        noro = IERC20(_noro);
    }

    function dispense() external {
        noro.transfer(msg.sender, 1e9);
    }
}
