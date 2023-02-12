pragma solidity ^0.8.4;

import "./interfaces/ITransfer.sol";
pragma solidity ^0.8.4;

interface ITransfer {
  function transfer(address _to, uint256 _tokenId) external;
}

contract Staking {
  mapping(address => mapping(uint256 => uint256)) stakedTokens;
  mapping(address => uint256) public stakedTokenCount;
  mapping(address => mapping(address => mapping(uint256 => uint256))) public stakedTokensByCollection;
  mapping(address => mapping(address => uint256)) public stakedTokenCountByCollection;

  function stakeToken(address _collection, uint256 _tokenId) public {
    ITransfer(_collection).transfer(address(this), _tokenId);

    stakedTokens[msg.sender][_tokenId] = 1;
    stakedTokenCount[msg.sender]++;

    stakedTokensByCollection[_collection][msg.sender][_tokenId] = 1;
    stakedTokenCountByCollection[_collection][msg.sender]++;
  }

  function unstakeToken(address _collection, uint256 _tokenId) public {
    require(stakedTokens[msg.sender][_tokenId] == 1, "Token is not staked");

    stakedTokens[msg.sender][_tokenId] = 0;
    stakedTokenCount[msg.sender]--;

    stakedTokensByCollection[_collection][msg.sender][_tokenId] = 0;
    stakedTokenCountByCollection[_collection][msg.sender]--;

    ITransfer(_collection).transfer(msg.sender, _tokenId);
  }

  function getStakedTokenCount(address _user) public view returns (uint256) {
    return stakedTokenCount[_user];
  }

  function getStakedTokenCountByCollection(address _collection, address _user) public view returns (uint256) {
    return stakedTokenCountByCollection[_collection][_user];
  }
}