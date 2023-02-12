// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IERC20Bound.sol";
import "./interfaces/IRuby.sol";
import "./interfaces/ITokenManager.sol";
import "./ManagerModifier.sol";

contract Ruby is
  IRuby,
  ERC20,
  ERC20Burnable,
  ManagerModifier,
  ReentrancyGuard,
  Pausable
{
  //=======================================
  // Immutables
  //=======================================
  IERC20Bound public immutable BOUND;
  
  //=======================================
  // Token Cap
  // ======================================
  uint256 public CAP;

  //=======================================
  // Constructor
  //=======================================
  constructor(
    address _manager,
    address _bound,
    uint256 _cap
  ) ERC20("Ruby", "RUBY") ManagerModifier(_manager) {
    BOUND = IERC20Bound(_bound);
    CAP = _cap;
  }

  //=======================================
  // External
  //=======================================
  function mintFor(address _for, uint256 _amount)
    external
    override
    onlyTokenMinter
  {
    // Check amount doesn't exceed cap
    require(ERC20.totalSupply() + _amount <= CAP, "Ruby: Cap exceeded");

    // Mint
    _mint(_for, _amount);
  }

  //=======================================
  // Admin
  //=======================================
  function pause() external onlyAdmin {
    _pause();
  }

  function unpause() external onlyAdmin {
    _unpause();
  }

  function setCap(uint256 _cap) external onlyAdmin {
    // Check cap is not exceeded
    require(ERC20.totalSupply() <= _cap, "Ruby: Cap exceeded");

    // Set cap
    CAP = _cap;
  }

  //=======================================
  // Internal
  //=======================================
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override {
    // Call super
    super._beforeTokenTransfer(from, to, amount);

    // Check if sender is manager
    if (!MANAGER.isManager(msg.sender, 0)) {
      // Check if minting or burning
      if (from != address(0) && to != address(0)) {
        // Check if token is unbound
        require(BOUND.isUnbound(address(this)), "Ruby: Token not unbound");
      }
    }

    // Check if contract is paused
    require(!paused(), "Ruby: Paused");
  }
}