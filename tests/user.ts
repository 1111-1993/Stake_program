import {  PublicKey } from '@solana/web3.js';
import { basicMintAddress, stakeMintAddress, userWallet } from "../scripts/config"
import { TokenHelper } from "./token_helper";
import { Wallet } from "@project-serum/anchor";


class User {
    basicToken: TokenHelper;
    basicTokenBag: PublicKey;
    stakeToken: TokenHelper;
    stakeTokenBag: PublicKey;
    wallet: Wallet;

    constructor(wallet = userWallet) {
        this.basicToken = new TokenHelper(basicMintAddress);
        this.stakeToken = new TokenHelper(stakeMintAddress);
        this.wallet = wallet;
    }

    getOrCreateBasicTokenBag = async () => {
       this.basicTokenBag = (await this.basicToken.getOrCreateTokenBag(this.wallet.publicKey)).address;
    }

    getOrCreateStakeTokenBag = async () => {
        this.stakeTokenBag = (await this.stakeToken.getOrCreateTokenBag(this.wallet.publicKey)).address;
    }

    basicBalance = async () => {
        // call getOrCreateBasicTokenBag first
        return await this.basicToken.balance(this.basicTokenBag);
    }

    stakeBalance = async () => {
        // call getOrCreateStakeTokenbag first
        return await this.basicToken.balance(this.stakeTokenBag);
    }
}


export {
    User
}