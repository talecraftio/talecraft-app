// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}



/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCall(target, data, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        require(isContract(target), "Address: call to non-contract");

        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        require(isContract(target), "Address: static call to non-contract");

        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(isContract(target), "Address: delegate call to non-contract");

        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verifies that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly

                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }
}
/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    using Address for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    /**
     * @dev Deprecated. This function has issues similar to the ones found in
     * {IERC20-approve}, and its usage is discouraged.
     *
     * Whenever possible, use {safeIncreaseAllowance} and
     * {safeDecreaseAllowance} instead.
     */
    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    function safeIncreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender) + value;
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
    }

    function safeDecreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        unchecked {
            uint256 oldAllowance = token.allowance(address(this), spender);
            require(oldAllowance >= value, "SafeERC20: decreased allowance below zero");
            uint256 newAllowance = oldAllowance - value;
            _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address.functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        if (returndata.length > 0) {
            // Return data is optional
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}

/**
 * @dev Wrappers over Solidity's arithmetic operations.
 *
 * NOTE: `SafeMath` is no longer needed starting with Solidity 0.8. The compiler
 * now has built in overflow checking.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the substraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator.
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _setOwner(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _setOwner(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _setOwner(newOwner);
    }

    function _setOwner(address newOwner) private {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

contract CraftTimeLock is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint256 amount; // How many staking tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        uint256 rewardDebtAtTimestamp; // the last timestamp user stake
        uint256 lastWithdrawTimestamp; // the last timestamp user withdrew at.
        uint256 firstDepositTimestamp; // the first timestamp user deposited at.
        uint256 lastDepositTimestamp; // the last timestamp user deposited at.
    }

    struct PoolInfo {
        IERC20 token; // Address of staking token contract.
        uint256 supply; // supply for this pool
        uint256 allocPoint; // How many allocation points assigned to this pool.
        uint256 lastRewardTimestamp; // Last timestamp that tokens distribution occurs.
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

    // Reward token per second, can be adjusted by the owner
    uint256 public tokenPerSecond = 0;

    // Reward bonus multipliers, can be adjusted by the owner
    uint256 public bonusMultiplier = 1;

    // The timestamp when rewards starts.
    uint256 public startTimestamp;

    // The timestamp when rewards ends
    uint256 public endTimestamp;

    // Pools array
    PoolInfo[] public poolInfo;

    // Users mapping, poolId => userAddress => UserInfo
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;

    // Array with fee amount (in basis points) for given stage
    uint256[] public feeStage;

    // Array with timestamp deltas, used to calculate fee stage,
    uint256[] public timestampDeltaFeeStage;

    event CreatePool(address indexed stakingToken, address indexed rewardToken, uint256 indexed allocation);
    event UpdatePoolAllocation(uint256 indexed pid, uint256 indexed allocation);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        IERC20 _rewardToken,
        IERC20 _stakingToken,
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        uint256 _allocation,
        address _feeRecipient,
        uint256[] memory _feeStage,
        uint256[] memory _timestampDeltaFeeStage
    ) {
        rewardToken = _rewardToken;
        feeRecipient = _feeRecipient;
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
        feeStage = _feeStage;
        timestampDeltaFeeStage = _timestampDeltaFeeStage;

        poolInfo.push(
            PoolInfo({
                token: _stakingToken,
                supply: 0,
                allocPoint: 1,
                lastRewardTimestamp: _startTimestamp,
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

        if (block.timestamp <= pool.lastRewardTimestamp || pool.lastRewardTimestamp >= endTimestamp) {
            return;
        }

        if (pool.supply <= 0) {
            pool.lastRewardTimestamp = block.timestamp;
            return;
        }

        uint256 toTimestamp = block.timestamp > endTimestamp ? endTimestamp : block.timestamp;

        uint256 multiplier = getMultiplier(pool.lastRewardTimestamp, toTimestamp);
        uint256 reward = multiplier.mul(tokenPerSecond).mul(pool.allocPoint).div(totalAllocPoint);

        if (pool.totalReward.add(reward) >= pool.totalAllocation) {
            reward = pool.totalAllocation.sub(pool.totalReward);
        }

        pool.accTokenPerShare = pool.accTokenPerShare.add(reward.mul(1e12).div(pool.supply));
        pool.lastRewardTimestamp = toTimestamp;
        pool.totalReward = pool.totalReward.add(reward);
    }

    /**
     * @dev Deposit tokens to DuelStaking for reward token allocation.
     */
    function deposit(uint256 _pid, uint256 _amount) external {
        require(block.timestamp < endTimestamp, "DuelStaking: Deposit deadline");

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

        if (user.firstDepositTimestamp == 0) {
            user.firstDepositTimestamp = block.timestamp;
        }
        user.lastDepositTimestamp = block.timestamp;

        pool.supply = pool.supply.add(_amount);

        pool.token.safeTransferFrom(address(msg.sender), address(this), _amount);

        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev Withdraw LP tokens from DuelStaking.
     */
    function withdraw(uint256 _pid, uint256 _amount) external {
        require(block.timestamp >= endTimestamp, "Withdraw is not allowed yet");

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
            user.lastWithdrawTimestamp = block.timestamp;

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

        if (block.timestamp < startTimestamp) {
            return 0;
        }

        uint256 accTokenPerShare = pool.accTokenPerShare;
        if (block.timestamp > pool.lastRewardTimestamp && pool.supply != 0) {
            uint256 toTimestamp = block.timestamp > endTimestamp ? endTimestamp : block.timestamp;
            uint256 multiplier = getMultiplier(pool.lastRewardTimestamp, toTimestamp);
            uint256 reward = multiplier.mul(tokenPerSecond).mul(pool.allocPoint).div(totalAllocPoint);
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
     * @dev Updates reward per second, only owner.
     */
    function setTokenPerSecond(uint256 _amount) external onlyOwner {
        require(_amount <= 30 ether, "DuelStaking: Max 30 tokens per second");
//        require(_amount >= .0001 ether, "DuelStaking: Min .0001 token per second");
        tokenPerSecond = _amount;
    }

    /**
     * @dev Updates start timestamp, only owner.
     */
    function setStartTimestamp(uint256 _timestamp) external onlyOwner {
        require(startTimestamp > block.timestamp, "DuelStaking: Farming has been started");
        require(_timestamp < endTimestamp, "DuelStaking: Start timestamp should be less then endTimestamp");

        startTimestamp = _timestamp;
        poolInfo[0].lastRewardTimestamp = startTimestamp;
    }

    /**
     * @dev Updates end timestamp, only owner.
     */
    function setEndTimestamp(uint256 _timestamp) external onlyOwner {
        require(endTimestamp > block.timestamp, "DuelStaking: Farming has been finished");
        require(_timestamp > startTimestamp, "DuelStaking: End timestamp should be greater then startTimestamp");

        endTimestamp = _timestamp;
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
     * @dev Updates timestamp delta fee stage array, only owner.
     * i.e. [0,3600,7200,10800,14400] for BSC 3600 sec = 1 hour
     * must be length of 5
     */
    function setTimestampDeltaFeeStage(uint256[] memory _timestampDeltas) external onlyOwner {
        require(_timestampDeltas.length == timestampDeltaFeeStage.length, "DuelStaking: TimestampDeltaFeeStage array mismatch");
        timestampDeltaFeeStage = _timestampDeltas;
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
        uint256 userTimestampDelta = getUserDelta(_pid, _user);

        uint256 fee;

        if (userTimestampDelta == 0 || userTimestampDelta <= timestampDeltaFeeStage[0]) {
            //25% fee for withdrawals in the same timestamp to prevent abuse from flashloans
            fee = feeStage[0];
        } else if (userTimestampDelta > timestampDeltaFeeStage[0] && userTimestampDelta <= timestampDeltaFeeStage[1]) {
            fee = feeStage[1];
        } else if (userTimestampDelta > timestampDeltaFeeStage[1] && userTimestampDelta <= timestampDeltaFeeStage[2]) {
            fee = feeStage[2];
        } else if (userTimestampDelta > timestampDeltaFeeStage[2] && userTimestampDelta <= timestampDeltaFeeStage[3]) {
            fee = feeStage[3];
        } else if (userTimestampDelta > timestampDeltaFeeStage[3] && userTimestampDelta <= timestampDeltaFeeStage[4]) {
            fee = feeStage[4];
        }

        return fee;
    }

    /**
     * @dev Get user timestamp delta from last deposit timestamp to current timestamp.
     */
    function getUserDelta(uint256 _pid, address _user) internal view returns (uint256) {
        UserInfo storage user = userInfo[_pid][_user];
        if (user.lastWithdrawTimestamp > 0) {
            uint256 estDelta = block.timestamp.sub(user.lastWithdrawTimestamp);
            return estDelta;
        } else {
            uint256 estDelta = block.timestamp.sub(user.firstDepositTimestamp);
            return estDelta;
        }
    }
}
