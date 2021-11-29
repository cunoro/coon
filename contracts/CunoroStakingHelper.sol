// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import './interfaces/IERC20.sol';
import './interfaces/ICunoroStaking.sol';

contract CunoroStakingHelper {
    address public immutable staking;
    address public immutable COON;

    constructor(address _staking, address _COON) {
        require(_staking != address(0));
        staking = _staking;
        require(_COON != address(0));
        COON = _COON;
    }

    function stake(uint256 _amount, address _recipient) external {
        IERC20(COON).transferFrom(msg.sender, address(this), _amount);
        IERC20(COON).approve(staking, _amount);
        ICunoroStaking(staking).stake(_amount, _recipient);
        ICunoroStaking(staking).claim(_recipient);
    }
}
