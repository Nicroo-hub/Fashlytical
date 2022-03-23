//Importing all packages needed
const Product = require('../models/product');
const getDbForum = require('../util/database').getDbForum;
const request = require('request');
const stripe = require('stripe')('sk_test_51JzNUYDIdf7Qkuot2NyFP8BZ5DPqgdZYRQVjqJzGxfil1HAYVfkvbHvdNYw9mQT3vOxfYNT2fO2okeJ2JpUobWqV00SgjOHtmc');

//Function for loading the index page of the shop
exports.getIndex = (req, res, next) => {
    Product.fetchAll()
        .then(products => {
            products.forEach(product => {
                let p = new Product(product.title, product.price, product.description, product.imagePath, product.rating, product._id);
                p.UpdateRating();
            });
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Home',
                path: '/'
            });
        })
        .catch(err => {
            console.log(err);
        });
};

//Function for loading the collection page (products page)
exports.getCollection = (req, res, next) => {
    var page = req.query.page ? req.query.page : 1;
    page = parseInt(page);
    if (page < 1) {
        page = 1;
    }
    Product.fetchAll()
        .then(products => {
            // paginate products array
            if (page * 8 - products.length >= 8) {
                page--;
            }
            let prods = products.slice((page - 1) * 8, page * 8);
            products.forEach(product => {
                let p = new Product(product.title, product.price, product.description, product.imagePath, product.rating, product._id);
                p.UpdateRating();
            });
            res.render('shop/collection', {
                prods: prods,
                pageTitle: 'Collection',
                path: '/collection',
                nextPage: parseInt(page) + 1,
                previousPage: parseInt(page) - 1,
            });
        })
        .catch(err => {
            console.log(err);
        });
};

//Function for loading the user cart page
exports.getCart = (req, res, next) => {
    if (req.user) {
        req.user.getTotalPrice()
            .then(total => {
                req.user.getCart()
                    .then(products => {
                        res.render('shop/cart', {
                            path: '/cart',
                            pageTitle: 'Cart',
                            products: products,
                            totalPrice: total
                        });
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    } else {
        res.redirect('/login');
    }
}

//Function for adding a product to the user's cart
exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            res.redirect('/cart');
        });
};

//Function for removing a products from the user's cart
exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user
        .deleteItemFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};

exports.postEmptyCart = (req, res, next) => {
    req.user.emptyCart()
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};

//Function for loading the checkout page
exports.getCheckout = (req, res, next) => {
    req.user.getCart().then(products => {
        products = products;
        req.user.getTotalPrice().then(totalPrice => {
            totalPrice = totalPrice;
            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(p => {
                    return {
                        name: p.title,
                        description: p.description.substring(0,50) + '\n' + p.description.substring(50),
                        amount: Math.round(p.price * 100),
                        currency: 'usd',
                        quantity: p.quantity
                    };
                }),
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout'
            })
                .then(session => {
                    res.render('shop/checkout', {
                        path: '/checkout',
                        pageTitle: 'Checkout',
                        products: products,
                        totalPrice: totalPrice,
                        sessionURL: session.url
                    });
                })
                .catch(err => console.log(err));
        })
    })
};

//Function for loading the orders page
exports.getOrders = (req, res, next) => {
    if (req.user) {
        var page = req.query.page ? req.query.page : 1;
        page = parseInt(page);
        if (page < 1) {
            page = 1;
        }
        req.user.getTotalPrice()
            .then(total => {
                req.user.getOrders()
                    .then(orders => {
                        if (page * 3 - orders.length >= 3) {
                            page--;
                        }
                        let userOrders = orders.slice((page - 1) * 3, page * 3);
                        res.render('shop/orders', {
                            pageTitle: 'Orders',
                            path: '/orders',
                            orders: userOrders,
                            totalPrice: total,
                            nextPage: parseInt(page) + 1,
                            previousPage: parseInt(page) - 1
                        });
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    } else {
        res.redirect('/login');
    }
}

//Function for adding an order to the orders page after checkout (using stripe API)
exports.postOrder = (req, res, next) => {
    req.user
        .addOrder()
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));
};

//Funtion for linking the shop with the forum => loading the topics page
exports.getForum = (req, res, next) => {
    var page = req.query.page ? req.query.page : 1;
    page = parseInt(page);
    if (page < 1) {
        page = 1;
    }
    const db = getDbForum();
    db.collection('topics').find().count()
        .then(countTopics => {
            if (page * 3 - countTopics >= 3) {
                page--;
            }
            let username;
            if (req.user === undefined) {
                username = "User";
            } else {
                username = req.user.username;
            }
            request('http://localhost:8080/forum?page=' + page,
                function (err, response, body) {
                    if (response.statusCode == 200) {
                        return res.render('forum/forum', {
                            nextPage: parseInt(page) + 1,
                            previousPage: parseInt(page) - 1,
                            pageTitle: 'Fashlytical Forum',
                            path: '/forum',
                            username: username,
                            user: req.user,
                            topics: JSON.parse(body).topics,
                            number: (page - 1) * 3 + 1,
                            errorMessage: ""
                        })
                    } else {
                        console.log(err);
                    }
                }
            );
        });
};