use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("Bipw4ED9hom7KCTiHxafPEiPwBuuenp9NP7PQJo4JMrx"); // Replace with program Id.

#[program]
pub mod staker {
    // REPLACE ADDRESS from .key/stake_mint.json
    pub const STAKE_MINT_ADDRESS: &str = "AfBJqmSuVghQbz6JbFkujh7QHYqJ3kotv9ETMGQLaHM6";
    // REPLACE ADDRESS from .key/basic_mint.json
    pub const BASIC_MINT_ADDRESS: &str = "4vRHgtJERfWxiE2BeMK9W8m7Fgg8murk7WuJCvrkFacA";

    use super::*;

    pub fn create_basic_token_bag(ctx: Context<CreateBasicTokenBag>) -> Result<()> {
        Ok(())
    }

    pub fn stake(
        ctx: Context<Stake>,
        stake_mint_authority_bump: u8,
        program_basic_bag_bump: u8,
        basic_amount: u64,
    ) -> Result<()> {
        // 1. SPL Token Program to mint stake to the user
        let stake_amount = basic_amount; // formula

        let stake_mint_address = ctx.accounts.stake_mint.key();
        let seeds = &[stake_mint_address.as_ref(), &[stake_mint_authority_bump]];
        let signer = [&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.stake_mint.to_account_info(),
                to: ctx.accounts.user_stake_token_bag.to_account_info(),
                authority: ctx.accounts.stake_mint_authority.to_account_info(),
            },
            &signer,
        );
        token::mint_to(cpi_ctx, stake_amount)?;

        // 2. SPL Token Program to transfer Basic token from the user.

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_basic_token_bag.to_account_info(),
                authority: ctx
                    .accounts
                    .user_basic_token_bag_authority
                    .to_account_info(),
                to: ctx.accounts.program_basic_token_bag.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, basic_amount)?;

        Ok(())
    }

    pub fn unstake(
        ctx: Context<UnStake>,
        program_basic_bag_bump: u8,
        stake_amount: u64,
    ) -> Result<()> {
        // SPL Token Program to burn user's stake.

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.stake_mint.to_account_info(),
                to: ctx.accounts.user_stake_token_bag.to_account_info(),
                authority: ctx
                    .accounts
                    .user_stake_token_bag_authority
                    .to_account_info(),
            },
        );
        token::burn(cpi_ctx, stake_amount)?;

        // 2. Ask SPL Token Program to transfer back Basic to the user.

        let basic_mint_address = ctx.accounts.basic_mint.key();
        let seeds = &[basic_mint_address.as_ref(), &[program_basic_bag_bump]];
        let signer = [&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.program_basic_token_bag.to_account_info(),
                authority: ctx.accounts.program_basic_token_bag.to_account_info(),
                to: ctx.accounts.user_basic_token_bag.to_account_info(),
            },
            &signer,
        );

        let basic_amount = stake_amount; // formula
        token::transfer(cpi_ctx, basic_amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateBasicTokenBag<'info> {
    // PDA for basic token bag for our program.
    #[account(
        init,
        payer = payer,

        seeds = [ BASIC_MINT_ADDRESS.parse::<Pubkey>().unwrap().as_ref() ],
        bump,

        token::mint = basic_mint,

        token::authority = program_basic_token_bag,
    )]
    pub program_basic_token_bag: Account<'info, TokenAccount>,

    #[account(
        address = BASIC_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub basic_mint: Account<'info, Mint>,

    // rent payer
    #[account(mut)]
    pub payer: Signer<'info>,

    // Associated Token Account
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(stake_mint_authority_bump: u8, program_basic_bag_bump: u8)]
pub struct Stake<'info> {
    // SPL Token Program
    pub token_program: Program<'info, Token>,

    #[account(
    mut,
    address = STAKE_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub stake_mint: Account<'info, Mint>,

    /// CHECK: only used as a signing PDA
    #[account(
    seeds = [ stake_mint.key().as_ref() ],
    bump = stake_mint_authority_bump,
    )]
    pub stake_mint_authority: UncheckedAccount<'info>,

    // Associated Token Account
    #[account(mut)]
    pub user_stake_token_bag: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_basic_token_bag: Account<'info, TokenAccount>,

    pub user_basic_token_bag_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ basic_mint.key().as_ref() ],
        bump = program_basic_bag_bump,
    )]
    pub program_basic_token_bag: Account<'info, TokenAccount>,

    #[account(
        address = BASIC_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub basic_mint: Account<'info, Mint>,
}

#[derive(Accounts)]
#[instruction(program_basic_bag_bump: u8)]
pub struct UnStake<'info> {
    // SPL Token Program
    pub token_program: Program<'info, Token>,

    #[account(
        mut,
        address = STAKE_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub stake_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_stake_token_bag: Account<'info, TokenAccount>,

    pub user_stake_token_bag_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ basic_mint.key().as_ref() ],
        bump = program_basic_bag_bump,
    )]
    pub program_basic_token_bag: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_basic_token_bag: Account<'info, TokenAccount>,

    #[account(
        address = BASIC_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub basic_mint: Box<Account<'info, Mint>>,
}
