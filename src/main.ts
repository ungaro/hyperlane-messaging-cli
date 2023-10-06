import { command, number, option, positional, run, string, subcommands } from "cmd-ts";
import fs from "fs";
import path from "path";
import { chainsList } from "./config/chains.js";
import { HyperlaneAPI } from "./utils/hyperlane.js";

import chalk from 'chalk';
import figlet from 'figlet';
import { toHex } from "viem";

export async function HyperlaneMessaging(): Promise<void> {

console.log(chalk.hex("#2362c0")(
    figlet.textSync(" Hyperlane CLI", { font: "Big", horizontalLayout: "full" })
  ));

console.log("USAGE");

const send = command({
  name: "Hyperlance Send Message",
  args: {
    orig: option({
      type: string,
      long: "origin",
      short: "o",
      description: "origin chain",
    }),
    dest: option({
      type: string,
      long: "destination",
      short: "d",
      description: "destination chain",
    }),
    message: option({
      type: string,
      long: "message",
      short: "m",
      description: "message to send",
    }),
    recipient: option({
      type: string,
      long: "recipient",
      short: "r",
      description: "message recipient",
    }),
    pk: option({
      type: string,
      long: "private-key",
      short: "p",
      description: "private key",
    }),
  },
  handler: ({ ...args }) => {
    console.log({ ...args });
    const _chainsList = chainsList();

    if (!_chainsList[args.orig]) {
      console.log("Unsupported origin chain");
    }
    if (!_chainsList[args.dest]) {
      console.log("Unsupported destination chain");
    }

    try {
      const hl = new HyperlaneAPI();
      hl.setAccount(args.pk);

      hl.sendMessage(args.orig, args.dest,args.recipient, toHex(args.message));
    } catch (err) {
      console.error("Error dispatching message:", err);
    }
  },
});
const search = command({
  name: "search",
  args: {
    file: positional({ type: string, displayName: 'file' }),
    messageCount: option({
      type: number,
      long: "latest",
      short: "l",
      description: "message count",
      defaultValue: () =>  1000000
    }),
  },
  handler: ({ ...args }) => {
    console.log({ args });
    const matchFile = path.join(process.cwd(),args.file);
    if (!fs.existsSync(matchFile)) {
      throw new Error('File not found');
    }else{
      console.log("ARGS",args)
      console.log("----------------------SEARCHING MESSAGES----------------------");
      const hl = new HyperlaneAPI();

      hl.searchMessages(matchFile,args.messageCount);
    }

    
  },
});

const message = subcommands({
  name: "message",
  cmds: { send, search },
});

const hl_cli = subcommands({
  name: "hl",
  cmds: { message },
});

run(hl_cli, process.argv.slice(2));
}
