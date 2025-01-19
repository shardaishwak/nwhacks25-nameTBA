import { BrowserProvider } from "ethers";

export default async function getAddress(provider: BrowserProvider) {
	const signer = await provider.getSigner();
	const address = await signer.getAddress();

	return address;
}
