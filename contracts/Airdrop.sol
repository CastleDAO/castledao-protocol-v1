// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ManagerModifier.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/ITokenManager.sol";
import "./interfaces/IRuby.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title Airdrop
 * @dev Contract to manage an airdrop.
 * Allows the manager to set the root hash.
 * Allows the manager to redeem airdrop tokens.
 * Is upgradeable.
 */
contract Airdrop is ManagerModifier, Pausable {
    bytes32 private _rootHash;
    mapping(uint256 => uint256) private _redeemed;
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;
    IRuby public ruby;
    IERC20 public magic;
    bool public isFree;
    uint256 public magicPrice;

    constructor(
        address _manager,
        address _ruby,
        address _magic,
        bool _isFree,
        uint256 _magicPrice
    ) ManagerModifier(_manager) {
        ruby = IRuby(_ruby);
        isFree = _isFree;
        magic = IERC20(_magic);
        magicPrice = _magicPrice;
    }

    event Transfer(address indexed from, address indexed to, uint256 value);

    function setRootHash(bytes32 rootHash) public onlyManager {
        require(_rootHash == 0, "Root hash already set");
        _rootHash = rootHash;
    }

    function setFree(bool _isFree) public onlyManager {
        isFree = _isFree;
    }

    function setMagicPrice(uint256 _magicPrice) public onlyManager {
        magicPrice = _magicPrice;
    }

    // Function to withdraw magic tokens only manager
    function withdrawMagic(uint256 amount) public onlyManager {
        magic.transfer(msg.sender, amount);
    }

    // Function to withdraw eth wrongfully deposited here, only manager
    function withdrawEth() public onlyManager {
        payable(msg.sender).transfer(address(this).balance);
    }

    function redeem(
        uint256 index,
        address recipient,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) public whenNotPaused {
        require(isFree, "Airdrop is not free right now");
        _redeem(index, recipient, amount, merkleProof);
    }

    function redeemForMagic(
        uint256 index,
        address recipient,
        uint256 amount,
        bytes32[] calldata merkleProof,
        uint256 magicAmount
    ) public whenNotPaused {
        require(magicAmount >= magicPrice, "Not enough magic for airdrop");
        require(magic.balanceOf(msg.sender) >= magicAmount, "Owner does not have enough magic");
        // Make sure the caller has approved enough tokens to pay for the airdrop
        require(
            magic.allowance(msg.sender, address(this)) >= magicAmount,
            "Not enough allowance"
        );

        // Transfer the magic tokens to this contract
        magic.transferFrom(msg.sender, address(this), magicAmount);
        _redeem(index, recipient, amount, merkleProof);
    }

    function _redeem(
        uint256 index,
        address recipient,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) internal {
        require(_rootHash != 0, "Root hash not set");

        // Make sure this has not been redeemed
        uint256 redeemedBlock = _redeemed[index / 256];
        uint256 redeemedMask = (uint256(1) << uint256(index % 256));
        require(
            (redeemedBlock & redeemedMask) == 0,
            "Airdrop already redeemed"
        );
        // Mark it as redeemed (if we fail, we revert)
        _redeemed[index / 256] = redeemedBlock | redeemedMask;

        bytes32 leaf = keccak256(abi.encodePacked(index, recipient, amount));
        require(
            MerkleProof.verify(merkleProof, _rootHash, leaf),
            "Invalid proof"
        );

        // Redeem!
        _balances[recipient] += amount;
        IRuby(ruby).mintFor(recipient, amount);
        _totalSupply += amount;
        emit Transfer(address(0), recipient, amount);
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
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
}
