import { BigNumber, BigNumberish } from 'ethers';

export class AccountTransferAmounts {
    toOperatorAmount: BigNumber;
    toWithdrawalFinalizerAmount: BigNumber;
    toAccumulatorAmount: BigNumber;
    toTestnetPaymasterAmount: BigNumber;
}

export class TransferCalculator {
    constructor(
        public lowerBoundOperatorThreshold: BigNumber,
        public upperBoundOperatorThreshold: BigNumber,
        public lowerBoundWithdrawerThreshold: BigNumber,
        public upperBoundWithdrawerThreshold: BigNumber,
        public lowerBoundPaymasterThreshold: BigNumber,
        public upperBoundPaymasterThreshold: BigNumber,
        public ethTransferThreshold: BigNumber
    ) {}

    /// Calculate how much ETH we have to send to Operator, Withdraw Finalizer, Reserve Accumulator.
    /// Based on required thresholds and available eth.
    calculateTransferAmounts(
        allowedEth: BigNumber,
        operatorBalance: BigNumber,
        withdrawerBalance: BigNumber,
        paymasterL2Balance: BigNumber,
        isMainnet: boolean
    ): AccountTransferAmounts {
        let toOperatorAmount = BigNumber.from(0);
        let toWithdrawalFinalizerAmount = BigNumber.from(0);
        let toTestnetPaymasterAmount = BigNumber.from(0);

        // Sub threshold amount from the fee account. We have to have some Treshhold on fee account for paying L1 fees.
        allowedEth = allowedEth.sub(this.ethTransferThreshold);
        if (allowedEth.lt(0)) {
            allowedEth = BigNumber.from(0);
        }

        // 1st priority
        // Calculate the transfer amount for paymaster (only on testnets)
        if (!isMainnet && allowedEth.gt(0) && paymasterL2Balance.lt(this.lowerBoundPaymasterThreshold)) {
            let maxAmountNeeded = this.upperBoundPaymasterThreshold.sub(paymasterL2Balance);
            toTestnetPaymasterAmount = maxAmountNeeded.gt(allowedEth) ? allowedEth : maxAmountNeeded; // Min
            allowedEth = allowedEth.sub(toTestnetPaymasterAmount);
        }
        console.log(`Amount which main wallet can send to paymaster: ${allowedEth}`);

        // 2nd priority
        // Calculate the transfer amount for operator.
        if (allowedEth.gt(0) && operatorBalance.lt(this.lowerBoundOperatorThreshold)) {
            let maxAmountNeeded = this.upperBoundOperatorThreshold.sub(operatorBalance);
            toOperatorAmount = maxAmountNeeded.gt(allowedEth) ? allowedEth : maxAmountNeeded; // Min
            allowedEth = allowedEth.sub(toOperatorAmount);
        }
        console.log(`Amount which main wallet can send to operator: ${allowedEth}`);

        // 3rd priority
        // Calculate the transfer amount for withdrawer.
        if (allowedEth.gt(0) && withdrawerBalance.lt(this.lowerBoundWithdrawerThreshold)) {
            let maxAmountNeeded = this.upperBoundWithdrawerThreshold.sub(withdrawerBalance);
            toWithdrawalFinalizerAmount = maxAmountNeeded.gt(allowedEth) ? allowedEth : maxAmountNeeded; // Min
            allowedEth = allowedEth.sub(toWithdrawalFinalizerAmount);
        }
        console.log(`Amount which main wallet can send to withdrawer: ${allowedEth}`);

        return {
            toOperatorAmount,
            toWithdrawalFinalizerAmount,
            toTestnetPaymasterAmount,
            // The rest of amount we have to send to the reserve address.
            toAccumulatorAmount: allowedEth
        };
    }
}
