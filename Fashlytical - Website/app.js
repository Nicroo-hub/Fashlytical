//Importing all packages needed
const express = require('express');
const session = require('express-session');
const mongoConnectShop = require('./util/database').mongoConnectShop;
const mongoConnectForum = require('./util/database').mongoConnectForum;
const MongoDBStore = require('connect-mongodb-session')(session);
const errorController = require('./controllers/error');
const flash = require('connect-flash');
const User = require('./models/user');
const Moderator = require('./models/moderator');
const Admin = require('./models/admin');
const MONGODB_URI =
    'mongodb+srv://Secondary:S87Q25LD@cluster0.9kcfe.mongodb.net/Fashlytical-Shop?retryWrites=true&w=majority';
const app = express();

//Creating a MongoDB store for storing the sessions
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

//Importing all routing needed
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const forumRoutes = require('./routes/forum');

///All the things the app uses
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


//Let the app use a session
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

//Using flash
app.use(flash());

//Using variables for middleware
app.use((req, res, next) => {
    res.locals.req = req; //For EJS purposes
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
});

//App user role management
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            if(user.role === "Admin") {
                req.session.application_pending = false;
                username = user.username;
                password = user.password;
                email = user.email;
                cart = user.cart;
                _id = user._id;
                profilePicture = user.profilePicture;
                req.user = new Admin(username, email, password, cart, _id, profilePicture);
            }
            else if (user.role === "Moderator") {
                req.session.application_pending = false;
                username = user.username;
                password = user.password;
                email = user.email;
                cart = user.cart;
                _id = user._id;
                profilePicture = user.profilePicture;
                req.user = new Moderator(username, email, password, cart, _id, profilePicture);
            }
            else {
                username = user.username;
                password = user.password;
                email = user.email;
                cart = user.cart;
                _id = user._id;
                profilePicture = user.profilePicture;
                req.user = new User(username, email, password, cart, _id, profilePicture);  
            }
            next();
        })
        .catch(err => console.log(err));
});

//Using the routes
app.use(shopRoutes);
app.use(authRoutes);
app.use(adminRoutes);
app.use(forumRoutes);

//Render error page if route doesnt exist
app.use(errorController.get404);

//Connecting the app to the database and localhost:3000
mongoConnectShop(() => {
    mongoConnectForum(() => {
        app.listen(3000);
    });
});