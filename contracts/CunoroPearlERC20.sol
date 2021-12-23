// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import './interfaces/IsCoon.sol';
import './libraries/SafeMath.sol';
import './libraries/SafeERC20.sol';
import './libraries/Address.sol';
import './types/ERC20.sol';

contract CunoroPearlERC20 is ERC20 {
    using SafeERC20 for ERC20;
    using Address for address;
    using SafeMath for uint256;

    address public immutable sCOON;

    constructor(address _sCOON) ERC20('Wrapped sCOON', 'PEARL', 18) {
        require(_sCOON != address(0));
        sCOON = _sCOON;
    }

    /**
        @notice wrap sCOON
        @param _amount uint
        @return uint
     */
    function wrap(uint256 _amount) external returns (uint256) {
        IERC20(sCOON).transferFrom(msg.sender, address(this), _amount);

        uint256 value = sCOONTowsCOON(_amount);
        _mint(msg.sender, value);
        return value;
    }

    /**
        @notice unwrap sCOON
        @param _amount uint
        @return uint
     */
    function unwrap(uint256 _amount) external returns (uint256) {
        _burn(msg.sender, _amount);

        uint256 value = pearlTosCOON(_amount);
        IERC20(sCOON).transfer(msg.sender, value);
        return value;
    }

    /**
        @notice converts wsCOON amount to sCOON
        @param _amount uint
        @return uint
     */
    function pearlTosCOON(uint256 _amount) public view returns (uint256) {
        return _amount.mul(IsCoon(sCOON).index()).div(10**decimals());
    }

    /**
        @notice converts sCOON amount to wsCOON
        @param _amount uint
        @return uint
     */
    function sCOONTowsCOON(uint256 _amount) public view returns (uint256) {
        return _amount.mul(10**decimals()).div(IsCoon(sCOON).index());
    }
}
