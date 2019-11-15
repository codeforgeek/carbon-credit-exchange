const Web3 = require("web3");
const EthereumTx = require('ethereumjs-tx').Transaction;
const axios = require('axios');
const ethNetwork = 'https://rinkeby.infura.io/v3/cdde516ec62c4706ba81e3ef8f265879';
const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));
 
async function transferFund(sendersData, recieverData, amountToSend) {
    //company 0x3bd2e500c697398e821650a561f103fbf2a4a55b
    var nonce = await web3.eth.getTransactionCount(sendersData.address);

    console.log(nonce)
    web3.eth.getBalance(sendersData.address, async (err, result) => {
        if (err) {
            return console.log(err);
        }
        let balance = web3.utils.fromWei(result, "ether");
        console.log(balance + " ETH");
        if(balance < amountToSend) {
            console.log('insufficient funds');
            return;
        }

        let gasPrices = await getCurrentGasPrices();
        let details = {
            "to": recieverData.address,
            "value": web3.utils.toHex(web3.utils.toWei(amountToSend.toString(), 'ether')),
            "gas": 21000,
            "gasPrice": gasPrices.low * 1000000000,
            "nonce": nonce,
            "chainId": 4 // EIP 155 chainId - mainnet: 1, rinkeby: 4
        };
        
        const transaction = new EthereumTx(details, {chain: 'rinkeby'});
        let privateKey = sendersData.privateKey.split('0x');
        let privKey = Buffer.from(privateKey[1],'hex');
        transaction.sign(privKey);
        
        const serializedTransaction = transaction.serialize();
        
        web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, id) => {
            if(err) {
                console.log(err);
                return;
            }
            const url = `https://rinkeby.etherscan.io/tx/${id}`
            console.log(url);
        });
    });
}

async function getCurrentGasPrices() {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
    let prices = {
      low: response.data.safeLow / 10,
      medium: response.data.average / 10,
      high: response.data.fast / 10
    };
    return prices;
}

transferFund({
    address: '0x3bd2e500c697398e821650a561f103fbf2a4a55b',
    privateKey: '0xa8138d83b4a1b1237ba09270d5a4f380052d72bce9e2d9292d9dbcbb3409e9df'
}, {
    address: '0xfe6f69c79910acf714d933df845052aa17386f31'
},0.1);