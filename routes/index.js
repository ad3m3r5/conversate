var express = require('express');
var router = express.Router();
var passport = require('passport');

var User = require('../models/user');
var Channel = require('../models/channel');

// Get index page
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/home');
    } else {
        res.render('index', {
            title: 'Index',
            user : req.user,
            othMsg: res.locals.othmsg,
            errMsg: res.locals.errmsg
        });
    }
});

// Get login page
router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('login', {
            title: 'Login',
            user : req.user,
            othMsg: res.locals.othmsg,
            errMsg: res.locals.errmsg
        });
    }
});

// Post to login user
router.post('/login', /*passport.authenticate('local'),*/ (req, res, next) => {
    let user = (req.body.username).toLowerCase();
    let pass = req.body.password;
    // if username and password are empty
    if (user.length === 0 || pass.length === 0) {
        req.flash('errMsg', 'Please enter a username and password');
        res.redirect('/');
    } else {
        next();
    }
    // move to passport-local login strategy
}, passport.authenticate('login', {
    successRedirect : '/home',
    failureRedirect : '/login',
    failureFlash : true
}));

// Get register page
router.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('register', {
            title: 'Register',
            user : req.user,
            othMsg: res.locals.othmsg,
            errMsg: res.locals.errmsg
        });
    }
});

// Post to register user
router.post('/register', (req, res, next) => {
    let user = (req.body.username).toLowerCase();
    let pass = req.body.password;

    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        // if username or password are empty
        if (user.length === 0 || pass.length === 0) {
            req.flash('errMsg', 'Please enter a username and password');
            res.redirect('/');
        } else {
            next();
        }
    }
    // move to passport-local register strategy
}, passport.authenticate('register', {
    successRedirect : '/home',
    failureRedirect : '/register',
    failureFlash : true
}));

// Logout request
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// User profile page
router.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        let userId = req.user._id;

        User.findById({ '_id' : userId }, (err, user) => {
            if (err) throw err;
            if (!user) {
                req.flash('errMsg', 'Your user account could not be found');
                res.redirect('/');
            } else {
                res.render('profile', {
                    title: 'Profile',
                    user : req.user,
                    othMsg: res.locals.othmsg,
                    errMsg: res.locals.errmsg
                });
            }
        });
    } else {
        res.redirect('/');
    }
});

// Post to change username
router.post('/changeuser', (req, res, next) => {
    let user = (req.body.chnguser).toLowerCase();
    let pass = req.body.chnguserpass;

    if (req.isAuthenticated()) {
        // if username or password are empty
        if (user.length === 0 || pass.length === 0) {
            req.flash('errMsg', 'Please fill in the required username and password fields');
            res.redirect('/profile');
        } else {
            next();
        }
    } else {
        res.redirect('/');
    }
    // move to passport-local changeuser strategy
}, passport.authenticate('changeuser', {
    successRedirect : '/profile',
    failureRedirect : '/profile',
    failureFlash : true
}));

// Post to change user password
router.post('/changepass', (req, res, next) => {
    let oldpass = req.body.oldpass;
    let pass = req.body.chngpass;
    let passconf = req.body.chngpassconf;

    if (req.isAuthenticated()) {
        // if username or password are empty
        if (oldpass.length === 0 || pass.length === 0 || passconf.length === 0) {
            req.flash('errMsg', 'Please fill in the required password fields');
            res.redirect('/profile');
        } else {
            next();
        }
    } else {
        res.redirect('/');
    }
    // move to passport-local changepass strategy
}, passport.authenticate('changepass', {
    successRedirect : '/profile',
    failureRedirect : '/profile',
    failureFlash : true
}));

router.post('/delchan', (req, res) => {
    if (req.isAuthenticated()) {
        if (req.user.username === 'admin') {
            let channelName = req.body.channame;
            if (channelName.length === 0) {
                req.flash('errMsg', 'Please provide a channel name');
                res.redirect('/profile');
            } else {
                Channel.findOne({ 'channelName' : channelName }, (err, channel) => {
                    if (err) throw err;

                    if (!channel) {
                        req.flash('errMsg', 'The specified channel could not be found');
                        res.redirect('/profile');
                    } else if (channel) {
                        channel.remove((err) => {
                            if (err) throw err;
                            req.flash('othMsg', `Channel - ${channelName} - has been deleted`);
                            res.redirect('/profile');
                        });
                    } else {
                        console.log('ERROR ON CHANNEL DELETION');
                    }
                });
            }
        } else {
            res.redirect('/home');
        }
    } else {
        res.redirect('/');
    }
});

// Get home page
router.get('/home', (req, res, next) => {
    if (req.isAuthenticated()) {
        Channel.find((err, channels) => {
            if (err) throw err;

            res.render('home', {
                title: 'Home',
                user : req.user,
                othMsg: res.locals.othmsg,
                errMsg: res.locals.errmsg,
                channels: channels
            });
        });
    } else {
        res.redirect('/');
    }
});

// Get channel page
router.get('/channel/:id', (req, res) => {
    if (req.isAuthenticated()) {
        let channelId = req.params.id;
        // search for requested channel
        Channel.findById(channelId, (err, channel) => {
            if (err) throw err;

            // if requested channel is not found
            if(!channel) {
                req.flash('errMsg', 'No channel with that ID found');
                res.redirect('/home');
            // if the channel is found - display it
            } else {
                if(channel.password && channel.password.length !== 0) {
                    res.render('channelPass', {
                        title: 'Channel Login',
                        user : req.user,
                        othMsg: res.locals.othmsg,
                        errMsg: res.locals.errmsg,
                        channelId: channel._id
                    });
                } else {
                    res.render('channel', {
                        title: channel.channelName,
                        user : req.user,
                        othMsg: res.locals.othmsg,
                        errMsg: res.locals.errmsg,
                        channel: channel
                    });
                }
            }
        });
    } else {
        res.redirect('/');
    }
});

router.post('/channel/:id', (req, res) => {
    if (req.isAuthenticated()) {
        let channelId = req.params.id;
        let channelPass = req.body.password;
        Channel.findById(channelId, (err, channel) => {
            if (err) throw err;

            // if requested channel is not found
            if(!channel) {
                req.flash('errMsg', 'No channel with that ID found');
                res.redirect('/home');
            // if the channel is found - display it
            } else {
                if(channel.validPassword(channelPass)) {
                    res.render('channel', {
                        title: channel.channelName,
                        user : req.user,
                        othMsg: res.locals.othmsg,
                        errMsg: res.locals.errmsg,
                        channel: channel
                    });
                } else {
                    req.flash('errMsg', 'Incorrect channel password');
                    res.redirect('/channel/' + channelId);
                }
            }
        });
    } else {
        res.redirect('/');
    }
});

module.exports = router;
