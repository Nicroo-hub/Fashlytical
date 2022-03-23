//Importing all packages needed
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

// Database variables
let _db;
let _dbForum;

//Function for connecting to the Shop database
const mongoConnectShop = callback => {
    MongoClient.connect(
            'mongodb+srv://Secondary:S87Q25LD@cluster0.9kcfe.mongodb.net/Fashlytical-Shop?retryWrites=true&w=majority'
        )
        .then(client => {
            console.log('Connected To the Shop Database!');
            _db = client.db();
            callback();
        })
        .catch(err => {
            console.log(err);
            throw err;
        });
};

//Function for connecting to the Forum database
const mongoConnectForum = callback => {
    MongoClient.connect(
            'mongodb+srv://Secondary:S87Q25LD@cluster0.9kcfe.mongodb.net/Fashlytical-Forum?retryWrites=true&w=majority'
        )
        .then(client => {
            console.log('Connected To the Forum Database!');
            _dbForum = client.db();
            callback();
        })
        .catch(err => {
            console.log(err);
            throw err;
        });
};

//Helping function for the main connection function (shows if database exists)
const getDbShop = () => {
    if (_db) {
        return _db;
    }
    throw 'No Shop database found!';
};

//Helping function for the main connection function (shows if database exists)
const getDbForum = () => {
    if (_dbForum) {
        return _dbForum;
    }
    throw 'No Forum database found!';
};

// export the functions
exports.mongoConnectShop = mongoConnectShop;
exports.mongoConnectForum = mongoConnectForum;
exports.getDb = getDbShop;
exports.getDbForum = getDbForum;