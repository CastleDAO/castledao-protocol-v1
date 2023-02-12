pragma solidity ^0.8.4;
import "./interfaces/IERC20Bound.sol";
import "./ManagerModifier.sol";

contract ERC20Bound is IERC20Bound, ManagerModifier {
  //=======================================
  // Mappings
  //=======================================
  mapping(address => bool) public unbound;

  //=======================================
  // Events
  //=======================================
  event Unbounded(address addr);
  event Bounded(address addr);

  //=======================================
  // Constructor
  //=======================================
  constructor(address _manager) ManagerModifier(_manager) {}

  //=======================================
  // External
  //=======================================
  function isUnbound(address _addr) external view override returns (bool) {
    return unbound[_addr] == true;
  }

  function unbind(address _address) external override onlyBinder {
    unbound[_address] = true;

    emit Unbounded(_address);
  }
}