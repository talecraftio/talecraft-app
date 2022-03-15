// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "./GameBase.sol";

contract Game2 is GameBase {
    using SafeERC20 for IERC20;

    constructor(Resource resource, IERC20 phi, GameLending gameLending, uint256 joinPrice_, uint256 minWeight_, uint256 maxWeight_)
            GameBase(resource, phi, gameLending, joinPrice_, minWeight_, maxWeight_) {}

    function joinGame() external whenNotPaused {
        _joinGame(msg.sender, true);
    }

    function _afterGameEnd(GameInfo storage game_) internal override {
        if (game_.bank > 0) {
            if (game_.winner == address(0)) {
                _phi.safeTransfer(game_.player[0].addr, game_.bank / 2);
                _phi.safeTransfer(game_.player[1].addr, game_.bank / 2);
            } else {
                _phi.safeTransfer(game_.winner, game_.bank * (1e6 - fee) / 1e6);
            }
        }
    }
}
