// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/IERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/IERC1155.sol";
import "./Resource.sol";

contract ChestSale is Ownable, ERC1155Holder {
    using SafeERC20 for IERC20;

    struct UserStats {
        uint256 weeksValue;
        uint256 chestsBought;
    }

    uint256 constant public TOTAL_CHESTS = 150000;  // must be a multiple of TOTAL_WEEKS * 4
    uint256 constant public WEEK = 7 * 24 * 60 * 60;
    uint256 constant public TOTAL_WEEKS = 15;
    uint256 constant public CHESTS_PER_WEEK = TOTAL_CHESTS / TOTAL_WEEKS;
    uint256 constant public WEEK_BALANCE = CHESTS_PER_WEEK / 4;
    uint256 constant public LIMIT_PER_USER = 250;
    uint256 public weekStart;
    uint256 public weeksLeft = TOTAL_WEEKS;
    uint256 public chestsLeft;
    uint256 public chestPricePhi = 10 ether;
    uint256 public chestPriceEth = .1 ether;

    Resource private immutable _resource;
    IERC20 private immutable _phi;
    mapping (address => UserStats) private _userStats;
    uint256[4] public balances;

    event ChestsOpened(address indexed player, uint256[] tokenIds);
    event ChestPricePhiUpdated(uint256 newValue);
    event ChestPriceEthUpdated(uint256 newValue);

    constructor(Resource resource_, IERC20 phi_) {
        _resource = resource_;
        _phi = phi_;
        _startWeek();
    }

    function _startWeek() private {
        require(weeksLeft > 0, "chest sale is over");
        weeksLeft--;
        weekStart = block.timestamp;
        chestsLeft = CHESTS_PER_WEEK;
        balances[0] = balances[1] = balances[2] = balances[3] = WEEK_BALANCE;
    }

    /// @notice Open chests. User must have at least chestPricePhi * count PHI approved to this contract
    ///         and send value of chestPriceEth * count
    /// @param count The number of chests to open
    function openChest(uint256 count) external payable {
        uint256 phiFee = chestPricePhi * count;

        require(count > 0 && count <= 500, "invalid count");
        require(chestsLeft >= count, "not enough available chests");
        require(msg.value == chestPriceEth * count, "incorrect value sent");
        require(_phi.balanceOf(msg.sender) >= phiFee, "insufficient PHI balance");

        // update user's weekly limit
        UserStats storage userStats = _userStats[msg.sender];
        if (userStats.weeksValue != weeksLeft) {
            userStats.chestsBought = 0;
            userStats.weeksValue = weeksLeft;
        }
        require(userStats.chestsBought + count < LIMIT_PER_USER, "your weekly limit is exceeded");
        userStats.chestsBought += count;

        // take PHI fee
        _phi.safeTransferFrom(msg.sender, address(this), phiFee);

        // start next week if needed
        if (block.timestamp - weekStart >= WEEK)
            _startWeek();

        // select tokens in opened chests
        uint256[] memory tokenIds = new uint256[](4);
        tokenIds[0] = 1;
        tokenIds[1] = 2;
        tokenIds[2] = 3;
        tokenIds[3] = 4;
        uint256[] memory tokenAmounts = new uint256[](4);
        for (uint256 i=0; i<count; i++) {
            uint256 tokenId = uint256(keccak256(abi.encodePacked(500 - i, block.timestamp, blockhash(block.number - 1), i))) % 4;
            if (balances[tokenId] == 0) {
                if (balances[(tokenId+1) % 4] != 0) {
                    tokenId = (tokenId+1) % 4;
                } else if (balances[(tokenId+2) % 4] != 0) {
                    tokenId = (tokenId+2) % 4;
                } else if (balances[(tokenId+3) % 4] != 0) {
                    tokenId = (tokenId+3) % 4;
                } else {
                    revert("sold out");
                }
            }
            balances[tokenId]--;
            tokenAmounts[tokenId]++;
        }

        // send tokens
        _resource.safeBatchTransferFrom(address(this), msg.sender, tokenIds, tokenAmounts, "");

        chestsLeft -= count;
        emit ChestsOpened(msg.sender, tokenIds);
    }

    /// @notice Withdraw AVAX and PHI fees
    /// @param to Address to withdraw fees to
    function withdrawFees(address to) external onlyOwner {
        (bool sent, bytes memory data) = to.call{value: address(this).balance}("");
        require(sent, "an error occurred while sending avax");
        _phi.safeTransfer(to, _phi.balanceOf(address(this)));
    }

    /// @notice Changes AVAX fee amount
    /// @param newValue New AVAX fee value
    function updateChestPriceEth(uint256 newValue) external onlyOwner {
        require(newValue > 0, "must not be zero");
        chestPriceEth = newValue;
        emit ChestPriceEthUpdated(newValue);
    }

    /// @notice Changes AVAX fee amount
    /// @param newValue New AVAX fee value
    function updateChestPricePhi(uint256 newValue) external onlyOwner {
        require(newValue > 0, "must not be zero");
        chestPricePhi = newValue;
        emit ChestPricePhiUpdated(newValue);
    }
}
