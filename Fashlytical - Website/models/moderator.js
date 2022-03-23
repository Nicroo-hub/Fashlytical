//Importing all packages needed
const User = require('../models/user');
const getDb = require('../util/database').getDb;
const getDbForum = require('../util/database').getDbForum;

//Moderator Class
class Moderator extends User {
    //Moderator Constructor
    constructor(username, email, password, cart, id, profilePicture, resetToken, resetTokenExpiration) {
        super(username, email, password, cart, id, profilePicture, resetToken, resetTokenExpiration);
        this.role = "Moderator";
    }

    //Moderator Functions:
    //Function for saving a moderator to the database
    save() {
        const db = getDb();
        return db.collection('users').insertOne(this);
    };

    //Fuction for getting the number of topics which the moderator/admin has created
    getNumTopicsCreated() {
        const db = getDbForum();
        return db.collection('topics').find({ creator: this.username }).count().then(count => {
            return count;
        });
    }
}

// export the Moderator class
module.exports = Moderator;