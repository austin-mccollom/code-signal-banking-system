Instructions
Your task is to implement a simplified version of a banking system. All operations that should be supported are listed below.
RULES
Solving this task consists of several levels. Subsequent levels are opened when the current level is correctly solved. You always have access to the dafa for the current and all previous levels.
You can execute a single test case by running the following command in the terminal: bash run_single_test.sh "<test_case_name>".
INFO
Requirements
Your task is to implement a simplified version of a banking system. Plan your design according to the level specifications below:
SETTINGS
• Level 1: The banking system should support creating new accounts, depositing money into accounts, and transferring money between two accounts.
• Level 2: The banking system should support ranking accounts based on the total value of outgoing transactions.
• Level 3: The banking system should allow scheduling payments and checking the status of scheduled payments.
• Level 4: The banking system should support merging two accounts while retaining both accounts' balance and transaction histories.
To move to the next level, you should pass all the tests at the current level.
Note
All operations will have a timestamp parameter - a stringified timestamp in milliseconds. It is guaranteed that all timestamps are unique and are in a range from 1 to 10% Operations will Be iven y
F
→
order of strictly increasing timestamps.

Level 3
DESC
The system should allow scheduling payments and checking the status of scheduled payments.
HISTORY
• SchedulePayment (tinestamp int, accountid string, amount int, delay int) *string - Should schedule a payment which will be performed at timestamp + delay. Returns a string with al unique identifier for the scheduled payment in the following format: "payment[ordinal number of the scheduled payment across all accounts]" - e.g.,
"paymentl", "payment2", etc. If
accountid doesn't exist, should return nil. The payment is skipped if the specified account has insufficient funds when the payment is performed. Additional conditions:
RULES
• Successful payments should be considered outgoing transactions and included when ranking accounts using the TopSpenders operation.
• Scheduled payments should be processed before any other transactions at the given timestamp.
• If an account needs to perform several scheduled payments simultaneously, they should be processed in order of creation - e.g., "paymentl" should be processed before "payment2"
INFO
SETTINGS
• CancelPayment (timestamp int, accountId string, paymentld string) bool - Should cancel the scheduled payment with paymentid. Returns true if the scheduled payment is successfully canceled. If paymentid does not exist or was already canceled, or if accountid is different from the source account for the scheduled payment, returns false. Note that scheduled payments must be performed before any CancelPayment operations at the given timestamp.


My attempt at instructions from memory:
Recreate the CodeSignal banking system test

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
