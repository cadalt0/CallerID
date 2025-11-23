/// Stake Module
/// Handles SUI staking and unstaking for spam reporting
module callerid::stake {
    use sui::table;
    use sui::coin;
    use sui::balance;
    use sui::sui::SUI;
    use callerid::master::{Self, CallerIDMaster, StakeInfo};

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    
    const EInsufficientStake: u64 = 1;
    const ENoStake: u64 = 2;
    const EInvalidAmount: u64 = 3;

    // ============================================================================
    // DATA STRUCTURES
    // ============================================================================
    // StakeInfo is defined in master module

    // ============================================================================
    // STAKING FUNCTIONS
    // ============================================================================

    /// Stake SUI (must be > 0)
    /// Locks the staked amount
    public entry fun stake(
        master: &mut CallerIDMaster,
        coin: coin::Coin<SUI>,
        ctx: &mut sui::tx_context::TxContext
    ) {
        let amount = coin::value(&coin);
        assert!(amount > 0, EInvalidAmount);
        
        let sender = sui::tx_context::sender(ctx);
        let timestamp = sui::tx_context::epoch_timestamp_ms(ctx);
        
        // Add coin to total staked
        let coin_balance = coin::into_balance(coin);
        let total_staked = master::get_total_staked_mut(master);
        balance::join(total_staked, coin_balance);
        
        // Update or create stake info
        let stakes = master::get_stakes_mut(master);
        if (table::contains(stakes, sender)) {
            // User already has stake - add to existing
            let stake_info = table::borrow_mut(stakes, sender);
            master::add_amount(stake_info, amount);
            master::set_timestamp(stake_info, timestamp);
            master::set_locked(stake_info, true);
        } else {
            // New stake
            let stake_info = master::new_stake_info(amount, timestamp, true);
            table::add(stakes, sender, stake_info);
        };
    }

    /// Unstake SUI
    /// Unlocks and returns the staked amount
    public entry fun unstake(
        master: &mut CallerIDMaster,
        amount: u64,
        ctx: &mut sui::tx_context::TxContext
    ) {
        let sender = sui::tx_context::sender(ctx);
        
        let stakes = master::get_stakes_mut(master);
        assert!(table::contains(stakes, sender), ENoStake);
        
        let stake_info = table::borrow_mut(stakes, sender);
        assert!(master::get_amount(stake_info) >= amount, EInsufficientStake);
        assert!(master::get_locked(stake_info), EInsufficientStake);
        
        // Update stake info
        master::subtract_amount(stake_info, amount);
        master::set_locked(stake_info, false);
        
        // If stake is zero, remove from table
        if (master::get_amount(stake_info) == 0) {
            let _stake_info = table::remove(stakes, sender);
        };
        
        // Transfer coin back to user
        let total_staked = master::get_total_staked_mut(master);
        let coin_balance = balance::split(total_staked, amount);
        let coin = coin::from_balance(coin_balance, ctx);
        sui::transfer::public_transfer(coin, sender);
    }

    // ============================================================================
    // QUERY FUNCTIONS
    // ============================================================================

    /// Get user's stake information
    public fun get_stake(
        master: &CallerIDMaster,
        user: address
    ): std::option::Option<StakeInfo> {
        let stakes = master::get_stakes(master);
        if (table::contains(stakes, user)) {
            std::option::some(*table::borrow(stakes, user))
        } else {
            std::option::none()
        }
    }

    /// Check if user has staked (for spam reporting requirement)
    public fun has_stake(master: &CallerIDMaster, user: address): bool {
        let stakes = master::get_stakes(master);
        if (table::contains(stakes, user)) {
            let stake_info = table::borrow(stakes, user);
            master::get_amount(stake_info) > 0 && master::get_locked(stake_info)
        } else {
            false
        }
    }

    /// Get total staked amount across all users
    public fun get_total_staked(master: &CallerIDMaster): u64 {
        let total_staked = master::get_total_staked(master);
        balance::value(total_staked)
    }
}

