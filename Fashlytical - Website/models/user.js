//Importing all packages needed
const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;
const getDbForum = require('../util/database').getDbForum;
const ObjectId = mongodb.ObjectId;
const Product = require('./product');

//User Class
class User {
    //User Constructor
    constructor(username, email, password, cart, id, profilePicture, resetToken, resetTokenExpiration) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.cart = cart; // {items: []}
        this._id = id ? new mongodb.ObjectId(id) : null;
        this.profilePicture = profilePicture;
        this.resetToken = resetToken;
        this.resetTokenExpiration = resetTokenExpiration;
        this.role = "User";
    }

    //User Functions:
    //Function for saving a user to the database
    save() {
        const db = getDb();
        return db.collection('users').insertOne(this);
    };

    //Function for fetching a user's cart
    getCart() {
        const db = getDb();
        const productIds = this.cart.items.map(i => {
            return i.productId;
        });
        return db
            .collection('products')
            .find({ _id: { $in: productIds } })
            .toArray()
            .then(products => {
                return products.map(p => {
                    return {
                        ...p,
                        quantity: this.cart.items.find(i => {
                            return i.productId.toString() === p._id.toString();
                        }).quantity
                    };
                });
            });
    };

    //Function for adding a product to the user's cart
    addToCart(product) {
        const cartProductIndex = this.cart.items.findIndex(cp => {
            return cp.productId.toString() === product._id.toString();
        });
        let newQuantity = 1;
        const updatedCartItems = [...this.cart.items];

        if (cartProductIndex >= 0) {
            newQuantity = this.cart.items[cartProductIndex].quantity + 1;
            updatedCartItems[cartProductIndex].quantity = newQuantity;
        } else {
            updatedCartItems.push({
                productId: new ObjectId(product._id),
                quantity: newQuantity
            });
        }
        const updatedCart = {
            items: updatedCartItems
        };
        const db = getDb();
        return db
            .collection('users')
            .updateOne({ _id: new ObjectId(this._id) }, { $set: { cart: updatedCart } });
    };

    //Function for deleting a product from a user's cart
    deleteItemFromCart(productId) {
        const updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString();
        });
        const db = getDb();
        return db
            .collection('users')
            .updateOne({ _id: new ObjectId(this._id) }, { $set: { cart: { items: updatedCartItems } } });
    }

    //Function for deleting all the products in a user's cart
    emptyCart() {
        const db = getDb();
        return db
            .collection('users')
            .updateOne({ _id: new ObjectId(this._id) }, { $set: { cart: { items: [] } } });
    }

    //Function for adding an order
    addOrder() {
        const db = getDb();
        db.collection('orders').createIndex( { "orderedAt": 1 }, { expireAfterSeconds: 604800 }); // Delete the order after the set number of seconds (1 week)0
        return this.getCart()
            .then(products => {
                let total = 0;
                for (let i = 0; i < products.length; i++) {
                    total += products[i].price * products[i].quantity;
                }
                const order = {
                    orderedAt: new Date(),
                    price: Math.round(total * 100) / 100,
                    items: products,
                    user: {
                        _id: new ObjectId(this._id)
                    }
                };
                return db.collection('orders').insertOne(order);
            })
            .then(result => {
                this.cart = { items: [] };
                return db
                    .collection('users')
                    .updateOne({ _id: new ObjectId(this._id) }, { $set: { cart: { items: [] } } });
            });
    }

    //Function for getting the total price of an order
    getTotalPrice() {
        let total = 0;
        const products = this.cart.items
        var promises = []
        for (let product of products) { promises.push(Product.findById(product.productId)) }
        return Promise.all(promises).then(prods => {
            let count = 0;
            prods.forEach(p => {
                let product = products[count]
                let price = parseFloat(p.price);
                total += price * product.quantity;
                count++;
            })
            return Math.round(total * 100) / 100;
        })
    }

    //Function for fetching all the orders made by a user
    getOrders() {
        const db = getDb();
        return db
            .collection('orders')
            .find({ 'user._id': new ObjectId(this._id) })
            .toArray();
    }

    //Function for getting all the moderators in the list of users
    static getModerators() {
        const db = getDb();
        return db.collection('users').find({ role: "Moderator" }).toArray();
    }

    //Fuction for getting the number of posts which the user has created
    getNumPostsCreated() {
        const db = getDbForum();
        return db.collection('posts').find({ creator: this.username }).count().then(count => {
            return count;
        });
    }

    //Function for getting the number of posts the user has liked
    getLikes() {
        let likes = 0;
        const db = getDbForum();
        return db.collection('posts').find().toArray().then(posts => {
            posts.forEach(post => {
                post.rated.forEach(rated => {
                    if (rated.userId === this._id.toString() && rated.method === "like") {
                        likes += 1;
                    }
                });
            });
            return likes;
        });
    }

    //Function for getting the number of posts the user has disliked
    getDislikes() {
        let dislikes = 0;
        const db = getDbForum();
        return db.collection('posts').find().toArray().then(posts => {
            posts.forEach(post => {
                post.rated.forEach(rated => {
                    if (rated.userId === this._id.toString() && rated.method === "dislike") {
                        dislikes += 1;
                    }
                });
            });
            return dislikes;
        });
    }

    //Function for fetching a single user by his id
    static findById(userId) {
        const db = getDb();
        return db
            .collection('users')
            .findOne({ _id: new ObjectId(userId) })
            .then(user => {
                return user;
            })
            .catch(err => {
                console.log(err);
            });
    }
}

// export the User class
module.exports = User;