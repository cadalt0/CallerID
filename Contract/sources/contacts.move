/// Contacts Module
/// Handles storing, querying, and reporting on contact records
module callerid::contacts {
    use sui::table;
    use std::string;
    use callerid::master::{Self, CallerIDMaster, ContactRecord};

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    
    const MAX_CONTACTS_PER_BATCH: u64 = 1000;
    const EContactNotFound: u64 = 1;
    const EEmptyName: u64 = 2;
    const EEmptyPhoneHash: u64 = 3;
    const EExceedsBatchLimit: u64 = 4;

    // ============================================================================
    // DATA STRUCTURES
    // ============================================================================
    // ContactRecord is defined in master module


    // ============================================================================
    // HELPER FUNCTIONS FOR SPAM MODULE
    // ============================================================================

    /// Check if contact exists (for spam module)
    public fun contains_contact(master: &CallerIDMaster, phone_hash: vector<u8>): bool {
        let contacts = master::get_contacts(master);
        table::contains(contacts, phone_hash)
    }

    /// Increment spam count (for spam module)
    public fun increment_spam_count(master: &mut CallerIDMaster, phone_hash: vector<u8>, spam_type: string::String) {
        let contacts = master::get_contacts_mut(master);
        let contact = table::borrow_mut(contacts, phone_hash);
        master::set_spam_type_and_increment(contact, spam_type);
    }

    /// Increment not spam count (for spam module)
    public fun increment_not_spam_count(master: &mut CallerIDMaster, phone_hash: vector<u8>) {
        let contacts = master::get_contacts_mut(master);
        let contact = table::borrow_mut(contacts, phone_hash);
        master::increment_not_spam_count(contact);
    }



    // ============================================================================
    // ADD CONTACTS
    // ============================================================================

    /// Add a single contact (helper function for easier JS calling)
    /// Accepts individual fields instead of struct
    public entry fun add_contact(
        master: &mut CallerIDMaster,
        phone_hash: vector<u8>,
        wallet_pubkey: vector<u8>,
        name: string::String,
        blob_id: string::String,
        sui_object_id: sui::object::ID,
    ) {
        // Validate required fields
        assert!(vector::length(&phone_hash) > 0, EEmptyPhoneHash);
        assert!(string::length(&name) > 0, EEmptyName);
        
        // Check if contact already exists
        let contacts_table = master::get_contacts_mut(master);
        if (table::contains(contacts_table, phone_hash)) {
            // Skip duplicates
            return
        };
        
        // Create ContactRecord
        let contact = master::new_contact_record(
            phone_hash,
            wallet_pubkey,
            name,
            blob_id,
            sui_object_id,
        );
        
        // Add to table
        table::add(contacts_table, phone_hash, contact);
        let total = master::get_total_contacts_mut(master);
        *total = *total + 1;
    }

    /// Add up to 1000 contacts in one transaction
    /// Each contact must have unique phone_hash
    public fun add_contacts(
        master: &mut CallerIDMaster,
        contacts: vector<ContactRecord>
    ) {
        let len = vector::length(&contacts);
        assert!(len <= MAX_CONTACTS_PER_BATCH, EExceedsBatchLimit);
        
        let mut i = 0;
        while (i < len) {
            let contact = *vector::borrow(&contacts, i);
            
            // Validate required fields
            let phone_hash = master::get_phone_hash(&contact);
            assert!(vector::length(&phone_hash) > 0, EEmptyPhoneHash);
            let name = master::get_name(&contact);
            assert!(string::length(&name) > 0, EEmptyName);
            
            // Check if contact already exists
            let contacts_table = master::get_contacts_mut(master);
            if (table::contains(contacts_table, phone_hash)) {
                // Skip duplicates (or you could update existing)
            } else {
                table::add(contacts_table, phone_hash, contact);
                let total = master::get_total_contacts_mut(master);
                *total = *total + 1;
            };
            
            i = i + 1;
        };
    }

    // ============================================================================
    // QUERY FUNCTIONS
    // ============================================================================

    /// Query a single contact by phone hash
    /// Returns Option<ContactRecord> - None if not found
    public fun get_contact(
        master: &CallerIDMaster,
        phone_hash: vector<u8>
    ): std::option::Option<ContactRecord> {
        let contacts = master::get_contacts(master);
        if (table::contains(contacts, phone_hash)) {
            std::option::some(*table::borrow(contacts, phone_hash))
        } else {
            std::option::none()
        }
    }

    /// Batch query multiple contacts by phone hashes
    /// Returns vector of Options - None for contacts not found
    public fun get_contacts(
        master: &CallerIDMaster,
        phone_hashes: vector<vector<u8>>
    ): vector<std::option::Option<ContactRecord>> {
        let mut results = vector::empty<std::option::Option<ContactRecord>>();
        let len = vector::length(&phone_hashes);
        let mut i = 0;
        
        while (i < len) {
            let phone_hash = *vector::borrow(&phone_hashes, i);
            vector::push_back(&mut results, get_contact(master, phone_hash));
            i = i + 1;
        };
        
        results
    }

    /// Get total number of contacts stored
    public fun get_total_contacts(master: &CallerIDMaster): u64 {
        master::get_total_contacts(master)
    }

    // ============================================================================
    // UPDATE FUNCTIONS (Anyone can update)
    // ============================================================================

    /// Update contact name (anyone can call)
    public entry fun update_name(
        master: &mut CallerIDMaster,
        phone_hash: vector<u8>,
        new_name: string::String,
    ) {
        let contacts = master::get_contacts(master);
        assert!(table::contains(contacts, phone_hash), EContactNotFound);
        assert!(string::length(&new_name) > 0, EEmptyName);
        
        let contacts_mut = master::get_contacts_mut(master);
        let contact = table::borrow_mut(contacts_mut, phone_hash);
        master::set_name(contact, new_name);
    }

    /// Update spam type (anyone can call)
    public entry fun update_spam_type(
        master: &mut CallerIDMaster,
        phone_hash: vector<u8>,
        new_type: string::String,
    ) {
        let contacts = master::get_contacts(master);
        assert!(table::contains(contacts, phone_hash), EContactNotFound);
        
        let contacts_mut = master::get_contacts_mut(master);
        let contact = table::borrow_mut(contacts_mut, phone_hash);
        master::set_spam_type(contact, new_type);
    }
}

