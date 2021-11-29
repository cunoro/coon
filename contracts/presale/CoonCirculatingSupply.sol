// SPDX-License-Identifier: AGPL-3.0-or-later\
pragma solidity 0.7.5;

import "../interfaces/IERC20.sol";

import "../libraries/SafeMath.sol";

contract CoonCirculatingSupply {
    using SafeMath for uint;

    bool public isInitialized;

    address public COON;
    address public owner;
    address[] public nonCirculatingCOONAddresses;

    constructor( address _owner ) {
        owner = _owner;
    }

    function initialize( address _clam ) external returns ( bool ) {
        require( msg.sender == owner, "caller is not owner" );
        require( isInitialized == false );

        COON = _clam;

        isInitialized = true;

        return true;
    }

    function COONCirculatingSupply() external view returns ( uint ) {
        uint _totalSupply = IERC20( COON ).totalSupply();

        uint _circulatingSupply = _totalSupply.sub( getNonCirculatingCOON() );

        return _circulatingSupply;
    }

    function getNonCirculatingCOON() public view returns ( uint ) {
        uint _nonCirculatingCOON;

        for( uint i=0; i < nonCirculatingCOONAddresses.length; i = i.add( 1 ) ) {
            _nonCirculatingCOON = _nonCirculatingCOON.add( IERC20( COON ).balanceOf( nonCirculatingCOONAddresses[i] ) );
        }

        return _nonCirculatingCOON;
    }

    function setNonCirculatingCOONAddresses( address[] calldata _nonCirculatingAddresses ) external returns ( bool ) {
        require( msg.sender == owner, "Sender is not owner" );
        nonCirculatingCOONAddresses = _nonCirculatingAddresses;

        return true;
    }

    function transferOwnership( address _owner ) external returns ( bool ) {
        require( msg.sender == owner, "Sender is not owner" );

        owner = _owner;

        return true;
    }
}
