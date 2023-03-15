// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


import "./interfaces/INFTMetadata.sol";

contract ItemsMetadataV1 is INFTMetadata {
    // uri for the metadata
    string private _uri;

    constructor(string memory _uri)  {
        _setURI(_uri);
    }

    // function to set the uri, internal
    function _setURI(string memory newuri) internal {
        _uri = newuri;
    }

    function tokenURI(address addr, uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_uri, addr, "/", tokenId , '.json'));
    }

    function erc1155TokenUri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_uri, tokenId, '.json'));
    }
}