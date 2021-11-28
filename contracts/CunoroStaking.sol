// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import "./interfaces/ICunoroStaking.sol";
import "./interfaces/IsCOON.sol";

import "./types/ERC20.sol";
import "./types/Ownable.sol";

import "./libraries/SafeMath.sol";
import "./libraries/SafeERC20.sol";

interface IWarmup {
    function retrieve( address staker_, uint amount_ ) external;
}

interface IDistributor {
    function distribute() external returns ( bool );
}

contract CunoroStaking is Ownable, ICunoroStaking {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public immutable COON;
    address public immutable sCOON;

    struct Epoch {
        uint length; // in seconds
        uint number;
        uint endTime; // unix epoch time in seconds
        uint distribute;
    }
    Epoch public epoch;

    address public distributor;

    address public locker;
    uint public totalBonus;

    address public warmupContract;
    uint public warmupPeriod;

    constructor (
        address _COON,
        address _sCOON,
        uint _epochLength,
        uint _firstEpochNumber,
        uint _firstEpochTime
    ) {
        require( _COON != address(0) );
        COON = _COON;
        require( _sCOON != address(0) );
        sCOON = _sCOON;

        epoch = Epoch({
            length: _epochLength,
            number: _firstEpochNumber,
            endTime: _firstEpochTime,
            distribute: 0
        });
    }

    struct Claim {
        uint deposit;
        uint gons;
        uint expiry;
        bool lock; // prevents malicious delays
    }
    mapping( address => Claim ) public warmupInfo;

    /**
        @notice stake COON to enter warmup
        @param _amount uint
        @return bool
     */
    function stake( uint _amount, address _recipient ) external override returns ( bool ) {
        rebase();

        IERC20( COON ).safeTransferFrom( msg.sender, address(this), _amount );

        Claim memory info = warmupInfo[ _recipient ];
        require( !info.lock, "Deposits for account are locked" );

        warmupInfo[ _recipient ] = Claim ({
            deposit: info.deposit.add( _amount ),
            gons: info.gons.add( IsCOON( sCOON ).gonsForBalance( _amount ) ),
            expiry: epoch.number.add( warmupPeriod ),
            lock: false
        });

        IERC20( sCOON ).safeTransfer( warmupContract, _amount );
        return true;
    }

    /**
        @notice retrieve sCOON from warmup
        @param _recipient address
     */
    function claim ( address _recipient ) external override {
        Claim memory info = warmupInfo[ _recipient ];
        if ( epoch.number >= info.expiry && info.expiry != 0 ) {
            delete warmupInfo[ _recipient ];
            IWarmup( warmupContract ).retrieve( _recipient, IsCOON( sCOON ).balanceForGons( info.gons ) );
        }
    }

    /**
        @notice forfeit sCOON in warmup and retrieve COON
     */
    function forfeit() external {
        Claim memory info = warmupInfo[ msg.sender ];
        delete warmupInfo[ msg.sender ];

        IWarmup( warmupContract ).retrieve( address(this), IsCOON( sCOON ).balanceForGons( info.gons ) );
        IERC20( COON ).safeTransfer( msg.sender, info.deposit );
    }

    /**
        @notice prevent new deposits to address (protection from malicious activity)
     */
    function toggleDepositLock() external {
        warmupInfo[ msg.sender ].lock = !warmupInfo[ msg.sender ].lock;
    }

    /**
        @notice redeem sCOON for COON
        @param _amount uint
        @param _trigger bool
     */
    function unstake( uint _amount, bool _trigger ) external {
        if ( _trigger ) {
            rebase();
        }
        IERC20( sCOON ).safeTransferFrom( msg.sender, address(this), _amount );
        IERC20( COON ).safeTransfer( msg.sender, _amount );
    }

    /**
        @notice returns the sCOON index, which tracks rebase growth
        @return uint
     */
    function index() public view returns ( uint ) {
        return IsCOON( sCOON ).index();
    }

    /**
        @notice trigger rebase if epoch over
     */
    function rebase() public {
        if( epoch.endTime <= block.timestamp ) {
            IsCOON( sCOON ).rebase( epoch.distribute, epoch.number );

            epoch.endTime = epoch.endTime.add( epoch.length );
            epoch.number++;

            if ( distributor != address(0) ) {
                IDistributor( distributor ).distribute();
            }

            uint balance = contractBalance();
            uint staked = IsCOON( sCOON ).circulatingSupply();

            if( balance <= staked ) {
                epoch.distribute = 0;
            } else {
                epoch.distribute = balance.sub( staked );
            }
        }
    }

    /**
        @notice returns contract COON holdings, including bonuses provided
        @return uint
     */
    function contractBalance() public view returns ( uint ) {
        return IERC20( COON ).balanceOf( address(this) ).add( totalBonus );
    }

    /**
        @notice provide bonus to locked staking contract
        @param _amount uint
     */
    function giveLockBonus( uint _amount ) external {
        require( msg.sender == locker );
        totalBonus = totalBonus.add( _amount );
        IERC20( sCOON ).safeTransfer( locker, _amount );
    }

    /**
        @notice reclaim bonus from locked staking contract
        @param _amount uint
     */
    function returnLockBonus( uint _amount ) external {
        require( msg.sender == locker );
        totalBonus = totalBonus.sub( _amount );
        IERC20( sCOON ).safeTransferFrom( locker, address(this), _amount );
    }

    enum CONTRACTS { DISTRIBUTOR, WARMUP, LOCKER }

    /**
        @notice sets the contract address for LP staking
        @param _contract address
     */
    function setContract( CONTRACTS _contract, address _address ) external onlyOwner() {
        if( _contract == CONTRACTS.DISTRIBUTOR ) { // 0
            distributor = _address;
        } else if ( _contract == CONTRACTS.WARMUP ) { // 1
            require( warmupContract == address( 0 ), "Warmup cannot be set more than once" );
            warmupContract = _address;
        } else if ( _contract == CONTRACTS.LOCKER ) { // 2
            require( locker == address(0), "Locker cannot be set more than once" );
            locker = _address;
        }
    }

    /**
     * @notice set warmup period for new stakers
     * @param _warmupPeriod uint
     */
    function setWarmup( uint _warmupPeriod ) external onlyOwner() {
        warmupPeriod = _warmupPeriod;
    }
}
