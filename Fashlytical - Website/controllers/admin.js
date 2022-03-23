//Importing all packages needed
const Product = require('../models/product');
const User = require('../models/user');
const Moderator = require('../models/moderator');
const Admin = require('../models/admin');
const getDb = require('../util/database').getDb;
const getDbForum = require('../util/database').getDbForum;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

//Function for loading the page for managing the website
exports.getManageProducts = (req, res, next) => {
    var page = req.query.page ? req.query.page : 1;
    page = parseInt(page);
    if (page < 1) {
        page = 1;
    }
    if (req.user && req.user.role === "Admin") {
        Product.fetchAll().then(products => {
            products.forEach(product => {
                product.title = product.title.substring(0,25).toLowerCase();
            });
            if (page * 9 - products.length >= 9) {
                page--;
            }
            let prods = products.slice((page - 1) * 9, page * 9);
            res.render('admin/manageproducts', {
                pageTitle: 'Manage Products',
                path: '/manageproducts',
                products: prods,
                nextPage: parseInt(page) + 1,
                previousPage: parseInt(page) - 1
            });
        });
    } else {
        res.redirect('/login');
    }
};

//Function for importing a product into the shop
exports.postImportProduct = (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const imagePath = req.file.path.replace('public\\', '');
    let rating = 0;
    const product = new Product(
        title,
        price,
        description,
        imagePath,
        rating
    );
    product
        .save()
        .then(result => {
            console.log('Imported Product');
            res.redirect('/manageproducts');
        })
        .catch(err => {
            console.log(err);
        }); 
}; 

//Function for handling the products in the shop (removing/updating)
exports.handleProducts = (req, res, next) => {
    const db = getDb();
    if (req.body.method === "Delete") {
        //Delete the product in the database and in all carts of users if they have it there.
        db.collection('users').find({}).toArray().then(users => {
            users.forEach(user => {
                user.cart.items.forEach(product => {
                    if(product.productId == req.body.productId) {
                        user.cart.items.splice(user.cart.items.indexOf(ObjectId(product.productId)), 1);
                    }
                    db.collection('users').updateOne({ _id: ObjectId(user._id) }, { $set: { cart: user.cart } });
                });
            });
        });
        Admin.deleteProduct(req.body.productId);
        return res.redirect('/manageproducts');
    } else if (req.body.method === "Update") {
        //Update the product in the database and in all carts of users if they have it there.
        let imagePath = "images\\shop\\logo-yellow.jpeg";
        if (req.file) {
            imagePath = req.file.path.replace('public\\', '');
        }
        db.collection('users').find({}).toArray().then(users => {
            users.forEach(user => {
                user.cart.items.forEach(product => {
                    if(product.productId == req.body.productId) {
                        user.cart.items.splice(user.cart.items.indexOf(ObjectId(product.productId)), 1);
                    }
                    db.collection('users').updateOne({ _id: ObjectId(user._id) }, { $set: { cart: user.cart } });
                });
            });
        });
        Admin.updateProduct(req.body.productId, req.body.title, req.body.price, req.body.description, imagePath, 0);
        return res.redirect('/manageproducts');
    }
};

//Function for loading the page for managing the users
exports.getManageUsers = (req, res, next) => {
    if (req.user && req.user.role === "Admin") {
        var page = req.query.page ? req.query.page : 1;
        const db = getDb();
        page = parseInt(page);
        if (page < 1) {
            page = 1;
        }
        db.collection('users').find({ role: { $ne: "Admin" } }).toArray().then(users => {
            if(page * 6 - users.length >= 6) {
                            page--;
            } 
            //Paginate Users
            let u = users.slice((page - 1) * 6, page * 6);
            res.render('admin/manageusers', {
                pageTitle: 'Manage Users',
                path: '/manageusers',
                users: u,
                nextPage: parseInt(page) + 1,
                previousPage: parseInt(page) - 1,
                number: (page - 1) * 6 + 1
            });
        });
    } else {
        res.redirect('/login');
    }
};

//Function for handling the users in the website (removing/demoting)
exports.handleUsers = (req, res, next) => {
    const db = getDb();
    const dbForum = getDbForum();
    const user_id = req.body.user_id;
    User.findById(user_id).then(user => {
        if (req.body.remove) {
            db.collection('users').deleteOne({ _id: new ObjectId(user_id) });
            // Remove all posts created by user in topics
            dbForum.collection('topics').find().toArray().then(topics => {
                topics.forEach(topic => {
                    let newPosts = topic.posts.filter(post => post.creator.toString() !== user.username.toString());
                    dbForum.collection('topics').updateOne({ _id: new ObjectId(topic._id) }, { $set: { posts: newPosts, countPosts: newPosts.length } });
                });
            });
            // Remove all posts created by user in posts collection & Remove all likes/dislikes and comments the user had on posts
            dbForum.collection('posts').find().toArray().then(posts => {
                posts.forEach(post => {
                    if (post.creator.toString() === user.username.toString()) {
                        dbForum.collection('posts').deleteOne({ _id: new ObjectId(post._id) });
                    }
                    let newRated = post.rated.filter(rating => rating.userId.toString() !== user._id.toString()); 
                    let countLikes = 0;
                    let countDislikes = 0;
                    newRated.forEach(rating => {
                        if (rating.method === "like") {
                            countLikes++;
                        }
                        if (rating.method === "dislike") {
                            countDislikes++;
                        }   
                    });
                    let newComments = post.comments.filter(comment => comment.creator.toString() !== user.username.toString());    
                    dbForum.collection('posts').updateOne({ _id: new ObjectId(post._id) }, { $set: { comments: newComments, rated: newRated, likes: countLikes, dislikes: countDislikes } });
                });
            });
            return res.redirect('/manageusers');
        } else if (req.body.demote) {
            db.collection('users').updateOne({ _id: new ObjectId(user_id) }, { $set: { role: "User" } });
            // Remove all topics created by the moderator
            dbForum.collection('topics').find({ creator: user.username }).toArray().then(topics => {
                console.log("topics: ", topics);
                topics.forEach(topic => {
                    topic.posts.forEach(post => {
                        console.log("post: ", post);
                        dbForum.collection('posts').deleteOne({ _id: new ObjectId(post.postId) });
                    });
                    dbForum.collection('topics').deleteOne({ _id: new ObjectId(topic._id) });
                });
            }).then(result => {
                return res.redirect('/manageusers');
            });
        }
    });
};

//Function for loading the page for importing products
exports.getApplications = (req, res, next) => {
    if (req.user) {
        if (req.user.role === "Admin") {
            let username;
            if (req.user === undefined) {
                username = "User";
            } else {
                username = req.user.username;
            }
            const db = getDbForum();
            return db.collection('applications').find({}).toArray().then(result => {
                res.render('admin/applications', {
                    pageTitle: 'User Applications',
                    path: '/applications',
                    applications: result,
                    username: username
                });
            });
        } else {
            res.redirect('/');
        }
    } else {
        res.redirect('/login');
    }
};

//Function for handling an application (accepting or rejecting a user's application)
exports.applicationHandle = (req, res, next) => {
    if (req.body.accept) {
        const db = getDb();
        const dbForum = getDbForum();
        const user_email = req.body.application_user;
        db.collection('users').findOne({ email: user_email })
            .then(user => {
                dbForum.collection('applications').deleteOne({ _id: new ObjectId(req.body.application_id) });
                let Mod = new Moderator(
                    user.username,
                    user.email,
                    user.password,
                    user.cart,
                    user._id,
                    user.profilePicture
                );
                db.collection('users').updateOne({ _id: user._id }, { $set: Mod })
                db.collection('sessions').updateOne({ 'session.user.email': user.email }, { $set: { 'session.user': Mod } })
                    .then(result => {

                        return res.redirect('/staff');
                    })
                    .catch(err => console.log("err", err));
            });
    }
    else if (req.body.reject) {
        const db = getDbForum();
        db.collection('applications').deleteOne({ _id: new ObjectId(req.body.application_id) });
        return res.redirect('/applications');
    }
    else throw new Error("Something went wrong");
};

