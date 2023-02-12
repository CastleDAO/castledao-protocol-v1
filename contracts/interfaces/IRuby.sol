pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRuby is IERC20 {
  function mintFor(address _for, uint256 _amount) external;
}
