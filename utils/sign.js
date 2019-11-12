const crypto = require('asymmetric-crypto');

function encryptEmail(data, pair) {
    try {
        let encryptedEmail = crypto.encrypt(data, pair.publicKey, pair.privateKey);
        return encryptedEmail;
    }
    catch(e) {
        console.log('error occurred in encrypting email');
        return null;        
    }
}

module.exports = encryptEmail;