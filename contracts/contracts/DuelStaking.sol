pragma solidity 0.8.5;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/math/SafeMath.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";

contract DuelStaking is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint256 amount; // How many staking tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        uint256 rewardDebtAtBlock; // the last block user stake
        uint256 lastWithdrawBlock; // the last block user withdrew at.
        uint256 firstDepositBlock; // the first block user deposited at.
        uint256 lastDepositBlock; // the last block user deposited at.
    }

    struct PoolInfo {
        IERC20 token; // Address of staking token contract.
        uint256 supply; // supply for this pool
        uint256 allocPoint; // How many allocation points assigned to this pool.
        uint256 lastRewardBlock; // Last block number that tokens distribution occurs.
        uint256 accTokenPerShare; // Accumulated tokens per share, times 1e12. See below.
        uint256 totalAllocation; // Total allocation for the pool
        uint256 totalReward; // Total rewards for the pool
    }
    // Basis point base to calculate fees
    uint256 public constant FEE_BASE = 10000;

    // Reward token instance
    IERC20 public immutable rewardToken;

    // Address where all fees goes, can be adjusted by the owner
    address public feeRecipient;

    // Reward token per block, can be adjusted by the owner
    uint256 public tokenPerBlock = 1e17;

    // Reward bonus multipliers, can be adjusted by the owner
    uint256 public bonusMultiplier = 1;

    // The block number when rewards starts.
    uint256 public startBlock;

    // The block number when rewards ends
    uint256 public endBlock;

    // Pools array
    PoolInfo[] public poolInfo;

    // Users mapping, poolId => userAddress => UserInfo
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;

    // Array with fee amount (in basis points) for given stage
    uint256[] public feeStage;

    // Array with block deltas, used to calculate fee stage,
    uint256[] public blockDeltaFeeStage;

    event CreatePool(address indexed stakingToken, address indexed rewardToken, uint256 indexed allocation);
    event UpdatePoolAllocation(uint256 indexed pid, uint256 indexed allocation);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        IERC20 _rewardToken,
        IERC20 _stakingToken,
        uint256 _startBlock,
        uint256 _endBlock,
        uint256 _allocation,
        address _feeRecipient,
        uint256[] memory _feeStage,
        uint256[] memory _blockDeltaFeeStage
    ) public {
        rewardToken = _rewardToken;
        feeRecipient = _feeRecipient;
        startBlock = _startBlock;
        endBlock = _endBlock;
        feeStage = _feeStage;
        blockDeltaFeeStage = _blockDeltaFeeStage;

        poolInfo.push(
            PoolInfo({
                token: _stakingToken,
                supply: 0,
                allocPoint: 1,
                lastRewardBlock: startBlock,
                accTokenPerShare: 0,
                totalAllocation: _allocation,
                totalReward: 0
            })
        );
        totalAllocPoint = 1;

        emit CreatePool(address(_stakingToken), address(_rewardToken), _allocation);
    }

    /**
     * @dev Updates reward vairables for the pool.
     */
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];

        if (block.number <= pool.lastRewardBlock || pool.lastRewardBlock >= endBlock) {
            return;
        }

        if (pool.supply <= 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        uint256 toBlock = block.number > endBlock ? endBlock : block.number;

        uint256 multiplier = getMultiplier(pool.lastRewardBlock, toBlock);
        uint256 reward = multiplier.mul(tokenPerBlock).mul(pool.allocPoint).div(totalAllocPoint);

        if (pool.totalReward.add(reward) >= pool.totalAllocation) {
            reward = pool.totalAllocation.sub(pool.totalReward);
        }

        pool.accTokenPerShare = pool.accTokenPerShare.add(reward.mul(1e12).div(pool.supply));
        pool.lastRewardBlock = toBlock;
        pool.totalReward = pool.totalReward.add(reward);
    }

    /**
     * @dev Deposit tokens to DuelStaking for reward token allocation.
     */
    function deposit(uint256 _pid, uint256 _amount) external {
        require(block.number < endBlock, "DuelStaking: Deposit deadline");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accTokenPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                safeTokenTransfer(msg.sender, pending);
            }
        }

        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accTokenPerShare).div(1e12);

        if (user.firstDepositBlock == 0) {
            user.firstDepositBlock = block.number;
        }
        user.lastDepositBlock = block.number;

        pool.supply = pool.supply.add(_amount);

        pool.token.safeTransferFrom(address(msg.sender), address(this), _amount);

        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev Withdraw LP tokens from DuelStaking.
     */
    function withdraw(uint256 _pid, uint256 _amount) external {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(user.amount >= _amount, "DuelStaking: Withdraw amount exceeds user amount");

        updatePool(_pid);

        uint256 pending = user.amount.mul(pool.accTokenPerShare).div(1e12).sub(user.rewardDebt);

        if (pending > 0) {
            safeTokenTransfer(msg.sender, pending);
        }

        if (_amount > 0) {
            uint256 fee = getWithdrawalFee(_pid, msg.sender);

            uint256 amount = applyFee(fee, _amount);
            uint256 feeAmount = calculateFee(fee, _amount);

            user.amount = user.amount.sub(_amount);
            user.lastWithdrawBlock = block.number;

            pool.supply = pool.supply.sub(_amount);

            pool.token.safeTransfer(address(msg.sender), amount);
            if (feeAmount > 0) {
                pool.token.safeTransfer(address(feeRecipient), feeAmount);
            }
        }

        user.rewardDebt = user.amount.mul(pool.accTokenPerShare).div(1e12);

        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev Withdraw without caring about rewards. EMERGENCY ONLY.
     * This has 25% slashing fee as same block withdrawals to prevent abuse of this function.
     */
    function emergencyWithdraw(uint256 _pid) external {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        pool.supply = pool.supply.sub(user.amount);

        uint256 amount = applyFee(feeStage[0], user.amount);
        uint256 feeAmount = calculateFee(feeStage[0], user.amount);

        user.amount = 0;
        user.rewardDebt = 0;

        pool.token.safeTransfer(address(msg.sender), amount);
        if (feeAmount > 0) {
            pool.token.safeTransfer(address(feeRecipient), feeAmount);
        }

        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    /**
     * @dev Returns reward multiplier over the given _from to _to block.
     */
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        return _to.sub(_from).mul(bonusMultiplier);
    }

    /**
     * @dev Returns pending rewards for user.
     */
    function getPendingRewards(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];

        if (block.number < startBlock) {
            return 0;
        }

        uint256 accTokenPerShare = pool.accTokenPerShare;
        if (block.number > pool.lastRewardBlock && pool.supply != 0) {
            uint256 toBlock = block.number > endBlock ? endBlock : block.number;
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, toBlock);
            uint256 reward = multiplier.mul(tokenPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            if (pool.totalReward.add(reward) >= pool.totalAllocation) {
                reward = pool.totalAllocation.sub(pool.totalReward);
            }
            accTokenPerShare = accTokenPerShare.add(reward.mul(1e12).div(pool.supply));
        }
        return user.amount.mul(accTokenPerShare).div(1e12).sub(user.rewardDebt);
    }

    /**
     * @dev Add pool reward allocation. Can only be called by the owner.
     */
    function addAllocation(uint256 _pid, uint256 _amount) public onlyOwner {
        updatePool(_pid);
        poolInfo[_pid].totalAllocation = poolInfo[_pid].totalAllocation.add(_amount);
        emit UpdatePoolAllocation(_pid, _amount);
    }

    /**
     * @dev Updates reward multiplier, only owner.
     */
    function setMultiplier(uint256 _multiplier) external onlyOwner {
        require(_multiplier > 0, "DuelStaking: Zero multiplier");
        bonusMultiplier = _multiplier;
    }

    /**
     * @dev Updates fee recipient, only owner.
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "DuelStaking: Zero fee recipient");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Updates reward per block, only owner.
     */
    function setTokenPerBlock(uint256 _amount) external onlyOwner {
        require(_amount <= 30 * 1e18, "DuelStaking: Max per block 30 tokens");
        require(_amount >= 1 * 1e16, "DuelStaking: Min per block 1 token");
        tokenPerBlock = _amount;
    }

    /**
     * @dev Updates start block, only owner.
     */
    function setStartBlock(uint256 _block) external onlyOwner {
        require(startBlock > block.number, "DuelStaking: Farming has been started");
        require(_block < endBlock, "DuelStaking: Start block should be less then endBlock");

        startBlock = _block;
        poolInfo[0].lastRewardBlock = startBlock;
    }

    /**
     * @dev Updates end block, only owner.
     */
    function setEndBlock(uint256 _block) external onlyOwner {
        require(endBlock > block.number, "DuelStaking: Farming has been finished");
        require(_block > startBlock, "DuelStaking: End block should be greater then startBlock");

        endBlock = _block;
    }

    /**
     * @dev Updates fee stage, only owner.
     * i.e. [2500,400,300,200,100] = [25%,4%,3%,2%,1%]
     * must be length of 5
     */
    function setFeeStage(uint256[] memory _feeStage) external onlyOwner {
        require(_feeStage.length == feeStage.length, "DuelStaking: FeeStage array mismatch");
        feeStage = _feeStage;
    }

    /**
     * @dev Updates block delta fee stage array, only owner.
     * i.e. [0,1200,2400,3600,4800] for BSC 1200 block ~ 1 hour
     * must be length of 5
     */
    function setBlockDeltaFeeStage(uint256[] memory _blockDeltas) external onlyOwner {
        require(_blockDeltas.length == blockDeltaFeeStage.length, "DuelStaking: BlockDeltaFeeStage array mismatch");
        blockDeltaFeeStage = _blockDeltas;
    }

    /**
     * @dev Sends leftover tokens to the fee recipient, only owner.
     */
    function claimLeftovers() external onlyOwner {
        require(poolInfo[0].supply == 0, "DuelStaking: Not all users has claimed");

        uint256 balance = rewardToken.balanceOf(address(this));

        require(balance > 0, "DuelStaking: Zero balance");

        safeTokenTransfer(msg.sender, balance);
    }

    /**
     * @dev Safe token transfer function, just in case if rounding error
     * causes pool to not have enough token balance.
     */
    function safeTokenTransfer(address _to, uint256 _amount) internal {
        uint256 balance = rewardToken.balanceOf(address(this));
        if (_amount > balance) {
            rewardToken.transfer(_to, balance);
        } else {
            rewardToken.transfer(_to, _amount);
        }
    }

    /**
     * @dev it calculates (1 - fee) * amount
     * Applies the fee by subtracting fees from the amount and returns
     * the amount after deducting the fee.
     */
    function applyFee(uint256 _feeInBips, uint256 _amount) internal pure returns (uint256) {
        return _amount.mul(FEE_BASE.sub(_feeInBips)).div(FEE_BASE);
    }

    /**
     * @dev it calculates fee * amount
     * Calculates the fee amount.
     */
    function calculateFee(uint256 _feeInBips, uint256 _amount) internal pure returns (uint256) {
        return _amount.mul(_feeInBips).div(FEE_BASE);
    }

    /**
     * @dev Get withdrawal fee in basis points for the user of the given pool.
     */
    function getWithdrawalFee(uint256 _pid, address _user) internal view returns (uint256) {
        uint256 userBlockDelta = getUserDelta(_pid, _user);

        uint256 fee;

        if (userBlockDelta == 0 || userBlockDelta <= blockDeltaFeeStage[0]) {
            //25% fee for withdrawals in the same block to prevent abuse from flashloans
            fee = feeStage[0];
        } else if (userBlockDelta > blockDeltaFeeStage[0] && userBlockDelta <= blockDeltaFeeStage[1]) {
            fee = feeStage[1];
        } else if (userBlockDelta > blockDeltaFeeStage[1] && userBlockDelta <= blockDeltaFeeStage[2]) {
            fee = feeStage[2];
        } else if (userBlockDelta > blockDeltaFeeStage[2] && userBlockDelta <= blockDeltaFeeStage[3]) {
            fee = feeStage[3];
        } else if (userBlockDelta > blockDeltaFeeStage[3] && userBlockDelta <= blockDeltaFeeStage[4]) {
            fee = feeStage[4];
        }

        return fee;
    }

    /**
     * @dev Get user blocks delta from last deposit block to current block.
     */
    function getUserDelta(uint256 _pid, address _user) internal view returns (uint256) {
        UserInfo storage user = userInfo[_pid][_user];
        if (user.lastWithdrawBlock > 0) {
            uint256 estDelta = block.number.sub(user.lastWithdrawBlock);
            return estDelta;
        } else {
            uint256 estDelta = block.number.sub(user.firstDepositBlock);
            return estDelta;
        }
    }
}
