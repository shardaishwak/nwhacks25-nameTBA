// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Bet.sol";

contract BetFactory is Ownable {
    uint256 public betCount;

    mapping(uint256 => Bet) public bets;

    constructor(address initialOwner) Ownable(initialOwner) {
        betCount = 0;
    }

    function deployBet(
        address payable player1,
        address payable player2,
        uint256 amount,
        bool resolved
    ) external {
        Bet newBet = new Bet(address(this), player1, player2, amount, resolved);
        bets[betCount] = newBet;
        betCount++;
    }

    function getBet(uint256 index) external view returns (Bet) {
        return bets[index];
    }
}
