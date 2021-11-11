// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "./TokenVesting.sol";
import "./TokenTimelock.sol";
import "../OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenVestingFactory {
    using SafeERC20 for IERC20;

    address public defaultOwner;
    uint256 public constant DEFAULT_CLIFF = 365 days;
    uint256 public constant DEFAULT_DURATION = 4 * 365 days;
    bool public constant DEFAULT_REVOCABLE = true;

    event DeployedVestingContract(address indexed vesting, address indexed beneficiary, address indexed owner);
    event DeployedTimelockContract(address indexed timelock, address indexed beneficiary, uint256 releaseTime);

    mapping (address => TokenVesting[]) internal _vestingContracts;
    mapping (address => TokenTimelock[]) internal _timelockContracts;

    constructor(address _defaultOwner) {
        defaultOwner = _defaultOwner;
    }

    function deployDefaultVestingContract(
        address _beneficiary,
        uint256 _start
    ) public returns (TokenVesting) {
        return deployVestingContract(defaultOwner, _beneficiary, _start, DEFAULT_CLIFF, DEFAULT_DURATION, DEFAULT_REVOCABLE);
    }

    function deployDefaultVestingContractAndDepositTokens(
        address _beneficiary,
        uint256 _start,
        IERC20 _token,
        uint256 amount
    ) public returns (TokenVesting) {
        TokenVesting c = deployDefaultVestingContract(_beneficiary, _start);
        _token.transferFrom(msg.sender, address(c), amount);
        return c;
    }

    function deployVestingContract(
        address _owner,
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration,
        bool _revocable
    ) public returns (TokenVesting) {
        TokenVesting vesting = new TokenVesting();

        vesting.initialize(_beneficiary, _start, _cliff, _duration, _revocable);

        vesting.transferOwnership(_owner);

        emit DeployedVestingContract(address(vesting), _beneficiary, _owner);

        _vestingContracts[_beneficiary].push(vesting);

        return vesting;
    }

    function deployVestingContractAndDepositTokens(
        address _owner,
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration,
        bool _revocable,
        IERC20 _token,
        uint256 amount
    ) public returns (TokenVesting) {
        TokenVesting c = deployVestingContract(_owner, _beneficiary, _start, _cliff, _duration, _revocable);
        _token.transferFrom(msg.sender, address(c), amount);
        return c;
    }

    function deployMultipleVestingContractAndDepositTokens(
        address _owner,
        address[] calldata _beneficiaries,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration,
        bool _revocable,
        IERC20 _token,
        uint256 amountEach
    ) public {
        for (uint256 i=0; i < _beneficiaries.length; i++) {
            TokenVesting c = deployVestingContract(_owner, _beneficiaries[i], _start, _cliff, _duration, _revocable);
            _token.transferFrom(msg.sender, address(c), amountEach);
        }
    }

    function deployTimelockContract(
        address _beneficiary,
        address _owner,
        uint256 _releaseTime,
        bool _revocable
    ) public returns (TokenTimelock) {
        TokenTimelock timelock = new TokenTimelock();

        timelock.initialize(_beneficiary, _releaseTime, _revocable);

        timelock.transferOwnership(_owner);

        emit DeployedTimelockContract(address(timelock), _beneficiary, _releaseTime);

        _timelockContracts[_beneficiary].push(timelock);

        return timelock;
    }

    function deployTimelockContractAndDepositTokens(
        address _beneficiary,
        address _owner,
        uint256 _releaseTime,
        bool _revocable,
        IERC20 _token,
        uint256 amountEach
    ) public returns (TokenTimelock) {
        TokenTimelock c = deployTimelockContract(_beneficiary, _owner, _releaseTime, _revocable);
        _token.transferFrom(msg.sender, address(c), amountEach);
        return c;
    }

    function deployMultipleTimelockContractAndDepositTokens(
        address[] calldata _beneficiaries,
        address _owner,
        uint256 _releaseTime,
        bool _revocable,
        IERC20 _token,
        uint256 amount
    ) public {
        for (uint256 i=0; i < _beneficiaries.length; i++) {
            TokenTimelock c = deployTimelockContract(_beneficiaries[i], _owner, _releaseTime, _revocable);
            _token.transferFrom(msg.sender, address(c), amount);
        }
    }

    function vestingContracts(address _beneficiary) public view returns (TokenVesting[] memory) {
        return _vestingContracts[_beneficiary];
    }

    function timelockContracts(address _beneficiary) public view returns (TokenTimelock[] memory) {
        return _timelockContracts[_beneficiary];
    }
}
