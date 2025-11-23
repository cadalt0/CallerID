/// Spam Reporting Module
/// Handles spam/not spam reporting for contacts (requires stake)
module callerid::spam {
    use std::string;
    use sui::table;
    use callerid::contacts;
    use callerid::master::{Self, CallerIDMaster};
    use callerid::stake;

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    
    const ENoStake: u64 = 2;
    const EEmptySpamType: u64 = 3;
    const EEmptyPhoneHash: u64 = 4;

    // ============================================================================
    // SPAM REPORTING FUNCTIONS (Requires Stake)
    // ============================================================================

    /// Report a contact as spam
    /// Requires user to have staked SUI (checked via stake module)
    /// Auto-creates contact if it doesn't exist
    /// Requires spam_type (cannot be empty)
    /// Optional: name, blob_id (for storing email/extra data), wallet_pubkey, sui_object_id
    /// Auto-increments spam_count (read-only, cannot be manually edited)
    /// Updates spam_type (can be changed later by anyone)
    public entry fun report_spam(
        master: &mut CallerIDMaster,
        phone_hash: vector<u8>,
        spam_type: string::String,
        ctx: &mut sui::tx_context::TxContext
    ) {
        report_spam_with_data(
            master,
            phone_hash,
            spam_type,
            std::option::none<string::String>(),
            std::option::none<string::String>(),
            std::option::none<vector<u8>>(),
            std::option::none<sui::object::ID>(),
            ctx
        );
    }

    /// Report spam with optional additional data
    /// name: Optional contact name (defaults to "Reported Spam" if None)
    /// blob_id: Optional Walrus Blob ID for storing email/extra data (defaults to empty if None)
    /// wallet_pubkey: Optional wallet public key (defaults to empty if None)
    /// sui_object_id: Optional Sui Object ID (defaults to zero if None)
    public entry fun report_spam_with_data(
        master: &mut CallerIDMaster,
        phone_hash: vector<u8>,
        spam_type: string::String,
        name: std::option::Option<string::String>,
        blob_id: std::option::Option<string::String>,
        wallet_pubkey: std::option::Option<vector<u8>>,
        sui_object_id: std::option::Option<sui::object::ID>,
        ctx: &mut sui::tx_context::TxContext
    ) {
        // Validate required fields
        assert!(vector::length(&phone_hash) > 0, EEmptyPhoneHash);
        assert!(string::length(&spam_type) > 0, EEmptySpamType);
        
        // Check if user has stake (imported from stake module)
        let sender = sui::tx_context::sender(ctx);
        assert!(stake::has_stake(master, sender), ENoStake);
        
        // Auto-create contact if it doesn't exist
        if (!contacts::contains_contact(master, phone_hash)) {
            // Use provided values or defaults
            let contact_name = if (std::option::is_some(&name)) {
                *std::option::borrow(&name)
            } else {
                string::utf8(b"Reported Spam")
            };
            
            let contact_blob_id = if (std::option::is_some(&blob_id)) {
                *std::option::borrow(&blob_id)
            } else {
                string::utf8(b"")
            };
            
            let contact_wallet_pubkey = if (std::option::is_some(&wallet_pubkey)) {
                *std::option::borrow(&wallet_pubkey)
            } else {
                vector::empty<u8>()
            };
            
            let contact_sui_object_id = if (std::option::is_some(&sui_object_id)) {
                *std::option::borrow(&sui_object_id)
            } else {
                sui::object::id_from_address(@0x0)
            };
            
            let contact = master::new_contact_record(
                phone_hash,
                contact_wallet_pubkey,
                contact_name,
                contact_blob_id,
                contact_sui_object_id,
            );
            
            // Add to contacts table
            let contacts_table = master::get_contacts_mut(master);
            table::add(contacts_table, phone_hash, contact);
            let total = master::get_total_contacts_mut(master);
            *total = *total + 1;
        };
        
        // Increment spam count (contact now exists)
        contacts::increment_spam_count(master, phone_hash, spam_type);
    }

    /// Report a contact as NOT spam
    /// Requires user to have staked SUI
    /// Auto-creates contact if it doesn't exist
    /// Auto-increments not_spam_count (read-only, cannot be manually edited)
    public entry fun report_not_spam(
        master: &mut CallerIDMaster,
        phone_hash: vector<u8>,
        ctx: &mut sui::tx_context::TxContext
    ) {
        // Validate required fields
        assert!(vector::length(&phone_hash) > 0, EEmptyPhoneHash);
        
        // Check if user has stake
        let sender = sui::tx_context::sender(ctx);
        assert!(stake::has_stake(master, sender), ENoStake);
        
        // Auto-create contact if it doesn't exist
        if (!contacts::contains_contact(master, phone_hash)) {
            // Create minimal contact record for spam reporting
            let empty_wallet_pubkey = vector::empty<u8>();
            let default_name = string::utf8(b"Reported Contact");
            let empty_blob_id = string::utf8(b"");
            let zero_object_id = sui::object::id_from_address(@0x0);
            
            let contact = master::new_contact_record(
                phone_hash,
                empty_wallet_pubkey,
                default_name,
                empty_blob_id,
                zero_object_id,
            );
            
            // Add to contacts table
            let contacts_table = master::get_contacts_mut(master);
            table::add(contacts_table, phone_hash, contact);
            let total = master::get_total_contacts_mut(master);
            *total = *total + 1;
        };
        
        // Increment not spam count (contact now exists)
        contacts::increment_not_spam_count(master, phone_hash);
    }
}

