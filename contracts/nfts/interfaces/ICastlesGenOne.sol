pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ICastleNFT is IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferOwnership(address newOwner) external;
    function setBaseURI(string calldata baseTokenURI) external;
    function ownerClaim(uint256 tokenId) external;
    function setPrice(uint256 newPrice) external;
    function ownerWithdraw() external;
}