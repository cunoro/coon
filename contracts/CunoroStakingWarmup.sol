// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;


import "./interfaces/IERC20.sol";


contract CunoroStakingWarmup {

    address public immutable staking;
    address public immutable sCOON;

    constructor ( address _staking, address _sCOON ) {
        require( _staking != address(0) );
        staking = _staking;
        require( _sCOON != address(0) );
        sCOON = _sCOON;
    }

    function retrieve( address _staker, uint _amount ) external {
        require( msg.sender == staking );
        IERC20( sCOON ).transfer( _staker, _amount );
    }
}
