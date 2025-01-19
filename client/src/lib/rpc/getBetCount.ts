/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from "ethers";

import getBetFactoryContract from "./getBetFactoryContract";

export default async function getBetCount(provider: Provider) {
	try {
		const betFactoryContract = await getBetFactoryContract(provider);
		const count = await betFactoryContract.betCount();

		return count;
	} catch (error: any) {
		console.error("Error getting all bet count", error);
		throw new Error(`Failed to get all bet count: ${error.message}`);
	}
}
