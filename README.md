# hyperlane-messaging-cli

```
git clone https://github.com/ungaro/hyperlane-messaging-cli
cd hyperlane-messaging-cli
yarn
yarn build
yarn link
```

now you can use hl to send or search for messages

if you receive `Permission Denied` error when using yarn link, you're probably using nvm.


- get installed nvm-node directory
```
nvm which node // outputs /Users/<YOUR_USER_FOLDER>/.nvm/versions/node/<YOUR_CURRENT_NODE_VERSION>/bin/node
```
Add executable permissions for all users, or just use +x just for the current user.
```
cd /Users/<YOUR_USER_FOLDER>/.nvm/versions/node/<YOUR_CURRENT_NODE_VERSION>/bin/
chmod a+x hl
```
## Sending CrossChain Messages
USAGE

```
hl message send

OPTIONS:
  --origin, -o <str>      - origin chain
  --destination, -d <str> - destination chain
  --message, -m <str>     - message to send
  --recipient, -r <str>   - message recipient
  --private-key, -p <str> - private key
```


  Example Usage: 
  without installing the cli

  `yarn start message send -o goerli -d arbitrumGoerli -m "your message" -r 0x36FdA966CfffF8a9Cdc814f546db0e6378bFef35 -p <YOUR PRIVATE KEY>`
  

  if you have installed cli.

  `hl message send -o goerli -d arbitrumGoerli -m "your message" -r 0x36FdA966CfffF8a9Cdc814f546db0e6378bFef35 -p <YOUR PRIVATE KEY>`


if you're using windows; use:
```
node ./dist/index.js message send -o goerli -d arbitrumGoerli -m "your message" -r 0x36FdA966CfffF8a9Cdc814f546db0e6378bFef35 -p <YOUR PRIVATE KEY>`
```

## Searching messages from a json formatted file


USAGE
```
hl message search

ARGUMENTS:
  <file> - a string

OPTIONS:
  --latest, -l <number> - message count [optional]
```

  Example Usage: 
    without installing the cli

  `yarn start message search src/config/match.json --latest 1000`

  if you have installed cli.

  `hl message search src/config/match.json --latest 1000`

  if you don't provide --latest option, default is to search for 1 million messages.
