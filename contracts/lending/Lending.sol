// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "hardhat/console.sol";

import "../staking/BaseStaker.sol";
import "../ManagerModifier.sol";
import "../interfaces/IRuby.sol";

contract Lending is ManagerModifier, BaseStaker, Pausable {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    IRuby public ruby;
    IERC20 public magic;

    // Total borrowed
    uint256 public totalBorrowed;
    // Total ruby emitted
    uint256 public totalRubyEmitted;
    // Loan fees accumulated
    uint256 public totalLoanFees;

    struct Collection {
        bool active;
        uint256 feesAPR;
        uint256 maxLoanRatio;
        uint256 rewardsAPY;
        uint256 floorPrice;
        uint256 liquidationRatio;
    }

    // Mapping of all collections
    EnumerableSet.AddressSet private allCollections;
    // Mapping of collections
    mapping(address => Collection) public collections;

    // Function to add a new collection allowed to the staking contract
    function addCollection(
        address _collection,
        uint256 _feesAPR,
        uint256 _maxLoanRatio,
        uint256 _rewardsAPY,
        uint256 _floorPrice,
        uint256 _liquidationRatio
    ) external onlyManager {
        allCollections.add(_collection);
        collections[_collection].active = true;
        collections[_collection].feesAPR = _feesAPR;
        collections[_collection].maxLoanRatio = _maxLoanRatio;
        collections[_collection].rewardsAPY = _rewardsAPY;
        collections[_collection].floorPrice = _floorPrice;
        collections[_collection].liquidationRatio = _liquidationRatio;

        // Emit event
        emit CollectionAdded(
            collections[_collection]
        );
    }

    // Function to remove a collection from the allowed collections
    function setCollectionActive(address _collection, bool _active)
        external
        onlyManager
    {
        collections[_collection].active = _active;

        // Emit event
        emit CollectionActiveSet(_collection, _active);
    }

    // Function to set the rewards APY for a collection, only manager
    function setRewardsAPY(address _collection, uint256 _rewardsAPY)
        external
        onlyManager
    {
        collections[_collection].rewardsAPY = _rewardsAPY;

        // Emit event
        emit RewardsAPYSet(_collection, _rewardsAPY);
    }

    // Function to set the fees APR for a collection, only manager
    function setFeesAPR(address _collection, uint256 _feesAPR)
        external
        onlyManager
    {
        collections[_collection].feesAPR = _feesAPR;
        // Emit event
        emit FeesAPRSet(_collection, _feesAPR);
    }

    // Function to set the max loan ratio for a collection, only manager
    function setCollectionMaxLoanRatio(
        address _collection,
        uint256 _maxLoanRatio
    ) external onlyManager {
        collections[_collection].maxLoanRatio = _maxLoanRatio;

        // Emit event
        emit MaxLoanRatioSet(_collection, _maxLoanRatio);
    }

    // Function to set the floor price for a collection, only oracle
    function setCollectionFloorPrice(address _collection, uint256 _floorPrice)
        external
        onlyOracle
    {
        collections[_collection].floorPrice = _floorPrice;

        // Emit event
        emit FloorPriceSet(_collection, _floorPrice);
    }

    // Function to set the liquidation ratio for a collection, only oracle
    function setCollectionLiquidationRatio(
        address _collection,
        uint256 _liquidationRatio
    ) external onlyOracle {
        collections[_collection].liquidationRatio = _liquidationRatio;

        // Emit event
        emit LiquidationRatioSet(_collection, _liquidationRatio);
    }

    // Mapping to hold the staked tokens for a user, per collection
    mapping(address => mapping(address => EnumerableSet.UintSet))
        internal userCollateral;

    struct Loan {
        // Amount borrowed
        uint256 amount;
        address borrower;
        // Last time user claimed rewards
        uint256 lastRewardTimestamp;
        // Total rewards claimed
        uint256 totalRewardsClaimed;
        // Total fees accumulated
        uint256 accumulatedFees;
        // Timestamp when the loan accumulated fees where last updated
        uint256 accumulatedFeesTimestamp;
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

    function addCollateral(address _collection, uint256 _tokenId) public {
        require(collections[_collection].active, "Collection not allowed");

        // Stake the token
        _stakeERC721ForUser(_collection, _tokenId, 0, msg.sender);

        // Add the token to the user's staked tokens
        userCollateral[msg.sender][_collection].add(_tokenId);

        // Emit event
        emit CollateralAdded(msg.sender, _collection, _tokenId);
    }

    function removeCollateral(address _collection, uint256 _tokenId) public {
        // Get the total loan amount and LTV for the user
        (
            uint256 totalLoanAmount,
            uint256 totalValueLocked
        ) = getUserLoanAmountAndTVL(msg.sender, _collection);

        uint256 newLTV = (totalLoanAmount * 100) /
            (totalValueLocked - collections[_collection].floorPrice);
        require(
            newLTV <= collections[_collection].maxLoanRatio,
            "Cannot remove collateral, LTV ratio too high"
        );

        _unstakeERC721(_collection, _tokenId);

        // Remove the token from the user's staked tokens
        userCollateral[msg.sender][_collection].remove(_tokenId);

        // Emit event
        emit CollateralRemoved(msg.sender, _collection, _tokenId);
    }

    // Function to calculate the total TVL and LTV ratio for a user
    function getUserLoanAmountAndTVL(address _user, address _collection)
        public
        view
        returns (uint256, uint256)
    {
        // get the total value locked for the user
        uint256 totalTokens = userCollateral[_user][_collection].length();

        uint256 totalValueLocked = totalTokens *
            collections[_collection].floorPrice;

        // Get the total loan amount for the user
        Loan memory loan = loans[_user][_collection];

        return (loan.amount, totalValueLocked);
    }

    // Function to get the LTV ratio for a user
    function getUserLTV(address _user, address _collection)
        public
        view
        returns (uint256)
    {
        // Get the total loan amount and TVL for the user
        (
            uint256 totalLoanAmount,
            uint256 totalValueLocked
        ) = getUserLoanAmountAndTVL(_user, _collection);

        // Calculate the LTV ratio
        if (totalValueLocked == 0) {
            return 0;
        }
        if (totalLoanAmount == 0) {
            return 0;
        }

        uint256 ltvRatio = (totalLoanAmount * 100) / totalValueLocked;

        return ltvRatio;
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
            uint256 totalValueLocked
        ) = getUserLoanAmountAndTVL(msg.sender, _collection);

        // Check if the user has enough collateral
        require(
            totalValueLocked >= _amount,
            "Cannot borrow, not enough collateral"
        );

        // Require that the new LTV ratio is lower than the max allowed
        uint256 newLTV = ((totalLoanAmount + _amount) * 100) / totalValueLocked;
        require(
            newLTV <= collections[_collection].maxLoanRatio,
            "Cannot borrow, LTV ratio too high"
        );

        console.log("Contract transfer   %s tokens to %s", _amount, msg.sender);

        // Transfer the amount to the user
        magic.transfer(msg.sender, _amount);

        // If the user already has a loan, add the new amount to the existing loan
        if (loans[msg.sender][_collection].amount > 0) {
            // Reset the rewards
            _claimRewards(msg.sender, _collection);

            // Calculate the total fees for the previous loan amount until now, and accumulate them
            uint256 totalFees = getUserLoanFees(msg.sender, _collection);
            _updateLoanFees(msg.sender, _collection, totalFees);

            // Update the loan amount
            loans[msg.sender][_collection].amount += _amount;
        } else {
            // Add the loan to the user
            loans[msg.sender][_collection] = Loan({
                amount: _amount,
                lastRewardTimestamp: block.timestamp,
                totalRewardsClaimed: 0,
                accumulatedFees: 0,
                accumulatedFeesTimestamp: block.timestamp,
                borrower: msg.sender
            });
        }

        // Emit event
        emit LoanTaken(msg.sender, _amount);
    }

    // function to calculate accumulated fees on a loan
    function getUserLoanFees(address _user, address _collection)
        public
        view
        returns (uint256)
    {
        // Get the loan
        Loan memory loan = loans[_user][_collection];
        // If the loan is not active, return 0
        if (loan.amount == 0) {
            return 0;
        }

        // Calculate the fees, this is the total accumulated + the fees for the time passed since the last update
        uint256 _days = (block.timestamp - loan.accumulatedFeesTimestamp) /
            1 days;

        uint256 _yearFeeAmount = (loan.amount *
            collections[_collection].feesAPR) / 100;
        uint256 fees = (_yearFeeAmount * _days) / 365;

        return fees + loan.accumulatedFees;
    }

    // Function to update loan fees for a user
    function _updateLoanFees(
        address _user,
        address _collection,
        uint256 totalFees
    ) internal {
        // Update the loan
        loans[_user][_collection].accumulatedFees = totalFees;
        loans[_user][_collection].accumulatedFeesTimestamp = block.timestamp;
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
        uint256 totalFees = getUserLoanFees(_user, _collection);

        require(
            _amount <= loans[_user][_collection].amount + totalFees,
            "Too much magic to repay, please input the right amount"
        );

        // Transfer the magic to the contract
        magic.transferFrom(msg.sender, address(this), _amount);

        // Pay fees
        if (totalFees > 0) {
            if (_amount >= totalFees) {
                _amount -= totalFees;
                _updateLoanFees(_user, _collection, 0);
            } else {
                _updateLoanFees(_user, _collection, totalFees - _amount);
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
    function claimRewards(address _collection) public {
        _claimRewards(msg.sender, _collection);
    }

    function _claimRewards(address _user, address _collection) internal {
        // Calculate the rewards for the time passed since the last update
        uint256 _days = (block.timestamp -
            loans[_user][_collection].lastRewardTimestamp) / 1 days;

        uint256 _yearFeeAmount = (loans[_user][_collection].amount *
            collections[_collection].rewardsAPY) / 100;
        uint256 rewards = (_yearFeeAmount * _days) / 365;

        console.log(
            "Rewards for   %s days: %s, year fee amount %s",
            _days,
            rewards,
            _yearFeeAmount
        );

        // Update the last reward timestamp
        loans[_user][_collection].lastRewardTimestamp = block.timestamp;

        // Update the total rewards claimed
        loans[_user][_collection].totalRewardsClaimed += rewards;

        console.log("Rewards transfer   %s tokens to %s", rewards, msg.sender);
        if (rewards > 0) {
            // Mint the rewards to the user
            ruby.mintFor(_user, rewards);
        }

        // Emit event
        emit RewardsClaimed(_user, rewards);
    }

    // Public function to check if a loan is liquidatable
    function isLiquidatable(address _user, address _collection)
        public
        view
        returns (bool)
    {
        if (loans[_user][_collection].amount == 0) {
            return false;
        }

        // Check that the liquidation ratio is passed
        // Divide loan.amount to totalValueLocked to get the ratio
        (
            uint256 totalLoanAmount,
            uint256 totalValueLocked
        ) = getUserLoanAmountAndTVL(msg.sender, _collection);

        uint256 LTV = ((totalLoanAmount) * 100) / totalValueLocked;

        return LTV > collections[_collection].liquidationRatio;
    }

    // Liquidation function, requires paying back loan and fees to receive collateral
    function liquidateLoan(
        address _user,
        address _collection,
        uint256 _amount
    ) public {
        // Check that the loan is active and it's not 0
        require(
            isLiquidatable(_user, _collection),
            "Cannot liquidate, no active loan"
        );

        // Check that the amount is equal to the debt + fees
        uint256 totalFees = getUserLoanFees(_user, _collection);
        uint256 totalDebt = loans[_user][_collection].amount + totalFees;

        require(
            _amount >= totalDebt,
            "Not enough magic to liquidate, please input the right amount"
        );

        // Receive the total debt
        magic.transferFrom(msg.sender, address(this), totalDebt);

        // Unstake collateral and send to the liquidator
        for (
            uint256 i = 0;
            i < userCollateral[_user][_collection].length();
            i++
        ) {
            uint256 tokenId = userCollateral[_user][_collection].at(i);
            _unstakeERC721(_collection, tokenId);
        }

        // Delete the loand and emit a liquidation event
        emit LoanLiquidated(_user, _collection, loans[_user][_collection]);
        delete loans[_user][_collection];
    }

    // function to get the collateral of a user
    function getUserCollateralAmount(address _user, address _collection)
        public
        view
        returns (uint256)
    {
        return userCollateral[_user][_collection].length();
    }

    function getUserCollateralAt(
        address _user,
        address _collection,
        uint256 _index
    ) public view returns (uint256) {
        return userCollateral[_user][_collection].at(_index);
    }

    // Events for the contract
    event CollateralAdded(
        address indexed user,
        address indexed collection,
        uint256 tokenId
    );

    event CollateralRemoved(
        address indexed user,
        address indexed collection,
        uint256 tokenId
    );

    event LoanTaken(address indexed user, uint256 amount);

    event LoanRepayed(address indexed user, uint256 amount);

    event LoanClosed(address indexed user, uint256 amount);

    event LoanLiquidated(address indexed user, address collection, Loan loan);

    event RewardsClaimed(address indexed user, uint256 amount);

    event CollectionAdded(
        Collection collection
    );

    event CollectionRemoved(address indexed collection);

    event CollectionActiveSet(address indexed collection, bool active);

    event FeesAPRSet(address indexed collection, uint256 apr);

    event RewardsAPYSet(address indexed collection, uint256 rubyRewards);

    event MaxLoanRatioSet(address collection, uint256 maxLoanRatio);

    event FloorPriceSet(address collection, uint256 floorPrice);

    event LiquidationRatioSet(address collection, uint256 liquidationRatio);
}
