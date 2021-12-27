// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import './interfaces/IsNoro.sol';
import './libraries/SafeMath.sol';
import './libraries/SafeERC20.sol';
import './libraries/Address.sol';
import './types/ERC20.sol';

contract CunoroPearlERC20 is ERC20 {
    using SafeERC20 for ERC20;
    using Address for address;
    using SafeMath for uint256;

    address public immutable sNORO;

    constructor(address _sNORO) ERC20('Wrapped sNORO', 'PEARL', 18) {
        require(_sNORO != address(0));
        sNORO = _sNORO;
    }

    /**
        @notice wrap sNORO
        @param _amount uint
        @return uint
     */
    function wrap(uint256 _amount) external returns (uint256) {
        IERC20(sNORO).transferFrom(msg.sender, address(this), _amount);

        uint256 value = sNOROTowsNORO(_amount);
        _mint(msg.sender, value);
        return value;
    }

    /**
        @notice unwrap sNORO
        @param _amount uint
        @return uint
     */
    function unwrap(uint256 _amount) external returns (uint256) {
        _burn(msg.sender, _amount);

        uint256 value = pearlTosNORO(_amount);
        IERC20(sNORO).transfer(msg.sender, value);
        return value;
    }

    /**
        @notice converts wsNORO amount to sNORO
        @param _amount uint
        @return uint
     */
    function pearlTosNORO(uint256 _amount) public view returns (uint256) {
        return _amount.mul(IsNoro(sNORO).index()).div(10**decimals());
    }

    /**
        @notice converts sNORO amount to wsNORO
        @param _amount uint
        @return uint
     */
    function sNOROTowsNORO(uint256 _amount) public view returns (uint256) {
        return _amount.mul(10**decimals()).div(IsNoro(sNORO).index());
    }
}
