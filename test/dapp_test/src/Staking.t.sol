// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.7.5;
pragma abicoder v2;

import "ds-test/test.sol"; // ds-test

import "../../../contracts/libraries/SafeMath.sol";
import "../../../contracts/libraries/FixedPoint.sol";
import "../../../contracts/libraries/FullMath.sol";
import "../../../contracts/Staking.sol";
import "../../../contracts/CunoroERC20.sol";
import "../../../contracts/sCunoroERC20.sol";
import "../../../contracts/governance/gNORO.sol";
import "../../../contracts/Treasury.sol";
import "../../../contracts/StakingDistributor.sol";
import "../../../contracts/CunoroAuthority.sol";

import "./util/Hevm.sol";
import "./util/MockContract.sol";

contract StakingTest is DSTest {
    using FixedPoint for *;
    using SafeMath for uint256;
    using SafeMath for uint112;

    CunoroStaking internal staking;
    CunoroTreasury internal treasury;
    CunoroAuthority internal authority;
    Distributor internal distributor;

    CunoroERC20Token internal noro;
    sCunoro internal snoro;
    gNORO internal gnoro;

    MockContract internal mockToken;

    /// @dev Hevm setup
    Hevm internal constant hevm = Hevm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);
    uint256 internal constant AMOUNT = 1000;
    uint256 internal constant EPOCH_LENGTH = 8; // In Seconds
    uint256 internal constant START_TIME = 0; // Starting at this epoch
    uint256 internal constant NEXT_REBASE_TIME = 1; // Next epoch is here
    uint256 internal constant BOUNTY = 42;

    function setUp() public {
        // Start at timestamp
        hevm.warp(START_TIME);

        // Setup mockToken to deposit into treasury (for excess reserves)
        mockToken = new MockContract();
        mockToken.givenMethodReturn(abi.encodeWithSelector(ERC20.name.selector), abi.encode("mock DAO"));
        mockToken.givenMethodReturn(abi.encodeWithSelector(ERC20.symbol.selector), abi.encode("MOCK"));
        mockToken.givenMethodReturnUint(abi.encodeWithSelector(ERC20.decimals.selector), 18);
        mockToken.givenMethodReturnBool(abi.encodeWithSelector(IERC20.transferFrom.selector), true);

        authority = new CunoroAuthority(address(this), address(this), address(this), address(this));

        noro = new CunoroERC20Token(address(authority));
        gnoro = new gNORO(address(this), address(this));
        snoro = new sCunoro();
        snoro.setIndex(10);
        snoro.setgNORO(address(gnoro));

        treasury = new CunoroTreasury(address(noro), 1, address(authority));

        staking = new CunoroStaking(
            address(noro),
            address(snoro),
            address(gnoro),
            EPOCH_LENGTH,
            START_TIME,
            NEXT_REBASE_TIME,
            address(authority)
        );

        distributor = new Distributor(address(treasury), address(noro), address(staking), address(authority));
        distributor.setBounty(BOUNTY);
        staking.setDistributor(address(distributor));
        treasury.enable(CunoroTreasury.STATUS.REWARDMANAGER, address(distributor), address(0)); // Allows distributor to mint noro.
        treasury.enable(CunoroTreasury.STATUS.RESERVETOKEN, address(mockToken), address(0)); // Allow mock token to be deposited into treasury
        treasury.enable(CunoroTreasury.STATUS.RESERVEDEPOSITOR, address(this), address(0)); // Allow this contract to deposit token into treeasury

        snoro.initialize(address(staking), address(treasury));
        gnoro.migrate(address(staking), address(snoro));

        // Give the treasury permissions to mint
        authority.pushVault(address(treasury), true);

        // Deposit a token who's profit (3rd param) determines how much noro the treasury can mint
        uint256 depositAmount = 20e18;
        treasury.deposit(depositAmount, address(mockToken), BOUNTY.mul(2)); // Mints (depositAmount- 2xBounty) for this contract
    }

    function testStakeNoBalance() public {
        uint256 newAmount = AMOUNT.mul(2);
        try staking.stake(address(this), newAmount, true, true) {
            fail();
        } catch Error(string memory error) {
            assertEq(error, "TRANSFER_FROM_FAILED"); // Should be 'Transfer exceeds balance'
        }
    }

    function testStakeWithoutAllowance() public {
        try staking.stake(address(this), AMOUNT, true, true) {
            fail();
        } catch Error(string memory error) {
            assertEq(error, "TRANSFER_FROM_FAILED"); // Should be 'Transfer exceeds allowance'
        }
    }

    function testStake() public {
        noro.approve(address(staking), AMOUNT);
        uint256 amountStaked = staking.stake(address(this), AMOUNT, true, true);
        assertEq(amountStaked, AMOUNT);
    }

    function testStakeAtRebaseToGnoro() public {
        // Move into next rebase window
        hevm.warp(EPOCH_LENGTH);

        noro.approve(address(staking), AMOUNT);
        bool isSnoro = false;
        bool claim = true;
        uint256 gNORORecieved = staking.stake(address(this), AMOUNT, isSnoro, claim);

        uint256 expectedAmount = gnoro.balanceTo(AMOUNT.add(BOUNTY));
        assertEq(gNORORecieved, expectedAmount);
    }

    function testStakeAtRebase() public {
        // Move into next rebase window
        hevm.warp(EPOCH_LENGTH);

        noro.approve(address(staking), AMOUNT);
        bool isSnoro = true;
        bool claim = true;
        uint256 amountStaked = staking.stake(address(this), AMOUNT, isSnoro, claim);

        uint256 expectedAmount = AMOUNT.add(BOUNTY);
        assertEq(amountStaked, expectedAmount);
    }

    function testUnstake() public {
        bool triggerRebase = true;
        bool isSnoro = true;
        bool claim = true;

        // Stake the noro
        uint256 initialNoroBalance = noro.balanceOf(address(this));
        noro.approve(address(staking), initialNoroBalance);
        uint256 amountStaked = staking.stake(address(this), initialNoroBalance, isSnoro, claim);
        assertEq(amountStaked, initialNoroBalance);

        // Validate balances post stake
        uint256 noroBalance = noro.balanceOf(address(this));
        uint256 sNoroBalance = snoro.balanceOf(address(this));
        assertEq(noroBalance, 0);
        assertEq(sNoroBalance, initialNoroBalance);

        // Unstake sNORO
        snoro.approve(address(staking), sNoroBalance);
        staking.unstake(address(this), sNoroBalance, triggerRebase, isSnoro);

        // Validate Balances post unstake
        noroBalance = noro.balanceOf(address(this));
        sNoroBalance = snoro.balanceOf(address(this));
        assertEq(noroBalance, initialNoroBalance);
        assertEq(sNoroBalance, 0);
    }

    function testUnstakeAtRebase() public {
        bool triggerRebase = true;
        bool isSnoro = true;
        bool claim = true;

        // Stake the noro
        uint256 initialNoroBalance = noro.balanceOf(address(this));
        noro.approve(address(staking), initialNoroBalance);
        uint256 amountStaked = staking.stake(address(this), initialNoroBalance, isSnoro, claim);
        assertEq(amountStaked, initialNoroBalance);

        // Move into next rebase window
        hevm.warp(EPOCH_LENGTH);

        // Validate balances post stake
        // Post initial rebase, distribution amount is 0, so sNORO balance doens't change.
        uint256 noroBalance = noro.balanceOf(address(this));
        uint256 sNoroBalance = snoro.balanceOf(address(this));
        assertEq(noroBalance, 0);
        assertEq(sNoroBalance, initialNoroBalance);

        // Unstake sNORO
        snoro.approve(address(staking), sNoroBalance);
        staking.unstake(address(this), sNoroBalance, triggerRebase, isSnoro);

        // Validate balances post unstake
        noroBalance = noro.balanceOf(address(this));
        sNoroBalance = snoro.balanceOf(address(this));
        uint256 expectedAmount = initialNoroBalance.add(BOUNTY); // Rebase earns a bounty
        assertEq(noroBalance, expectedAmount);
        assertEq(sNoroBalance, 0);
    }

    function testUnstakeAtRebaseFromGnoro() public {
        bool triggerRebase = true;
        bool isSnoro = false;
        bool claim = true;

        // Stake the noro
        uint256 initialNoroBalance = noro.balanceOf(address(this));
        noro.approve(address(staking), initialNoroBalance);
        uint256 amountStaked = staking.stake(address(this), initialNoroBalance, isSnoro, claim);
        uint256 gnoroAmount = gnoro.balanceTo(initialNoroBalance);
        assertEq(amountStaked, gnoroAmount);

        // test the unstake
        // Move into next rebase window
        hevm.warp(EPOCH_LENGTH);

        // Validate balances post-stake
        uint256 noroBalance = noro.balanceOf(address(this));
        uint256 gnoroBalance = gnoro.balanceOf(address(this));
        assertEq(noroBalance, 0);
        assertEq(gnoroBalance, gnoroAmount);

        // Unstake gNORO
        gnoro.approve(address(staking), gnoroBalance);
        staking.unstake(address(this), gnoroBalance, triggerRebase, isSnoro);

        // Validate balances post unstake
        noroBalance = noro.balanceOf(address(this));
        gnoroBalance = gnoro.balanceOf(address(this));
        uint256 expectedNoro = initialNoroBalance.add(BOUNTY); // Rebase earns a bounty
        assertEq(noroBalance, expectedNoro);
        assertEq(gnoroBalance, 0);
    }
}
