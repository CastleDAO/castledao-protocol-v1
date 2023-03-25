// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../ManagerModifier.sol";

contract GeneralsAmuletStaker is ManagerModifier {
    using EnumerableSet for EnumerableSet.UintSet;
    IERC721 public ballotContract;
    IERC721 public generalContract;

    mapping(uint256 => string) public amulets;
    mapping(uint256 => uint256) public generalAmulet;

    // Mapping to hold the staked tokens for a user
    mapping(address => EnumerableSet.UintSet) internal userBallotsStaked;

    // Boolean flag to allow unstaking of the ballot token
    bool public allowUnstake = false;

    event AmuletChanged(uint256 amuletId, string amuleName);
    event AmuletAdded(uint256 amuletId, string amuleName);
    event AmuletRemoved(uint256 amuletId);

    constructor(
        address _manager,
        address _ballotContract,
        address _generalContract
    ) ManagerModifier(_manager) {
        ballotContract = IERC721(_ballotContract);
        generalContract = IERC721(_generalContract);
    }

    // Function to allow the manager to allow unstaking of the ballot token
    function setAllowUnstake(bool _allowUnstake) external onlyManager {
        allowUnstake = _allowUnstake;
    }

    function stakeBallot(
        uint256 _ballotId,
        uint256 _generalTokenId,
        uint256 _amuletId
    ) external {
        require(
            keccak256(abi.encodePacked(amulets[_amuletId])) !=
                keccak256(abi.encodePacked("")),
            "Invalid amulet ID"
        );

        // Require that the user owns the general token
        require(
            generalContract.ownerOf(_generalTokenId) == msg.sender,
            "User does not own general token"
        );

        ballotContract.transferFrom(msg.sender, address(this), _ballotId);

        generalAmulet[_generalTokenId] = _amuletId;
        userBallotsStaked[msg.sender].add(_ballotId);
    }

    // Function to unstake, checks that the unstaking is allowed
    function unstakeBallot(uint256 _ballotId) external {
        require(allowUnstake, "Unstaking not allowed");
        require(
            userBallotsStaked[msg.sender].contains(_ballotId),
            "Ballot not staked"
        );

        ballotContract.transferFrom(address(this), msg.sender, _ballotId);
        userBallotsStaked[msg.sender].remove(_ballotId);
    }

    // Allowed amulets modifiers
    function addAmulet(
        uint256 _amuletId,
        string memory _property
    ) external onlyManager {
        amulets[_amuletId] = _property;
        emit AmuletAdded(_amuletId, _property);
    }

    function removeAmulet(uint256 _amuletId) external onlyManager {
        delete amulets[_amuletId];
        emit AmuletRemoved(_amuletId);
    }

    function changeAmulet(
        uint256 _amuletId,
        string memory _property
    ) external onlyManager {
        amulets[_amuletId] = _property;
        emit AmuletChanged(_amuletId, _property);
    }

    function getGeneralAmulet(uint256 _generalTokenId)
        external
        view
        returns (string memory)
    {
        return amulets[generalAmulet[_generalTokenId]];
    }
}
