//HYPERLANE MESSAGING CONTRACTS
//
import fs from "fs";
import path from "path";
import type { PrivateKeyAccount } from "viem";
import { createPublicClient, pad, parseAbiItem, parseGwei } from "viem";
import type { Chain } from "viem/chains";

import { createWalletClient, getContract, http } from "viem";

import chalkAnimation from "chalk-animation";
import { privateKeyToAccount } from "viem/accounts";
import { chainsList, contractAdresses } from "../config/chains.js";
import { fromHex, toHex, trim } from "viem";

export type MatchingList = MatchingListElement[];

export interface MatchingListElement {
  originDomain?: "*" | number | number[];
  senderAddress?: "*" | string | string[];
  destinationDomain?: "*" | number | number[];
  recipientAddress?: "*" | string | string[];
}

interface ChainInfo {
  [key: string]: Chain;
}



export class HyperlaneAPI {
  private _account!: PrivateKeyAccount;
  _chainsList:ChainInfo;
  _contractAddresses:any;
  recipientAbi:any;
  igpAbi:any;
  messageboxAbi:any;
  matchingList!: MatchingList ;

  constructor() {
    this._chainsList = chainsList();
    this._contractAddresses = contractAdresses();
    try {
      const mailboxAbiPath = path.join(process.cwd(),"./src/config/abi/mailbox.json");
      const recipientAbiPath = path.join(process.cwd(),"./src/config/abi/recipient.json");
      const igpAbiPath = path.join(process.cwd(), "./src/config/abi/igp.json");
      const matchingListPath = path.join(process.cwd(), "./src/config/match.json");
      const mailboxData = fs.readFileSync(mailboxAbiPath, { encoding: "utf8", flag: "r" });
      const igpData = fs.readFileSync(igpAbiPath, { encoding: "utf8", flag: "r" });
      const recipientData = fs.readFileSync(igpAbiPath, {encoding: "utf8",flag: "r",});
      const matchingListData = fs.readFileSync(matchingListPath, {encoding: "utf8",flag: "r",});

      this.recipientAbi = JSON.parse(recipientData);
      this.igpAbi = JSON.parse(igpData);
      this.matchingList = JSON.parse(matchingListData);
      this.messageboxAbi = JSON.parse(mailboxData);
    } catch (error) {
      console.error('Error parsing JSON data from files:', error);
    }

  }
  // Setter for the private account property
  setAccount(pk: string) {
    this._account = privateKeyToAccount(`0x${pk}`);
  }

  // Getter for the private account property
  getAccount(): PrivateKeyAccount {
    return this._account;
  }


  public async  payforGas(
  orig: string,
  dest: string,
  recipient: string,
  messageId: string
) {
  const ca = this._contractAddresses["igp"][orig]["contractAddress"];
  const account = this.getAccount(); // Get the account
  const walletClient = createWalletClient({
    account,
    chain: this._chainsList[orig],
    transport: http(),
  });
  const publicClient = createPublicClient({
    chain: this._chainsList[orig],
    transport: http(),
  });

  const contract = getContract({
    address: ca,
    abi: this.igpAbi,
    publicClient,
    walletClient,
  });

  const txResponse = await contract.read.quoteGasPayment([
    this._chainsList[dest].id,
    550000,
  ]);

  const gasPayment = Math.ceil(parseInt(txResponse.toString()) / 1000000000);

  const hash = await walletClient.writeContract({
    address: ca,
    abi: this.igpAbi,
    functionName: "payForGas",
    args: [
      messageId as `0x${string}`,
      this._chainsList[dest].id,
      550000,
      account.address,
    ],
    value: parseGwei(gasPayment.toString()),
    account,
  });


  console.log("Gas Payment made for message", hash);
  this.checkDelivery(dest, recipient);

}



public async checkDelivery(dest: string, recipient: string) {

const account =  this.getAccount();

    const publicClient = createPublicClient({
      chain: this._chainsList[dest],
      transport: http(),
    });
  
    const walletClient = createWalletClient({
      account,
      chain: this._chainsList[dest],
      transport: http(),
    });
  
    console.log("PARAMETERS", recipient);
  
    const contract = getContract({
      address: recipient as `0x${string}`,
      abi: this.recipientAbi,
      publicClient,
      walletClient,
    });
  
    const rainbowDelivery = chalkAnimation.pulse(
      "==============checking for message delivery=============="
    );
  
    const receivedMessageUnwatch = contract.watchEvent.ReceivedMessage(
      {
        batch: false,
      },
      {
        onLogs: (logs: any) => {
          console.log("CHECKDELIVERY_LOGS", logs);
          rainbowDelivery.stop();
          receivedMessageUnwatch();
        },
      }
    );
  
  }
  

  public async  sendMessage(
    orig: string,
    dest: string,
    recipient: string,
    message: string,
  ) {
    const account =  this.getAccount();

    console.log("PARAMS___", orig, dest, recipient, message);
  
    console.log("Using Account:", account.address);
  
    const walletClient = createWalletClient({
      account,
      chain: this._chainsList[orig],
      transport: http(),
    });
  
    const publicClient = createPublicClient({
      chain: this._chainsList[orig],
      transport: http(),
    });
  
    const contract = getContract({
      address: this._contractAddresses["messagebox"][orig]["contractAddress"],
      abi: this.messageboxAbi,
      publicClient,
      walletClient,
    });
    //console.log("CONTRACT_address",_contractAddresses['messagebox'][orig]['contractAddress']);
  
    console.log(
      "PARAMETERS",
      this._chainsList[dest]["id"],
      this._contractAddresses["messagebox"][dest]["contractAddress"],
      message
    );
  
    console.log(
      "Using IGP for ",
      orig,
      ":",
      this._contractAddresses["igp"][orig]["contractAddress"]
    );
  
    const txResponse = await contract.write.dispatch([
      this._chainsList[dest]["id"],
      pad(recipient as `0x${string}`),
      message,
    ]);
    //      console.log("HASH_",txResponse);
    //console.log("EXPLORER_URL",_chainsList[dest]['blockExplorers']['etherscan'][' url']) ;
    console.log("=======================================");
  
    //const explorer = _chainsList[dest]['blockExplorers']['etherscan'][' url'] ;
    console.log(`Message dispatched with tx hash: Explorer/${txResponse}`);
  
    const rainbow = chalkAnimation.pulse(
      "==============checking for messageid=============="
    );
  
    
    // @ts-ignore
    const unwatch = contract.watchEvent.DispatchId(
      {
        batch: false,
      },
      {
        onLogs: (logs: any) => {

  
            logs.forEach((value: any) => {

            if (value.args["messageId"]) {
              var messageId = value.args["messageId"];
              console.log(`MESSAGE ID FOUND: ${messageId}`);
  
              console.log(
                `Check your message on HYPERLANE explorer: https://explorer.hyperlane.xyz/?search=${messageId}`
              );
  
              rainbow.stop(); // Animation stops\
              this.payforGas(orig, dest, recipient, messageId);
              unwatch(); // Exit the callback
  
            }
          });
        },
      }
    );
    return;
  
  }
  
  

  public async  getMessages(
    origChain: number,
    destChain: number,
    senderAddress: `0x${string}`,
    recipientAddress: `0x${string}`,
    limit: number
  ) {
    
    // DESCRIPTION: Due to the utilization of asynchronous methods within this class, output is buffered, and the console output is generated once processing has been successfully completed.
    var output = "";
    var count=0;
    
    const origin = this.getChainById(origChain);

    if (destChain != undefined) {
      const destination = this.getChainById(destChain);
    }
  
    const originNetwork = origin?.network;
    const messageboxContractAddress: string =
      this._contractAddresses["messagebox"][originNetwork as string][
        "contractAddress"
      ];
    var allItems = [];
    const publicClient = createPublicClient({
      chain: origin,
      transport: http(),
    });
  
    let remainingLoops = limit;
    let latestBlockNumber = await publicClient.getBlockNumber();
  
    output =
      output +
      "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n";
    output =
      output +
      "PARAMETERS: \n" +
      "Originating CHAIN: " +
      origChain +
      "\nDestination CHAIN: " +
      destChain +
      "\nSender Address: " +
      senderAddress +
      "\nRecipient Address: " +
      recipientAddress +
      "\nLIMIT: " +
      limit +
      "\n";
  
    while (remainingLoops > 0) {
  
      try {
     
  
        const loopsInThisStep = Math.min(1000, remainingLoops);
        output = output + "------------------------------------------ \n";
        output =
          output +
          `Getting ${loopsInThisStep} items on ${originNetwork} ending with ${latestBlockNumber} number \n`;
        output = output + "Remaining Blocks:" + remainingLoops + "\n";
        output = output + "------------------------------------------ \n";
  
  
        let loopsInThisStepInt = BigInt(loopsInThisStep);
  
        let logs;
        if (senderAddress != undefined) {
           logs = await publicClient.getLogs({
            address: messageboxContractAddress as `0x${string}`,
            event: parseAbiItem(
              "event Dispatch(address indexed,uint32 indexed,bytes32 indexed,bytes)"
            ),
            args: {
              from: senderAddress as `0x${string}`,
              to: messageboxContractAddress as `0x${string}`,
            } as any,
            fromBlock: latestBlockNumber - loopsInThisStepInt,
            toBlock: latestBlockNumber,
          });
        } else {
          logs = await publicClient.getLogs({
            address: messageboxContractAddress as `0x${string}`,
            event: parseAbiItem(
              "event Dispatch(address indexed,uint32 indexed,bytes32 indexed,bytes)"
            ),
            fromBlock: latestBlockNumber - loopsInThisStepInt,
            toBlock: latestBlockNumber,
          });
        }
  
  
        logs.forEach(function (item: any) {
          let logAdded=false;
  
          var address = trim(item.args[2]);
          var addressstring = fromHex(toHex(address), "string");
          addressstring = addressstring.replace("0x", "");
          var argDestChain = item.args[1];
          var data = item.args[3];
          let array = data.split(addressstring);

          
  // we have already checked origindomain and senderaddress
  // now we need to make sure any combination of recipientaddress and destchain is handled        
  
  //if both recipientAddress & destChain are undefined
  if (recipientAddress != undefined && destChain != undefined){
  
    let wantedChain = fromHex(item.topics[2], "number");
    let wantedRecipient = trim(item.topics[3].slice(2)).toString();
  
    if (destChain == wantedChain && recipientAddress.toLowerCase() == wantedRecipient){
      output =
      output +
      "\nPayload:" +
      JSON.stringify(
        item,
        (key, value) =>
          typeof value === "bigint" ? value.toString() : value // handle bigint in json, return everything else unchanged
      ) +
      "\n";
      logAdded=true;
      count++;
  
    }
  
  }else{
  

        //maybe recipientAddress & destChain are both undefined

        if (destChain == undefined && recipientAddress == undefined && logAdded==false) {
  
          let messageHex = array[1];
          if (messageHex != undefined && logAdded==false) {
            let message = fromHex(`0x${messageHex}`, "string");
            output = output + "------------------------------------------ \n";
  
            output = output + "MESSAGE:" + message + "\n";
            output =
              output +
              "\nPayload:" +
              JSON.stringify(
                item,
                (key, value) =>
                  typeof value === "bigint" ? value.toString() : value // handle bigint in json, return everything else unchanged
              ) +
              "\n";
              logAdded=true;
              count++;
          }

      }


    //if both of recipientAddress & destChain are not undefined, only recipientAddress might be undefined
          if (recipientAddress != undefined && logAdded==false) {
            output = output + "___recipientAddress______\n"
  
            if (recipientAddress == trim(item.topics[3].slice(2)) ){
  
              output =
              output +
              "\nPayload:" +
              JSON.stringify(
                item,
                (key, value) =>
                  typeof value === "bigint" ? value.toString() : value // handle bigint in json, return everything else unchanged
              ) +
              "\n";
              logAdded=true;
              count++;
            }      }
  
      //if both of recipientAddress & destChain are not undefined, only destChain might be undefined

          if (destChain != undefined && logAdded==false) {
            console.log("DestCHAIN",fromHex(item.topics[2], "number"));
            output = output + "___destChain______\n"
  
            if (destChain == fromHex(item.topics[2], "number")){
              output =
              output +
              "\nPayload:" +
              JSON.stringify(
                item,
                (key, value) =>
                  typeof value === "bigint" ? value.toString() : value // handle bigint in json, return everything else unchanged
              ) +
              "\n";
              logAdded=true;
              count++;
            }
          
          }
  

      }
  
        });
  
        remainingLoops -= loopsInThisStep;
        output = output + `REMAINING ITEMS FOR ${origChain} -> ${destChain}: ${remainingLoops}\n`;

        latestBlockNumber -= loopsInThisStepInt;
      } catch (e) {
        console.log("ERROR", e);
      }
    }
    output = output + "Found Items: " + count + "\n";
  
    console.log(output);
  
  }
  



   public getChainById(id: number): Chain | undefined {
    for (const chainName in this._chainsList) {
      if (this._chainsList.hasOwnProperty(chainName)) {
        const chain = this._chainsList[chainName];
        if (chain.id === id) {
          return chain; // Return the chain object with matching id
        }
      }
    }
    return undefined; // Return undefined if no matching id is found
  }

  public async  searchMessages(file: string, limit: number) {
  
    const matchData = fs.readFileSync(file, { encoding: "utf8", flag: "r" });
    const matchDataJson = JSON.parse(matchData);
    const matchingListObj = matchDataJson[0].matchinglist;
  
    matchingListObj.forEach((item: any, key: any) => {
      this.getMessages(
        item?.originDomain,
        item?.destinationDomain,
        item?.senderAddress,
        item?.recipientAddress,
        limit
      );
    });
   
  }
  


}



