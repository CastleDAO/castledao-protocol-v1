// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/utils/Strings.sol";

import "./interfaces/IERC721Metadata.sol";

contract SmolBrawlersMetadata is IERC721Metadata {
    using Strings for uint256;
    // uri for the metadata
    string private _uri;

    constructor(string memory uri)  {
        _setURI(uri);
    }

    // function to set the uri, internal
    function _setURI(string memory newuri) internal {
        _uri = newuri;
    }

    /*
     Temporal implementation to return the uri of the token
     
     In the future we will use the brawlers data to construct a json that will include:
     - Equipped items
     - Level of the brawler
     - Experience of the brawler
     - Health and other attributes
     - Equipped items can be rendered on chain.

    */
    function tokenURI( uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_uri, "/", tokenId.toString(), ".json"));
    }

}