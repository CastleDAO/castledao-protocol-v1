// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

interface ICastleDAOBallot {
    function addToWhitelistMultiple(address[] memory _accounts) external;
    function toggleLive() external;
    function mint(
        uint32 _stamp,
        uint32 _background,
        uint32 _signature
    ) external payable;
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function seeds(uint256 tokenId) external view returns (uint32 background, uint32 signature, uint32 stamp);
    function palette(uint256 index) external view returns (string memory);
    function paletteLength() external view returns (uint256);
    function backgroundNames(uint256 index) external view returns (string memory);
    function backgroundNamesLength() external view returns (uint256);
    function backgrounds(uint256 index) external view returns (bytes memory);
    function backgroundsLength() external view returns (uint256);
    function signatureNames(uint256 index) external view returns (string memory);
    function signatureNamesLength() external view returns (uint256);
    function signatures(uint256 index) external view returns (bytes memory);
    function signaturesLength() external view returns (uint256);
    function stampNames(uint256 index) external view returns (string memory);
    function stampNamesLength() external view returns (uint256);
    function stamps(uint256 index) external view returns (bytes memory);
    function stampsLength() external view returns (uint256);
}