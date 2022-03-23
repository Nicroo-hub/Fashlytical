//Importing all packages needed
const Moderator = require('../models/moderator');
const getDb = require('../util/database').getDb;
const mongodb = require('mongodb');

//Admin Class
class Admin extends Moderator {
    //Admin Constructor
    constructor(username, email, password, cart, id, profilePicture, resetToken, resetTokenExpiration) {
        super(username, email, password, cart, id, profilePicture, resetToken, resetTokenExpiration);
        this.role = "Admin";
    }

    //Admin Functions:
    //Function for saving an admin to the database
    save() {
        const db = getDb();
        return db.collection('users').insertOne(this);
    };

    //Function for removing a product in the shop
    static deleteProduct(productId) {
        const db = getDb();
        return db.collection('products').deleteOne({ _id: new mongodb.ObjectId(productId) });
    }

    //Function for updating a product in the shop
    static updateProduct(productId, title, price, description, imagePath, rating) {
        const db = getDb();
        return db.collection('products').updateOne({ _id: new mongodb.ObjectId(productId) }, { $set: { title: title, price: price, description: description, imagePath: imagePath, rating: rating } });
    }
}

// export the Admin class
module.exports = Admin;