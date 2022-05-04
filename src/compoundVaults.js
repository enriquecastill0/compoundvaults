import dotenv from "dotenv";
dotenv.config({path: "../.env"});
import { ethers } from 'ethers';
import VaultChef from './constants/vaultChef.js';
import StrategyABI from './strategySushi.js' ;
dotenv.config();

const botPrivateKey = process.env.PRIVATE_KEY;

const polygonProvider = new ethers.providers.JsonRpcProvider(
    'https://polygon-rpc.com'
  );

 
const botWallet = new ethers.Wallet(botPrivateKey, polygonProvider);
const VAULT_CHEF_ADDRESS = '0x9B95F4B6f7C8F9f306a65fA835461b4eF7070Bd4'; 
async function main(){
console.log(`COMPOUND SCRIPT EXECUTION STARTED AT ${new Date()}`);
  const vaultChef = new ethers.Contract(
    VAULT_CHEF_ADDRESS,
    VaultChef,
    polygonProvider
  );
  console.log(`FETCHING LENGTH OF POOLS `);
  const poolLengthResponse = await vaultChef.poolLength();
  const poolLength = parseInt(poolLengthResponse.toString());
  console.log(`THERE ARE ${poolLength} in VaultChef`);

  const requestsForStrategyAddresses = [];

  for (let i = 1; i < poolLength; i++) {
    requestsForStrategyAddresses.push(vaultChef.poolInfo(i));
  }
  console.log(`MAPPING VAULTCHEF POOLS`);
  const strategiesData = await Promise.all(
    requestsForStrategyAddresses
  );
  const strategiesAddresses = strategiesData.map((strategy) => strategy.strat);

  console.log(`STARTING TO EARN()`);
  console.log('POLYGON GAS PRICE: ');
  const gasPrice = await polygonProvider.getGasPrice();
  

  let index = 1;
  for await (const strategyAddress of strategiesAddresses) {
    const stratContract = new ethers.Contract(
      strategyAddress,
      StrategyABI,
      botWallet
    );
    console.log(`EXECUTING EARN() ON VAULT ${index}: `);
    const options = { gasPrice: gasPrice };
    const tx = await stratContract.earn(options);
    try {
      await tx.wait();
      console.log();
      console.log(`EARN() WAS EXECUTED ON VAULT ${index} WAITING FOR MINING `);
      console.log(`VAULT ${index} was compounded`);
    } catch (e) {
      console.log('Earn Failed at Vault: ' + index);
    }
    index++;
  }


}

main().then(()=> console.log("SCRIPT EXECUTION FINISHED")).catch(() => console.log("SCRIPT EXECUTION END WITH ERRORS.")); 