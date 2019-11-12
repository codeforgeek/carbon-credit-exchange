const crypto = require('asymmetric-crypto');

function decryptEmail(emailData, keys) {
    try {
        let result = crypto.decrypt(emailData.email, emailData.signature, keys.senderPublicKey, keys.privateKey);
        return result;
    }
    catch(e) {
        console.log(e);
        return null;
    }
}

module.exports = decryptEmail;