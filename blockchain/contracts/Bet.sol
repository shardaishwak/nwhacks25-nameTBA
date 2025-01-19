// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Bet is Ownable {
    struct BetDetails {
        address payable player1;
        address payable player2;
        uint256 amount;
        bool resolved;
        bool started;
        uint256 startTime;
        bool player1Paid;
        bool player2Paid;
    }

    BetDetails public betDetails;

    error BetAlreadyResolved();
    error BetNotResolved();
    error InvalidUser();
    error InvalidAmount();
    error AlreadyPaid();
    error BetNotPaid();

    modifier onlyPlayer() {
        if (
            msg.sender != betDetails.player1 && msg.sender != betDetails.player2
        ) {
            revert InvalidUser();
        }
        _;
    }

    constructor(
        address initialOwner,
        address payable player1,
        address payable player2,
        uint256 amount,
        bool resolved
    ) Ownable(initialOwner) {
        betDetails = BetDetails(
            player1,
            player2,
            amount,
            resolved,
            false,
            0,
            false,
            false
        );
    }

    function resolveBet(uint256 health1, uint256 health2) external onlyPlayer {
        if (betDetails.resolved) {
            revert BetAlreadyResolved();
        }
        if (!betDetails.started) {
            revert BetNotResolved();
        }
        // who dies first loses
        if (health1 > 0 && health2 > 0) {
            revert BetNotResolved();
        } else {
            betDetails.resolved = true;
            // distrivute the money to the winner. Double the amount
            if (health1 == 0) {
                betDetails.player2.transfer(betDetails.amount * 2);
            } else {
                betDetails.player1.transfer(betDetails.amount * 2);
            }
        }
    }

    function startBet() external onlyPlayer {
        // first need to check if the players have paid the amount
        if (betDetails.player1Paid && betDetails.player2Paid) {
            betDetails.started = true;
            betDetails.startTime = block.timestamp;
        } else {
            revert BetNotPaid();
        }
    }

    function getBetDetails() external view returns (BetDetails memory) {
        return betDetails;
    }

    function fund() external payable {
        if (msg.value != betDetails.amount) {
            revert InvalidAmount();
        }
        if (
            msg.sender != betDetails.player1 && msg.sender != betDetails.player2
        ) {
            revert InvalidUser();
        }
        if (msg.sender == betDetails.player1 && betDetails.player1Paid) {
            revert AlreadyPaid();
        }
        if (msg.sender == betDetails.player2 && betDetails.player2Paid) {
            revert AlreadyPaid();
        }

        // end
        if (msg.sender == betDetails.player1) {
            betDetails.player1Paid = true;
        } else if (msg.sender == betDetails.player2) {
            betDetails.player2Paid = true;
        }
    }
}
