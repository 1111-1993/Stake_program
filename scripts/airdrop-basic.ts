import { mintTo }  from "@solana/spl-token";
import { basicMintKeypair, connection, randomPayer } from "./config";
import { TokenHelper } from "../tests/token_helper";
import { User } from "../tests/user";


const airdropBasic = async () => {
    const user = new User()
    await user.getOrCreateBasicTokenBag();


    await mintTo(
        connection,
        await randomPayer(),
        basicMintKeypair.publicKey,
        user.basicTokenBag,
        basicMintKeypair, 
        1_000_000_000,
        []
    );

    const balance = await (new TokenHelper(basicMintKeypair.publicKey)).balance(user.basicTokenBag);
    console.log(`Token Account '${user.basicTokenBag.toString()}' balance: ${balance}`);
}

export {
    airdropBasic,
}