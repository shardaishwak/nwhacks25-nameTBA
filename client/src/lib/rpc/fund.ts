/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, BrowserProvider } from "ethers";
import getBetContract from "./getBetContract";

export default async function fund(
	id: number,
	amount: bigint,
	provider: BrowserProvider
) {
	try {
		const signer = await provider.getSigner();
		const betContract = await getBetContract(id, provider);

		const amountFormat = ethers.formatEther(amount);
		console.log(`Funding bet ${id} with ${amountFormat} ETH`);

		const tx = await betContract.connect(signer).fund({
			value: amount,
		});
		await tx.wait();

		console.log(`Bet ${id} funded with ${amountFormat} ETH`);

		return tx;
	} catch (error: any) {
		console.error("Error fund", error);
		throw new Error(`Failed to fund: ${error.message}`);
	}
}
