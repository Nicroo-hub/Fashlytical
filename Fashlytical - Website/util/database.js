//Importing all packages needed
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

//Variable for accessing the MongoDB database
let _db;
let _dbForum;

//Function for connecting to the MongoDB Shop database
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

//Function for connecting to the MongoDB Forum database
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

//Function for checking if the database exists
const getDbShop = () => {
    if (_db) {
        return _db;
    }
    throw 'No Shop database found!';
};

//Function for checking if the database exists
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