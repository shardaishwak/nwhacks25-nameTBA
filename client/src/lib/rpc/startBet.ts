/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserProvider } from "ethers";
import getBetContract from "./getBetContract";

export default async function startBet(id: number, provider: BrowserProvider) {
	try {
		const signer = await provider.getSigner();

		const betContract = await getBetContract(id, provider);
		const tx = await betContract.connect(signer).startBet();
		await tx.wait();

		console.log(`Bet ${id} started`);
		return null;
	} catch (error: any) {
		console.error("Error starting a bet", error);
		throw new Error(`Failed to start a bet: ${error.message}`);
	}
}
