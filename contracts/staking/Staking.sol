// //SPDX-License-Identifier: Unlicense
// pragma solidity ^0.8.13;

// import "@openzeppelin/contracts/utils/math/Math.sol";
// import "./StakingState.sol";
// import "./ContractControl.sol";
// import "../interfaces/ITokenManager.sol";
// import "../ManagerModifier.sol";

// contract CastleDAOStaking is StakingState, ContractControl, ManagerModifier { 
//     constructor() {
//         daysLockedToReward[0] = 2; daysLockedToReward[15] = 10;
//         daysLockedToReward[30] = 25; daysLockedToReward[50] = 40;
//         daysLockedToReward[100] = 100;
//         lockTimesAvailable[0] = true; lockTimesAvailable[15] = true; 
//         lockTimesAvailable[30] = true; lockTimesAvailable[50] = true; 
//         lockTimesAvailable[100] = true; 
//     }

//     using EnumerableSet for EnumerableSet.UintSet;

//     function setContracts(address _neanderSmols, address _bones, address _maxStakeToken) external onlyOwner {
//         neanderSmols = IERC721(_neanderSmols);
//         bones = _bones; 
//         maxStakeToken = _maxStakeToken
//     }

//     modifier contractsAreSet() {
//         require(address(neanderSmols) != address(0), "Contracts aren't set");
//         require(bones != address(0), "Contracts aren't set");
//         _;
//     }

//     function stakeSmol(
//         uint256[] calldata _neanderTokens,
//         uint256[] calldata _lockTimes)
//     external
//     contractsAreSet
//     whenNotPaused
//     {
//         require(_neanderTokens.length > 0 && _neanderTokens.length == _lockTimes.length, "No tokens given");
//         for(uint256 i = 0; i < _neanderTokens.length; i++) {
//             _stakeSmol(_neanderTokens[i], (_lockTimes[i]));
//         }
//     }

//     function _stakeSmol(uint256 _tokenId, uint256 _lockTime) private {
//         require(lockTimesAvailable[_lockTime] == true, "Lock time invalid");
//         userToTokensStaked[msg.sender].add(_tokenId);
//         tokenIdToUser[_tokenId] = msg.sender;

//         tokenIdToStakeStartTime[_tokenId] = block.timestamp;
//         tokenIdToLastRewardTime[_tokenId] = block.timestamp;
//         tokenIdToLockDuration[_tokenId] = _lockTime * 1 days;

//         emit NeanderStaked(msg.sender, _tokenId, _lockTime, block.timestamp);

//         if (_lockTime == 100) {
//             IMaxStakeToken(maxStakeToken).mint(msg.sender, 1);
//         }

//         // will revert if user does not own token
//         neanderSmols.safeTransferFrom(msg.sender, address(this), _tokenId);
//     }

//     function unstakeSmol(
//         uint256[] calldata _neanderTokens)
//     external
//     contractsAreSet
//     whenNotPaused
//     {
//         require(_neanderTokens.length > 0, "No tokens given");
//         for(uint256 i = 0; i < _neanderTokens.length; i++) {
//             _unstakeSmol(neanderSmols, _neanderTokens[i]);
//         }
//     }

//     function _unstakeSmol(IERC721 neander, uint256 _tokenId) private {
//         require(userToTokensStaked[msg.sender].contains(_tokenId), "Not owned by user");
//         require(tokenIdToStakeStartTime[_tokenId] + tokenIdToLockDuration[_tokenId] <= block.timestamp, "Lock time not over");

//         if(block.timestamp - tokenIdToLastRewardTime[_tokenId] >= 1 days) {
//             _claimRewards(_tokenId);
//         }

//         delete tokenIdToUser[_tokenId];
//         delete tokenIdToStakeStartTime[_tokenId];
//         delete tokenIdToLockDuration[_tokenId];

//         emit NeanderUnstaked(msg.sender, address(neander), _tokenId);

//         neander.safeTransferFrom(address(this), msg.sender, _tokenId);
//     }

//     function claimRewards(
//         uint256[] calldata _neanderTokens)
//     external
//     contractsAreSet
//     whenNotPaused
//     {
//         require(_neanderTokens.length > 0, "No tokens given");
//         for(uint256 i = 0; i < _neanderTokens.length; i++) {
//             _claimRewards(_neanderTokens[i]);
//         }
//     }

//     function _claimRewards(uint256 _tokenId) private{
//         require(userToTokensStaked[msg.sender].contains(_tokenId), "Not owned by user");

//         uint256 lastRewardTime = tokenIdToLastRewardTime[_tokenId];
//         uint256 rewardDays = (block.timestamp - lastRewardTime) / 1 days;
//         uint256 rewardAmount = getRewardAmount(_tokenId);

//         require(rewardAmount > 0, "Not enough to claim");

//         uint256 newRewardStartTime = (rewardDays * 1 days) + lastRewardTime;
//         tokenIdToLastRewardTime[_tokenId] = newRewardStartTime;

//         IBones(bones).mint(msg.sender, rewardAmount * 10**18);

//         emit RewardClaimed(msg.sender, _tokenId, rewardAmount);
//     }

//     function getRewardAmount(uint256 _tokenId) public view contractsAreSet returns(uint256){
//         uint256 lastRewardTime = tokenIdToLastRewardTime[_tokenId];
//         uint256 rewardAmount = 0;
//         uint256 rewardDays = (block.timestamp - lastRewardTime) / 1 days;
//         uint256 lockDuration = tokenIdToLockDuration[_tokenId] / 1 days;

//         rewardAmount = daysLockedToReward[lockDuration] * rewardDays;

//         return rewardAmount;
//     }

//     function getUserFromToken(uint256 _tokenId) external view returns(address){
//         return tokenIdToUser[_tokenId];
//     }

//     function setLockTimes(uint256[] calldata _lockTimes) external onlyAdmin {
//         for(uint i=0; i<_lockTimes.length; i++) {
//             lockTimesAvailable[_lockTimes[i]] = true;
//         }
//     }

//     function removeLockTimes(uint256[] calldata _lockTimes) external onlyAdmin {
//         for(uint i=0; i<_lockTimes.length; i++) {
//             lockTimesAvailable[_lockTimes[i]] = false;
//         }
//     }

//     function setRewards(uint256 _days, uint256 _reward) external onlyAdmin {
//         daysLockedToReward[_days] = _reward;
//     }
// }