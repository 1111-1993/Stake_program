import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import fs from "fs";
import * as anchor from "@project-serum/anchor";

anchor.setProvider(anchor.Provider.env());
const program = anchor.workspace.Staker;
const connection = anchor.getProvider().connection;
const userWallet = anchor.workspace.Staker.provider.wallet;

const randomPayer = async (lamports = LAMPORTS_PER_SOL) => {
    const wallet = Keypair.generate();
    const signature = await connection.requestAirdrop(wallet.publicKey, lamports);
    await connection.confirmTransaction(signature);
    return wallet;
}

const findBasicMintAuthorityPDA = async (): Promise<[PublicKey, number]> => {
    return await getProgramDerivedAddress(basicMintAddress);
}

const findStakeMintAuthorityPDA = async (): Promise<[PublicKey, number]> => {
    return await getProgramDerivedAddress(stakeMintAddress);
}

const getProgramDerivedAddress = async (seed: PublicKey): Promise<[PublicKey, number]> => {
    return await PublicKey.findProgramAddress(
        [seed.toBuffer()],
        program.programId
    );
}


// @ts-ignore
const basicData = JSON.parse(fs.readFileSync(".keys/basic_mint.json"));
const basicMintKeypair = Keypair.fromSecretKey(new Uint8Array(basicData));
const basicMintAddress = basicMintKeypair.publicKey;

// @ts-ignore
const stakeData = JSON.parse(fs.readFileSync(".keys/stake_mint.json"));
const stakeMintKeypair = Keypair.fromSecretKey(new Uint8Array(stakeData))
const stakeMintAddress = stakeMintKeypair.publicKey;



export {
    program,
    connection,
    userWallet,
    randomPayer,
    basicMintKeypair,
    basicMintAddress,
    stakeMintKeypair,
    stakeMintAddress,
    findBasicMintAuthorityPDA,
    findStakeMintAuthorityPDA,
}