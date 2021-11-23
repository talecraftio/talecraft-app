// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/Counters.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/structs/EnumerableSet.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/IERC1155.sol";
import "./Resource.sol";

contract Marketplace is ERC1155Holder {
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.UintSet;

    struct Listing {
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        address seller;
        address buyer;
        bool closed;
    }

    Resource internal immutable _resource;
    Counters.Counter internal _listingIds;
    mapping (uint256 => Listing) internal _listings;
    mapping (address => EnumerableSet.UintSet) internal _listingsBySeller;
    mapping (address => EnumerableSet.UintSet) internal _activeListingsBySeller;
    EnumerableSet.UintSet internal _activeListings;

    event NewListing(address indexed seller, uint256 indexed listingId);
    event ListingCancelled(uint256 indexed listingId);
    event Trade(address indexed seller, address indexed buyer, uint256 indexed listingId);

    constructor(Resource resource) {
        _resource = resource;
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

        emit ListingCancelled(listingId);
    }

    function buyListing(uint256 listingId) external payable {
        Listing storage listing = _listings[listingId];
        require(!listing.closed, "this listing is already closed");
        require(msg.value == listing.price, "invalid value sent");

        listing.buyer = msg.sender;
        listing.closed = true;
        _resource.safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, "");


        (bool sent, bytes memory data) = msg.sender.call{value: msg.value}("");
        require(sent, "an error occurred while sending avax");

        _activeListings.remove(listingId);
        _activeListingsBySeller[listing.seller].remove(listingId);

        emit Trade(listing.seller, msg.sender, listingId);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        require(listingId > 0 && listingId <= _listingIds.current(), "invalid listing id");
        return _listings[listingId];
    }

    function getListingsBySeller(address seller) external view returns (uint256[] memory) {
        return _activeListingsBySeller[seller].values();
    }
}
