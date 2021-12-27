// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.7.5;

import "../interfaces/IERC20.sol";
import "../interfaces/IsNORO.sol";
import "../interfaces/IwsNORO.sol";
import "../interfaces/IgNORO.sol";
import "../interfaces/ITreasury.sol";
import "../interfaces/IStaking.sol";
import "../interfaces/IOwnable.sol";
import "../interfaces/IUniswapV2Router.sol";
import "../interfaces/IStakingV1.sol";
import "../interfaces/ITreasuryV1.sol";

import "../types/CunoroAccessControlled.sol";

import "../libraries/SafeMath.sol";
import "../libraries/SafeERC20.sol";


contract CunoroTokenMigrator is CunoroAccessControlled {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for IgNORO;
    using SafeERC20 for IsNORO;
    using SafeERC20 for IwsNORO;

    /* ========== MIGRATION ========== */

    event TimelockStarted(uint256 block, uint256 end);
    event Migrated(address staking, address treasury);
    event Funded(uint256 amount);
    event Defunded(uint256 amount);

    /* ========== STATE VARIABLES ========== */

    IERC20 public immutable oldNORO;
    IsNORO public immutable oldsNORO;
    IwsNORO public immutable oldwsNORO;
    ITreasuryV1 public immutable oldTreasury;
    IStakingV1 public immutable oldStaking;

    IUniswapV2Router public immutable sushiRouter;
    IUniswapV2Router public immutable uniRouter;

    IgNORO public gNORO;
    ITreasury public newTreasury;
    IStaking public newStaking;
    IERC20 public newNORO;

    bool public noroMigrated;
    bool public shutdown;

    uint256 public immutable timelockLength;
    uint256 public timelockEnd;

    uint256 public oldSupply;

    constructor(
        address _oldNORO,
        address _oldsNORO,
        address _oldTreasury,
        address _oldStaking,
        address _oldwsNORO,
        address _sushi,
        address _uni,
        uint256 _timelock,
        address _authority
    ) CunoroAccessControlled(ICunoroAuthority(_authority)) {
        require(_oldNORO != address(0), "Zero address: NORO");
        oldNORO = IERC20(_oldNORO);
        require(_oldsNORO != address(0), "Zero address: sNORO");
        oldsNORO = IsNORO(_oldsNORO);
        require(_oldTreasury != address(0), "Zero address: Treasury");
        oldTreasury = ITreasuryV1(_oldTreasury);
        require(_oldStaking != address(0), "Zero address: Staking");
        oldStaking = IStakingV1(_oldStaking);
        require(_oldwsNORO != address(0), "Zero address: wsNORO");
        oldwsNORO = IwsNORO(_oldwsNORO);
        require(_sushi != address(0), "Zero address: Sushi");
        sushiRouter = IUniswapV2Router(_sushi);
        require(_uni != address(0), "Zero address: Uni");
        uniRouter = IUniswapV2Router(_uni);
        timelockLength = _timelock;
    }

    /* ========== MIGRATION ========== */

    enum TYPE {
        UNSTAKED,
        STAKED,
        WRAPPED
    }

    // migrate NOROv1, sNOROv1, or wsNORO for NOROv2, sNOROv2, or gNORO
    function migrate(
        uint256 _amount,
        TYPE _from,
        TYPE _to
    ) external {
        require(!shutdown, "Shut down");

        uint256 wAmount = oldwsNORO.sNOROTowNORO(_amount);

        if (_from == TYPE.UNSTAKED) {
            require(noroMigrated, "Only staked until migration");
            oldNORO.safeTransferFrom(msg.sender, address(this), _amount);
        } else if (_from == TYPE.STAKED) {
            oldsNORO.safeTransferFrom(msg.sender, address(this), _amount);
        } else {
            oldwsNORO.safeTransferFrom(msg.sender, address(this), _amount);
            wAmount = _amount;
        }

        if (noroMigrated) {
            require(oldSupply >= oldNORO.totalSupply(), "NOROv1 minted");
            _send(wAmount, _to);
        } else {
            gNORO.mint(msg.sender, wAmount);
        }
    }

    // migrate all cunoro tokens held
    function migrateAll(TYPE _to) external {
        require(!shutdown, "Shut down");

        uint256 noroBal = 0;
        uint256 sNOROBal = oldsNORO.balanceOf(msg.sender);
        uint256 wsNOROBal = oldwsNORO.balanceOf(msg.sender);

        if (oldNORO.balanceOf(msg.sender) > 0 && noroMigrated) {
            noroBal = oldNORO.balanceOf(msg.sender);
            oldNORO.safeTransferFrom(msg.sender, address(this), noroBal);
        }
        if (sNOROBal > 0) {
            oldsNORO.safeTransferFrom(msg.sender, address(this), sNOROBal);
        }
        if (wsNOROBal > 0) {
            oldwsNORO.safeTransferFrom(msg.sender, address(this), wsNOROBal);
        }

        uint256 wAmount = wsNOROBal.add(oldwsNORO.sNOROTowNORO(noroBal.add(sNOROBal)));
        if (noroMigrated) {
            require(oldSupply >= oldNORO.totalSupply(), "NOROv1 minted");
            _send(wAmount, _to);
        } else {
            gNORO.mint(msg.sender, wAmount);
        }
    }

    // send preferred token
    function _send(uint256 wAmount, TYPE _to) internal {
        if (_to == TYPE.WRAPPED) {
            gNORO.safeTransfer(msg.sender, wAmount);
        } else if (_to == TYPE.STAKED) {
            newStaking.unwrap(msg.sender, wAmount);
        } else if (_to == TYPE.UNSTAKED) {
            newStaking.unstake(msg.sender, wAmount, false, false);
        }
    }

    // bridge back to NORO, sNORO, or wsNORO
    function bridgeBack(uint256 _amount, TYPE _to) external {
        if (!noroMigrated) {
            gNORO.burn(msg.sender, _amount);
        } else {
            gNORO.safeTransferFrom(msg.sender, address(this), _amount);
        }

        uint256 amount = oldwsNORO.wNOROTosNORO(_amount);
        // error throws if contract does not have enough of type to send
        if (_to == TYPE.UNSTAKED) {
            oldNORO.safeTransfer(msg.sender, amount);
        } else if (_to == TYPE.STAKED) {
            oldsNORO.safeTransfer(msg.sender, amount);
        } else if (_to == TYPE.WRAPPED) {
            oldwsNORO.safeTransfer(msg.sender, _amount);
        }
    }

    /* ========== OWNABLE ========== */

    // halt migrations (but not bridging back)
    function halt() external onlyPolicy {
        require(!noroMigrated, "Migration has occurred");
        shutdown = !shutdown;
    }

    // withdraw backing of migrated NORO
    function defund(address reserve) external onlyGovernor {
        require(noroMigrated, "Migration has not begun");
        require(timelockEnd < block.number && timelockEnd != 0, "Timelock not complete");

        oldwsNORO.unwrap(oldwsNORO.balanceOf(address(this)));

        uint256 amountToUnstake = oldsNORO.balanceOf(address(this));
        oldsNORO.approve(address(oldStaking), amountToUnstake);
        oldStaking.unstake(amountToUnstake, false);

        uint256 balance = oldNORO.balanceOf(address(this));

        if(balance > oldSupply) {
            oldSupply = 0;
        } else {
            oldSupply -= balance;
        }

        uint256 amountToWithdraw = balance.mul(1e9);
        oldNORO.approve(address(oldTreasury), amountToWithdraw);
        oldTreasury.withdraw(amountToWithdraw, reserve);
        IERC20(reserve).safeTransfer(address(newTreasury), IERC20(reserve).balanceOf(address(this)));

        emit Defunded(balance);
    }

    // start timelock to send backing to new treasury
    function startTimelock() external onlyGovernor {
        require(timelockEnd == 0, "Timelock set");
        timelockEnd = block.number.add(timelockLength);

        emit TimelockStarted(block.number, timelockEnd);
    }

    // set gNORO address
    function setgNORO(address _gNORO) external onlyGovernor {
        require(address(gNORO) == address(0), "Already set");
        require(_gNORO != address(0), "Zero address: gNORO");

        gNORO = IgNORO(_gNORO);
    }

    // call internal migrate token function
    function migrateToken(address token) external onlyGovernor {
        _migrateToken(token, false);
    }

    /**
     *   @notice Migrate LP and pair with new NORO
     */
    function migrateLP(
        address pair,
        bool sushi,
        address token,
        uint256 _minA,
        uint256 _minB
    ) external onlyGovernor {
        uint256 oldLPAmount = IERC20(pair).balanceOf(address(oldTreasury));
        oldTreasury.manage(pair, oldLPAmount);

        IUniswapV2Router router = sushiRouter;
        if (!sushi) {
            router = uniRouter;
        }

        IERC20(pair).approve(address(router), oldLPAmount);
        (uint256 amountA, uint256 amountB) = router.removeLiquidity(
            token, 
            address(oldNORO), 
            oldLPAmount,
            _minA, 
            _minB, 
            address(this), 
            block.timestamp
        );

        newTreasury.mint(address(this), amountB);

        IERC20(token).approve(address(router), amountA);
        newNORO.approve(address(router), amountB);

        router.addLiquidity(
            token, 
            address(newNORO), 
            amountA, 
            amountB, 
            amountA, 
            amountB, 
            address(newTreasury), 
            block.timestamp
        );
    }

    // Failsafe function to allow owner to withdraw funds sent directly to contract in case someone sends non-noro tokens to the contract
    function withdrawToken(
        address tokenAddress,
        uint256 amount,
        address recipient
    ) external onlyGovernor {
        require(tokenAddress != address(0), "Token address cannot be 0x0");
        require(tokenAddress != address(gNORO), "Cannot withdraw: gNORO");
        require(tokenAddress != address(oldNORO), "Cannot withdraw: old-NORO");
        require(tokenAddress != address(oldsNORO), "Cannot withdraw: old-sNORO");
        require(tokenAddress != address(oldwsNORO), "Cannot withdraw: old-wsNORO");
        require(amount > 0, "Withdraw value must be greater than 0");
        if (recipient == address(0)) {
            recipient = msg.sender; // if no address is specified the value will will be withdrawn to Owner
        }

        IERC20 tokenContract = IERC20(tokenAddress);
        uint256 contractBalance = tokenContract.balanceOf(address(this));
        if (amount > contractBalance) {
            amount = contractBalance; // set the withdrawal amount equal to balance within the account.
        }
        // transfer the token from address of this contract
        tokenContract.safeTransfer(recipient, amount);
    }

    // migrate contracts
    function migrateContracts(
        address _newTreasury,
        address _newStaking,
        address _newNORO,
        address _newsNORO,
        address _reserve
    ) external onlyGovernor {
        require(!noroMigrated, "Already migrated");
        noroMigrated = true;
        shutdown = false;

        require(_newTreasury != address(0), "Zero address: Treasury");
        newTreasury = ITreasury(_newTreasury);
        require(_newStaking != address(0), "Zero address: Staking");
        newStaking = IStaking(_newStaking);
        require(_newNORO != address(0), "Zero address: NORO");
        newNORO = IERC20(_newNORO);

        oldSupply = oldNORO.totalSupply(); // log total supply at time of migration

        gNORO.migrate(_newStaking, _newsNORO); // change gNORO minter

        _migrateToken(_reserve, true); // will deposit tokens into new treasury so reserves can be accounted for

        _fund(oldsNORO.circulatingSupply()); // fund with current staked supply for token migration

        emit Migrated(_newStaking, _newTreasury);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    // fund contract with gNORO
    function _fund(uint256 _amount) internal {
        newTreasury.mint(address(this), _amount);
        newNORO.approve(address(newStaking), _amount);
        newStaking.stake(address(this), _amount, false, true); // stake and claim gNORO

        emit Funded(_amount);
    }

    /**
     *   @notice Migrate token from old treasury to new treasury
     */
    function _migrateToken(address token, bool deposit) internal {
        uint256 balance = IERC20(token).balanceOf(address(oldTreasury));

        uint256 excessReserves = oldTreasury.excessReserves();
        uint256 tokenValue = oldTreasury.valueOf(token, balance);

        if (tokenValue > excessReserves) {
            tokenValue = excessReserves;
            balance = excessReserves * 10**9;
        }

        oldTreasury.manage(token, balance);

        if (deposit) {
            IERC20(token).safeApprove(address(newTreasury), balance);
            newTreasury.deposit(balance, token, tokenValue);
        } else {
            IERC20(token).safeTransfer(address(newTreasury), balance);
        }
    }
}
