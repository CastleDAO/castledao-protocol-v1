// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "./interfaces/ITokenManager.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract ManagerModifierUpgradeable is Initializable {
  //=======================================
  // Variables
  //=======================================
  IManager public MANAGER;

  //=======================================
  // Initializer
  //=======================================
  function initializeManagerModifier(address _manager) public initializer {
      MANAGER = IManager(_manager);
  }

  //=======================================
  // Modifiers
  //=======================================
  modifier onlyAdmin() {
    require(MANAGER.isAdmin(msg.sender), "Manager: Not an Admin");
    _;
  }

  modifier onlyManager() {
    require(MANAGER.isManager(msg.sender, 0), "Manager: Not manager");
    _;
  }

  modifier onlyMinter() {
    require(MANAGER.isManager(msg.sender, 1), "Manager: Not minter");
    _;
  }

  modifier onlyTokenMinter() {
    require(MANAGER.isManager(msg.sender, 2), "Manager: Not token minter");
    _;
  }

  modifier onlyBinder() {
    require(MANAGER.isManager(msg.sender, 3), "Manager: Not binder");
    _;
  }

  modifier onlyOracle() {
    require(MANAGER.isManager(msg.sender, 4), "Manager: Not oracle");
    _;
  }
}