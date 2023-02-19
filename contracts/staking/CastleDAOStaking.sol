//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "./Staker.sol";
import "../interfaces/ITokenManager.sol";
import "../ManagerModifier.sol";
import "../interfaces/IRuby.sol";
import "hardhat/console.sol";

contract CastleDAOStaking is Staker, ManagerModifier {
    // Address of the Ruby contract
    IRuby public ruby;

    // List of allowed lock times
    mapping(uint256 => bool) public lockTimesAvailable;
    // Mapping of rewards per lock
    mapping(uint256 => uint256) public daysLockedToReward;

    // Mapping with the last time a token ID was rewarded, per collection
    mapping(address => mapping(uint256 => uint256)) public tokenIdToLastRewardTime;
    
    // Mapping of collection to rewards per day
    mapping(address => uint256) public collectionRewardsPerDay;

    // List of allowed collections (addresses of contracts that can be staked)
    mapping(address => bool) public allowedCollections;
    
    // Array with the allowed collections
    address[] public allowedCollectionsArray;

    // Mapping to hold the staked tokens for a user, per collection
    mapping(address => mapping(address => uint256[])) public userToTokensStaked;

    // Function to set the rewards per day for a collection, only manager
    function setRewardsPerDay(address _collection, uint256 _rewardsPerDay) external onlyManager {
        collectionRewardsPerDay[_collection] = _rewardsPerDay;
    }

    // Function to add a new collection allowed to the staking contract
    function addCollection(address _collection) external onlyManager {
        allowedCollections[_collection] = true;
        allowedCollectionsArray.push(_collection);
    }

    // Function to remove a collection from the allowed collections
    function removeCollection(address _collection) external onlyManager {
        allowedCollections[_collection] = false;
    }

    function setLockTimes(uint256[] calldata _lockTimes) external onlyManager {
        for(uint i=0; i<_lockTimes.length; i++) {
            lockTimesAvailable[_lockTimes[i]] = true;
        }
    }

    function removeLockTimes(uint256[] calldata _lockTimes) external onlyManager {
        for(uint i=0; i<_lockTimes.length; i++) {
            lockTimesAvailable[_lockTimes[i]] = false;
        }
    }

    function setRewards(uint256 _days, uint256 _reward) external onlyManager {
        daysLockedToReward[_days] = _reward;
    }

    // Constructor that receives the address of the Ruby contract, and the address of the initial allowed collections
    constructor(address _manager, address _ruby, address[] memory _collections, uint256[] memory _rewardsPerDay) ManagerModifier(_manager) {
        ruby = IRuby(_ruby);

        // Set the allowed lock times
        lockTimesAvailable[0] = true;
        lockTimesAvailable[15] = true;
        lockTimesAvailable[30] = true;
        lockTimesAvailable[50] = true;
        lockTimesAvailable[100] = true;

        // Set the base rewards per lock time
        daysLockedToReward[0] = 2;
        daysLockedToReward[15] = 10;
        daysLockedToReward[30] = 25;
        daysLockedToReward[50] = 40;
        daysLockedToReward[100] = 100;

        // Set the initial allowed collections
        for(uint256 i = 0; i < _collections.length; i++) {
            allowedCollections[_collections[i]] = true;
        }

        allowedCollectionsArray = _collections;

        // Set the initial rewards per day for each collection
        for(uint256 i = 0; i < _collections.length; i++) {
            collectionRewardsPerDay[_collections[i]] = _rewardsPerDay[i];
        }

    }

    // Function to stake a token, only allowed collections
    function stakeCastleDAONFT(address _collection, uint256 _tokenId, uint256 _lockDays) external {
        require(allowedCollections[_collection], "Collection not allowed");

        // Check that the lock time is allowed
        require(lockTimesAvailable[_lockDays], "Lock time not allowed");

        stakeERC721(_collection, _tokenId, _lockDays);

        // Set last reward time
        tokenIdToLastRewardTime[_collection][_tokenId] = block.timestamp;

        // Add the token to the user's staked tokens
        userToTokensStaked[msg.sender][_collection].push(_tokenId);
    }

    // Function to unstake a token, only allowed collections
    function unstakeCastleDAONFT(address _collection, uint256 _tokenId) external {
        require(allowedCollections[_collection], "Collection not allowed");

        // Claim rewards for this token
        _claimRewards(_collection, _tokenId);
        
        unstakeERC721(_collection, _tokenId);

        // Remove the token from the user's staked tokens
        uint256[] storage userTokens = userToTokensStaked[msg.sender][_collection];
        for(uint256 i = 0; i < userTokens.length; i++) {
            if(userTokens[i] == _tokenId) {
                userTokens[i] = userTokens[userTokens.length - 1];
                userTokens.pop();
                break;
            }
        }
        
    }

    // Function to claim rewards for all the tokens staked by the user
    function claimRewards() external {
        // Get the user's staked tokens and for each, claim the rewards
        // get the users tokens for each allowed collection and claim rewards
        for(uint256 i = 0; i < allowedCollectionsArray.length; i++) {
            address collection = allowedCollectionsArray[i];
            uint256[] storage userTokens = userToTokensStaked[msg.sender][collection];
            for(uint256 j = 0; j < userTokens.length; j++) {
                _claimRewards(collection, userTokens[j]);
            }
        }
    }


    function _claimRewards(address _collection, uint256 _tokenId) private{
        // Require that the token is staked and owned by the user
        require(
            stakedTokens[msg.sender][_collection][_tokenId] >= 1,
            "Not enough tokens staked"
        );

        uint256 lastRewardTime = tokenIdToLastRewardTime[_collection][_tokenId];
        uint256 rewardDays = (block.timestamp - lastRewardTime) / 1 days;
        uint256 rewardAmount = getRewardAmount(msg.sender, _collection, _tokenId);

        require(rewardAmount > 0, "Not enough to claim");

        uint256 newRewardStartTime = (rewardDays * 1 days) + lastRewardTime;
        tokenIdToLastRewardTime[_collection][_tokenId] = newRewardStartTime;

        IRuby(ruby).mintFor(msg.sender, rewardAmount * 10**18);

        emit RewardClaimed(msg.sender, _collection,  _tokenId, rewardAmount);
    }

    function getRewardAmount(address _user, address _collection, uint256 _tokenId) public view returns(uint256){
        uint256 lastRewardTime = tokenIdToLastRewardTime[_collection][_tokenId];
        uint256 rewardAmount = 0;
        uint256 rewardDays = (block.timestamp - lastRewardTime) / 1 days;
        uint256 lockDuration = lockTime[_user][_collection][_tokenId].lockDaysDuration;
        console.log("lockDuration %s", lockDuration);
        console.log("rewardDays %s", rewardDays);
        console.log("collectionRewardsPerDay[_collection]  %s", collectionRewardsPerDay[_collection]);
        console.log("daysLockedToReward[lockDuration]  %s", daysLockedToReward[lockDuration]);

        rewardAmount = (daysLockedToReward[lockDuration] + collectionRewardsPerDay[_collection]) * rewardDays;

        return rewardAmount;
    }


    // Event to emit when a reward is claimed
    event RewardClaimed(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
}