pragma solidity ^0.8.0;

interface ICryptoGenerals {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferOwnership(address newOwner) external;
    function setBaseURI(string calldata baseTokenURI) external;
    function ownerClaim() external;
    function setPrice(uint256 newPrice, uint256 _type) external;
    function ownerWithdraw() external;
    function totalSupply() external view returns (uint256);
}