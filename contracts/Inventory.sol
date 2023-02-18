// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ManagerModifier.sol";
import "./staking/Staker.sol";

/**
 * @title Inventory
 * @dev Contract to manage the inventory of a user.
 * Allows the manager to increase the max slots per user.
 * Allows the manager to increase the number of slots for a user.
 * Allows the user to stake NFTs of different collections.
 * Allows the user to unstake NFTs of different collections.
 * Is upgradeable.
 */

contract Inventory is Staker, ManagerModifier {
    
    // Max slots per user
    uint256 public maxSlots;

    struct UserInfo {
        uint256 numSlots;
        mapping(address => mapping(uint256 => uint256)) stakedNFTs;
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
        userInfo.numSlots += numSlots;
        emit SlotsIncreased(user, numSlots);
    }

    function stakeNFT(address nftContract, uint256 tokenId) public {
        UserInfo storage userInfo = users[msg.sender];
        require(userInfo.numSlots > 0, "User has no inventory slots");

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        userInfo.stakedNFTs += 1;
    }

    function unstakeNFT(address nftContract, uint256 tokenId) public {
        UserInfo storage userInfo = users[msg.sender];
        require(userInfo.stakedNFTs > 0, "User has no staked NFTs");

        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        userInfo.stakedNFTs -= 1;
    }
}