//Importing all packages needed
const express = require('express');
const adminController = require('../controllers/admin');
const router = express.Router();
const multer = require('multer');

//Definining the storage engine for product pictures
const fileStorageProducts = multer.diskStorage({
    destination: (req, file, cb) => {
        var destinationPath = 'public/';
            destinationPath += 'images/productimages/';
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

//Filtering acceptable file types
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

//All the routing for the admin pages

//route for getting the manage shop's products
router.get('/manageproducts', adminController.getManageProducts);

//route for importing a product into the shop
router.post('/import-product', multer({storage: fileStorageProducts, fileFilter: fileFilter}).single('productImage'), adminController.postImportProduct);

//route for handling the products in the shop (removing, updating)
router.post('/manageproducts', multer({storage: fileStorageProducts, fileFilter: fileFilter}).single('productImage'), adminController.handleProducts);

//route for getting the page for managing the websites's users
router.get('/manageusers', adminController.getManageUsers);

//route for posting the page for managing the websites's users
router.post('/manageusers', adminController.handleUsers);

//route for getting the user applications page
router.get('/applications', adminController.getApplications);

//route for handling the user applications (accept/reject)
router.post('/applications', adminController.applicationHandle);

//exporting all the routes
module.exports = router;