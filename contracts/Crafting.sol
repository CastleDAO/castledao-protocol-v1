// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./ManagerModifierUpgradeable.sol";
import "./nfts/items/interfaces/ICastleVerseItems.sol";

contract Crafting is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ManagerModifierUpgradeable
{
    ICastleVerseItems public itemsContract;
    IERC20Upgradeable public magicToken;
    IERC20Upgradeable public rubyToken;

    struct Recipe {
        uint256 magicCost;
        uint256 rubyCost;
        uint256 outputItem;
        uint256 successChance; // Percentage, e.g. 80 for 80% success rate
    }

    mapping(uint256 => uint256[]) public recipeInputItems;
    mapping(uint256 => uint256[]) public recipeInputAmounts;
    mapping(uint256 => Recipe) public recipes;

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

    function addRecipe(
        uint256 recipeId,
        uint256[] memory inputItems,
        uint256[] memory inputAmounts,
        uint256 magicCost,
        uint256 rubyCost,
        uint256 outputItem,
        uint256 successChance
    ) external onlyManager {
        require(
            inputItems.length == inputAmounts.length,
            "Input items and amounts length mismatch"
        );

        recipes[recipeId] = Recipe(
            magicCost,
            rubyCost,
            outputItem,
            successChance
        );
        recipeInputItems[recipeId] = inputItems;
        recipeInputAmounts[recipeId] = inputAmounts;
    }

    function craft(uint256 recipeId) external whenNotPaused nonReentrant {
        Recipe memory recipe = recipes[recipeId];

        require(recipe.successChance > 0, "Invalid recipe");

        // Check input items
        uint256[] memory inputItems = recipeInputItems[recipeId];
        uint256[] memory inputAmounts = recipeInputAmounts[recipeId];

        // Transfer input items
        for (uint256 i = 0; i < inputItems.length; i++) {
            itemsContract.burn(msg.sender, inputItems[i], inputAmounts[i]);
        }

        // Transfer MAGIC and RUBY tokens
        if (recipe.magicCost > 0) {
            magicToken.transferFrom(
                msg.sender,
                address(this),
                recipe.magicCost
            );
        }
        if (recipe.rubyCost > 0) {
            rubyToken.transferFrom(msg.sender, address(this), recipe.rubyCost);
        }

        // Craft the output item based on success chance
        uint256 random = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, recipeId))
        ) % 100;
        if (random < recipe.successChance) {
            itemsContract.managerMint(msg.sender, recipe.outputItem, 1, "");
        }
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

    // Helpers to access recipe inputs and amounts
    function getRecipeInputItem(
        uint256 recipeId,
        uint256 index
    ) external view returns (uint256) {
        return recipeInputItems[recipeId][index];
    }

    function getRecipeInputAmount(
        uint256 recipeId,
        uint256 index
    ) external view returns (uint256) {
        return recipeInputAmounts[recipeId][index];
    }

    function getRecipeInputItemsLength(
        uint256 recipeId
    ) external view returns (uint256) {
        return recipeInputItems[recipeId].length;
    }

    function getRecipeInputAmountsLength(
        uint256 recipeId
    ) external view returns (uint256) {
        return recipeInputAmounts[recipeId].length;
    }
}
