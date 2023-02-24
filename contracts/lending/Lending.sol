// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "../ManagerModifier.sol";
import "../interfaces/IRuby.sol";

contract Lending is
    ManagerModifier,
    BaseStakerUpgradeable,
    PuasableUpgradeable
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    IRuby public ruby;
    IERC20 public magic;

    // Total borrowed
    uint256 public totalBorrowed;
    // Total ruby emitted
    uint256 public totalRubyEmitted;
    // Loan fees accumulated
    uint256 public totalLoanFees;

    // Mapping of all collections
    EnumerableSetUpgradeable.AddressSet private allCollections;
    // Mapping of active collections
    mapping(address => bool) public activeCollections;

    // Fees for the loan
    mapping(address => uint256) public collectionsAPY;

    // Max loan ratio for a collection
    mapping(address => uint256) public collectionsMaxLoanRatio;

    // Max earnings ratio for a collection
    mapping(address => uint256) public collectionsRubyRewards;

    // Mapping of collection floor prices
    mapping(address => uint256) public collectionsFloorPrices;

    // Function to add a new collection allowed to the staking contract
    function addCollection(
        address _collection,
        uint256 _apy,
        uint256 _maxLoanRatio
    ) external onlyManager {
        allCollections.add(_collection);
        collectionsAPY[_collection] = _apy;
        collectionsMaxLoanRatio[_collection] = _maxLoanRatio;
    }

    // Function to remove a collection from the allowed collections
    function setActiveCollection(address _collection, bool _active)
        external
        onlyManager
    {
        activeCollections[_collection] = _active;
    }

    // Function to set the rewards APY for a collection, only manager
    function setRewardsPerDay(address _collection, uint256 _rewardsAPY)
        external
        onlyManager
    {
        collectionsRubyRewards[_collection] = _rewardsAPY;
    }

    // Function to set the rewards APY for a collection, only manager
    function setAPY(address _collection, uint256 _apy) external onlyManager {
        collectionsAPY[_collection] = _apy;
    }

    // Function to set the max loan ratio for a collection, only manager
    function setMaxLoanRatio(address _collection, uint256 _maxLoanRatio)
        external
        onlyManager
    {
        collectionsMaxLoanRatio[_collection] = _maxLoanRatio;
    }

    // Function to set the floor price for a collection, only oracle
    function setFloorPrice(address _collection, uint256 _floorPrice)
        external
        onlyOracle
    {
        collectionsFloorPrices[_collection] = _floorPrice;
    }

    // Mapping to hold the staked tokens for a user, per collection
    mapping(address => mapping(address => EnumerableSetUpgradeable.UintSet))
        internal userToTokensStaked;

    struct Loan {
        // Amount borrowed
        uint256 amount;
        // Timestamp when the loan was created
        uint256 loanUpdatedTimestamp;
        address borrower;
        // Last time user claimed rewards
        uint256 lastRewardTimestamp;
        // Total rewards claimed
        uint256 totalRewardsClaimed;
        // Total fees accumulated
        uint256 totalFees;
    }

    mapping(address => mapping(address => Loan)) public loans; // user => collection => loan

    constructor(
        address _manager,
        address _ruby,
        address _magic
    ) ManagerModifier(_manager) {
        ruby = IRuby(_ruby);
        magic = IERC20(_magic);
    }

    function addCollateral(address _collection, uint256 _tokenId) internal {
        require(activeCollections[_collection], "Collection not allowed");

        // Stake the token
        _stakeERC721ForUser(_collection, _tokenId, _lockDays, msg.sender);

        // Add the token to the user's staked tokens
        userToTokensStaked[msg.sender][_collection].add(_tokenId);

        // Emit event
        emit CollateralAdded(msg.sender, _collection, _tokenId);
    }

    function removeCollateral(address _collection, uint256 _tokenId) internal {
        // Get the total loan amount and LTV for the user
        (
            uint256 totalLoanAmount,
            uint256 totalValueLocked,
            uint256 ltvRatio
        ) = getUserLoanAndTVLAndLTV(msg.sender, _collection);

        // If we remove this token, the LTV ratio will be higher than the max allowed
        require(
            ltvRatio <= collectionsMaxLoanRatio[_collection],
            "Cannot remove collateral, LTV ratio too high"
        );

        uint256 newLTV = ((totalValueLocked -
            collectionsFloorPrices[_collection]) * 100) / totalValueLocked;
        require(
            newLTV <= collectionsMaxLoanRatio[_collection],
            "Cannot remove collateral, LTV ratio too high"
        );

        _unstakeERC721(_collection, _tokenId);

        // Remove the token from the user's staked tokens
        userToTokensStaked[msg.sender][_collection].remove(_tokenId);

        // Emit event
        emit CollateralRemoved(msg.sender, _collection, _tokenId);
    }

    // Function to calculate the total TVL and LTV ratio for a user
    function getUserLoanAndTVLAndLTV(address _user, address _collection)
        public
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        // Get the total loan amount for the user
        Loan memory loan = loans[_user][_collection];
        if (loan.amount == 0) {
            return (0, 0);
        }

        // get the total value locked for the user
        uint256 totalTokens = userToTokensStaked[msg.sender][_collection]
            .length();

        uint256 totalValueLocked = totalTokens *
            collectionsFloorPrices[_collection];

        // Calculate the LTV ratio
        uint256 ltvRatio = 0;
        if (totalValueLocked > 0) {
            ltvRatio = (loan.amount * 100) / totalValueLocked;
        }

        return (loan.amount, totalValueLocked, ltvRatio);
    }

    function borrow(uint256 _amount, address _collection) public {
        // require that the contract has enough magic balance
        require(
            magic.balanceOf(address(this)) >= _amount,
            "Cannot borrow, not enough magic"
        );

        // Get the total loan amount and LTV for the user
        (
            uint256 totalLoanAmount,
            uint256 totalValueLocked,
            uint256 ltvRatio
        ) = getUserLoanAndTVLAndLTV(msg.sender, _collection);

        // Check if the user has enough collateral
        require(
            ltvRatio <= collectionsMaxLoanRatio[_collection],
            "Cannot borrow, LTV ratio too high"
        );

        // Check if the user has enough collateral
        require(
            totalValueLocked >= _amount,
            "Cannot borrow, not enough collateral"
        );

        // Require that the new LTV ratio is lower than the max allowed
        uint256 newLTV = ((totalValueLocked - _amount) * 100) /
            totalValueLocked;
        require(
            newLTV <= collectionsMaxLoanRatio[_collection],
            "Cannot borrow, LTV ratio too high"
        );

        // Transfer the amount to the user
        magic.transferFrom(msg.sender, address(this), _amount);

        // If the user already has a loan, add the new amount to the existing loan
        if (loans[msg.sender][_collection].amount > 0) {
            // Reset the rewards
            _claimRewards(msg.sender, _collection);

            // Calculate the total fees for the previous loan
            uint256 totalFees = calculateLoanFeesSinceLastUpdated(
                msg.sender,
                _collection
            );
            // Add the fees to the total fees
            loans[msg.sender][_collection].totalFees = totalFees;
            loans[msg.sender][_collection].amount += _amount;
            loans[msg.sender][_collection].loanUpdatedTimestamp = block
                .timestamp;
        } else {
            // Add the loan to the user
            loans[msg.sender][_collection] = Loan({
                amount: _amount,
                lastRewardTimestamp: block.timestamp,
                totalRewardsClaimed: 0,
                totalFees: 0,
                loanUpdatedTimestamp: block.timestamp,
                borrower: msg.sender
            });
        }

        // Emit event
        emit LoanTaken(msg.sender, _amount);
    }

    // function to calculate accumulated fees on a loan
    function calculateLoanFeesSinceLastUpdated(
        address _user,
        address _collection
    ) public view returns (uint256) {
        // Get the loan
        Loan memory loan = loans[_user][_collection];

        // If the loan is not active, return 0
        if (loan.amount == 0) {
            return 0;
        }

        // Calculate the fees
        uint256 fees = (loan.amount *
            collectionsAPY[_collection] *
            (block.timestamp - loan.loanUpdatedTimestamp)) / (365 * 1 days);

        return fees + loan.totalFees;
    }

    // Function to repay a loan partially or totally.
    // Repaying the loan also forces to pay and update the accumulated fees, and claim rewards
    // Once the loan is paid, it will be deleted
    function repay(
        address _user,
        address _collection,
        uint256 _amount
    ) public {
        // Check that the loan is active and it's not 0
        require(
            loans[_user][_collection].amount > 0,
            "Cannot repay, no active loan"
        );

        // Check that the user has enough magic
        require(
            magic.balanceOf(msg.sender) >= _amount,
            "Cannot repay, not enough magic"
        );

        // Check that the amount is not greater than the loan amount + totalFees + new fees
        uint256 totalFees = calculateLoanFeesSinceLastUpdated(
            _user,
            _collection
        );

        require(
            _amount <= loans[_user][_collection].amount + totalFees,
            "Too much magic to repay, please input the right amount"
        );

        // Transfer the magic to the contract
        magic.transferFrom(msg.sender, address(this), _amount);

        // First update the loan with the totalFees and last updated timestap
        loans[_user][_collection].totalFees = totalFees;
        loans[_user][_collection].loanUpdatedTimestamp = block.timestamp;

        // Pay fees
        if (totalFees > 0) {
            if (_amount >= totalFees) {
                _amount -= totalFees;
                loans[_user][_collection].totalFees = 0;
            } else {
                loans[_user][_collection].totalFees -= _amount;
                _amount = 0;
            }
        }

        // Pay loan
        if (_amount > 0) {
            if (_amount >= loans[_user][_collection].amount) {
                _amount -= loans[_user][_collection].amount;
                loans[_user][_collection].amount = 0;
            } else {
                loans[_user][_collection].amount -= _amount;
                _amount = 0;
            }
        }

        // Claim user rewards
        _claimRewards(_user, _collection);

        // Emit event
        emit LoanRepayed(_user, _amount);

        // If the loan is 0, delete it
        if (loans[_user][_collection].amount == 0) {
            delete loans[_user][_collection];

            // Emit event
            emit LoanClosed(_user, _amount);
        }
    }

    // Claim rewards for a user
    function claimRewards(_collection) public {
        _claimRewards(msg.sender, _collection);
    }

    function _claimRewards(address _user, address _collection) internal {
        // Rewards APY of the collection, divided by 365 and multiplied by the number of days since the last claim
        uint256 rewards = (loans[_user][_collection].amount *
            collectionsRubyRewards[_collection] *
            (block.timestamp - loans[_user][_collection].lastRewardTimestamp)) /
            (365 * 1 days);

        // Update the last reward timestamp
        loans[_user][_collection].lastRewardTimestamp = block.timestamp;

        // Update the total rewards claimed
        loans[_user][_collection].totalRewardsClaimed += rewards;

        if (rewards > 0) {
            // Mint the rewards to the user
            ruby.mintFor(_user, rewards);
        }

        // Emit event
        emit RewardsClaimed(_user, rewards);
    }
}
