//Importing all packages needed
const getDb = require('../util/database').getDb;
const mongodb = require('mongodb');

//Product Class
class Product {
    //Product Constructor
    constructor(title, price, description, imagePath, rating, id) {
        this.title = title;
        this.price = price;
        this.description = description;
        this.imagePath = imagePath;
        this.rating = rating;
        this._id = id ? new mongodb.ObjectId(id) : null;
    }
    //Product Functions:
    //Function for saving a product to the database
    save() {
        //Will be changed to work with Katriel's API
        const db = getDb();
        let dbOp;
        if (this._id) {
            dbOp = db.collection('products').updateOne({ _id: this._id }, { $set: this });
        } else {
            dbOp = db.collection('products').insertOne(this);
        }
        return dbOp;
    }

    //Function for fetching all products from the database
    static fetchAll() {
        const db = getDb();
        return db
            .collection('products')
            .find()
            .toArray()
            .then(products => {
                return products;
            })
            .catch(err => {
                console.log(err);
            });
    }

    //Function for finding a single product by its id
    static findById(prodId) {
        const db = getDb();
        return db
            .collection('products')
            .find({ _id: new mongodb.ObjectId(prodId) })
            .next()
            .then(product => {
                return product;
            })
            .catch(err => {
                console.log(err);
            });
    }

    //Function for deleting a single product by its id
    static deleteById(prodId) {
        const db = getDb();
        return db
            .collection('products')
            .deleteOne({ _id: new mongodb.ObjectId(prodId) })
            .then(result => {
                console.log('Deleted');
            })
            .catch(err => {
                console.log(err);
            });
    }

    //Function for updating the rating of a product
    UpdateRating() {
        const db = getDb();
        let totalRating = 0;
        let totalRatingCount = 0;
        return db.collection('ratings').find().toArray().then(ratings => {
            ratings.forEach(rating => {
                if (rating.productId === this._id.toString()) {
                    totalRatingCount += 1;
                    totalRating += parseInt(rating.stars);
                }
            });
            if (totalRatingCount === 0) {
                this.rating = 0;
                return this.save();
            } else {
                this.rating = parseFloat(totalRating / totalRatingCount).toFixed(1);
                return this.save();
            }
        });
    }
}

// export the Product class
module.exports = Product;