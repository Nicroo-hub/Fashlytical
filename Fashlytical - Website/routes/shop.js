//Importing all packages needed
const express = require('express');
const shopController = require('../controllers/shop');
const router = express.Router();

//All the routing for the shop's purposes

//route for getting the index page
router.get('/', shopController.getIndex);

//route for getting the collection page
router.get('/collection', shopController.getCollection);

//route for getting the user cart page
router.get('/cart', shopController.getCart);

//route for adding a product to the cart
router.post('/cart', shopController.postCart);

//route for removing a product from the cart
router.post('/cart-delete-item', shopController.postCartDeleteProduct);

//route for emptying the cart
router.post('/cart-empty-cart', shopController.postEmptyCart);

//route for getting the checkout page
router.get('/checkout', shopController.getCheckout);

//route for posting an order
router.get('/checkout/success', shopController.postOrder);

//route for getting the orders page
router.get('/orders', shopController.getOrders);

//route for connecting from the shop to the forum => getting the topics page
router.get('/forum', shopController.getForum);

//exporting all the routes
module.exports = router;