class Transaction {
    private id: number;
    private timestamp: number; // execute at for scheduled txs.
    private target: number;
    private amount: number;
    private type: 'deposit' | 'withdrawal' | 'transfer';

    constructor(target: number, amount: number) {
        this.target = target;
        this.amount = amount;
    }
}

class Account {
    private id: number;
    private balance: number;
    // private transactionHistory: 

    constructor() {

    }
}
class Bank {
    private accounts: Map<number, Account>;

    constructor() {
        this.accounts;
    }

    deposit(target: number, amount: number): boolean {
        return false;
    }

    transfer(from: number, to: number, amount: number): boolean {
        return false;
    }
    
    withdraw(from: number, amount: number): boolean {
        return false;
    }

    topVolumeAccounts(k: number) {

    }

    mergeAccounts(account1: Account, account2: Account) {

    }

}