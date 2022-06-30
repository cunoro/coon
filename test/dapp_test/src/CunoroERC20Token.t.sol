// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.7.5;

import "ds-test/test.sol"; // ds-test
import "../../../contracts/CunoroERC20.sol";

import "../../../contracts/CunoroAuthority.sol";

contract OlymppusERC20TokenTest is DSTest {
    CunoroERC20Token internal noroContract;

    ICunoroAuthority internal authority;

    address internal UNAUTHORIZED_USER = address(0x1);

    function test_erc20() public {
        authority = new CunoroAuthority(address(this), address(this), address(this), address(this));
        noroContract = new CunoroERC20Token(address(authority));
        assertEq("Cunoro", noroContract.name());
        assertEq("NORO", noroContract.symbol());
        assertEq(9, int256(noroContract.decimals()));
    }

    function testCannot_mint() public {
        authority = new CunoroAuthority(address(this), address(this), address(this), UNAUTHORIZED_USER);
        noroContract = new CunoroERC20Token(address(authority));
        // try/catch block pattern copied from https://github.com/Anish-Agnihotri/MultiRaffle/blob/master/src/test/utils/DSTestExtended.sol
        try noroContract.mint(address(this), 100) {
            fail();
        } catch Error(string memory error) {
            // Assert revert error matches expected message
            assertEq("UNAUTHORIZED", error);
        }
    }

    // Tester will pass it's own parameters, see https://fv.ethereum.org/2020/12/11/symbolic-execution-with-ds-test/
    function test_mint(uint256 amount) public {
        authority = new CunoroAuthority(address(this), address(this), address(this), address(this));
        noroContract = new CunoroERC20Token(address(authority));
        uint256 supplyBefore = noroContract.totalSupply();
        // TODO look into https://dapphub.chat/channel/dev?msg=HWrPJqxp8BHMiKTbo
        // noroContract.setVault(address(this)); //TODO WTF msg.sender doesn't propigate from .dapprc $DAPP_TEST_CALLER config via mint() call, must use this value
        noroContract.mint(address(this), amount);
        assertEq(supplyBefore + amount, noroContract.totalSupply());
    }

    // Tester will pass it's own parameters, see https://fv.ethereum.org/2020/12/11/symbolic-execution-with-ds-test/
    function test_burn(uint256 mintAmount, uint256 burnAmount) public {
        authority = new CunoroAuthority(address(this), address(this), address(this), address(this));
        noroContract = new CunoroERC20Token(address(authority));
        uint256 supplyBefore = noroContract.totalSupply();
        // noroContract.setVault(address(this));  //TODO WTF msg.sender doesn't propigate from .dapprc $DAPP_TEST_CALLER config via mint() call, must use this value
        noroContract.mint(address(this), mintAmount);
        if (burnAmount <= mintAmount) {
            noroContract.burn(burnAmount);
            assertEq(supplyBefore + mintAmount - burnAmount, noroContract.totalSupply());
        } else {
            try noroContract.burn(burnAmount) {
                fail();
            } catch Error(string memory error) {
                // Assert revert error matches expected message
                assertEq("ERC20: burn amount exceeds balance", error);
            }
        }
    }
}
