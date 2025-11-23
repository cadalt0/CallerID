module app::contacts {
    use enclave::enclave::{Self, Enclave};
    use std::string::String;

    const CONTACTS_INTENT: u8 = 0;
    const EInvalidSignature: u64 = 1;

    /// Witness used during deployment so only this module can create the config cap.
    public struct CONTACTS has drop {}

    /// Must match the Rust struct used in the enclave when serializing contacts.
    #[allow(unused_field)]
    public struct ContactRecord has copy, drop, store {
        name: String,
        phone_hash: vector<u8>,
        email: String,
        other: String,
    }

    /// Batch wrapper; aligns with the Rust `ContactBatch`.
    public struct ContactBatch has drop, store {
        contacts: vector<ContactRecord>,
    }

    public struct ContactBook has key, store {
        id: UID,
        timestamp_ms: u64,
        contacts: vector<ContactRecord>,
    }

    fun init(otw: CONTACTS, ctx: &mut TxContext) {
        let cap = enclave::new_cap(otw, ctx);
        cap.create_enclave_config(
            b"contacts enclave".to_string(),
            x"00",
            x"00",
            x"00",
            ctx,
        );
        sui::transfer::public_transfer(cap, ctx.sender())
    }

    /// Consumes the signed payload and stores it on-chain once verified.
    public fun update_contacts<T>(
        batch: ContactBatch,
        timestamp_ms: u64,
        signature: &vector<u8>,
        enclave: &Enclave<T>,
        ctx: &mut TxContext,
    ): ContactBook {
        let contacts = batch.contacts;
        let verified = enclave.verify_signature(CONTACTS_INTENT, timestamp_ms, batch, signature);
        assert!(verified, EInvalidSignature);

        ContactBook {
            id: sui::object::new(ctx),
            timestamp_ms,
            contacts,
        }
    }

    /// Seal access control policy function
    /// Simplified for local testing: allow any transaction signer to decrypt.
    entry fun seal_approve(_id: vector<u8>, _ctx: &TxContext) {}
}

