// Basic function layout credit to:
// OmarElGabry (chat.io) - https://github.com/OmarElGabry/chat.io

var channelModel = require('../models/channel');
var User = require('../models/user');

// Re-defined Channel schema functions
var create = function (data, callback){
	var newChannel = new channelModel(data);
	newChannel.save(callback);
};
var find = function(data, callback) {
    channelModel.find(data, callback);
};
var findOne = function(data, callback) {
    channelModel.findOne(data, callback);
};
var findById = function(id, callback) {
    channelModel.findById(id, callback);
};
var findByIdAndUpdate = function(id, data, callback) {
    channelModel.findByIdAndUpdate(id, data, { new: true }, callback);
};

var addMessage = function(channel, message, callback) {
	channel.messages.push(message);
	channel.save(callback);
}

// addUser to connections list
var addUser = function(channel, socket, callback) {
	var exists;
    var userId = socket.request.session.passport.user;
    var connection = { userId: userId, socketId: socket.id};
	channel.connections.forEach((conn) => {
		if (conn.userId === userId) {
			exists = true;
		}
	});
	if (exists !== true) {
    	channel.connections.push(connection);
    	channel.save(callback);
	} else {
		channel.save(callback);
	}
};

// get user list from connections list
var getUsers = function(channel, socket, callback) {
    var users = [], uids = {}, num = 0;
    var userId = socket.request.session.passport.user;

    channel.connections.forEach((connection) => {
        if (connection.userId === userId) {
            num++;
        }
        if (!uids[connection.userId]) {
            users.push(connection.userId);
        }
        uids[connection.userId] = true;

        var loadedUsers = 0;
        users.forEach((userId, i) => {
            User.findById(userId, (err, user) => {
                if (err) return callback(err);

                users[i] = user;
                if (++loadedUsers === users.length) {
                    return callback(null, users, num);
                }
            });
        });
    });
};

// remove user from connections list
var removeUser = function(socket, callback) {
    var userId = socket.request.session.passport.user;
    find((err, channels) => {
        if(err) return callback(err);

        channels.every((channel) => {
            var pass = true, num = 0, tar = 0;
            channel.connections.forEach((connection, i) => {
                if (connection.userId === userId) {
                    num++;
                }
                if (connection.socketId === socket.id) {
                    pass = false, tar = i;
                }
            });

            if (!pass) {
                channel.connections.id(channel.connections[tar]._id).remove();
                channel.save((err) => {
                    callback(err, channel, userId, num);
                });
            }

            return pass;
        });
    });
};

var addMessage = function(channel, message, callback) {
	channel.messages.push(message);
	channel.save(callback);
}

// export defined functions
module.exports = {
	create,
	find,
	findOne,
	findById,
	addMessage,
	addUser,
	getUsers,
	removeUser
}
