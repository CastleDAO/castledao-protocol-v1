
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for ERC721 metadata
interface IERC721Metadata {
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
