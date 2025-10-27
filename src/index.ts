/**
 * Code signal: banking system
 * 
 * Requirements
 * Your task is to implement a simplified version of a banking system.
 * 
 * Level 1: The banking system should support creating new accounts and depositing money into 
 * and withdrawing/paying money from accounts.
 * 
 * Level 2: The banking system should support ranking accounts based on the total value of transactions.
 * 
 * Level 3: The banking system should support scheduling transfers and checking the scheduled transfer status.
 * 
 * Level 4: The banking system should support merging two accounts while retaining the balances 
 * and transaction histories of the original accounts.
 * 
 * To move to the next level, you should pass all the tests at the current level.
 */

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

    constructor(id: number, balance: number) {
        // id assignment handled by Bank class
        this.id = id;
        this.balance = balance;
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
}
class Bank {
    private accounts: Map<number, Account>;
    private nextAccountId: number

    constructor() {
        this.accounts = new Map<number, Account>;
        this.nextAccountId = 1;
    }

    createAccount(balance: number) {
        const newAccount = new Account(nextAccountId, balance);
                this.accounts.set(nextAccountId, newAccount);
        nextAccountId++;
    }

    topVolumeAccounts(k: number) {

    }

    mergeAccounts(account1: Account, account2: Account) {

    }

}