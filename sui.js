import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { CONFIG } from './config.js';
import fs from 'fs';

async function createSigner(privateKey) {
    const decoded = decodeSuiPrivateKey(privateKey);
    if (decoded.schema !== 'ED25519') {
        throw new Error('Unsupported key type: ' + decoded.schema);
    }
    
    const keypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);
    const client = new SuiClient({ url: CONFIG.RPC_URL });
    
    return { keypair, client };
}

async function checkBalance(client, address) {
    const coins = await client.getCoins({
        owner: address,
        coinType: '0x2::sui::SUI'
    });

    const totalBalance = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
    if (totalBalance === BigInt(0)) {
        throw new Error('Insufficient balance');
    }

    return coins.data;
}

async function mint({ client, keypair }) {
    const tx = new TransactionBlock();
    
    tx.setGasBudget(CONFIG.GAS.BUDGET);
    tx.setGasPrice(CONFIG.GAS.PRICE);

    const treasuryCap = tx.object(CONFIG.ARGUMENTS.arg1);
    const mintCap = tx.object(CONFIG.ARGUMENTS.arg2);
    const recipient = tx.pure(CONFIG.ARGUMENTS.arg3);
    
    tx.moveCall({
        target: `${CONFIG.CONTRACT_ID}::hamster::mint`,
        arguments: [treasuryCap, mintCap, recipient]
    });

    const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: {
            showEffects: true,
            showEvents: true,
            showBalanceChanges: true,
        },
    });

    return result;
}

async function processWallet(privateKey, index) {
    try {
        const { keypair, client } = await createSigner(privateKey);
        const address = keypair.getPublicKey().toSuiAddress();
        
        console.log(`[Wallet ${index}] Address: ${address}`);
        const coins = await checkBalance(client, address);
        
        for (let i = 0; i < CONFIG.MINT_TIMES; i++) {
            try {
                console.log(`[Wallet ${index}] Mint ${i + 1}/${CONFIG.MINT_TIMES}`);
                const result = await mint({ client, keypair });
                
                if (result.effects?.status?.status === 'success') {
                    const gasUsed = result.effects.gasUsed;
                    const netGasCost = BigInt(gasUsed.computationCost) + 
                                     BigInt(gasUsed.storageCost) - 
                                     BigInt(gasUsed.storageRebate);
                    
                    console.log(`[Wallet ${index}] Success - Tx: ${result.digest}, Gas: ${netGasCost}`);
                } else {
                    console.error(`[Wallet ${index}] Failed - Status: ${result.effects?.status?.status}`);
                }
            } catch (error) {
                console.error(`[Wallet ${index}] Mint ${i + 1} failed:`, error.message);
            }
            
            // 添加随机延迟，避免请求过于集中
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        }
    } catch (error) {
        console.error(`[Wallet ${index}] Error:`, error.message);
    }
}

async function main() {
    try {
        // 读取钱包文件
        const wallets = fs.readFileSync('wallet.txt', 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && line.startsWith('suiprivkey'));
        
        if (wallets.length === 0) {
            throw new Error('No valid wallets found in wallet.txt');
        }
        
        console.log(`Found ${wallets.length} wallet(s)`);
        
        // 并行处理所有钱包
        await Promise.all(wallets.map((privateKey, index) => 
            processWallet(privateKey, index + 1)
        ));
        
        console.log('All tasks completed');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();