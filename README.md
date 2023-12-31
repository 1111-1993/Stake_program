
##  Solana Staking Program

Solana staking program 

`Framework:` Anchor Installation ```https://www.anchor-lang.com/docs/installation```

`SPl Token:` Basic Token

`Total Supply:` 1 billion tokens




## Deployment

To deploy this project run

```bash
git clone https://github.com/1111-1993/Stake_program.git
```
```bash 
anchor build
```
Note: If ```.so``` file created in directory ```target/deploy``` otherwise try
```bash
cargo build-bpf --manifest-path=./programs/staker/Cargo.toml --bpf-out-dir=target/deploy
```
then use command ```anchor keys list``` to find out ```Program Id``` and reaplace ```Anchor.toml``` and ```declare_id!``` in ```lib.rs```

Create mint keypairs 
```bash
solana-keygen new --outfile .keys/stake_mint.json
solana-keygen new --outfile .keys/basic_mint.json
```

```bash
anchor deploy
```
Install dependencies:
```bash
yarn install
```

```bash 
anchor test
```
or try this ```anchor test --skip-local-validator```

