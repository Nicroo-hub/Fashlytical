//Importing all packages needed
const getDb = require('../util/database').getDb;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

//Rating Class
class Rating { 
    //Constructor Function for a Rating
    constructor(productId, productName, userId, stars, id) {
        this.productId = productId;
        this.productName = productName;
        this.userId = userId;
        this.stars = stars;
        this._id = id ? mongodb.ObjectId(id) : null;
    }

    // Save a rating to the database
    save() {
        const db = getDb();
        let dbOp;
        if (this._id) {
            dbOp = db.collection('ratings').updateOne({ _id: this._id }, { $set: this });
        } else {
            dbOp = db.collection('ratings').insertOne(this);
        }
        return dbOp;
    };

    // Find a rating by id  
    static findById(ratingId) {
        const db = getDb();
        return db
            .collection('ratings')
            .findOne({ _id: new ObjectId(ratingId) })
            .then(rating => {
                return rating;
            })
            .catch(err => {
                console.log(err);
            });
    }

    // Update a rating
    updateRating(stars) {
        this.stars = parseInt(stars);
        return this.save();
    }
}

// export the Rating class
module.exports = Rating;