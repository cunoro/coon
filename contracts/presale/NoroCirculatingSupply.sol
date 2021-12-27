// SPDX-License-Identifier: AGPL-3.0-or-later\
pragma solidity 0.7.5;

import '../interfaces/IERC20.sol';

import '../libraries/SafeMath.sol';

contract NoroCirculatingSupply {
    using SafeMath for uint256;

    bool public isInitialized;

    address public NORO;
    address public owner;
    address[] public nonCirculatingNOROAddresses;

    constructor(address _owner) {
        owner = _owner;
    }

    function initialize(address _noro) external returns (bool) {
        require(msg.sender == owner, 'caller is not owner');
        require(isInitialized == false);

        NORO = _noro;

        isInitialized = true;

        return true;
    }

    function NOROCirculatingSupply() external view returns (uint256) {
        uint256 _totalSupply = IERC20(NORO).totalSupply();

        uint256 _circulatingSupply = _totalSupply.sub(getNonCirculatingNORO());

        return _circulatingSupply;
    }

    function getNonCirculatingNORO() public view returns (uint256) {
        uint256 _nonCirculatingNORO;

        for (
            uint256 i = 0;
            i < nonCirculatingNOROAddresses.length;
            i = i.add(1)
        ) {
            _nonCirculatingNORO = _nonCirculatingNORO.add(
                IERC20(NORO).balanceOf(nonCirculatingNOROAddresses[i])
            );
        }

        return _nonCirculatingNORO;
    }

    function setNonCirculatingNOROAddresses(
        address[] calldata _nonCirculatingAddresses
    ) external returns (bool) {
        require(msg.sender == owner, 'Sender is not owner');
        nonCirculatingNOROAddresses = _nonCirculatingAddresses;

        return true;
    }

    function transferOwnership(address _owner) external returns (bool) {
        require(msg.sender == owner, 'Sender is not owner');

        owner = _owner;

        return true;
    }
}
