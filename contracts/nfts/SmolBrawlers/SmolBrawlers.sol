pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../../ManagerModifierUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
// Inventory will be a ERC-6551 token account that can hold various nfts
import "./interfaces/IInventory.sol";
import "./interfaces/IERC721Metadata.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";


contract SmolBrawlers is ERC721Upgradeable, ERC721EnumerableUpgradeable, ManagerModifierUpgradeable, ReentrancyGuardUpgradeable {
    using Counters for Counters.Counter;

    IERC721Metadata private _metadataContract;
    Counters.Counter private _tokenIdCounter;


    function initialize(
        string memory name,
        string memory symbol,
        address manager,
        address metadataContractAddress
    ) public initializer {
        ERC721Upgradeable.__ERC721_init(name, symbol);
        __ReentrancyGuard_init();
        initializeManagerModifier(manager);
        _metadataContract = IERC721Metadata(metadataContractAddress);
    }

    // Needed functions for ERC721Enumerable
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    } 

     function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId, amount);
    }

    // Function to access the counter (maybe does not need to be public)
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function setMetadataContract(address newMetadataContractAddress) external onlyManager {
        _metadataContract = IERC721Metadata(newMetadataContractAddress);
    }

    function managerMint(address account, uint256 amount) public onlyMinter {
        // Call N times the internal mint function

    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return _metadataContract.tokenURI(tokenId);
    }


    // Token withdrawal functions
    function withdrawTokens(
        address token,
        uint256 amount
    )
        external
        onlyManager
    {
        IERC20Upgradeable(token).transfer(msg.sender, amount);
    }

    function withdrawETH(uint256 amount) external onlyManager {
        payable(msg.sender).transfer(amount);
    }

    // To receive ether
    receive() external payable {}


    // function burn(address account, uint256 id, uint256 amount) public {
    //     require(msg.sender == account || isApprovedForAll(account, msg.sender), "ERC721: caller is not owner nor approved");
    //     _burn(account, id, amount);
    // }

}