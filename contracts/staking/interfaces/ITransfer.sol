pragma solidity ^0.8.4;

interface ITransfer {
  function transfer(address _to, uint256 _tokenId) external;
}