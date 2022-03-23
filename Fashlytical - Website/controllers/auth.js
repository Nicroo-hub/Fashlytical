//Importing all packages needed
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const getDb = require('../util/database').getDb;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

//Variable for transporting email
var transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "eb296e641ed885",
        pass: "a7b96c03029972"
    }
});

//Function for loading the login page
exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Fashlytical Login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};

//Function for posting the login page (logging in)
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const db = getDb();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Fashlytical Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }
    db.collection('users').findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Fashlytical Login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }
            bcrypt
                .compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Fashlytical Login',
                        errorMessage: 'Invalid email or password.',
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: []
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                });
        })
};

//Function for loading the signup page
exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Fashlytical Signup',
        errorMessage: message,
        oldInput: {
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
};

//Function for posting the signup page (signing up)
exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const cart = { items: [] };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                username: username,
                email: email,
                password: password,
                confirmPassword: req.body.confirmpass
            },
            validationErrors: errors.array()
        });
    }
    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User(
                username,
                email,
                hashedPassword,
                cart
            );
            return user.save();
        })
        .then(result => {
            res.redirect('/login');
        })
};

//Function for redirecting to login page after logging out
exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        res.redirect('/login');
    });
};

//Function for loading the reset password page
exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};

//Function for requesting a password reset (sending email for password reset)
exports.postReset = (req, res, next) => {
    const db = getDb();
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        db.collection('users').findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return db.collection('users').updateOne({ _id: user._id }, { $set: user });
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    from: 'fashlyticalhelp@gmail.com',
                    to: req.body.email,
                    subject: 'Password reset',
                    html: `
                          <h1>Fashlytical<h1>  
                          <p>You requested a password reset!</p>
                          <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password!</p>
                          `
                });
            })
            .catch(err => {
                console.log(err);
            });
    });
};

//Function for loading the new password page (after clicking the link in the email)
exports.getNewPassword = (req, res, next) => {
    const db = getDb();
    const token = req.params.token;
    db.collection('users').findOne({ resetToken: token })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'Update Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
};

//Function for applying the new password for the user
exports.postNewPassword = (req, res, next) => {
    const db = getDb();
    const newPassword = req.body.password;
    const userId = req.body.userId;
    db.collection('users').findOne({ _id: ObjectId(userId) })
        .then(user => {
            newUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            newUser.password = hashedPassword;
            newUser.resetToken = undefined;
            newUser.resetTokenExpiration = undefined;
            return db.collection('users').updateOne({ _id: ObjectId(userId) }, { $set: newUser });
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
        });
};