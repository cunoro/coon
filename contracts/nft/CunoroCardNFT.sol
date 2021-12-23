// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

contract CunoroCardNFT is ERC721, Ownable {
    string public cardURI;
    uint256 public tokenIdCount;

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public claimed;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory cardURI_
    ) ERC721(name_, symbol_) {
        cardURI = cardURI_;
    }

    function _burn(uint256 tokenId) internal override(ERC721) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function setWhitelist(address[] memory otters_) external onlyOwner {
        require(otters_.length != 0, 'at least 1 otter');
        for (uint256 i; i < otters_.length; i++) {
            whitelist[otters_[i]] = true;
        }
    }

    function unsetWhitelist(address[] memory otters_) external onlyOwner {
        require(otters_.length != 0, 'at least 1 otter');
        for (uint256 i; i < otters_.length; i++) {
            whitelist[otters_[i]] = false;
        }
    }

    function claim() external {
        require(msg.sender != address(0), 'zero address');
        require(whitelist[msg.sender], 'not in whitelist');
        require(claimed[msg.sender] == 0, 'already claimed');

        tokenIdCount += 1;
        claimed[msg.sender] = tokenIdCount;

        _mint(msg.sender, tokenIdCount);
        _setTokenURI(tokenIdCount, cardURI);
    }
}
