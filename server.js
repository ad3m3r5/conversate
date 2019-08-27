// Conversate App
const dotenv = require('dotenv');
dotenv.config();

var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var host = process.env.HOST || '0.0.0.0';
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash    = require('connect-flash');
var mongoose = require('mongoose');
var passport = require('passport');
var passportSocketIo = require("passport.socketio");
var morgan = require('morgan');

var http = require('http').Server(app);
var io = require('socket.io')(http);

var routes = require('./routes/index');

// View Engine
app.set('view engine', 'ejs');

// App Configs
var sessConf = require('./config/session.js'); // import session config
app.use(morgan('dev')); // log with morgan in dev format/mode
app.use(flash()); // use connect-flash
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
var sessionStore = new redisStore ({ // define redis session config
    host: sessConf.url,
    port: sessConf.port
});
var sessionMiddleWare = session({ // define session store config
    store: sessionStore,
    key: sessConf.key,
    secret: sessConf.secret,
    cookie: {
        maxAge: sessConf.age
    },
    resave: false,
    saveUninitialized: true
});
io.use((socket, next) => {
    sessionMiddleWare(socket.request, socket.request.res, next); // session middleware for socketio
});
app.use(sessionMiddleWare);
io.sockets.on('connection', (socket) => {
    socket.request.session;
});
app.use(passport.initialize()); // initialize passport
app.use(passport.session()); // connect passport to session
app.use(express.static('public')); // define public accessible directory
io.use(passportSocketIo.authorize({ // connect socketio to passport session data
    cookieParser: cookieParser,
    key: sessConf.key,
    secret: sessConf.secret,
    store: sessionStore
}));

// Import socketio functions
socket = require('./socketio')(io);

// MongoDB
var configDB = require('./config/database.js'); // import mongodb config
mongoose.set('useCreateIndex', true);
mongoose.connect(configDB.url, { useNewUrlParser: true }) // connect to mongodb
    .then(() => {
        console.log(`MongoDB connected.`); // success output after connection
    });
mongoose.connection.on('error', err => debug(`MongoDB connection error: ${err}`));

// App GET/POST routes
app.use(function(req, res, next) { // pass connect-flash messages to local store
    res.locals.othmsg = req.flash('othMsg');
    res.locals.errmsg = req.flash('errMsg');
    next();
});

app.use((req, res, next) => { // allow socketio within routes (if/when necessary)
    req.io = io;
    next();
});

app.use('/', routes); // use express router

// Catch 404
// Credits to:
// https://stackoverflow.com/a/9802006
// https://github.com/expressjs/express/blob/master/examples/error-pages/index.js
app.use((req, res, next) => {
    res.status(404);
    // respond with html page
    if (req.accepts('html')) {
        res.render('404', { title: '404 Error', user: req.user, url: req.url });
        return;
    }
    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }
    // default to plain-text. send()
    res.type('txt').send('Not found');
});

// Passport Config
require('./config/passport')(passport);

// Initialize express/http server
var server = http.listen(port, host, () => {
    // log to console on server initialization
    console.log('Conversate live on port: ' + host + ':' + port);
});

module.exports = app;
