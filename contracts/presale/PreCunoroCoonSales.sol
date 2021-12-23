// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import '../types/Ownable.sol';
import '../types/ERC20.sol';

import '../libraries/SafeMath.sol';
import '../libraries/SafeERC20.sol';

contract PreCunorodCoonSales is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event SaleStarted(address indexed activator, uint256 timestamp);
    event SaleEnded(address indexed activator, uint256 timestamp);
    event SellerApproval(
        address indexed approver,
        address indexed seller,
        string indexed message
    );

    IERC20 public dai;

    IERC20 public pdCoon;

    address private _saleProceedsAddress;

    uint256 public pdCoonPrice;

    bool public initialized;

    mapping(address => bool) public approvedBuyers;

    constructor() {}

    function initialize(
        address pdCoon_,
        address dai_,
        uint256 pdCoonPrice_,
        address saleProceedsAddress_
    ) external onlyOwner {
        require(!initialized);
        pdCoon = IERC20(pdCoon_);
        dai = IERC20(dai_);
        pdCoonPrice = pdCoonPrice_;
        _saleProceedsAddress = saleProceedsAddress_;
        initialized = true;
    }

    function setPredCoonPrice(uint256 newPredCoonPrice_)
        external
        onlyOwner
        returns (uint256)
    {
        pdCoonPrice = newPredCoonPrice_;
        return pdCoonPrice;
    }

    function _approveBuyer(address newBuyer_)
        internal
        onlyOwner
        returns (bool)
    {
        approvedBuyers[newBuyer_] = true;
        return approvedBuyers[newBuyer_];
    }

    function approveBuyer(address newBuyer_) external onlyOwner returns (bool) {
        return _approveBuyer(newBuyer_);
    }

    function approveBuyers(address[] calldata newBuyers_)
        external
        onlyOwner
        returns (uint256)
    {
        for (
            uint256 iteration_ = 0;
            newBuyers_.length > iteration_;
            iteration_++
        ) {
            _approveBuyer(newBuyers_[iteration_]);
        }
        return newBuyers_.length;
    }

    function _calculateAmountPurchased(uint256 amountPaid_)
        internal
        returns (uint256)
    {
        return amountPaid_.mul(pdCoonPrice);
    }

    function buyPredCoon(uint256 amountPaid_) external returns (bool) {
        require(approvedBuyers[msg.sender], 'Buyer not approved.');
        uint256 pdCoonAmountPurchased_ = _calculateAmountPurchased(amountPaid_);
        dai.safeTransferFrom(msg.sender, _saleProceedsAddress, amountPaid_);
        pdCoon.safeTransfer(msg.sender, pdCoonAmountPurchased_);
        return true;
    }

    function withdrawTokens(address tokenToWithdraw_)
        external
        onlyOwner
        returns (bool)
    {
        IERC20(tokenToWithdraw_).safeTransfer(
            msg.sender,
            IERC20(tokenToWithdraw_).balanceOf(address(this))
        );
        return true;
    }
}
