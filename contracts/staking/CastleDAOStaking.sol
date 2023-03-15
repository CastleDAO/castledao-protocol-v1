//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./BaseStaker.sol";
import "../interfaces/ITokenManager.sol";
import "../ManagerModifier.sol";
import "../interfaces/IRuby.sol";
import "hardhat/console.sol";

contract CastleDAOStaking is ManagerModifier, BaseStaker, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    // Address of the Ruby contract
    IRuby public ruby;

    // Paused state
    bool public paused;

    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    // List of allowed lock times
    mapping(uint256 => bool) public lockTimesAvailable;
    // Mapping of rewards per lock
    mapping(uint256 => uint256) public daysLockedToReward;

    // Mapping with the last time a token ID was rewarded, per collection
    mapping(address => mapping(uint256 => uint256))
        public tokenIdToLastRewardTime;

    // Mapping of collection to rewards per day
    mapping(address => uint256) public collectionRewardsPerDay;

    // Array with the allowed collections
    EnumerableSet.AddressSet private allowedCollectionsArray;

    // Mapping to hold the staked tokens for a user, per collection
    mapping(address => mapping(address => EnumerableSet.UintSet))
        internal userToTokensStaked;

    // Function to set the rewards per day for a collection, only manager
    function setRewardsPerDay(address _collection, uint256 _rewardsPerDay)
        external
        onlyManager
    {
        collectionRewardsPerDay[_collection] = _rewardsPerDay;
    }

    // Function to add a new collection allowed to the staking contract
    function addCollection(address _collection) external onlyManager {
        allowedCollectionsArray.add(_collection);
    }

    // Function to remove a collection from the allowed collections
    function removeCollection(address _collection) external onlyManager {
        allowedCollectionsArray.remove(_collection);
    }

    function setLockTimes(uint256[] calldata _lockTimes) external onlyManager {
        for (uint256 i = 0; i < _lockTimes.length; i++) {
            lockTimesAvailable[_lockTimes[i]] = true;
        }
    }

    function removeLockTimes(uint256[] calldata _lockTimes)
        external
        onlyManager
    {
        for (uint256 i = 0; i < _lockTimes.length; i++) {
            lockTimesAvailable[_lockTimes[i]] = false;
        }
    }

    function setRewards(uint256 _days, uint256 _reward) external onlyManager {
        daysLockedToReward[_days] = _reward;
    }

    // Function to pause the staking contract
    function setPaused(bool _paused) external onlyManager {
        paused = _paused;
    }

    // Constructor that receives the address of the Ruby contract, and the address of the initial allowed collections
    constructor(
        address _manager,
        address _ruby,
        address[] memory _collections,
        uint256[] memory _rewardsPerDay,
        uint256[] memory _lockTimes,
        uint256[] memory _rewards
    ) ManagerModifier(_manager) {
        ruby = IRuby(_ruby);

        require(
            _collections.length == _rewardsPerDay.length,
            "Not enough data"
        );
        require(_lockTimes.length == _rewards.length, "Not enough data");

        // Set the allowed lock times
        for (uint256 i = 0; i < _lockTimes.length; i++) {
            lockTimesAvailable[_lockTimes[i]] = true;
            // Set the base rewards per lock time
            daysLockedToReward[_lockTimes[i]] = _rewards[i];
        }

        // Set the initial allowed collections
        for (uint256 i = 0; i < _collections.length; i++) {
            // Set the initial rewards per day for each collection
            collectionRewardsPerDay[_collections[i]] = _rewardsPerDay[i];

            allowedCollectionsArray.add(_collections[i]);
        }

    }

    // Function to stake a token, only allowed collections
    function stakeCastleDAONFT(
        address[] calldata _collections,
        uint256[] calldata _tokenIds,
        uint256[] calldata _lockDays
    ) external whenNotPaused {
        require(
            _collections.length > 0 &&
                _collections.length == _tokenIds.length &&
                _collections.length == _lockDays.length,
            "Not enough data"
        );

        for (uint256 i = 0; i < _collections.length; i++) {
            _stakeCastleDAONFT(_collections[i], _tokenIds[i], (_lockDays[i]));
        }
    }

    function _stakeCastleDAONFT(
        address _collection,
        uint256 _tokenId,
        uint256 _lockDays
    ) internal {
        require(allowedCollectionsArray.contains(_collection), "Collection not allowed");

        // Check that the lock time is allowed
        require(lockTimesAvailable[_lockDays] == true, "Lock time not allowed");

        _stakeERC721ForUser(_collection, _tokenId, _lockDays, msg.sender);
        // Set last reward time
        tokenIdToLastRewardTime[_collection][_tokenId] = block.timestamp;

        // Add the token to the user's staked tokens
        userToTokensStaked[msg.sender][_collection].add(_tokenId);
    }

    // Function to unstake tokens, only allowed collections
    function unstakeCastleDAONFT(
        address[] calldata _collections,
        uint256[] calldata _tokenIds
    ) external {
        require(
            _collections.length > 0 && _collections.length == _tokenIds.length,
            "Not enough data"
        );

        for (uint256 i = 0; i < _collections.length; i++) {
            _unstakeCastleDAONFT(_collections[i], _tokenIds[i]);
        }
    }

    // IT allows to unstake a token and claim the rewards
    // Token can be unstaked even if the collection is not allowed anymore, but rewards are not distributed
    function _unstakeCastleDAONFT(address _collection, uint256 _tokenId)
        internal nonReentrant
    {

        if (allowedCollectionsArray.contains(_collection)) {
            // Claim rewards for this token
            _claimRewards(_collection, _tokenId);
        }

        _unstakeERC721(_collection, _tokenId);

        // Remove the token from the user's staked tokens
        userToTokensStaked[msg.sender][_collection].remove(_tokenId);
    }

    // Function to claim rewards for all the tokens staked by the user
    function claimRewards() external nonReentrant {
        // Get the user's staked tokens and for each, claim the rewards
        // get the users tokens for each allowed collection and claim rewards
        for (uint256 i = 0; i < allowedCollectionsArray.length(); i++) {
            address collection = allowedCollectionsArray.at(i);
            uint256 totalTokens = userToTokensStaked[msg.sender][collection]
                .length();
            for (uint256 j = 0; j < totalTokens; j++) {
                _claimRewards(
                    collection,
                    userToTokensStaked[msg.sender][collection].at(j)
                );
            }
        }
    }

    function _claimRewards(address _collection, uint256 _tokenId) private {
        // Require that the token is staked and owned by the user
        require(
            stakedTokens[msg.sender][_collection][_tokenId] >= 1,
            "Not enough tokens staked"
        );

        uint256 lastRewardTime = tokenIdToLastRewardTime[_collection][_tokenId];
        uint256 rewardDays = (block.timestamp - lastRewardTime) / 1 days;
        uint256 rewardAmount = getRewardAmount(
            msg.sender,
            _collection,
            _tokenId
        );

        require(rewardAmount > 0, "Not enough to claim");

        uint256 newRewardStartTime = (rewardDays * 1 days) + lastRewardTime;
        tokenIdToLastRewardTime[_collection][_tokenId] = newRewardStartTime;

        IRuby(ruby).mintFor(msg.sender, rewardAmount * 10**18);

        emit RewardClaimed(msg.sender, _collection, _tokenId, rewardAmount);
    }

    function getRewardAmount(
        address _user,
        address _collection,
        uint256 _tokenId
    ) public view returns (uint256) {

        uint256 lastRewardTime = tokenIdToLastRewardTime[_collection][_tokenId];
        uint256 rewardAmount = 0;
        uint256 rewardDays = (block.timestamp - lastRewardTime) / 1 days;
        uint256 lockDuration = lockTime[_user][_collection][_tokenId]
            .lockDaysDuration;
       

        rewardAmount =
            (daysLockedToReward[lockDuration] +
                collectionRewardsPerDay[_collection]) *
            rewardDays;

        return rewardAmount;
    }

    // Event to emit when a reward is claimed
    event RewardClaimed(
        address indexed user,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 amount
    );
}
