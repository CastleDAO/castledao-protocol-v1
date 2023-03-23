// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../ManagerModifier.sol";

contract GeneralsAmuletStaker is ManagerModifier {
    using EnumerableSet for EnumerableSet.UintSet;
    IERC721 public ballotContract;
    IERC721 public generalContract;
    IERC20 public arbToken;
    IERC20 public magicToken;

    mapping(uint256 => string) public amulets;
    mapping(uint256 => uint256) public generalAmulet;

    // Mapping to hold the staked tokens for a user
    mapping(address => EnumerableSet.UintSet) internal userBallotsStaked;

    // Boolean flag to allow unstaking of the ballot token
    bool public allowUnstake = false;

    // Price in ARB to stake a ballot
    uint256 public arbPrice = 1000000000000000000;

    // Price in MAGIC to stake a ballot
    uint256 public magicPrice = 1000000000000000000;

    event AmuletChanged(uint256 amuletId, string amuleName);
    event AmuletAdded(uint256 amuletId, string amuleName);
    event AmuletRemoved(uint256 amuletId);

    constructor(
        address _manager,
        address _ballotContract,
        address _generalContract,
        address _arbToken,
        address _magicToken
    ) ManagerModifier(_manager) {
        ballotContract = IERC721(_ballotContract);
        generalContract = IERC721(_generalContract);
        arbToken = IERC20(_arbToken);
        magicToken = IERC20(_magicToken);

        amulets[1] = "fire";
        amulets[2] = "sea";
        amulets[3] = "forest";
        amulets[4] = "magic";
    }

    // Function to allow the manager to allow unstaking of the ballot token
    function setAllowUnstake(bool _allowUnstake) external onlyManager {
        allowUnstake = _allowUnstake;
    }

    // Function to allow the manager to set the price in ARB to stake a ballot
    function setArbPrice(uint256 _arbPrice) external onlyManager {
        arbPrice = _arbPrice;
    }

    // Function to allow the manager to set the price in MAGIC to stake a ballot
    function setMagicPrice(uint256 _magicPrice) external onlyManager {
        magicPrice = _magicPrice;
    }

    function stakeBallot(
        uint256 _ballotId,
        uint256 _generalTokenId,
        uint256 _amuletId,
        uint256 _tokenChoice
    ) external {
        require(
            keccak256(abi.encodePacked(amulets[_amuletId])) !=
                keccak256(abi.encodePacked("")),
            "Invalid amulet ID"
        );

        ballotContract.transferFrom(msg.sender, address(this), _ballotId);

        // Require token choice to be 1 or 2
        require(_tokenChoice == 1 || _tokenChoice == 2, "Invalid token choice");

        // If tokenChoice is 1, use ARB token. Check if arbPrice is greater than 0
        if (_tokenChoice == 1 && arbPrice > 0) {
            // Use the stored price of the token
            arbToken.transferFrom(msg.sender, address(this), arbPrice);
        } else if (_tokenChoice == 2 && magicPrice > 0) {
            // Use the stored price of the token
            magicToken.transferFrom(msg.sender, address(this), magicPrice);
        }

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

    // Function to withdraw all the ARB and MAGIC tokens from the contract
    function withdrawAllTokens() external onlyManager {
        arbToken.transfer(msg.sender, arbToken.balanceOf(address(this)));
        magicToken.transfer(msg.sender, magicToken.balanceOf(address(this)));
    }

    // Function to withdraw all the ETH from the contract
    function withdrawAllEth() external onlyManager {
        payable(msg.sender).transfer(address(this).balance);
    }
}
