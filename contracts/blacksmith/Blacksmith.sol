// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../ManagerModifierUpgradeable.sol";
import "../nfts/items/interfaces/ICastleVerseItems.sol";
import "../bank/interfaces/IBank.sol";
contract Blacksmith is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ManagerModifierUpgradeable
{
    ICastleVerseItems public itemsContract;
    IERC20Upgradeable public rubyToken;
    IBank public bank;

    mapping(uint256 => Item) public items;

    // Public total supply of an item
    mapping(uint256 => uint256) public totalSupply;

    struct Item {
        uint256 priceRuby;
        bool paused; // true if item is paused
        uint256 maxSupply; // 0 if no max supply
    }

    function initialize(
        address _manager,
        address _itemsContract,
        address _rubyToken,
        address _bank
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        initializeManagerModifier(_manager);
        itemsContract = ICastleVerseItems(_itemsContract);
        rubyToken = IERC20Upgradeable(_rubyToken);
        bank = IBank(_bank);
    }

      function addItem(
        uint256 itemId,
        uint256 priceRuby,
        uint256 maxSupply
    )
        external
        onlyManager
    {
        items[itemId] = Item(priceRuby, false, maxSupply);
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
        uint256 newMaxSupply
    )
        external
        onlyManager
    {
        items[itemId].priceRuby = newPriceRuby;
        items[itemId].maxSupply = newMaxSupply;
    }

    // Internal purchase function
    function _purchaseItems(
        uint256[] memory itemIds,
        uint256[] memory amounts,
        bytes[] memory data,
        uint256 totalPrice
    ) internal {
        rubyToken.transferFrom(msg.sender, address(bank), totalPrice);

        for (uint256 i = 0; i < itemIds.length; i++) {
            itemsContract.managerMint(msg.sender, itemIds[i], amounts[i], data[i]);
            totalSupply[itemIds[i]] += amounts[i];
        }
    }

    function purchaseItems(
        uint256[] memory itemIds,
        uint256[] memory amounts,
        bytes[] memory data
    ) external {
        require(
            itemIds.length == amounts.length && itemIds.length == data.length,
            "Input length mismatch"
        );

        uint256 totalPrice;

        for (uint256 i = 0; i < itemIds.length; i++) {
            Item memory item = items[itemIds[i]];

            // Check the max supply 
            if (item.maxSupply > 0) {
                require(totalSupply[itemIds[i]] + amounts[i] <= item.maxSupply, "Max supply reached");
            }

            if (item.priceRuby > 0) {
                totalPrice += item.priceRuby * amounts[i];
            }
        }

        _purchaseItems(itemIds, amounts, data, totalPrice );

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

    function withdrawETH(uint256 amount) external onlyManager {
        payable(msg.sender).transfer(amount);
    }

}
