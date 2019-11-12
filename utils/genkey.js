const crypto = require('asymmetric-crypto');

function generateKeys() {
    let pair = crypto.keyPair();    
    return {
        privateKey: pair.secretKey,
        publicKey: pair.publicKey
    }
}

module.exports = generateKeys;