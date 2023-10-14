import { Keypair, PublicKey } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import {
    basicMintKeypair,
    stakeMintKeypair,
    connection,
    randomPayer,
    findStakeMintAuthorityPDA,
} from "./config";

const createMints = async () => {
    const basicMintAddress = await createMintAcct(
        basicMintKeypair,
        basicMintKeypair.publicKey
    )

    const [stakePDA, _] =  await findStakeMintAuthorityPDA();
    

    const stakeMintAddress = await createMintAcct(
        stakeMintKeypair,
        stakePDA)

    console.log(`basic Mint Address: ${basicMintAddress}`);
    console.log(`stake Mint Address: ${stakeMintAddress}`);
}



const createMintAcct = async (keypairToAssign: Keypair, authorityToAssign: PublicKey): Promise<PublicKey> => {
    return await createMint(
        connection,
        await randomPayer(),
        authorityToAssign, // mint authority
        null, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
        8, // decimals
        keypairToAssign // address of the mint
    );
}


export {
    createMints
}