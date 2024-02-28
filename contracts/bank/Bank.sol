// This contract serves as a receiver of tokens and eth accross the different parts of the protocol.
// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../ManagerModifierUpgradeable.sol";
import "./interfaces/IBank.sol";

contract Bank is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ManagerModifierUpgradeable,
    IBank
{
    IERC20Upgradeable public rubyToken;

    function initialize(
        address _manager,
        address _rubyToken
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        initializeManagerModifier(_manager);
        rubyToken = IERC20Upgradeable(_rubyToken);
    }

    function pause() external onlyManager {
        _pause();
    }

    function unpause() external onlyManager {
        _unpause();
    }

    function withdrawTokens(
        address token,
        uint256 amount
    ) external onlyManager {
        IERC20Upgradeable(token).transfer(msg.sender, amount);
    }

    function withdrawRuby(uint256 amount) external onlyManager {
        rubyToken.transfer(msg.sender, amount);
    }

    function withdrawETH(uint256 amount) external onlyManager {
        payable(msg.sender).transfer(amount);
    }

}
