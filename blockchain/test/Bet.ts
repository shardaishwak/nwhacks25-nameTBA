import {
	time,
	loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { BetFactory } from "../typechain-types";

describe("Lock", function () {
	async function deployFactoryFixture() {
		const [owner, otherAccount] = await hre.ethers.getSigners();

		const BetFactory = await hre.ethers.getContractFactory("BetFactory");
		const betFactory = await BetFactory.deploy(owner.address);
		await betFactory.waitForDeployment();

		const transaction = await betFactory.deploymentTransaction();

		return { owner, otherAccount, betFactory };
	}

	async function deployBetFixture() {
		const { owner, otherAccount, betFactory } = await loadFixture(
			deployFactoryFixture
		);

		await betFactory.deployBet(owner.address, otherAccount.address, 100, false);
		const betAddress = await betFactory.bets(0);

		const bet = await hre.ethers.getContractAt("Bet", betAddress);

		console.log(betAddress);

		return { owner, otherAccount, betFactory, betAddress, bet };
	}

	describe("Deployment", function () {
		it("Should set the right owner", async function () {
			const { owner, otherAccount, betFactory } = await loadFixture(
				deployFactoryFixture
			);

			expect(await betFactory.owner()).to.equal(owner.address);
		});

		it("Should deploy a bet", async function () {
			const { owner, otherAccount, betFactory, betAddress, bet } =
				await loadFixture(deployBetFixture);
			expect(await bet.owner()).to.equal(await betFactory.getAddress());
			const betDetails = await bet.betDetails();
			// check that all the details are correct
			expect(betDetails[0]).to.equal(owner.address);
			expect(betDetails[1]).to.equal(otherAccount.address);
			expect(betDetails[2]).to.equal(100);
			expect(betDetails[3]).to.equal(false);
			expect(betDetails[4]).to.equal(false);
			expect(betDetails[5]).to.equal(0);
			expect(betDetails[6]).to.equal(false);
			expect(betDetails[7]).to.equal(false);
		});

		it("Should all the players to fund the bet", async function () {
			const { owner, otherAccount, betFactory, betAddress, bet } =
				await loadFixture(deployBetFixture);

			await bet.connect(owner).fund({ value: 100 });
			await bet.connect(otherAccount).fund({ value: 100 });

			expect(await hre.ethers.provider.getBalance(betAddress)).to.equal(200);
			let betDetails = await bet.betDetails();
			expect(betDetails[6]).to.equal(true);
			expect(betDetails[7]).to.equal(true);
			expect(betDetails[4]).to.equal(false);

			await bet.startBet();

			betDetails = await bet.betDetails();
			expect(betDetails[4]).to.equal(true);
		});
		it("Should not allow the user to start if they all have not funded", async function () {
			const { owner, otherAccount, betFactory, betAddress, bet } =
				await loadFixture(deployBetFixture);

			const BetContract = await hre.ethers.getContractFactory("Bet");

			await expect(bet.startBet()).to.be.revertedWithCustomError(
				BetContract,
				"BetNotPaid"
			);

			await bet.connect(owner).fund({ value: 100 });

			await expect(bet.startBet()).to.be.revertedWithCustomError(
				BetContract,
				"BetNotPaid"
			);

			const details = await bet.betDetails();
			expect(details[6]).to.equal(true);
			expect(details[7]).to.equal(false);
			expect(details[4]).to.equal(false);
		});
		it("Should not all the bet to not resolve if the bet has not started", async function () {
			const { owner, otherAccount, betFactory, betAddress, bet } =
				await loadFixture(deployBetFixture);

			const BetContract = await hre.ethers.getContractFactory("Bet");

			await expect(bet.resolveBet(0, 0)).to.be.revertedWithCustomError(
				BetContract,
				"BetNotResolved"
			);

			// paid the contract
			await bet.connect(owner).fund({ value: 100 });
			await bet.connect(otherAccount).fund({ value: 100 });

			// start bet
			await bet.startBet();
		});
		it("Should not allow resolution if the health score is greater than 0 for both players", async function () {
			const { owner, otherAccount, betFactory, betAddress, bet } =
				await loadFixture(deployBetFixture);

			const BetContract = await hre.ethers.getContractFactory("Bet");

			// paid the contract
			await bet.connect(owner).fund({ value: 100 });
			await bet.connect(otherAccount).fund({ value: 100 });

			// start bet
			await bet.startBet();

			await expect(bet.resolveBet(1, 1)).to.be.revertedWithCustomError(
				BetContract,
				"BetNotResolved"
			);
		});
		it("Should allow resolution if the health score is 0 for one player", async function () {
			const { owner, otherAccount, betFactory, betAddress, bet } =
				await loadFixture(deployBetFixture);

			const BetContract = await hre.ethers.getContractFactory("Bet");

			// paid the contract
			await bet.connect(owner).fund({ value: 100 });
			await bet.connect(otherAccount).fund({ value: 100 });

			// start bet
			await bet.startBet();

			await bet.resolveBet(0, 1);

			const details = await bet.betDetails();
			expect(details[3]).to.equal(true);

			// the winner should have the entire fees
			expect(await hre.ethers.provider.getBalance(betAddress)).to.equal(0);
			// other player should have around 10,000 + 100 eth
			expect(
				await hre.ethers.provider.getBalance(otherAccount.address)
			).to.be.gt(10100);
		});
	});
});
