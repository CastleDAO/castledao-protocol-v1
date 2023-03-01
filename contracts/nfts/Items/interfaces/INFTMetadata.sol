// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// Interface for NFT metadata, it has a function for the tokenURI
interface INFTMetadata {
    function tokenURI(address addr, uint256 tokenId) external view returns (string memory);
}