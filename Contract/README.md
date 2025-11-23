# CallerID Contract

A modular Sui Move contract for storing contacts, staking, and spam reporting.

## Module Structure

### 1. `contacts.move` - Contact Management
**Purpose**: Store, query, and manage contact records.

**Key Features**:
- Add up to 1000 contacts in one transaction
- Query contacts by phone hash (searches all transactions)
- Update name and spam_type (anyone can update)

**Main Functions**:
- `init()` - Initialize shared ContactBook
- `add_contacts()` - Add up to 1000 contacts
- `get_contact()` - Query single contact by phone hash
- `get_contacts()` - Batch query multiple contacts
- `get_total_contacts()` - Get total number of contacts
- `update_name()` - Update contact name (anyone)
- `update_spam_type()` - Update spam type (anyone)

**Data Structures**:
- `ContactRecord`: phone_hash, wallet_pubkey, name, blob_id, sui_object_id, spam_count, not_spam_count, spam_type
- `ContactBook`: Shared object with Table<phone_hash, ContactRecord>

---

### 2. `spam.move` - Spam Reporting Module
**Purpose**: Handle spam/not spam reporting for contacts (requires stake).

**Key Features**:
- Report contact as spam (requires stake)
- Report contact as not spam (requires stake)
- Auto-increment spam counts (read-only, cannot be manually edited)
- Infinite voting allowed (users can vote multiple times)

**Main Functions**:
- `report_spam()` - Report contact as spam (requires stake, auto-increments spam_count)
- `report_not_spam()` - Report contact as not spam (requires stake, auto-increments not_spam_count)

**Note**: Spam counts are auto-incremented only and cannot be manually edited. Each vote increments the respective count.

---

### 3. `stake.move` - Staking Module
**Purpose**: Handle SUI staking/unstaking for spam reporting requirements.

**Key Features**:
- Stake any amount > 0 SUI
- Stakes are locked when created
- Unstake to unlock and withdraw
- Check if user has stake (for spam reporting)

**Main Functions**:
- `init()` - Initialize shared StakePool
- `stake()` - Lock SUI (must be > 0)
- `unstake()` - Unlock and withdraw SUI
- `get_stake()` - Query user's stake info
- `has_stake()` - Check if user has staked (for reporting requirement)
- `get_total_staked()` - Get total staked across all users

**Data Structures**:
- `StakeInfo`: amount, timestamp, locked
- `StakePool`: Shared object with Table<address, StakeInfo>

---

## Usage Flow

1. **Initialize** (one-time setup):
   ```move
   contacts::init(ctx);
   stake::init(ctx);
   ```

2. **Add Contacts**:
   ```move
   contacts::add_contacts(&mut contact_book, contacts_vector, ctx);
   ```

3. **Stake SUI** (required for reporting):
   ```move
   stake::stake(&mut stake_pool, coin, ctx);
   ```

4. **Report Spam**:
   ```move
   spam::report_spam(&mut contact_book, phone_hash, spam_type, &stake_pool, ctx);
   ```

5. **Query Contact**:
   ```move
   let contact_opt = contacts::get_contact(&contact_book, phone_hash);
   ```

---

## Important Notes

- **Spam Counts**: `spam_count` and `not_spam_count` are auto-incremented only. They cannot be manually edited.
- **Voting**: Users can vote spam/not spam infinite times (each vote increments count).
- **Stake Requirement**: Reporting spam/not spam requires user to have staked SUI.
- **Upgradeable Fields**: `name` and `spam_type` can be updated by anyone.
- **Global Queries**: `get_contact()` searches all contacts stored across all transactions (not just one list).

---

## Build & Test

```bash
sui move build
```
For test check tests/js folder
you can run individual scripts to check each features

Note must keep private key in env to scripts to work 

