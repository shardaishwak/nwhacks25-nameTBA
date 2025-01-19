/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserProvider } from "ethers";
import getBetContract from "./getBetContract";

export default async function resolveBet(
	id: number,
	health1: number,
	health2: number,
	provider: BrowserProvider
) {
	try {
		const signer = await provider.getSigner();

		const betContract = await getBetContract(id, provider);
		const tx = await betContract.connect(signer).resolveBet(health1, health2);
		await tx.wait();

		console.log(`Bet ${id} resolved`);
		return null;
	} catch (error: any) {
		console.error("Error resolving a bet", error);
		throw new Error(`Failed to resolve a bet: ${error.message}`);
	}
}
