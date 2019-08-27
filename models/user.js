var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var User = new mongoose.Schema({
    username: String,
    password: String,
    auth: {
        failedLogAtt: {
            type: Number,
            default: 0
        },
        failedLogExp: String
    },
    created_on: {
        type: Date,
        default: Date.now
    }
});

// Generate password hash
User.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
// Check if compared password is equivalent
User.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

var userSchema =  mongoose.model('User', User);

module.exports = userSchema;
