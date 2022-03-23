//Importing all packages needed
const express = require('express');
const { check, body } = require('express-validator');
const authController = require('../controllers/auth');
const getDb = require('../util/database').getDb;
const router = express.Router();

//All the routing for the authentication purposes

//route for getting the login page
router.get('/login', authController.getLogin);

//route for getting the signup page
router.get('/signup', authController.getSignup);

//route for getting the reset password page
router.get('/reset', authController.getReset);

//post route for resetting a password
router.post('/reset', authController.postReset);

//route for getting the new password page
router.get('/reset/:token', authController.getNewPassword);

//route for setting the new password
router.post('/new-password', authController.postNewPassword);

//route for posting the login page (logging in)
router.post('/login', [
        //checking the validation of the email
        body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
        //checking the validation of the password (min 6 characters)
        body('password', 'Password has to be valid.')
        .isLength({ min: 6 })
        .trim()
    ],
    authController.postLogin
);

//route for posting the signup page (signing up)
router.post(
    '/signup', [
        //checking the availability of the username
        body(
            'username',
            'Username has to be valid.'
        )
        .custom((value, { req }) => {
            const db = getDb();
             return db.collection('users').findOne({ username: value }).then(userDoc => {
                if (userDoc) {
                    return Promise.reject(
                        'Username already exists, please choose another one.'
                    );
                }
            });
        }),
        //checking the availability of the email
        check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, { req }) => {
            const db = getDb();
            return db.collection('users').findOne({ email: value }).then(userDoc => {
                if (userDoc) {
                    return Promise.reject(
                        'E-Mail already exists, please pick a different one.'
                    );
                }
            });
        })
        .normalizeEmail(),
        //checking the validation of the password
        body(
            'password',
            'Please enter a password with only numbers and text and at least 6 characters.'
        )
        .isLength({ min: 6 })
        .isAlphanumeric()
        .trim(),
        body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (req.body.confirmpass !== req.body.password) {
                throw new Error('Passwords have to match!');
            }
            return true;
        })
    ],
    authController.postSignup
);

//route for logging out of the application
router.post('/logout', authController.postLogout);

//exporting all the routes
module.exports = router;