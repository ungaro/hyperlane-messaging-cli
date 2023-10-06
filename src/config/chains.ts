//HYPERLANE MESSAGING CONTRACTS
//
import fs from "fs";
import path from "path";
import type { Chain } from "viem/chains";
import {
  arbitrum,
  arbitrumGoerli,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  celo,
  celoAlfajores,
  gnosis,
  goerli,
  mainnet,
  moonbaseAlpha,
  moonbeam,
  optimism,
  optimismGoerli,
  polygon,
  polygonMumbai,
  sepolia,
} from "viem/chains";

interface ChainInfo {
  [key: string]: Chain;
}




export function contractAdresses() {
  const chainsPath = path.join(process.cwd(), "./src/config/contracts.json");
  try {
    const chainsData = JSON.parse(fs.readFileSync(chainsPath, {
      encoding: "utf8",
      flag: "r",
    }));
    return chainsData;
  } catch (error) {
    console.error('Error parsing JSON data from contracts.json:', error);
    return {}; // Return an empty object or handle the error as needed
  }
}
export function chainsList() {
  const chainInfo: ChainInfo = {};

  chainInfo["mainnet"] = mainnet;
  chainInfo["celo"] = celo;
  chainInfo["avalanche"] = avalanche;
  chainInfo["avalancheFuji"] = avalancheFuji;
  chainInfo["polygon"] = polygon;
  chainInfo["bsc"] = bsc;
  chainInfo["arbitrum"] = arbitrum;
  chainInfo["optimism"] = optimism;
  chainInfo["moonbeam"] = moonbeam;
  chainInfo["gnosis"] = gnosis;
  chainInfo["celoAlfajores"] = celoAlfajores;
  chainInfo["polygonMumbai"] = polygonMumbai;
  chainInfo["bscTestnet"] = bscTestnet;
  chainInfo["goerli"] = goerli;
  chainInfo["moonbaseAlpha"] = moonbaseAlpha;
  chainInfo["optimismGoerli"] = optimismGoerli;
  chainInfo["sepolia"] = sepolia;
  chainInfo["arbitrumGoerli"] = arbitrumGoerli;

  return chainInfo;
}



