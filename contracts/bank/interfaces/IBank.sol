// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IBank {
    // Initializes the contract with manager and rubyToken addresses
    function initialize(address _manager, address _rubyToken) external;

    // Pauses the contract, disabling certain functions
    function pause() external;

    // Unpauses the contract, enabling all functions
    function unpause() external;

    // Withdraws a specified amount of any ERC20 token from the contract
    function withdrawTokens(address token, uint256 amount) external;

    // Withdraws a specified amount of rubyToken from the contract
    function withdrawRuby(uint256 amount) external;

    // Withdraws a specified amount of ETH from the contract
    function withdrawETH(uint256 amount) external;
}