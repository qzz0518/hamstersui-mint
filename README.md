# Sui NFT Batch Minting Script

A high-performance script for batch minting NFTs on the Sui blockchain.

## Features

- Multi-wallet support (batch processing)
- Optimized gas management
- Error handling and retry mechanism
- Detailed transaction reporting

## Setup

1. Install dependencies:
```bash
npm install @mysten/sui.js
```

2. Configure wallets:
- Create `wallet.txt` in the project root
- Add one private key per line (suiprivkey format)

3. Configure settings in `config.js`:
- RPC URL
- Contract ID
- Mint arguments

## Usage

```bash
node sui.js
```

## Configuration

Edit `config.js` to customize:
- `RPC_URL`: Sui RPC endpoint
- `CONTRACT_ID`: Target contract address
- `MINT_TIMES`: Number of mints per wallet
- `ARGUMENTS`: Contract-specific arguments

## Example wallet.txt
```
suiprivkey1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
suiprivkey1yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

## Error Handling

The script includes:
- Gas optimization
- Network retry mechanism
- Detailed error logging
