var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var Channel = mongoose.Schema({
    channelName: String,
    password: String,
    messages: {
        type: [{
            username: String,
            message: String,
            sent_on: {
                type: Date,
                default: Date.now
            }
        }]
    },
    connections: {
        type: [{
            userId: String,
            socketId: String
        }]
    },
    created_on: {
        type: Date,
        default: Date.now
    }
});

// Generate password hash
Channel.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
// Check if compared password is equivalent
Channel.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

var channelSchema = mongoose.model('Channel', Channel);

module.exports = channelSchema;
