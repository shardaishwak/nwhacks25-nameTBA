/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from "ethers";
import getBetContract from "./getBetContract";
import { Bet } from "./typechain-types";

function betToStruct(bet: Bet.BetDetailsStructOutput): Bet.BetDetailsStruct {
	return {
		player1: bet[0],
		player2: bet[1],
		amount: BigInt(bet[2]),
		resolved: bet[3],
		started: bet[4],
		startTime: BigInt(bet[5]),
		player1Paid: bet[6],
		player2Paid: bet[7],
	};
}

export default async function getBet(id: number, provider: Provider) {
	try {
		const betContract = await getBetContract(id, provider);
		const details = await betContract.betDetails();

		if (!details) {
			throw new Error("Failed to get bet details");
		}

		return betToStruct(details);
	} catch (error: any) {
		console.error("Error getting a bet", error);
		throw new Error(`Failed to get a bet: ${error.message}`);
	}
}
