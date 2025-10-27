Recreate the CodeSignal banking system unit tests

There are the classes Account and Transaction. Transactions have a timestamp, recipient account, and amount. The interviewee will need to implement these classes plus a transaction history. 

The test has 4 phases.
Phase 1:
the interviewee must implement the following methods in the Bank class, which requires implementing the Account and Transaction classes:
deposit()
transfer()
withdraw()

Transactions have a timestamp, recipient account, and amount. Account has an accountId, balance, and transaction history at minimum. The interviewee will need to implement these classes.

Phase 2
implement topTransactingAccounts(k: number) method which returns an array of account IDs of the the k highest transaction volumn accounts.

Phase 3
add cashback to withdraws, but the cashback doesn't hit the account until the scheduled time, so interviewee will also need to implement scheduled transactions

Phase 4
implement mergeAccounts(account1: number, account2: number) method that creates a new Account that has the combined balance of the the input accounts, plus a merged transactions history and scheduled transactions
