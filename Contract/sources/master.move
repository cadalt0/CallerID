/// Master Module
/// Contains the master object that combines contacts and stakes
module callerid::master {
    use sui::table;
    use sui::balance;
    use sui::sui::SUI;
    use std::string;

    /// Contact record with spam reporting fields
    #[allow(unused_field)]
    public struct ContactRecord has store, copy, drop {
        phone_hash: vector<u8>,        // Blake2b256 hash of phone number
        wallet_pubkey: vector<u8>,     // Wallet public key
        name: string::String,                  // Contact name (upgradeable by anyone)
        blob_id: string::String,                   // Walrus Blob ID string (e.g., "1hwYC_D_65WyvwEmBLM2yxBRKjrtmxnH-qH6dd4jBVs")
        sui_object_id: sui::object::ID,             // Related Sui object ID
        spam_count: u64,               // Auto-incremented, read-only (how many reported spam)
        not_spam_count: u64,           // Auto-incremented, read-only (how many reported not spam)
        spam_type: string::String,             // Type of spam (upgradeable by anyone)
    }

    /// Stake information for a user
    public struct StakeInfo has store, copy, drop {
        amount: u64,           // Staked SUI amount
        timestamp: u64,        // When staked
        locked: bool,          // Lock status
    }

    /// Master object containing both contacts and stakes
    public struct CallerIDMaster has key {
        id: sui::object::UID,
        contacts: table::Table<vector<u8>, ContactRecord>,  // phone_hash -> ContactRecord
        total_contacts: u64,
        stakes: table::Table<address, StakeInfo>,  // user address -> StakeInfo
        total_staked: balance::Balance<SUI>,
    }

    /// Initialize the master shared object
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let master = CallerIDMaster {
            id: sui::object::new(ctx),
            contacts: table::new(ctx),
            total_contacts: 0,
            stakes: table::new(ctx),
            total_staked: balance::zero(),
        };
        sui::transfer::share_object(master);
    }

    // ============================================================================
    // HELPER FUNCTIONS FOR STAKE MODULE
    // ============================================================================

    /// Get stakes table (for stake module)
    public fun get_stakes_mut(master: &mut CallerIDMaster): &mut table::Table<address, StakeInfo> {
        &mut master.stakes
    }

    /// Get stakes table (immutable, for stake module)
    public fun get_stakes(master: &CallerIDMaster): &table::Table<address, StakeInfo> {
        &master.stakes
    }

    /// Get total_staked balance (for stake module)
    public fun get_total_staked_mut(master: &mut CallerIDMaster): &mut balance::Balance<SUI> {
        &mut master.total_staked
    }

    /// Get total_staked balance (immutable, for stake module)
    public fun get_total_staked(master: &CallerIDMaster): &balance::Balance<SUI> {
        &master.total_staked
    }

    // ============================================================================
    // HELPER FUNCTIONS FOR CONTACTS MODULE
    // ============================================================================

    /// Get contacts table (for contacts module)
    public fun get_contacts_mut(master: &mut CallerIDMaster): &mut table::Table<vector<u8>, ContactRecord> {
        &mut master.contacts
    }

    /// Get contacts table (immutable, for contacts module)
    public fun get_contacts(master: &CallerIDMaster): &table::Table<vector<u8>, ContactRecord> {
        &master.contacts
    }

    /// Get total_contacts (for contacts module)
    public fun get_total_contacts_mut(master: &mut CallerIDMaster): &mut u64 {
        &mut master.total_contacts
    }

    /// Get total_contacts (immutable, for contacts module)
    public fun get_total_contacts(master: &CallerIDMaster): u64 {
        master.total_contacts
    }

    // ============================================================================
    // HELPER FUNCTIONS FOR CONTACT RECORD FIELD ACCESS
    // ============================================================================

    /// Create new ContactRecord
    public fun new_contact_record(
        phone_hash: vector<u8>,
        wallet_pubkey: vector<u8>,
        name: string::String,
        blob_id: string::String,
        sui_object_id: sui::object::ID,
    ): ContactRecord {
        ContactRecord {
            phone_hash,
            wallet_pubkey,
            name,
            blob_id,
            sui_object_id,
            spam_count: 0,
            not_spam_count: 0,
            spam_type: string::utf8(b""),
        }
    }

    /// Get phone_hash from ContactRecord
    public fun get_phone_hash(record: &ContactRecord): vector<u8> {
        record.phone_hash
    }

    /// Get name from ContactRecord
    public fun get_name(record: &ContactRecord): string::String {
        record.name
    }

    /// Set name in ContactRecord
    public fun set_name(record: &mut ContactRecord, name: string::String) {
        record.name = name;
    }

    /// Set spam_type in ContactRecord
    public fun set_spam_type(record: &mut ContactRecord, spam_type: string::String) {
        record.spam_type = spam_type;
    }

    /// Increment spam_count in ContactRecord
    public fun increment_spam_count(record: &mut ContactRecord) {
        record.spam_count = record.spam_count + 1;
    }

    /// Increment not_spam_count in ContactRecord
    public fun increment_not_spam_count(record: &mut ContactRecord) {
        record.not_spam_count = record.not_spam_count + 1;
    }

    /// Set spam_type and increment spam_count
    public fun set_spam_type_and_increment(record: &mut ContactRecord, spam_type: string::String) {
        record.spam_count = record.spam_count + 1;
        record.spam_type = spam_type;
    }

    // ============================================================================
    // HELPER FUNCTIONS FOR STAKE INFO FIELD ACCESS
    // ============================================================================

    /// Create new StakeInfo
    public fun new_stake_info(amount: u64, timestamp: u64, locked: bool): StakeInfo {
        StakeInfo {
            amount,
            timestamp,
            locked,
        }
    }

    /// Get amount from StakeInfo
    public fun get_amount(info: &StakeInfo): u64 {
        info.amount
    }

    /// Get locked from StakeInfo
    public fun get_locked(info: &StakeInfo): bool {
        info.locked
    }

    /// Set amount in StakeInfo
    public fun set_amount(info: &mut StakeInfo, amount: u64) {
        info.amount = amount;
    }

    /// Add to amount in StakeInfo
    public fun add_amount(info: &mut StakeInfo, amount: u64) {
        info.amount = info.amount + amount;
    }

    /// Subtract from amount in StakeInfo
    public fun subtract_amount(info: &mut StakeInfo, amount: u64) {
        info.amount = info.amount - amount;
    }

    /// Set timestamp in StakeInfo
    public fun set_timestamp(info: &mut StakeInfo, timestamp: u64) {
        info.timestamp = timestamp;
    }

    /// Set locked in StakeInfo
    public fun set_locked(info: &mut StakeInfo, locked: bool) {
        info.locked = locked;
    }
}

