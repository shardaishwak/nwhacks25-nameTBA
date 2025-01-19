import deployBet from "./deployBet";
import fund from "./fund";
import getAddress from "./getAddress";
import getBalance from "./getBalance";
import getBet from "./getBet";
import getBetContract from "./getBetContract";
import getBetCount from "./getBetCount";
import getBetFactoryContract from "./getBetFactoryContract";
import resolveBet from "./resolveBet";
import startBet from "./startBet";

export default class RPC {
	wallet = {
		getAddress,
		getBalance,
	};
	betFactory = {
		getBetCount,
		deployBet,
		getBetFactoryContract,
	};
	bet = {
		fund,
		getBet,
		startBet,
		resolveBet,
		getBetContract,
	};
}

export const rpc = new RPC();
