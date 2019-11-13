const IPFS = require('ipfs-api');
const OrbitDB = require('orbit-db');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');
const fs = require('fs');
const Identities = require('orbit-db-identity-provider');
const ethWallet = require('ethereumjs-wallet');

// load all dbs
let filePath = './dbaddress.js';
let userDb = null;
let propertiesDb = null;
let realtimeListDb = null;

async function loadDB() {
    const ipfsOptions = {
        EXPERIMENTAL: {
            pubsub: true
        },
        relay: {
            enabled: true, hop: {
                enabled: true, active: true
            }
        },
        host: 'localhost',
        port: '5001'
    };
    
    // create identity
    const IdOptions = { id: 'local-id'};
    var identity = await Identities.createIdentity(IdOptions);
    
    // Create IPFS instance
    const ipfs = new IPFS(ipfsOptions);
    const orbitdb = new OrbitDB(ipfs, identity);
    
    console.log('loading the databases');
    try {
        //loads all db
        fs.access(filePath, fs.F_OK, async (err) => {
            if(err) {
                // file does not exists
                // create databases and create file
                console.log('Databases does not exists, this is a genesis peer\n');
                console.log('Creating databases and path files\n');
                // create dbs
                userDb = await orbitdb.create('cc.user', 'docstore', {
                    accessController: {
                        write: ['*']
                    }                    
                });

                propertiesDb = await orbitdb.create('cc.propertylist', 'docstore', {
                    accessController: {
                        write: ['*']
                    }   
                });

                realtimeListDb = await orbitdb.create('cc.creditrealtimelist', 'docstore', {
                    accessController: {
                        write: ['*']
                    }   
                });
                let fileContents = {
                    "user": userDb.address.toString(),
                    "propertylist": propertiesDb.address.toString(),
                    "creditrealtimelist": realtimeListDb.address.toString()
                }
                // write the db file
                fs.writeFileSync(filePath, JSON.stringify(fileContents));
                console.log('database peer file created, loading them in memory');
            } else {
                // file exists, load the databases
                let fileData = fs.readFileSync(filePath,'utf-8');
                let config = JSON.parse(fileData);
                console.log('Databases exists, loading them in memory\n');
                userDb = await orbitdb.open(config.user);
                propertiesDb = await orbitdb.open(config.propertylist);
                realtimeListDb = await orbitdb.open(config.creditrealtimelist);
            }

            // load the local store of the data
            userDb.events.on('ready', () => {
                console.log('user database is ready.');
            });

            userDb.events.on('replicate.progress', (address, hash, entry, progress, have) => {
                console.log('user database replication is in progress');
            });

            userDb.events.on('replicated', (address) => {
                console.log('user database replication done.');
            });

            propertiesDb.events.on('ready', () => {
                console.log('properties database is ready.')
            });

            propertiesDb.events.on('replicate.progress', (address, hash, entry, progress, have) => {
                console.log('properties database replication is in progress');
            });

            propertiesDb.events.on('replicated', (address) => {
                console.log('properties database replication done.');
            });

            realtimeListDb.events.on('ready', () => {
                console.log('credit database is ready.')
            });

            realtimeListDb.events.on('replicate.progress', (address, hash, entry, progress, have) => {
                console.log('credit database replication is in progress');
            });

            realtimeListDb.events.on('replicated', (address) => {
                console.log('credit databse replication done.');
            });
            userDb.load();
            propertiesDb.load();
            realtimeListDb.load();
        });
    }
    catch (e) {
        console.log(e);
    }
}

// load the database
loadDB();

async function addUser(requestData) {
    try {
        let id = uuid();
        let password = bcrypt.hashSync(requestData.password, 10);
        let addressData = ethWallet.generate();
        let data = {
            _id: id,
            email: requestData.email,
            password: password,
            accountAddress: addressData.getAddressString(),
            privateKey: addressData.getPrivateKeyString(),
            role: requestData.role,
            balance: 0,
            carbonCredit: 0,
            time: Date.now()
        };
        let hash = await userDb.put(data);
        console.log(hash);
        let userData = userDb.get(id);
        console.log(userData);
        return {
            "error": false,
            "hash": hash,
            "data": userData[0]
        }
    }
    catch (e) {
        console.log(e);
        return {
            "error": true,
            "hash": null,
            "data": null
        }
    }
}

async function login(data) {
    try {
        let userData = await getUserByEmail(data.email);
        if (bcrypt.compareSync(data.password, userData[0].password)) {
            // correct password
            return {
                "error": false,
                "data": {
                    "userId": userData[0]['_id'],
                    "email": userData[0]['email'],
                    "accountAddress": userData[0]['accountAddress'],
                    "balance": userData[0]['balance'],
                    "carbonCredit": userData[0]['carbonCredit']
                },
                "message": "user logged in successfully."
            }
        } else {
            return {
                "error": true,
                "data": null,
                "message": "password does not match"
            }
        }
    }
    catch (e) {
        console.log(e)
        return {
            "error": true,
            "data": null,
            "message": "error occurred during login"
        }
    }
}

async function getListing() {
    try {
        let creditData = propertiesDb.query((doc) => doc);
        return {
            "error": false,
            "data": creditData,
            "message": "Success"
        };
    }
    catch (e) {
        return {
            "error": true,
            "data": null,
            "message": "failure"
        };
    }
}

async function getMyListing(data) {
    try {
        let creditData = propertiesDb.query((doc) => doc.email === data.email);
        return {
            "error": false,
            "data": creditData,
            "message": "Success"
        };
    }
    catch (e) {
        return {
            "error": true,
            "data": null,
            "message": "failure"
        };
    }
}

async function getCreditData() {
    try {
        let listingData = realtimeListDb.query((doc) => doc);
        return {
            "error": false,
            "data": listingData,
            "message": "Success"
        };
    }
    catch (e) {
        return {
            "error": true,
            "data": null,
            "message": "failure"
        };
    }
}

async function getCompanyCredit(data) {
    try {
        let listingData = realtimeListDb.query((doc) => doc.email === data.email);
        return {
            "error": false,
            "data": listingData,
            "message": "Success"
        };
    }
    catch (e) {
        return {
            "error": true,
            "data": null,
            "message": "failure"
        };
    }
}


async function getUserByEmail(email) {
    let data = userDb.query((doc) => doc.email === email);
    return data;
}

async function checkUserEmail(data) {
    try {
        let userData = await getUserByEmail(data.email);
        if (userData.length == 0) {
            return {
                "error": false,
                "data": null,
                "message": "email does not exists."
            } 
        } else {
            // email present
            return {
                "error": true,
                "data": null,
                "message": "email already exists."
            }
        }
    }
    catch (e) {
        console.log(e)
        return {
            "error": true,
            "data": null,
            "message": "error occurred during email presence check."
        }
    }
}



module.exports = {
    addUser: addUser,
    login: login,
    checkUserEmail: checkUserEmail,
    getListing: getListing,
    getCreditData: getCreditData,
    getCompanyCredit: getCompanyCredit,
    getMyListing: getMyListing
};