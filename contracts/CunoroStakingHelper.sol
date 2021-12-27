// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import './interfaces/IERC20.sol';
import './interfaces/ICunoroStaking.sol';

contract CunoroStakingHelper {
    address public immutable staking;
    address public immutable NORO;

    constructor(address _staking, address _NORO) {
        require(_staking != address(0));
        staking = _staking;
        require(_NORO != address(0));
        NORO = _NORO;
    }

    function stake(uint256 _amount, address _recipient) external {
        IERC20(NORO).transferFrom(msg.sender, address(this), _amount);
        IERC20(NORO).approve(staking, _amount);
        ICunoroStaking(staking).stake(_amount, _recipient);
        ICunoroStaking(staking).claim(_recipient);
    }
}
