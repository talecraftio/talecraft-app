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

    uint256 constant public TOTAL_CHESTS = 150000;
    uint256 constant public WEEK = 7 * 24 * 60 * 60;
    uint256 constant public TOTAL_WEEKS = 15;
    uint256 constant public CHESTS_PER_WEEK = TOTAL_CHESTS / TOTAL_WEEKS;
    uint256 constant public WEEK_BALANCE = CHESTS_PER_WEEK / 4;
    uint256 public weekStart;
    uint256 public weeksLeft = TOTAL_WEEKS;
    uint256 public chestsLeft;
    uint256 public chestPricePhi = 10 ether;
    uint256 public chestPriceEth = .1 ether;

    Resource private resource;
    IERC20 private phi;
    uint256[4] public balances;

    event ChestsOpened(address indexed player, uint256[] tokenIds);
    event ChestPricePhiUpdated(uint256 newValue);
    event ChestPriceEthUpdated(uint256 newValue);

    constructor(Resource resource_, IERC20 phi_) {
        resource = resource_;
        phi = phi_;
        _startWeek();
    }

    function _startWeek() private {
        require(weeksLeft > 0, "chest sale is over");
        weeksLeft--;
        weekStart = block.timestamp;
        chestsLeft = CHESTS_PER_WEEK;
        balances[0] = balances[1] = balances[2] = balances[3] = WEEK_BALANCE;
    }

    function openChest(uint256 count) public payable {
        require(count > 0 && count <= 500, "invalid count");
        require(chestsLeft >= count, "not enough available chests");
        require(msg.value == chestPriceEth * count, "incorrect value sent");
        require(phi.balanceOf(msg.sender) >= chestPricePhi * count, "insufficient PHI balance");

        phi.safeTransferFrom(msg.sender, address(this), chestPricePhi * count);

        if (block.timestamp - weekStart >= WEEK)
            _startWeek();

        uint256[] memory tokenIds = new uint256[](4);
        tokenIds[0] = 1;
        tokenIds[1] = 2;
        tokenIds[2] = 3;
        tokenIds[3] = 4;
        uint256[] memory tokenAmounts = new uint256[](4);
        for (uint256 i=0; i<count; i++) {
            uint256 tokenId = uint256(keccak256(abi.encodePacked(500 - i, block.timestamp, blockhash(block.number), i))) % 4;
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
            tokenAmounts[tokenId] += 1;
        }
        resource.safeBatchTransferFrom(address(this), msg.sender, tokenIds, tokenAmounts, "");
        chestsLeft -= count;
        emit ChestsOpened(msg.sender, tokenIds);
    }

    function withdrawFees(address payable to) public onlyOwner {
        to.transfer(address(this).balance);
        phi.safeTransferFrom(address(this), to, phi.balanceOf(address(this)));
    }

    function updateChestPriceEth(uint256 newValue) public onlyOwner {
        require(newValue > 0, "must not be zero");
        chestPriceEth = newValue;
        emit ChestPriceEthUpdated(newValue);
    }

    function updateChestPricePhi(uint256 newValue) public onlyOwner {
        require(newValue > 0, "must not be zero");
        chestPricePhi = newValue;
        emit ChestPricePhiUpdated(newValue);
    }

    receive() external payable {
        revert();
    }
}
