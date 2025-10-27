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

const MILLISECONDS_IN_1_DAY = 86400000;
const FALSE = "false";
const TRUE = "true";

enum BalLogType {
  CREATE = "create",
  PAY = "pay",
  PAY_V2 = "pay_v2",
  DEPOSIT = "deposit",
  MERGE_T = "merge_target",
  MERGE_S = "merge_src"
}

class BalLog {
  ts: number;
  acct: Account;
  amount: number;
  typ: BalLogType;
  bal: number;

  constructor(ts: number, acct: Account, amount: number, typ: BalLogType, bal: number) {
    this.ts = ts;
    this.acct = acct;
    this.amount = amount;
    this.typ = typ;
    this.bal = bal;
  }
}

class Account {
  ts: number;
  acct_id: string;
  balance: number;
  activity: number; // both pay and deposit
  sent: number;
  log: BalLog[]; // sorted by ts
  private sortedByTs: boolean;

  constructor(ts: number, acct_id: string) {
    this.ts = ts;
    this.acct_id = acct_id;
    this.balance = 0;
    this.activity = 0;
    this.sent = 0;
    this.log = [];
    this.sortedByTs = true;
    this.log.push(new BalLog(ts, this, 0, BalLogType.CREATE, 0));
  }

  pay_v2(ts: number, amount: number): boolean {
    if (this.balance < amount) {
      return false;
    }
    this.balance -= amount;
    this.activity += amount;
    this.sent += amount;
    this.log.push(new BalLog(ts, this, amount, BalLogType.PAY_V2, this.balance));
    this.sortedByTs = false;
    return true;
  }

  pay(ts: number, amount: number): string {
    if (this.balance < amount) {
      return "";
    }
    this.balance -= amount;
    this.activity += amount;
    this.sent += amount;
    this.log.push(new BalLog(ts, this, amount, BalLogType.PAY, this.balance));
    this.sortedByTs = false;
    return `${this.balance}`;
  }

  deposit(ts: number, amount: number): string {
    this.balance += amount;
    this.activity += amount;
    this.log.push(new BalLog(ts, this, amount, BalLogType.DEPOSIT, this.balance));
    this.sortedByTs = false;
    return `${this.balance}`;
  }

  merge(ts: number, acct: Account): boolean {
    this.balance += acct.balance;
    this.activity += acct.activity;
    this.sent += acct.sent;
    this.log.push(...acct.log);
    this.sortedByTs = false;
    this.log.push(new BalLog(ts, this, acct.balance, BalLogType.MERGE_T, this.balance));
    return true;
  }

  get_balance(ts: number): number | null {
    if (!this.sortedByTs) {
      this.log.sort((a, b) => a.ts - b.ts);
      this.sortedByTs = true;
    }
    // Binary search for the rightmost element <= ts
    const id = bisectRight(this.log, ts, (log) => log.ts) - 1;
    if (id < 0) {
      return null; // before the account was created
    }
    return this.log[id].bal;
  }
}

class Payment {
  ts: number;
  acct: Account;
  payment_id: string;
  amount: number;
  ready: number; // ts+delay

  constructor(ts: number, acct: Account, payment_id: string, amount: number, ready: number = 0) {
    this.ts = ts;
    this.acct = acct;
    this.payment_id = payment_id;
    this.amount = amount;
    this.ready = ready;
  }
}

class Transfer {
  ts: number;
  src: Account;
  target: Account;
  amount: number;

  constructor(ts: number, src: Account, target: Account, amount: number) {
    this.ts = ts;
    this.src = src;
    this.target = target;
    this.amount = amount;
  }
}

class Bank {
  private accts: Map<string, Account>;
  private m_accts: Map<string, Account>; // accounts merged into another acct
  private xfer_id: number;
  private p_xfers: Map<number, Transfer>; // pending xfers
  private c_xfers: Map<number, Transfer>; // completed
  private payment_id: number;
  private payments: Map<string, Payment>; // queue of payments to process cashback
  private scheduled_payments: Map<string, Payment>; // v3, no cash back, schedule with delay
  private pending_payments: Payment[]; // sorted by (ready, payment_id)
  private c_payments: Map<string, Payment>; // payment_id -> payment, completed payments
  private merges: Map<Account, Account>; // src -> target

  constructor() {
    this.accts = new Map();
    this.m_accts = new Map();
    this.xfer_id = 1;
    this.p_xfers = new Map();
    this.c_xfers = new Map();
    this.payment_id = 0;
    this.payments = new Map();
    this.scheduled_payments = new Map();
    this.pending_payments = [];
    this.c_payments = new Map();
    this.merges = new Map();
  }

  create_acct(ts: string, acct_id: string): string {
    if (this.accts.has(acct_id)) {
      return FALSE;
    }
    this.accts.set(acct_id, new Account(parseInt(ts), acct_id));
    return TRUE;
  }

  deposit(ts: string, acct_id: string, amount: string): string {
    const account = this.accts.get(acct_id);
    if (!account) {
      return "";
    }
    return account.deposit(parseInt(ts), parseInt(amount));
  }

  pay_v2(ts: number, account_id: string, amount: number): string | null {
    const account = this.accts.get(account_id);
    if (!account) {
      return null;
    }
    const can_pay = account.pay_v2(ts, amount);
    if (!can_pay) {
      return null;
    }
    this.payment_id += 1;
    const p_id_int = this.payment_id;
    const res = `payment${p_id_int}`;
    this.payments.set(res, new Payment(ts, account, res, amount));
    return res;
  }

  get_payment_status(ts: number, acct_id: string, payment_id: string): string | null {
    const account = this.accts.get(acct_id);
    if (!account) {
      return null;
    }
    const c_payment = this.c_payments.get(payment_id);
    if (c_payment && acct_id === c_payment.acct.acct_id) {
      return "CASHBACK_RECEIVED";
    }
    const p_payment = this.payments.get(payment_id);
    if (p_payment && p_payment.acct.acct_id === acct_id) {
      return "IN_PROGRESS";
    }
    return null;
  }

  pay(ts: string, acct_id: string, amount: string): string {
    const account = this.accts.get(acct_id);
    if (!account) {
      return "";
    }
    return account.pay(parseInt(ts), parseInt(amount));
  }

  top(ts: string, n: string): string {
    const accts = Array.from(this.accts.values());
    accts.sort((a, b) => b.activity - a.activity);
    return accts.slice(0, parseInt(n)).map(a => `${a.acct_id}(${a.activity})`).join(", ");
  }

  top_senders(ts: string, n: string): string {
    const accts = Array.from(this.accts.values());
    accts.sort((a, b) => b.sent - a.sent);
    return accts.slice(0, parseInt(n)).map(a => `${a.acct_id}(${a.sent})`).join(", ");
  }

  xfer_v2(ts: number, src_acct_id: string, target_acct_id: string, amount: number): number | null {
    if (src_acct_id === target_acct_id || !this.accts.has(src_acct_id) || !this.accts.has(target_acct_id)) {
      return null;
    }
    const src = this.accts.get(src_acct_id)!;
    if (src.balance < amount) {
      return null;
    }
    const target = this.accts.get(target_acct_id)!;
    src.pay_v2(ts, amount);
    target.deposit(ts, amount);
    return src.balance;
  }

  xfer(ts: string, src_acct_id: string, target_acct_id: string, amount: string): string {
    if (src_acct_id === target_acct_id || !this.accts.has(src_acct_id)) {
      return "";
    }
    const src = this.accts.get(src_acct_id)!;
    if (!this.accts.has(target_acct_id)) {
      return "";
    }
    const transfer = new Transfer(
      parseInt(ts),
      this.accts.get(src_acct_id)!,
      this.accts.get(target_acct_id)!,
      parseInt(amount)
    );
    if (src.balance < transfer.amount) {
      return "";
    }
    const xfer_id_str = `transfer${this.xfer_id}`;
    this.p_xfers.set(this.xfer_id, transfer);
    this.xfer_id += 1;
    return xfer_id_str;
  }

  ac_xfer(ts: string, acct_id: string, xfer_id: string): string {
    const xfer_id_num = parseInt(xfer_id.substring("transfer".length));
    const ts_num = parseInt(ts);
    const xfer = this.p_xfers.get(xfer_id_num);
    if (!xfer) {
      return FALSE;
    }
    if (xfer.target.acct_id !== acct_id) {
      return FALSE;
    }
    if (ts_num - xfer.ts > MILLISECONDS_IN_1_DAY) {
      this.p_xfers.delete(xfer_id_num);
      return FALSE;
    }
    xfer.src.pay(ts_num, xfer.amount);
    xfer.target.deposit(ts_num, xfer.amount);
    this.c_xfers.set(xfer_id_num, xfer);
    this.p_xfers.delete(xfer_id_num);
    return TRUE;
  }

  cash_back(ts: string): void {
    const ts_num = parseInt(ts);
    const pays = Array.from(this.payments.values());
    pays.sort((a, b) => a.ts - b.ts);
    
    let i = 0;
    while (i < pays.length && pays[i].ts + MILLISECONDS_IN_1_DAY <= ts_num) {
      const p = pays[i];
      this.deposit(ts, p.acct.acct_id, String(Math.floor(p.amount * 0.02)));
      this.c_payments.set(p.payment_id, p);
      this.payments.delete(p.payment_id);
      i++;
    }
  }

  // SCHEDULE_PAYMENT <timestamp> <accountId> <amount> <delay>
  schedule_payment(timestamp: number, acct_id: string, amount: number, delay: number): string | null {
    const account = this.accts.get(acct_id);
    if (!account) {
      return null;
    }
    this.payment_id += 1;
    const payment_id_str = `payment${this.payment_id}`;
    const p = new Payment(timestamp, account, payment_id_str, amount, timestamp + delay);
    this.scheduled_payments.set(payment_id_str, p);
    this.pending_payments.push(p);
    this.pending_payments.sort((a, b) => {
      if (a.ready !== b.ready) return a.ready - b.ready;
      return a.payment_id.localeCompare(b.payment_id);
    });
    return payment_id_str;
  }

  // CANCEL_PAYMENT <timestamp> <accountId> <paymentId>
  cancel_payment(timestamp: number, acct_id: string, paymentId: string): boolean {
    const account = this.accts.get(acct_id);
    const c_payment = this.c_payments.get(paymentId);
    const s_payment = this.scheduled_payments.get(paymentId);
    
    if (!account || c_payment || !s_payment) {
      return false;
    }
    if (s_payment.acct.acct_id !== acct_id) {
      return false;
    }
    this.c_payments.set(paymentId, s_payment);
    this.pending_payments = this.pending_payments.filter(p => p.payment_id !== paymentId);
    this.scheduled_payments.delete(paymentId);
    return true;
  }

  process_payment(timestamp: number): void {
    const ts_num = parseInt(String(timestamp));
    const toProcess: Payment[] = [];
    const skipped: Payment[] = [];
    
    // Find all payments ready to process
    for (const p of this.pending_payments) {
      if (p.ready <= ts_num) {
        toProcess.push(p);
      } else {
        break;
      }
    }
    
    // Sort by payment_id for consistent processing order
    toProcess.sort((a, b) => a.payment_id.localeCompare(b.payment_id));
    
    // Process each payment
    for (const p of toProcess) {
      const index = this.pending_payments.indexOf(p);
      if (index !== -1) {
        this.pending_payments.splice(index, 1);
      }
      
      if (!p.acct.pay_v2(ts_num, p.amount)) {
        skipped.push(p);
        continue;
      }
      this.scheduled_payments.delete(p.payment_id);
      this.c_payments.set(p.payment_id, p);
    }
    
    // Re-add skipped payments
    this.pending_payments.push(...skipped);
    this.pending_payments.sort((a, b) => {
      if (a.ready !== b.ready) return a.ready - b.ready;
      return a.payment_id.localeCompare(b.payment_id);
    });
  }

  merge_accounts(ts: number, acct_id1: string, acct_id2: string): boolean {
    const acct2 = this.accts.get(acct_id2);
    const acct1 = this.accts.get(acct_id1);
    
    if (!acct2 || !acct1 || acct_id1 === acct_id2) {
      return false;
    }
    
    const src = acct2;
    const target = acct1;
    this.accts.delete(acct_id2);
    this.merges.set(src, target);
    this.m_accts.set(acct_id2, src);
    src.log.push(new BalLog(ts, src, -src.balance, BalLogType.MERGE_S, 0));
    
    // Update payments to point to merged account
    for (const p of this.payments.values()) {
      if (p.acct.acct_id === acct_id2) {
        p.acct = target;
      }
    }
    
    // Handle pending transfers
    const pendingTransfers = Array.from(this.p_xfers.entries());
    for (const [xfer_id, xfer] of pendingTransfers) {
      if (xfer.src.acct_id === acct_id2) {
        if (xfer.target.acct_id === acct_id1) {
          // Target is the account to merge into, cancel the transfer
          this.p_xfers.delete(xfer_id);
        } else {
          // Update transfer to start from the new merged account
          xfer.src = target;
        }
      }
    }
    
    return target.merge(ts, src);
  }

  get_balance(ts: number, account_id: string, time_at: number): number | null {
    if (this.m_accts.has(account_id)) {
      const acct = this.m_accts.get(account_id)!;
      if (!acct.log.length) {
        return null;
      }
      acct.log.sort((a, b) => a.ts - b.ts);
      if (time_at > acct.log[acct.log.length - 1].ts || time_at < acct.log[0].ts) {
        return null;
      }
      const merge_target = this.merges.get(acct);
      if (!merge_target) {
        return null;
      }
      return this.get_balance(ts, merge_target.acct_id, time_at);
    }
    if (this.accts.has(account_id)) {
      return this.accts.get(account_id)!.get_balance(time_at);
    }
    return null;
  }
}

/**
 * Helper function: Binary search for the rightmost element <= value
 */
function bisectRight<T>(arr: T[], value: number, keyFn: (item: T) => number): number {
  let left = 0;
  let right = arr.length;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (keyFn(arr[mid]) <= value) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  return left;
}

/**
 * Main solution function that processes queries
 */
export function solution(queries: string[][]): string[] {
  const bank = new Bank();
  const res: string[] = [];
  
  for (const q of queries) {
    bank.cash_back(q[1]);
    bank.process_payment(parseInt(q[1]));
    
    switch (q[0]) {
      case "CREATE_ACCOUNT":
        res.push(bank.create_acct(q[1], q[2]));
        break;
      case "DEPOSIT":
        res.push(bank.deposit(q[1], q[2], q[3]));
        break;
      case "PAY":
        res.push(bank.pay(q[1], q[2], q[3]));
        break;
      case "PAY_V2":
        res.push(bank.pay_v2(parseInt(q[1]), q[2], parseInt(q[3])) || "");
        break;
      case "SCHEDULE_PAYMENT":
        res.push(bank.schedule_payment(parseInt(q[1]), q[2], parseInt(q[3]), parseInt(q[4])) || "");
        break;
      case "CANCEL_PAYMENT":
        res.push(bank.cancel_payment(parseInt(q[1]), q[2], q[3]) ? TRUE : FALSE);
        break;
      case "GET_PAYMENT_STATUS":
        res.push(bank.get_payment_status(parseInt(q[1]), q[2], q[3]) || "");
        break;
      case "TOP_ACTIVITY":
        res.push(bank.top(q[1], q[2]));
        break;
      case "TOP_SPENDERS":
        res.push(bank.top_senders(q[1], q[2]));
        break;
      case "TRANSFER":
        res.push(bank.xfer(q[1], q[2], q[3], q[4]));
        break;
      case "TRANSFER_V2":
        res.push(String(bank.xfer_v2(parseInt(q[1]), q[2], q[3], parseInt(q[4])) || ""));
        break;
      case "ACCEPT_TRANSFER":
        res.push(bank.ac_xfer(q[1], q[2], q[3]));
        break;
      case "MERGE_ACCOUNTS":
        res.push(bank.merge_accounts(parseInt(q[1]), q[2], q[3]) ? TRUE : FALSE);
        break;
      case "GET_BALANCE":
        const balance = bank.get_balance(parseInt(q[1]), q[2], parseInt(q[3]));
        res.push(balance !== null ? String(balance) : "");
        break;
      default:
        res.push("unsupported");
    }
  }
  
  return res;
}
