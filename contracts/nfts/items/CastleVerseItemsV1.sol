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

    struct Item {
        uint256 priceRuby;
        uint256 priceMagic;
        bool isMagicAllowed; // true if MAGIC payment is allowed
        bool isFree;
        bool isRestricted; // True if only manager can mint
    }

    mapping(uint256 => Item) public items;

    function initialize(
        address manager,
        address metadataContractAddress,
        address magicTokenAddress,
        address rubyTokenAddress
    ) public initializer  {
        ERC1155Upgradeable.__ERC1155_init("");
        initializeManagerModifier(manager);
        _metadataContract = INFTMetadata(metadataContractAddress);
        magicToken = IERC20Upgradeable(magicTokenAddress);
        rubyToken = IERC20Upgradeable(rubyTokenAddress);
    }

    function setMetadataContract(address newMetadataContractAddress) external onlyManager {
        _metadataContract = INFTMetadata(newMetadataContractAddress);
    }

    function addItem(
        uint256 itemId,
        uint256 priceRuby,
        uint256 priceMagic,
        bool isMagicAllowed,
        bool isRestricted
    )
        external
        onlyManager
    {
        items[itemId] = Item(priceRuby, priceMagic, isMagicAllowed, (priceRuby == 0) && (priceMagic == 0), isRestricted);
    }

    function modifyItem(
        uint256 itemId,
        uint256 newPriceRuby,
        uint256 newPriceMagic,
        bool newIsMagicAllowed,
        bool newIsRestricted
    )
        external
        onlyManager
    {
        items[itemId].priceRuby = newPriceRuby;
        items[itemId].priceMagic = newPriceMagic;
        items[itemId].isMagicAllowed = newIsMagicAllowed;
        items[itemId].isFree = (newPriceRuby == 0) && (newPriceMagic == 0);
        items[itemId].isRestricted = newIsRestricted;
    }

    function mintItem(uint256 itemId, uint256 amount,  bytes memory data) external {
        require(!items[itemId].isRestricted, "Item is restricted");
        require(items[itemId].isFree, "Item is not free to mint");

        _mint(msg.sender, itemId, amount, data);
    }

    function purchaseItem(uint256 itemId, uint256 amount, bool useMagic, bytes memory data) external {
        Item memory item = items[itemId];
        require(!item.isFree, "Item is free to mint, use mintItem function");
        require(item.isMagicAllowed || !useMagic, "MAGIC payment is not allowed for this item");

        uint256 totalPrice = useMagic ? item.priceMagic * amount : item.priceRuby * amount;

        if (useMagic) {
            magicToken.transferFrom(msg.sender, address(this), totalPrice);
        } else {
            rubyToken.transferFrom(msg.sender, address(this), totalPrice);
        }

        _mint(msg.sender, itemId, amount, data);
    }

    function managerMint(address account, uint256 id, uint256 amount, bytes memory data) public onlyMinter {
        _mint(account, id, amount, data);
    }

    function managerMintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyMinter {
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