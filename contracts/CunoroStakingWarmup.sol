// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import './interfaces/IERC20.sol';

contract CunoroStakingWarmup {
    address public immutable staking;
    address public immutable sNORO;

    constructor(address _staking, address _sNORO) {
        require(_staking != address(0));
        staking = _staking;
        require(_sNORO != address(0));
        sNORO = _sNORO;
    }

    function retrieve(address _staker, uint256 _amount) external {
        require(msg.sender == staking);
        IERC20(sNORO).transfer(_staker, _amount);
    }
}
