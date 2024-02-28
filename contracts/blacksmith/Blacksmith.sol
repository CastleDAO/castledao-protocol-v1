// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../ManagerModifierUpgradeable.sol";
import "../nfts/items/interfaces/ICastleVerseItems.sol";

contract Blacksmith is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ManagerModifierUpgradeable
{
    ICastleVerseItems public itemsContract;
    IERC20Upgradeable public magicToken;
    IERC20Upgradeable public rubyToken;

    mapping(uint256 => Item) public items;

    // Public total supply of an item
    mapping(uint256 => uint256) public totalSupply;

    struct Item {
        uint256 priceRuby;
        uint256 priceMagic;
        bool isMagicAllowed; // true if MAGIC payment is allowed
        bool isFree;
        bool paused; // true if item is paused
        uint256 maxSupply; // 0 if no max supply
    }

    function initialize(
        address _manager,
        address _itemsContract,
        address _magicToken,
        address _rubyToken
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        initializeManagerModifier(_manager);

        itemsContract = ICastleVerseItems(_itemsContract);
        magicToken = IERC20Upgradeable(_magicToken);
        rubyToken = IERC20Upgradeable(_rubyToken);
    }

      function addItem(
        uint256 itemId,
        uint256 priceRuby,
        uint256 priceMagic,
        bool isMagicAllowed,
        uint256 maxSupply
    )
        external
        onlyManager
    {
        items[itemId] = Item(priceRuby, priceMagic, isMagicAllowed, (priceRuby == 0) && (priceMagic == 0), false, maxSupply);
    }

    function pauseItem(uint256 itemId) external onlyManager {
        items[itemId].paused = true;
    }

    function unpauseItem(uint256 itemId) external onlyManager {
        items[itemId].paused = false;
    }

    function modifyItem(
        uint256 itemId,
        uint256 newPriceRuby,
        uint256 newPriceMagic,
        bool newIsMagicAllowed,
        uint256 newMaxSupply
    )
        external
        onlyManager
    {
        items[itemId].priceRuby = newPriceRuby;
        items[itemId].priceMagic = newPriceMagic;
        items[itemId].isMagicAllowed = newIsMagicAllowed;
        items[itemId].isFree = (newPriceRuby == 0) && (newPriceMagic == 0);
        items[itemId].maxSupply = newMaxSupply;
    }

    function purchaseItem(uint256 itemId, uint256 amount, bool useMagic, bytes memory data) external {
        Item memory item = items[itemId];

        // Check the max supply 
        if (item.maxSupply > 0) {
            require(totalSupply[itemId] + amount <= item.maxSupply, "Max supply reached");
        }
        
        if (!item.isFree) {

            require(item.isMagicAllowed || !useMagic, "MAGIC payment is not allowed for this item");

            uint256 totalPrice = useMagic ? item.priceMagic * amount : item.priceRuby * amount;

            if (useMagic) {
                magicToken.transferFrom(msg.sender, address(this), totalPrice);
            } else {
                rubyToken.transferFrom(msg.sender, address(this), totalPrice);
            }
        }

        itemsContract.managerMint(msg.sender, itemId, amount, data);

        totalSupply[itemId] += amount;

    }

  
    function pause() external onlyManager {
        _pause();
    }

    function unpause() external onlyManager {
        _unpause();
    }

    function withdrawTokens(
        address token,
        uint256 amount
    ) external onlyManager {
        IERC20Upgradeable(token).transfer(msg.sender, amount);
    }

    function withdrawMagic(uint256 amount) external onlyManager {
        magicToken.transfer(msg.sender, amount);
    }

    function withdrawRuby(uint256 amount) external onlyManager {
        rubyToken.transfer(msg.sender, amount);
    }

    function withdrawETH(uint256 amount) external onlyManager {
        payable(msg.sender).transfer(amount);
    }

}
