// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/Counters.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/security/Pausable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/structs/EnumerableSet.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/IERC1155.sol";
import "./Resource.sol";
import "./CustomEnumerableMap.sol";

contract GameLending is Ownable, ERC1155Holder, Pausable {
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.UintSet;
    using CustomEnumerableMap for CustomEnumerableMap.UintToUintMap;
    using SafeERC20 for IERC20;

    struct LendListing {
        uint256 id;
        uint256 duration;
        uint256 price;
        uint256 tokenId;

        address lender;
        address borrower;

        uint256 started;
        bool finished;
    }

    Resource internal immutable _resource;
    IERC20 internal immutable _phi;
    Counters.Counter internal _listingIds;
    mapping (uint256 => LendListing) internal _listings;
    mapping (address => EnumerableSet.UintSet) internal _listingsByLender;
    mapping (address => EnumerableSet.UintSet) internal _heldListingsByLender;
    mapping (address => EnumerableSet.UintSet) internal _activeListingsByLender;
    mapping (address => EnumerableSet.UintSet) internal _activeListingsByBorrower;

    EnumerableSet.UintSet internal _activeListings;
    uint256 feePercentage = 2000; // 1e6

    event NewListing(address indexed lender, uint256 indexed listingId);
    event ListingCancelled(uint256 indexed listingId);
    event Borrow(address indexed lender, address indexed borrower, uint256 indexed listingId);

    event FeeUpdated(uint256 newValue);

    constructor(Resource resource, IERC20 phi) {
        _resource = resource;
        _phi = phi;

        emit FeeUpdated(feePercentage);
    }

    function list(uint256 tokenId, uint256 duration, uint256 price) external whenNotPaused {
        require(price > 0, "price cannot be zero");
        require(duration > 0, "duration cannot be zero");
        require(tokenId > 0, "tokenId cannot be zero");

        _resource.safeTransferFrom(msg.sender, address(this), tokenId, 1, "");

        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        _listings[listingId].id = listingId;
        _listings[listingId].tokenId = tokenId;
        _listings[listingId].duration = duration;
        _listings[listingId].price = price;
        _listings[listingId].lender = msg.sender;

        _listingsByLender[msg.sender].add(listingId);
        _heldListingsByLender[msg.sender].add(listingId);
        _activeListingsByLender[msg.sender].add(listingId);
        _activeListings.add(listingId);

        emit NewListing(msg.sender, listingId);
    }

    function cancelList(uint256 listingId) external {
        if (msg.sender != owner())
            require(!paused(), "Pausable: paused");

        LendListing storage listing = _listings[listingId];
        require(listing.lender == msg.sender || msg.sender == owner(), "you did not create this listing");
        require(!listing.finished, "this listing is already cancelled");
        require(
            listing.started == 0 ||
            block.timestamp - listing.started > listing.duration,
                "this listing is rented currently"
        );

        listing.finished = true;
        _resource.safeTransferFrom(address(this), listing.lender, listing.tokenId, 1, "");
        _heldListingsByLender[listing.lender].remove(listingId);
        _activeListings.remove(listingId);
        _activeListingsByLender[listing.lender].remove(listingId);
        _activeListingsByBorrower[listing.borrower].remove(listingId);

        emit ListingCancelled(listingId);
    }

    function borrowListing(uint256 listingId) external whenNotPaused {
        LendListing storage listing = _listings[listingId];
        require(listing.started == 0, "this listing is already used");

        listing.borrower = msg.sender;
        listing.started = block.timestamp;
        _phi.safeTransferFrom(msg.sender, address(this), listing.price);
        _phi.safeTransfer(listing.lender, listing.price * (1e6 - feePercentage) / 1e6);

        _activeListings.remove(listingId);
        _activeListingsByLender[listing.lender].remove(listingId);
        _activeListingsByBorrower[msg.sender].add(listingId);

        emit Borrow(listing.lender, msg.sender, listingId);
    }

    function getListing(uint256 listingId) public view returns (LendListing memory) {
        require(listingId > 0 && listingId <= _listingIds.current(), "invalid listing id");
        return _listings[listingId];
    }

    function getListings(uint256[] calldata listingIds) external view returns (LendListing[] memory) {
        LendListing[] memory result = new LendListing[](listingIds.length);
        for (uint256 i=0; i < listingIds.length; i++) {
            result[i] = _listings[listingIds[i]];
        }
        return result;
    }

    function getActiveListingIds() external view returns (uint256[] memory) {
        return _activeListings.values();
    }

    function getListingTokenId(uint256 listingId) public view returns (uint256) {
        require(listingId > 0 && listingId <= _listingIds.current(), "invalid listing id");
        return _listings[listingId].tokenId;
    }

    function updateFee(uint256 newValue) external onlyOwner {
        feePercentage = newValue;
        emit FeeUpdated(newValue);
    }

    function withdrawFee(address to) external onlyOwner {
        uint256 balance = _phi.balanceOf(address(this));
        require(balance > 0, "nothing to withdraw");
        _phi.safeTransfer(to, balance);
    }

    function getBorrowedTokenIds(address borrower) public view returns (uint256[] memory) {
        uint256 activeListingsLength = _activeListingsByBorrower[borrower].length();
        uint256[] memory result = new uint256[](activeListingsLength);
        uint256 resultIdx;
        for (uint256 i=0; i < activeListingsLength; i++) {
            LendListing memory l = _listings[_activeListingsByBorrower[borrower].at(i)];
            if (block.timestamp - l.started < l.duration)
                result[resultIdx++] = l.tokenId;
        }
        return result;
    }

    function getBorrowedListings(address borrower) public view returns (LendListing[] memory) {
        uint256 activeListingsLength = _activeListingsByBorrower[borrower].length();
        LendListing[] memory result = new LendListing[](activeListingsLength);
        uint256 resultIdx;
        for (uint256 i=0; i < activeListingsLength; i++) {
            LendListing memory l = _listings[_activeListingsByBorrower[borrower].at(i)];
            if (block.timestamp - l.started < l.duration)
                result[resultIdx++] = l;
        }
        return result;
    }

    function getBorrowedTotalWeight(address borrower) public view returns (uint256) {
        uint256 result = 0;
        uint256 activeListingsLength = _activeListingsByBorrower[borrower].length();
        for (uint256 i=0; i < activeListingsLength; i++) {
            LendListing memory l = _listings[_activeListingsByBorrower[borrower].at(i)];
            if (block.timestamp - l.started < l.duration)
                result += _resource.getResourceWeight(l.tokenId);
        }
        return result;
    }

    function getLenderListings(address lender) public view returns (uint256[] memory) {
        return _listingsByLender[lender].values();
    }

    function getLenderHeldListings(address lender) public view returns (uint256[] memory) {
        return _heldListingsByLender[lender].values();
    }

    function isListingAvailable(address borrower, uint256 listingId) public view returns (bool) {
        LendListing memory listing = _listings[listingId];
        return listing.borrower == borrower && block.timestamp - listing.started < listing.duration;
    }

    function togglePause() external onlyOwner {
        if (paused())
            _unpause();
        else
            _pause();
    }

    function emergencyWithdraw(uint256[] memory tokenId, uint256[] memory amount) external onlyOwner {
        _resource.safeBatchTransferFrom(address(this), msg.sender, tokenId, amount, "");
    }
}
