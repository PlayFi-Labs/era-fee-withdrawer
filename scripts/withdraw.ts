import { ethers } from "ethers";
import * as zkweb3 from "zksync-web3";

import * as dotenv from 'dotenv';

dotenv.config();

const FEE_ACCOUNT_PRIVATE_KEY = process.env.MISC_FEE_ACCOUNT_PRIVATE_KEY;
const L1_FEE_DISTRIBUTOR_PRIVATE_KEY = process.env.MISC_L1_FEE_DISTRIBUTOR_PRIVATE_KEY;
const L1_WEB3_API_URL = process.env.L1_RPC_ADDRESS;
const ZKSYNC_WEB3_API_URL = process.env.ZKSYNC_WEB3_API_URL;

// fill in withdrawal hash here
const WITHDRAWAL_HASH = "";

(async () => {
    const ethProvider = new ethers.providers.JsonRpcProvider(L1_WEB3_API_URL);
    const zksyncProvider = new zkweb3.Provider(ZKSYNC_WEB3_API_URL);
    const zkWallet = !L1_FEE_DISTRIBUTOR_PRIVATE_KEY ? new zkweb3.Wallet(FEE_ACCOUNT_PRIVATE_KEY, zksyncProvider,ethProvider) : new zkweb3.Wallet(L1_FEE_DISTRIBUTOR_PRIVATE_KEY, zksyncProvider, ethProvider);
    const finalizeWithdrawTx = await zkWallet.finalizeWithdrawal(WITHDRAWAL_HASH,undefined, {gasPrice: 1000000000});
    const receipt = await finalizeWithdrawTx.wait();
    console.log(`Withdrawal L2 tx has been verified on L1, tx hash: ${receipt.transactionHash}`);
})();