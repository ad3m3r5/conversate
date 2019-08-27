var LocalStrategy   = require('passport-local').Strategy;

var User = require('../models/user');
var Channel = require('../models/channel');

module.exports = function(passport) {
    // serialize user session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    // deserialize user session
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // passport-local login user strategy
    passport.use('login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, username, password, done) {
        let usern = username.toLowerCase();
        let passw = password;
        User.findOne({ 'username' : usern }, (err, user) => {
            if (err) {
                console.log('ERROR ON FIND USER FOR LOGIN: ' + usern);
                return done(err);
            }
            // if username and password are empty
            if (usern.length === 0 || passw.length === 0 ) {
                // no login credentials submitted
                return done(null, false, req.flash('errMsg', 'Please enter a valid username and password'));
            } else {
                if (!user) {
                    // if no user object found in database
                    return done(null, false, req.flash('errMsg', 'Incorrect username or password'));
                } else if ((user.auth.failedLogAtt === 4) && (!user.validPassword(passw))) {
                    // invalid login hit 5 attempts (lock out for 2.5min)
                    user.auth.failedLogAtt += 1;
                    user.auth.failedLogExp = Date.now() + 150000; // 2.5 min
                    user.save((err) => {
                        if(err) throw err;
                        return done(null, false, req.flash('errMsg', 'Too many invalid login attempts. Please try again in a few minutes'));
                    });
                } else if ((user.auth.failedLogAtt === 5) && (Date.now() <= parseInt(user.auth.failedLogExp))) {
                    // login attempt during wait period
                    return done(null, false, req.flash('errMsg', 'Too many invalid login attempts. Please try again in a few minutes'));
                } else if ((!user.validPassword(passw)) && (user.auth.failedLogAtt === 5) && (Date.now() > parseInt(user.auth.failedLogExp))) {
                    // invalid password and wait time has expired (reset expiration)
                    user.auth.failedLogAtt = 1;
                    user.auth.failedLogExp = "";
                    user.save((err) => {
                        if(err) throw err;
                        return done(null, false, req.flash('errMsg', 'Incorrect username or password'));
                    });
                } else if (!user.validPassword(passw)) {
                    // user found but invalid password
                    user.auth.failedLogAtt += 1;
                    user.save((err) => {
                        if(err) throw err;
                        return done(null, false, req.flash('errMsg', 'Incorrect username or password'));
                    });
                } else if (user.validPassword(passw)) {
                    // successful login
                    user.auth.failedLogAtt = 0;
                    user.auth.failedLogExp = "";
                    user.save((err) => {
                        if(err) throw err;

                        return done(null, user);
                    });
                } else {
                    // if any other issue has occurred
                    console.log('LOGIN ERROR: ' + Date.now() + ' - ' + usern);
                    return done(null, false, req.flash('errMsg', 'An error has occurred on login, please try again later'));
                }
            }
        });
    }));

    // passport-local register user strategy
    passport.use('register', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, username, password, done) {
        let usern = username.toLowerCase();
        let passw = password;
        User.findOne({ 'username' : usern }, (err, user) => {
            if (err) {
                console.log('ERROR ON FIND USER FOR REGISTER: ' + usern);
                return done(err);
            }
            // if username and password are empty
            if (usern.length === 0 || passw.length === 0 ) {
                // no registration credentials submitted
                return done(null, false, req.flash('errMsg', 'Please enter a valid username and password'));
            } else if (!testUser(usern)) {
                return done(null, false, req.flash('errMsg', 'Please enter a valid username (a-z, A-Z, 0-9, -, _, 4-16 char)'));
            } else if (!testPass(passw)) {
                return done(null, false, req.flash('errMsg', 'Please enter a valid password (one lowercase, one uppercase, one digit, 8-512 char)'));
            } else {
                if (user) {
                    return done(null, false, req.flash('errMsg', 'An account with that username already exists'));
                } else if (!user) {
                    var newUser = new User();
                    newUser.username = usern;
                    newUser.password = newUser.generateHash(passw);
                    newUser.save((err) => {
                        if (err) throw err;

                        return done(null, newUser);
                    });
                } else {
                    return done(null, false, req.flash('errMsg', 'Error on registration, please try again later'));
                }
            }
        });
    }));


    // passport-local username change strategy
    passport.use('changeuser', new LocalStrategy({
        usernameField : 'chnguser',
        passwordField : 'chnguserpass',
        passReqToCallback : true
    },
    function(req, chnguser, chnguserpass, done) {
        let usern = (req.user.username).toLowerCase();
        let newusern = chnguser.toLowerCase();
        let passw = chnguserpass;
        User.findOne({ 'username' : usern }, (err, user) => {
            // error on account search
            if (err) {
                console.log('ERROR ON FIND USER FOR CHANGEUSER: ' + usern);
                return done(err);
            } else {
                // user account not found
                if (!user) {
                    console.log('COULD NOT FIND USERNAME FOR CHANGEUSER: ' + usern);
                    return done(null, false, req.flash('errMsg', 'The requested account could not be found'));
                } else if (user) {
                // current user account found
                    if (usern.length === 0 || newusern.length === 0 || passw.length === 0) {
                        return done(null, false, req.flash('errMsg', 'Please fill in the required username and password fields'));
                    } else if (user.username === 'admin') {
                        return done(null, false, req.flash('errMsg', 'The admin account username cannot be changed'));
                    } else if (!testUser(newusern)) {
                        return done(null, false, req.flash('errMsg', 'Please provide a valid username'));
                    } else if (usern === newusern) {
                        return done(null, false, req.flash('errMsg', 'Current username and new username are the same'));
                    } else if (!user.validPassword(passw)) {
                        return done(null, false, req.flash('errMsg', 'Incorrect password entered'));
                    } else if (testUser(usern) && testUser(newusern) && user.validPassword(passw)) {
                        User.findOne({ 'username' : newusern }, (err, otherUser) => {
                            if (err) {
                                console.log('ERROR ON SECOND FIND USER FOR CHANGEUSER: ' + usern);
                                return done(err);
                            } else {
                                if (otherUser) {
                                    return done(null, false, req.flash('errMsg', 'An account with that username already exists'));
                                } else if (!otherUser) {
                                    user.username = newusern;
                                    user.save((err) => {
                                        if(err) throw err;

                                        //return done(null, user, req.flash('othMsg', 'Username successfully changed'));
                                    });
                                    Channel.find((err, channels) => {
                                        if (err) {
                                            console.log('ERROR ON FIND CHANNELS FOR CHANGEUSER: ' + usern);
                                            return done(err);
                                        } else {
                                            if (!channels) {
                                                console.log('no channels');
                                                return done(null, user, req.flash('othMsg', 'Username successfully changed'));
                                            } else if (channels) {
                                                for (var i = 0; i < channels.length; i++) {
                                                    for(var j = 0; j < channels[i].messages.length; j++) {
                                                        if(channels[i].messages[j].username === usern) {
                                                            console.log('Message: ' + channels[i].messages[j]);
                                                            console.log('Curr user: ' + usern);
                                                            channels[i].messages[j].username = newusern;
                                                            console.log('Message: ' + channels[i].messages[j]);
                                                        }
                                                    }
                                                    channels[i].save((err) => {
                                                        if (err) throw err;
                                                    });
                                                }
                                                return done(null, user, req.flash('othMsg', 'Username successfully changed'));
                                            }
                                        }
                                    });
                                } else {
                                    return done(null, false, req.flash('errMsg', 'An error has occurred, please try again later'));
                                }
                            }
                        });
                    } else {
                        console.log('ERROR ON CHANGEUSER - USER FOUND: ' + usern);
                        return done(null, false, req.flash('errMsg', 'An error has occurred, please try again later'));
                    }
                } else {
                    console.log('ERROR ON CHANGEUSER: ' + usern);
                    return done(null, false, req.flash('errMsg', 'An error has occurred, please try again later'));
                }
            }
        });
    }));


    // passport-local change password strategy
    passport.use('changepass', new LocalStrategy({
        usernameField : 'chngpass',
        passwordField : 'chngpassconf',
        passReqToCallback : true
    },
    function(req, chngpass, chngpassconf, done) {
        let usern = (req.user.username).toLowerCase();
        let oldpass = req.body.oldpass;
        let pass = chngpass;
        let passconf = chngpassconf;
        User.findOne({ 'username' : usern }, (err, user) => {
            // error on account search
            if (err) {
                console.log('ERROR ON FIND USER FOR CHANGEPASS: ' + usern);
                return done(err);
            } else {
                // user account not found
                if (!user) {
                    console.log('COULD NOT FIND USERNAME FOR CHANGEPASS: ' + usern);
                    return done(null, false, req.flash('errMsg', 'The requested account could not be found'));
                }
                else if (user) {
                    // user account found
                    if (usern.length === 0 || oldpass.length === 0 || pass.legnth === 0 || passconf.length === 0) {
                        return done(null, false, req.flash('errMsg', 'Please fill in the required password fields'));
                    } else if (pass !== passconf) {
                        return done(null, false, req.flash('errMsg', 'New password and password confirmation must match'));
                    } else if (!user.validPassword(oldpass)) {
                        return done(null, false, req.flash('errMsg', 'Incorrect current password entered'));
                    } else if (!testPass(pass) || !testPass(passconf)) {
                        return done(null, false, req.flash('errMsg', 'Please enter a valid new password and password confirmation'));
                    } else if (testPass(pass) && testPass(passconf) && user.validPassword(pass)) {
                        return done(null, false, req.flash('errMsg', 'Current password and new password are the same'));
                    } else if (testUser(usern) && user.validPassword(oldpass) && pass === passconf && testPass(pass) && testPass(passconf)) {
                        user.password = user.generateHash(pass);
                        user.save((err) => {
                            if (err) throw err;

                            return done(null, user, req.flash('othMsg', 'Password successfully changed'));
                        });
                    } else {
                        console.log('ERROR ON CHANGEPASS - USER FOUND: ' + usern)
                        return done(null, false, req.flash('errMsg', 'An error has occurred, please try again later'));
                    }
                } else {
                    // catch all error
                    console.log('ERROR ON CHANGEPASS: ' + usern);
                    return done(null, false, req.flash('errMsg', 'An error has occurred, please try again later'));
                }
            }
        });
    }));
};

// Test for valid username
function testUser(input) {
    let format = /^[a-z0-9_-]{4,16}$/igm;
    return format.test(input);
}
// test for valid password
function testPass(input) {
    let format = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,512}$/;
    return format.test(input);
}
