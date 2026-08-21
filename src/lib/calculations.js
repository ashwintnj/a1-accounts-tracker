import { toNumber } from './format';

const sum = (numbers) => numbers.reduce((acc, item) => acc + toNumber(item), 0);

export const calculateDaily = (record) => {
    const banks = record.banks || [];
    const openingTotal = sum(banks.map((bank) => bank.opening));
    const closingTotal = sum(banks.map((bank) => bank.closing));
    const overallBalanceX = openingTotal - closingTotal;

    const moneySentA = toNumber(record.moneySentA);
    const rechargeAddGr = toNumber(record.rechargeAddGr);
    const rechargeAddEg = toNumber(record.rechargeAddEg);
    const totalRechargeAddB = rechargeAddGr + rechargeAddEg;
    const totalDebitedC = moneySentA + totalRechargeAddB;

    const receivedEntries = record.moneyReceivedEntries || [];
    const receivedEntriesTotal = sum(receivedEntries.map((entry) => entry.amount));
    const oldAeps = toNumber(record.oldAeps);
    const totalMoneyReceivedD = receivedEntriesTotal + oldAeps;

    const tallyLeft = overallBalanceX + totalMoneyReceivedD;
    const tallyDifference = tallyLeft - totalDebitedC;
    const tallyMatched = Math.abs(tallyDifference) < 0.01;

    const rechargeDoneGr = toNumber(record.rechargeDoneGr);
    const rechargeDoneEg = toNumber(record.rechargeDoneEg);
    const totalRechargesE = rechargeDoneGr + rechargeDoneEg;

    const gpayBusiness = toNumber(record.gpayBusiness);
    const aeps = toNumber(record.aeps);
    const moneyBeforeScreenshot = toNumber(record.moneyBeforeScreenshot);
    const extraReceivedF = gpayBusiness + aeps + moneyBeforeScreenshot;

    const dTotal = totalMoneyReceivedD + extraReceivedF - oldAeps;
    const debitRealG = moneySentA + totalRechargesE;
    const finalAmount = debitRealG - dTotal;

    return {
        openingTotal,
        closingTotal,
        overallBalanceX,
        totalRechargeAddB,
        totalDebitedC,
        receivedEntriesTotal,
        oldAeps,
        totalMoneyReceivedD,
        tallyLeft,
        tallyDifference,
        tallyMatched,
        totalRechargesE,
        extraReceivedF,
        dTotal,
        debitRealG,
        finalAmount
    };
};

export const getFinalDirectionText = (value) => {
    if (value > 0) {
        return 'Take this cash OUT from shop to yellow box';
    }
    if (value < 0) {
        return 'Pay this cash INTO shop from yellow box';
    }
    return 'No cash movement needed';
};
