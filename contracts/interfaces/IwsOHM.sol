// SPDX-License-Identifier: AGPL-3.0
pragma solidity >=0.7.5;

import "./IERC20.sol";

// Old wsNORO interface
interface IwsNORO is IERC20 {
    function wrap(uint256 _amount) external returns (uint256);

    function unwrap(uint256 _amount) external returns (uint256);

    function wNOROTosNORO(uint256 _amount) external view returns (uint256);

    function sNOROTowNORO(uint256 _amount) external view returns (uint256);
}
