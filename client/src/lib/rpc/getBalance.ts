/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from "ethers";

export default async function getBalance(address: string, provider: Provider) {
	try {
		const balance = await provider.getBalance(address);
		return balance;
	} catch (error: any) {
		console.error("Error getting balance", error);
		throw new Error(`Failed to get balance: ${error.message}`);
	}
}
