/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, Provider } from "ethers";
import { Bet } from "./typechain-types";
import chainConfig from "./index.json";
import getBetFactoryContract from "./getBetFactoryContract";

export default async function getBetContract(id: number, provider: Provider) {
	try {
		const betFactoryContract = await getBetFactoryContract(provider);

		const betAddress = await betFactoryContract.getBet(id);

		const betContract = new ethers.Contract(
			betAddress,
			chainConfig.contracts.bet.abi,
			provider
		) as unknown as Bet;

		return betContract;
	} catch (error: any) {
		console.error("Error getting a bet contract", error);
		throw new Error(`Failed to get a bet contract: ${error.message}`);
	}
}
