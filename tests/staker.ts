import { expect } from 'chai';
import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  stakeMintAddress,
  basicMintAddress,
  program,
  findStakeMintAuthorityPDA
} from "../scripts/config"
import { User } from "./user";
import { createMints } from "../scripts/create-mints";
import { airdropBasic } from "../scripts/airdrop-basic";
import { TokenHelper } from "./token_helper";



describe("staker", () => {

  before(async () => {
    await createMints();
    await airdropBasic();
  });


  it('It creates the program basic token bag', async () => {
    const user = new User();
    const [basicPDA, _] = await getProgramBasicTokenBagPDA();

    await program.rpc.createBasicTokenBag({
      accounts: {
        basicMint: basicMintAddress,
        programBasicTokenBag: basicPDA,
        payer: user.wallet.publicKey,

        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      }
    });

    const tokenHelper = new TokenHelper(basicMintAddress);
    expect(await tokenHelper.balance(basicPDA)).to.be.eql(0);
  });


  it('It swaps Basic for stake', async () => {
    // 0. Prepare Token Bags
    const user =  new User();
    await user.getOrCreateStakeTokenBag();
    await user.getOrCreateBasicTokenBag()

    // 1. Get current stake amount
    const userStakes = await user.stakeBalance();
    const userBasics = await user.basicBalance();

    // For the MINT
    const [stakePDA, stakePDABump] = await findStakeMintAuthorityPDA();
    // For the TRANSFER
    const [basicBagPDA, basicBagBump] = await getProgramBasicTokenBagPDA();

    // 2. Execute our stuff
    await program.rpc.stake(
        stakePDABump,
        basicBagBump,
        new anchor.BN(5_000),
        {
          accounts: {
            // Solana is lost: where are my spl program friends?
            tokenProgram: TOKEN_PROGRAM_ID,

            // MINTING stake TO USERS
            stakeMint: stakeMintAddress,
            stakeMintAuthority: stakePDA,
            userStakeTokenBag: user.stakeTokenBag,


            // TRANSFERING Basic FROM USERS
            
            userBasicTokenBag: user.basicTokenBag,
            userBasicTokenBagAuthority: user.wallet.publicKey,
            programBasicTokenBag: basicBagPDA,
            basicMint: basicMintAddress,
          },
        },
    );

    // 3. Tests

    // We expect the user to have received 5_000 stake
    expect(await user.stakeBalance()).to.be.eql(userStakes + 5_000);

    // We expect the user to have paid 5_000 basic to the program.
    expect(await user.basicBalance()).to.be.eql(userBasics - 5_000);
    const tokenHelper = new TokenHelper(basicMintAddress);
    expect(await tokenHelper.balance(basicBagPDA)).to.be.eql(5_000)
  });

  it('It redeems stake for basic', async () => {
    // 0. Prepare Token Bags
    const user = new User();
    await user.getOrCreateStakeTokenBag();
    await user.getOrCreateBasicTokenBag()
    // For the TRANSFER
    const [basicBagPDA, basicBagBump] = await getProgramBasicTokenBagPDA();

    // 1. Get current stake amount
    const userStakes = await user.stakeBalance();
    const userBasics = await user.basicBalance();

    // 2. Execute our stuff
    await program.rpc.unstake(
        basicBagBump,
        new anchor.BN(5_000),
        {
          accounts: {
            tokenProgram: TOKEN_PROGRAM_ID,

            // BURNING USER'S state

            stakeMint: stakeMintAddress,
            userStakeTokenBag: user.stakeTokenBag,
            userStakeTokenBagAuthority: user.wallet.publicKey,


            // TRANSFER basic TO USERS
            programBasicTokenBag: basicBagPDA,
            userBasicTokenBag: user.basicTokenBag,
            basicMint: basicMintAddress,
          },
        }
    );

    // 3. Tests

    // We expect the user to have redeem stake to the program.
    expect(await user.stakeBalance()).to.be.eql(userStakes - 5_000);

    // We expect the user to have received 5_000 basic basic back.
    expect(await user.basicBalance()).to.be.eql(userBasics + 5_000);
  });

})


const getProgramBasicTokenBagPDA = async (): Promise<[PublicKey, number]> => {
  const seed = basicMintAddress;

  return await PublicKey.findProgramAddress(
      [seed.toBuffer()],
      program.programId
  );
}