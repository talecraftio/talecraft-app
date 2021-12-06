// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;
pragma abicoder v2;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/Counters.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/structs/EnumerableSet.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/IERC1155.sol";
import "./Resource.sol";
import "./CustomEnumerableMap.sol";

contract MarketplaceNew is ERC1155Holder, Ownable {
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.UintSet;
    using CustomEnumerableMap for CustomEnumerableMap.UintToUintMap;
    using SafeERC20 for IERC20;

    struct Listing {
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        address seller;
        address buyer;
        bool closed;
    }

    struct LockedItem {
        uint256 tokenId;
        uint256 amount;
    }

    Resource internal immutable _resource;
    IERC20 internal immutable _phi;
    Counters.Counter internal _listingIds;
    mapping (uint256 => Listing) internal _listings;
    mapping (address => EnumerableSet.UintSet) internal _listingsBySeller;
    mapping (address => EnumerableSet.UintSet) internal _activeListingsBySeller;
    mapping (address => CustomEnumerableMap.UintToUintMap) internal _lockedBalances;
    EnumerableSet.UintSet internal _activeListings;
    uint256 feePercentage = 2000; // 1e6

    event NewListing(address indexed seller, uint256 indexed listingId);
    event ListingCancelled(uint256 indexed listingId);
    event Trade(address indexed seller, address indexed buyer, uint256 indexed listingId);

    event FeeUpdated(uint256 newValue);

    constructor(Resource resource, IERC20 phi) {
        _resource = resource;
        _phi = phi;

        emit FeeUpdated(feePercentage);
    }

    function putOnSale(uint256 tokenId, uint256 amount, uint256 price) external {
        require(amount > 0, "amount cannot be zero");
        require(price > 0, "price cannot be zero");
        require(tokenId > 0, "tokenId cannot be zero");

        _resource.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        _listings[listingId].tokenId = tokenId;
        _listings[listingId].amount = amount;
        _listings[listingId].price = price;
        _listings[listingId].seller = msg.sender;

        _listingsBySeller[msg.sender].add(listingId);
        _activeListingsBySeller[msg.sender].add(listingId);
        _activeListings.add(listingId);
        _updateLockedBalances(msg.sender, tokenId, int256(amount));

        emit NewListing(msg.sender, listingId);
    }

    function cancelSale(uint256 listingId) external {
        Listing storage listing = _listings[listingId];
        require(listing.seller == msg.sender, "you did not create this listing");
        require(!listing.closed, "this listing is already closed");

        listing.closed = true;
        _resource.safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, "");
        _activeListings.remove(listingId);
        _activeListingsBySeller[listing.seller].remove(listingId);
        _updateLockedBalances(listing.seller, listing.tokenId, -int256(listing.amount));

        emit ListingCancelled(listingId);
    }

    function buyListing(uint256 listingId) external {
        Listing storage listing = _listings[listingId];
        require(!listing.closed, "this listing is already closed");

        listing.buyer = msg.sender;
        listing.closed = true;
        _phi.safeTransferFrom(msg.sender, address(this), listing.price);
        _phi.safeTransfer(listing.seller, listing.price * (1e6 - feePercentage) / 1e6);
        _resource.safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, "");

        _activeListings.remove(listingId);
        _activeListingsBySeller[listing.seller].remove(listingId);
        _updateLockedBalances(listing.seller, listing.tokenId, -int256(listing.amount));

        emit Trade(listing.seller, msg.sender, listingId);
    }

    function _updateLockedBalances(address sender, uint256 tokenId, int256 delta) private {
        (bool success, uint256 value) = _lockedBalances[sender].tryGet(tokenId);
        _lockedBalances[sender].set(tokenId, uint256(int256(value) + delta));
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        require(listingId > 0 && listingId <= _listingIds.current(), "invalid listing id");
        return _listings[listingId];
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

    function getListingsBySeller(address seller) external view returns (uint256[] memory) {
        return _activeListingsBySeller[seller].values();
    }

    function getLockedTokens(address seller) external view returns (LockedItem[] memory) {
        uint256 len = _lockedBalances[seller].length();
        LockedItem[] memory result = new LockedItem[](len);
        for (uint256 i=0; i < len; i++) {
            (uint256 tokenId, uint256 balance) = _lockedBalances[seller].at(i);
            result[i] = LockedItem({ tokenId: tokenId, amount: balance });
        }
        return result;
    }
}
