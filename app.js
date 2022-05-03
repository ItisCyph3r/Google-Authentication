'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
require('dotenv').config()
const app = express();
const port = 3001;



app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/authenticate')

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    picture: String

})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
const User = new mongoose.model('User', userSchema)

passport.use(User.createStrategy());

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3001/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            googleId: profile.id,
            username: profile.displayName,
            picture: profile._json.picture
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, (err, user) => {
        done(err, user)
    })
});

app
    .route('/')
    .get((req, res) => {
        res.render('home', {});
    })
    .post((req, res) => {

    })

app
    .route('/login/google')
    .get(passport.authenticate('google', {
        scope: ['profile']
    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login',
        failureMessage: true
    }),
    function (req, res) {
        res.redirect('/secrets');
    });

app
    .route('/login')
    .get((req, res) => {
        res.render('login', {});
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.passport
        })

        req.login(user, function (err) {
            if (err) {
                console.log(err)
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect('/secrets')
                })
            }
        })
    })

app
    .route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        User.register({
            username: req.body.username
        }, req.body.password, function (err, user) {
            if (err) {
                console.log(err)
                res.redirect('/register')
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect('/secrets')
                })
            }
        })
    })

app
    .route('/secrets')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            User.findOne({
                username: 'Samuel FN'
            }, (err, resultname) => {
                if (err) {
                    console.log(err)
                } else {
                    User.findOne({
                        username: 'Samuel FN'
                    }, (err, resultpic) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.render('secrets', {
                                username: resultname.username,
                                userpicture: '<img src="' + resultpic.picture + '"></img>'
                            })
                            
                        }
                    })
                }

            })
        }
    })

app
    .route('/logout')
    .get((req, res) => {
        req.logout();
        res.redirect('/');

    })
    .post((req, res) => {

    })

app.listen(process.env.YOUR_PORT || process.env.PORT || port, () => {
    console.log('Listening to server on port ' + port)
})



