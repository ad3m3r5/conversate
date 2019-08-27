// Much of the basic socketio functionality credit to:
// OmarElGabry (chat.io) - https://github.com/OmarElGabry/chat.io

var User = require('../models/user');
var Channel = require('../models/channelFunc');
var ChannelModel = require('../models/channel');

// Export io functions
exports = module.exports = function(io) {
    var home_ns = io.of('/home'); // home namespace
    var chan_ns = io.of('/channel'); // channel namespace

    // socket for home page (channel list)
    home_ns.on('connection', (socket) => {
        Channel.find((err, channels) => {
            if (err) throw err;

            if(!channels || channels.length === 0 || channels == null) {
                console.log('No channels found');
            }
            if(channels && channels.length !== 0 && channels != null) {
                socket.emit('updateChannelUsers', channels);
            } else {
                console.log('ERROR ON updateChannelUsers');
            }
        });

        // Add channel request
        socket.on('addChannel', (name, password, checked) => {
            // search for channel with requested name
            let format = /^[a-z0-9_-]{2,15}$/igm;
            let format2 = /^[a-z0-9_-]{1,32}$/igm;
            Channel.findOne({ 'channelName' : name }, (err, channel) => {
                if (err) throw err;

                // if channel already exists
                if(channel) {
                    // emit update function with error
                    socket.emit('updateChannelList', { error: 'Channel name already exists'});
                // if channel does not exist - create it
                } else if (name === '' || !format.test(name)) {
                    socket.emit('updateChannelList', { error: 'Please enter a valid channel name'});
                } else if (checked === true && password === '' || !format2.test(password)) {
                    socket.emit('updateChannelList', { error: 'Please enter a valid channel password222'});
                } else {
                    if(password) {
                        // create new channel with password
                        var passHash = new ChannelModel().generateHash(password);
                        Channel.create({
                            channelName: name,
                            password: passHash
                        }, (err, newChannel) => {
                            if (err) throw err;

                            // update channel list for connected users
                            socket.emit('updateChannelList', newChannel);
                            socket.broadcast.emit('updateChannelList', newChannel);
                        });
                    } else {
                        // create new channel without password
                        Channel.create({
                            channelName: name
                        }, (err, newChannel) => {
                            if (err) throw err;

                            // update channel list for connected users
                            socket.emit('updateChannelList', newChannel);
                            socket.broadcast.emit('updateChannelList', newChannel);
                        });
                    }
                }
            });
        });
    });

    // socket for channel page
    chan_ns.on('connection', (socket) => {

        // On user join
        socket.on('join', (channelId) => {
            // find connected channel by id
            Channel.findById(channelId, (err, channel) => {
                if (err) throw err;

                // if the channel is not found
                if(!channel) {
                    // emit update function with error
                    socket.emit('updateUserList', { error: 'No channel found' });
                } else {
                    // if connected socket does not have a valid session
                    if (socket.request.session.passport == null) {
                        return;
                    }
                    // add user to channel
                    Channel.addUser(channel, socket, (err, newChannel) => {
                        socket.join(newChannel.id);
                        // get list of connected users
                        Channel.getUsers(newChannel, socket, (err, users, numUser) => {
                            if (err) throw err;

                            socket.emit('updateUserList', users, true);

                            if(numUser === 1) {
                                socket.broadcast.to(newChannel.id).emit('updateUserList', users[users.length - 1]);
                            }

                            // Update channel user count
                            home_ns.emit('updateUsers', newChannel);
                        })
                    })
                }
            });
        });

        // On user disconnect
        socket.on('disconnect', () => {
            // if connected socket does not have a valid session
            if(socket.request.session.passport == null){
				return;
			}
            // Remove user from channel user list
            Channel.removeUser(socket, (err, channel, userId, numUser) => {
                if (err) throw err;

                socket.leave(channel.id);

                if(numUser === 1) {
                    socket.broadcast.to(channel.id).emit('removeUser', userId);
                }

                home_ns.emit('updateUsers', channel);
            });
        });

        // On new channel message
        socket.on('newMessage', (message) => {
            if(message.message.length > 400) {
                console.log('message length over 400 char');
            } else {
                Channel.findById(message.channelId, (err, channel) => {
                    if (err) throw err;
                    if(!channel) {
                        console.log('Error saving message - Channel not found: ' + message.channelId);
                    } else {
                        Channel.addMessage(channel, message, (err, newMessage) => {
                            socket.broadcast.to(message.channelId).emit('postMessage', message);
                        });
                    }
                });
            }

        });

    });
}
