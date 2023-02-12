pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract StakingState is ERC721Holder {
    event TokenStaked(
        address indexed _owner,
        uint256 indexed _tokenId,
        uint256 indexed _lockTime,
        uint256 _stakeTime
    );
    event TokenUnstaked(
        address indexed _owner, 
        address indexed _tokenAddress, 
        uint256 indexed _tokenId
    );
    event RewardClaimed(
        address indexed _owner,
        uint256 indexed _tokenId,
        uint256 indexed _rewardAmount
    );

    IERC721 public neanderSmols;
    address public bones;
    address public maxStakeToken;

    mapping(address => EnumerableSet.UintSet) internal userToTokensStaked;
    mapping(uint256 => address) public tokenIdToUser;

    mapping(uint256 => uint256) public tokenIdToStakeStartTime;
    mapping(uint256 => uint256) public tokenIdToLockDuration;
    mapping(uint256 => uint256) public tokenIdToLastRewardTime;

    mapping(uint256 => uint256) public daysLockedToReward;
    mapping(uint256 => bool) internal lockTimesAvailable;
}

interface IBones {
    function mint(address to, uint256 amount) external;
}

interface IMaxStakeToken {
    function mint(address to, uint256 amount) external;
}