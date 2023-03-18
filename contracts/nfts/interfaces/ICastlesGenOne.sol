pragma solidity ^0.8.0;


interface ICastleNFT {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferOwnership(address newOwner) external;
    function setBaseURI(string calldata baseTokenURI) external;
    function ownerClaim(uint256 tokenId) external;
    function setPrice(uint256 newPrice) external;
    function ownerWithdraw() external;
    function totalSupply() external;
}