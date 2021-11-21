// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;
pragma abicoder v2;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/Counters.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/structs/EnumerableSet.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/IERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/ERC1155.sol";
import "./ChestSale.sol";

contract Resource is ERC1155, Ownable {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    enum Tier {
        None,
        Stone,
        Iron,
        Silver,
        Gold,
        PhiStone
    }

    struct ResourceType {
        string name;
        uint256 weight;
        Tier tier;
        uint256[] ingredients;
        string ipfsHash;
    }

    struct PendingCraft {
        uint256 tokenId;
        uint256 finishTimestamp;
        bool claimed;
    }

    Counters.Counter internal _tokenIds;
    Counters.Counter internal _craftIds;
    IERC20 internal immutable _phi;
    bool internal _initialMintComplete;
    EnumerableSet.AddressSet internal _players;
    uint256 public craftWaitSkipPrice = 10 ether;  // default 10 CRAFT
    bool public reverseCraftActive = false;

    mapping (uint256 => ResourceType) public resourceTypes;
    mapping (address => EnumerableSet.UintSet) internal _pendingCraftsByUser;
    mapping (uint256 => PendingCraft) internal _pendingCrafts;
    mapping (address => EnumerableSet.UintSet) internal _ownedTokens;
    mapping (uint256 => mapping (uint256 => uint256)) internal _recipes;

    event ResourceTypeRegistered(uint256 indexed tokenId, string name, uint256 weight, string ipfsHash);
    event CraftStarted(address indexed player, uint256 craftId);
    event CraftClaimed(address indexed player, uint256 craftId);
    event CraftWaitSkipped(uint256 craftId);

    event CraftWaitSkipPriceUpdated(uint256 newValue);
    event ReverseCraftStatusUpdated(bool newValue);

    constructor(IERC20 phi) ERC1155("http://dev.bennnnsss.com:39100/_meta/") {
        _phi = phi;
        ResourceType[] memory resources_ = new ResourceType[](4);
        resources_[0] = ResourceType("earth", 1, Tier.None, new uint256[](0), "QmYKGb7p6k23XP7HGd63tJ8c4ftPT8mYQZuLZpLj26eFtc");
        resources_[1] = ResourceType("water", 1, Tier.None, new uint256[](0), "QmT3jQjCzAmPY8Mo4sHYpgN3covtw7o7XbudMDDiCX4Qh9");
        resources_[2] = ResourceType("fire", 1, Tier.None, new uint256[](0), "QmUaRGqSywM4UyvBhLW66ewWDheK2hKfnv4PYotjuCvoAa");
        resources_[3] = ResourceType("air", 1, Tier.None, new uint256[](0), "Qmf2ZAyZXGiB3PRp1nEG1ss9VMrtrnwutaotThU5tMxjj5");
        registerResourceTypes(resources_);
    }

    /// @notice Mint base resource token amounts to the chest contract
    /// @param chest Address to mint tokens to
    function initialMint(ChestSale chest) external onlyOwner {
        require(!_initialMintComplete, "initial mint is performed already");
        _mint(address(chest), 1, 75000, "");
        _mint(address(chest), 2, 75000, "");
        _mint(address(chest), 3, 75000, "");
        _mint(address(chest), 4, 75000, "");
        _initialMintComplete = true;
    }

    /// @notice Register new resource types
    /// @param types Array of resource types data ([name, weight, tier, [ingredient1, ingredient2], ipfsHash]) to register
    function registerResourceTypes(ResourceType[] memory types) public onlyOwner {
        for (uint256 i=0; i < types.length; i++) {
            _tokenIds.increment();
            uint256 tokenId = _tokenIds.current();
            resourceTypes[tokenId] = types[i];
            if (types[i].ingredients.length == 0) {
                // do nothing
            } else if (types[i].ingredients.length == 2) {
                _recipes[types[i].ingredients[0]][types[i].ingredients[1]] = tokenId;
            } else {
                revert("Invalid ingredients count");
            }
            emit ResourceTypeRegistered(tokenId, types[i].name, types[i].weight, types[i].ipfsHash);
        }
    }

    /// @notice Start crafting a token
    /// @param tokenId A token ID to craft
    function craft(uint256 tokenId) external {
        require(resourceTypes[tokenId].ingredients.length > 0, "No recipe for this resource");
        uint256[] memory ingredients = resourceTypes[tokenId].ingredients;
        Tier maxTier = Tier.None;
        for (uint256 i=0; i < ingredients.length; i++) {
            require(balanceOf(msg.sender, ingredients[i]) > 0, "insufficient ingredients");
            _burn(msg.sender, ingredients[i], 1);
            if (resourceTypes[ingredients[i]].tier > maxTier) {
                maxTier = resourceTypes[ingredients[i]].tier;
            }
        }
        uint256 delay = 0;
        uint256 price = 0;
        if (maxTier == Tier.Stone) {
            delay = 30 * 60;            // 30 min
            price = 1 ether;            // 1 CRAFT
        } else if (maxTier == Tier.Iron) {
            delay = 2 * 60 * 60;        // 2 h
            price = 2 ether;            // 2 CRAFT
        } else if (maxTier == Tier.Silver) {
            delay = 12 * 60 * 60;       // 12 h
            price = 3 ether;            // 3 CRAFT
        } else if (maxTier == Tier.Gold) {
            delay = 24 * 60 * 60;       // 1 day
            price = 4 ether;            // 4 CRAFT
        } else if (maxTier == Tier.PhiStone) {
            delay = 7 * 24 * 60 * 60;   // 1 week
            price = 5 ether;            // 5 CRAFT
        }
        if (price > 0) {
            _phi.safeTransferFrom(msg.sender, address(this), price);
        }
        _craftIds.increment();
        uint256 craftId = _craftIds.current();
        _pendingCrafts[craftId] = PendingCraft(tokenId, block.timestamp + delay, false);
        _pendingCraftsByUser[msg.sender].add(craftId);
        emit CraftStarted(msg.sender, craftId);
    }

    /// @notice Start reverse crafting a token
    /// @param tokenId A token ID to reverse craft
    function reverseCraft(uint256 tokenId) external {
        require(reverseCraftActive, "reverse craft is not active");
        require(balanceOf(msg.sender, tokenId) > 0, "you do not own this resource");
        uint256[] memory ingredients = resourceTypes[tokenId].ingredients;
        require(ingredients.length > 0, "you cannot reverse a base resource");
        Tier tier = resourceTypes[tokenId].tier;
        uint256 delay = 0;
        uint256 price = 0;
        if (tier == Tier.Stone) {
            delay = 30 * 60;            // 30 min
            price = 1 ether;            // 1 CRAFT
        } else if (tier == Tier.Iron) {
            delay = 2 * 60 * 60;        // 2 h
            price = 2 ether;            // 2 CRAFT
        } else if (tier == Tier.Silver) {
            delay = 12 * 60 * 60;       // 12 h
            price = 3 ether;            // 3 CRAFT
        } else if (tier == Tier.Gold) {
            delay = 24 * 60 * 60;       // 1 day
            price = 4 ether;            // 4 CRAFT
        } else if (tier == Tier.PhiStone) {
            delay = 7 * 24 * 60 * 60;   // 1 week
            price = 5 ether;            // 5 CRAFT
        }
        _phi.safeTransferFrom(msg.sender, address(this), price);
        for (uint256 i=0; i < ingredients.length; i++) {
            _craftIds.increment();
            uint256 craftId = _craftIds.current();
            _pendingCrafts[craftId] = PendingCraft(ingredients[i], block.timestamp + delay, false);
            _pendingCraftsByUser[msg.sender].add(craftId);
            emit CraftStarted(msg.sender, craftId);
        }
    }

    /// @notice Skip craft waiting for `craftWaitSkipPrice` CRAFT
    /// @param craftId A craft ID to skip waiting for
    function skipCraftWait(uint256 craftId) external {
        require(_pendingCraftsByUser[msg.sender].contains(craftId), "this craft is not pending for you");
        PendingCraft storage craft_ = _pendingCrafts[craftId];
        require(craft_.finishTimestamp > block.timestamp, "this craft is not pending");
        _phi.safeTransferFrom(msg.sender, address(this), craftWaitSkipPrice);
        craft_.finishTimestamp = block.timestamp - 1;
        emit CraftWaitSkipped(craftId);
    }

    /// @notice Claim result token from craft started using craft(tokenId) method
    /// @param craftId Craft ID to claim result from
    function claimCraft(uint256 craftId) external {
        require(_pendingCraftsByUser[msg.sender].contains(craftId), "this craft is not pending for you");
        PendingCraft storage craft_ = _pendingCrafts[craftId];
        require(craft_.finishTimestamp <= block.timestamp, "this craft is still pending");
        craft_.claimed = true;
        _pendingCraftsByUser[msg.sender].remove(craftId);
        _mint(msg.sender, craft_.tokenId, 1, "");
        emit CraftClaimed(msg.sender, craftId);
    }

    /// @notice Withdraw PHI fees
    /// @param to Address to withdraw fees to
    function withdrawFees(address to) external onlyOwner {
        _phi.safeTransfer(to, _phi.balanceOf(address(this)));
    }

    /// @notice List token IDs owned by an address
    /// @param player Address to list owned tokens for
    /// @return List of token IDs
    function ownedTokens(address player) external view returns (uint256[] memory) {
        return _ownedTokens[player].values();
    }

    /// @notice List token IDs owned by an address (paginated)
    /// @param player Address to list owned tokens for
    /// @param offset Array offset
    /// @param count Count of items to return
    /// @return List of token IDs
    function ownedTokensPaginated(address player, uint256 offset, uint256 count) external view returns (uint256[] memory) {
        uint256[] memory values = _ownedTokens[player].values();
        uint256[] memory result = new uint256[](count);
        for (uint256 i=0; i < count; i++) {
            result[i] = values[offset + i];
        }
        return result;
    }

    /// @notice Get resource types info by IDs
    /// @param ids Array of resource types IDs to return info for
    /// @return Resource type array
    function getResourceTypes(uint256[] memory ids) external view returns (ResourceType[] memory) {
        ResourceType[] memory result = new ResourceType[](ids.length);
        for (uint256 i=0; i<ids.length; i++) {
            result[i] = resourceTypes[ids[i]];
        }
        return result;
    }

    /// @notice Get resource type weight by IDs
    /// @param id Resource type ID to return weight for
    /// @return Resource type weight
    function getResourceWeight(uint256 id) external view returns (uint256) {
        return resourceTypes[id].weight;
    }

    /// @notice Get result of crafting with two ingredients
    /// @param tokenId1 Ingredient 1
    /// @param tokenId2 Ingredient 2
    /// @return Result token ID, 0 if no matching recipe
    function getCraftingResult(uint256 tokenId1, uint256 tokenId2) external view returns (uint256) {
        uint256 result = _recipes[tokenId1][tokenId2];
        if (result == 0)
            result = _recipes[tokenId2][tokenId1];
        return result;
    }

    /// @notice Get pending crafts for a player
    /// @param player Player address
    /// @return Array of craft IDs
    function pendingCrafts(address player) external view returns (uint256[] memory) {
        return _pendingCraftsByUser[player].values();
    }

    /// @notice Get pending crafts by IDs
    /// @param ids Craft IDs to return
    /// @return Crafts info
    function getCrafts(uint256[] memory ids) external view returns (PendingCraft[] memory) {
        PendingCraft[] memory result = new PendingCraft[](ids.length);
        for (uint256 i=0; i<ids.length; i++) {
            result[i] = _pendingCrafts[ids[i]];
        }
        return result;
    }

    /// @notice Get all players addresses (all addresses that sent or received tokens)
    /// @return Array of players addresses
    function getPlayers() external view returns (address[] memory) {
        return _players.values();
    }

    /// @notice Get all players addresses (all addresses that sent or received tokens) (paginated)
    /// @param offset Array offset
    /// @param count Count of items to return
    /// @return Array of players addresses
    function getPlayersPaginated(uint256 offset, uint256 count) external view returns (address[] memory) {
        address[] memory values = _players.values();
        address[] memory result = new address[](count);
        for (uint256 i=0; i < count; i++) {
            result[i] = values[offset + i];
        }
        return result;
    }

    /// @notice Get resource types count
    /// @return Resource types count
    function resourceCount() external view returns (uint256) {
        return _tokenIds.current();
    }

    function setCraftSkipWaitPrice(uint256 newValue) external onlyOwner {
        require(craftWaitSkipPrice != newValue, "no change");
        craftWaitSkipPrice = newValue;
        emit CraftWaitSkipPriceUpdated(newValue);
    }

    function setReverseCraftActive(bool newValue) external onlyOwner {
        require(newValue != reverseCraftActive, "no change");
        reverseCraftActive = newValue;
        emit ReverseCraftStatusUpdated(newValue);
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        for (uint256 i=0; i<ids.length; i++) {
            if (from != address(0) && balanceOf(from, ids[i]) <= amounts[i])
                _ownedTokens[from].remove(ids[i]);
            if (to != address(0) && balanceOf(to, ids[i]) == 0)
                _ownedTokens[to].add(ids[i]);
        }
        _players.add(from);
        _players.add(to);
    }
}
