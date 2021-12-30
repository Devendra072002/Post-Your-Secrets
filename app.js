require('dotenv').config();

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//passport-local is one of the dependencies of passport-local-mongoose

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({

    secret: "Our litte secret.",
    resave: false,
    saveUninitialized: false
}));
//Set up our session with some initial configuration


app.use(passport.initialize());
//Initializing passport to start using passport.


app.use(passport.session());
//using passport to dealing with our session


mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
//we are going to use to hash and salt our password and to save our users into the mongodb database.


const User = new mongoose.model("User", userSchema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {

    //If request is authenticated
    if (req.isAuthenticated()) {
        res.render("secrets");
    }
    else {
        res.redirect("/login");
    }
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
})

app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
    //Its only because of the passport-local-mongoose that we can avoid creating our new user, saving our user and interact with mongoose directly.Instead we are going to be using the package as our middleman to handle all of that for us.
});

app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //This comes from passport package
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");  
            });
            //"local"-->Strategy
        }
        //Callback returns an err if not able to find that user in our database
    });

});

app.listen(3000, function () {
    console.log("Server started on port 3000.");
})

