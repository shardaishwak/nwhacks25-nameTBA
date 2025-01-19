/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, Provider } from "ethers";
import { BetFactory } from "./typechain-types";
import chainConfig from "./index.json";

export default async function getBetFactoryContract(provider: Provider) {
	try {
		const betFactoryContract = new ethers.Contract(
			chainConfig.contracts.betfactory.address,
			chainConfig.contracts.betfactory.abi,
			provider
		) as unknown as BetFactory;

		return betFactoryContract;
	} catch (error: any) {
		console.error("Error getting the bet factory", error);
		throw new Error(`Failed to get the bet factory: ${error?.message}`);
	}
}
