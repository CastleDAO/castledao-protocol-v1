// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ManagerModifier.sol";
import "./staking/BaseStaker.sol";

/**
 * @title Inventory
 * @dev Contract to manage the inventory of a user.
 * Allows the manager to increase the max slots per user.
 * Allows the manager to increase the number of slots for a user.
 * Allows the user to stake NFTs of different collections.
 * Allows the user to unstake NFTs of different collections.
 * Is upgradeable.
 */

contract Inventory is BaseStaker, ManagerModifier {
    
    // Max slots per user
    uint256 public maxSlots;

    struct UserInfo {
        uint256 slotsUsed;
        uint256 capacity;
    }

    // Constructor function with the manager address
    constructor(address _manager, uint256 _maxSlots) ManagerModifier(_manager) {
        maxSlots = _maxSlots;
    }

    // Function to increase max slots per user, only callable by the manager
    function setMaxSlots(uint256 _maxSlots) public onlyManager {
        maxSlots = _maxSlots;
    }

    mapping(address => UserInfo) public users;

    event SlotsIncreased(address indexed user, uint256 numSlots);

    function increaseSlots(address user, uint256 numSlots) public onlyManager {
        UserInfo storage userInfo = users[user];
        userInfo.capacity += numSlots;
        emit SlotsIncreased(user, numSlots);
    }

    function stakeNFT(address _collection, uint256 _tokenId, uint256 _amount) public {
        UserInfo storage userInfo = users[msg.sender];
        require((userInfo.slotsUsed + _amount) <= userInfo.capacity, "User has no inventory slots");

        _stakeERC1155ForUser(_collection, _tokenId, 1, _amount, msg.sender);

        // Increase the count of slots used
        userInfo.slotsUsed += _amount;

    }

    // Stake NFTs to a user, only callable by the manager
    function stakeNFTsForUser(address user, address _collection, uint256[] memory _tokenIds) public onlyManager {
        UserInfo storage userInfo = users[user];
        require((userInfo.slotsUsed + _tokenIds.length) <= userInfo.capacity, "User has no inventory slots");

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            _stakeERC1155ForUser( _collection, _tokenIds[i], 1, 0, user);
        }
    }

    function unstakeNFT(address _collection, uint256 _tokenId, uint256 _amount) public {
        UserInfo storage userInfo = users[msg.sender];
        require(stakedTokens[msg.sender][_collection][_tokenId] > 0, "User has no staked NFTs");

        _unstakeERC1155(_collection, _tokenId, _amount);
        userInfo.slotsUsed -= _amount;
    }
}