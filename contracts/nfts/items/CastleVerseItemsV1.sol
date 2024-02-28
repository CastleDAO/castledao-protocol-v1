pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "../../ManagerModifierUpgradeable.sol";
import "./interfaces/INFTMetadata.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";


contract CastleVerseItems is ERC1155Upgradeable, ManagerModifierUpgradeable {
    INFTMetadata private _metadataContract;
    IERC20Upgradeable public magicToken;
    IERC20Upgradeable public rubyToken;
    mapping(uint256 => bytes) public itemCustomizationData;


    // Holds the list of paused items
    mapping(uint256 => bool) public pausedItems;

    function initialize(
        address manager,
        address metadataContractAddress
    ) public initializer  {
        ERC1155Upgradeable.__ERC1155_init("");
        initializeManagerModifier(manager);
        _metadataContract = INFTMetadata(metadataContractAddress);
    }

    function setMetadataContract(address newMetadataContractAddress) external onlyManager {
        _metadataContract = INFTMetadata(newMetadataContractAddress);
    }

    function managerMint(address account, uint256 id, uint256 amount, bytes memory data) public onlyMinter {
        // Reject if item is paused
        require(!pausedItems[id], "Item is paused");
        _mint(account, id, amount, data);

    }

    function managerMintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyMinter {
        // Reject if item is paused
        for (uint256 i = 0; i < ids.length; i++) {
            require(!pausedItems[ids[i]], "Item is paused");
        }
        _mintBatch(to, ids, amounts, data);
        
    }

    function uri(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return _metadataContract.erc1155TokenUri(tokenId);
    }

    // Pause and unpause items
    function pauseItem(uint256 id) external onlyManager {
        pausedItems[id] = true;
    }

    function unpauseItem(uint256 id) external onlyManager {
        pausedItems[id] = false;
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


    function burn(address account, uint256 id, uint256 amount) public {
        require(msg.sender == account || isApprovedForAll(account, msg.sender), "ERC1155: caller is not owner nor approved");
        _burn(account, id, amount);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) public {
        require(msg.sender == account || isApprovedForAll(account, msg.sender), "ERC1155: caller is not owner nor approved");
        _burnBatch(account, ids, amounts);
    }
}