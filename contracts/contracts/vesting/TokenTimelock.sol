// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "../OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";
import "../OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";
import "../OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/proxy/utils/Initializable.sol";

/**
 * @dev A token holder contract that will allow a beneficiary to extract the
 * tokens after a given release time.
 *
 * Useful for simple vesting schedules like "advisors get all of their tokens
 * after 1 year".
 */
contract TokenTimelock is Ownable, Initializable {
    using SafeERC20 for IERC20;

    // beneficiary of tokens after they are released
    address private _beneficiary;

    // beneficiary of tokens after they are released
    bool private _revocable;

    // timestamp when token release is enabled
    uint256 private _releaseTime;

    mapping(address => bool) public revoked;

    event Revoked(address token);

    function initialize(
        address beneficiary_,
        uint256 releaseTime_,
        bool revocable_
    ) external initializer {
        // solhint-disable-next-line not-rely-on-time
        require(releaseTime_ > block.timestamp, 'TokenTimelock: release time is before current time');
        _beneficiary = beneficiary_;
        _releaseTime = releaseTime_;
        _revocable = revocable_;
    }

    /**
     * @return the beneficiary of the tokens.
     */
    function beneficiary() public view virtual returns (address) {
        return _beneficiary;
    }

    /**
     * @return the time when the tokens are released.
     */
    function releaseTime() public view virtual returns (uint256) {
        return _releaseTime;
    }

    /**
     * @notice Transfers tokens held by timelock to beneficiary.
     */
    function release(IERC20 _token) public virtual {
        require(block.timestamp >= releaseTime() || revoked[address(_token)], 'TokenTimelock: current time is before release time');

        uint256 amount = _token.balanceOf(address(this));
        require(amount > 0, 'TokenTimelock: no tokens to release');

        _token.safeTransfer(beneficiary(), amount);
    }

    /**
     * @notice Allows the owner to revoke the timelock. Tokens already vested
     * @param _token ERC20 token which is being locked
     */
    function revoke(address _token) public onlyOwner {
        require(_revocable, 'Not revocable');
        require(!revoked[_token], 'Already revoked');

        revoked[_token] = true;

        emit Revoked(_token);
    }
}
