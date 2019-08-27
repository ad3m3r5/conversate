// Basic structure and some functions to:
// OmarElGabry (chat.io) - https://github.com/OmarElGabry/chat.io

var app = {
    home: function() {
        $('#pass-check').on('click', function(e) {
            if(this.checked) {
                $('#chan-pass').css({ 'display' : 'block' });
                $('#chan-pass-note').css({ 'display' : 'block' });
            } else {
                $('#chan-pass').css({ 'display' : 'none' });
                $('#chan-pass-note').css({ 'display' : 'none' });
            }
        });


        var socket = io('/home');
        socket.on('connect', function() {

            // Update channel list
            socket.on('updateChannelList', function(channel) {
                if(channel.error != null) {
                    alert(channel.error.toString());
                } else {
                    app.workers.updateChannelList(channel);
                }
            });

            socket.on('updateChannelUsers', function(channels) {
                if(channels != null && channels.length !== 0) {
                    app.workers.updateChannelUsers(channels);
                }
            });

            // Update user count on channel list
            socket.on('updateUsers', function(channel) {
                $('#channel-' + channel._id.toString() + ' .channel-users-num').html(channel.connections.length.toString());
            });

            // New channel added
            $('#chan-btn').on('click', function(e) {
                // get result bool from function
                var result = app.workers.verifyChannel();
                var channelName = $('#chan-name').val();
                var channelPassword = $('#chan-pass').val();
                // if password
                if (result === true) {
                    socket.emit('addChannel', channelName, channelPassword, true);
                    app.workers.clearChannelVal();
                // if no password
                } else if (result === false) {
                    socket.emit('addChannel', channelName, null, false);
                    app.workers.clearChannelVal();
                }
            });
            $('#chan-name').keypress(function(e) {
                if(e.which == 13) {
                    var result = app.workers.verifyChannel();
                    var channelName = $('#chan-name').val();
                    var channelPassword = $('#chan-pass').val();
                    // if password
                    if (result === true) {
                        socket.emit('addChannel', channelName, channelPassword, true);
                        app.workers.clearChannelVal();
                    // if no password
                    } else if (result === false) {
                        socket.emit('addChannel', channelName, null, false);
                        app.workers.clearChannelVal();
                    }
                }
            });

        });
    },
    channel: function(channelId, username) {
        app.workers.autoScroll(true);
        var maxLength = 400;
        $('#message-input').keyup(function() {
            var length = maxLength - $(this).val().length;
            $('#chars').text(length);
        });

        var socket = io('/channel');
        socket.on('connect', function() {

            // User joins channel
            socket.emit('join', channelId);

            // User leaves channel
            socket.on('removeUser', function(userId) {
                $('li#user-' + userId).remove();
                app.workers.updateNumUser();
            });

            // Update user list
            socket.on('updateUserList', function(users, clear) {
                if(users.error != null) {
                    alert(users.error.toString());
                } else {
                    app.workers.updateUserList(users, clear);
                }
            });

            // Send new message
            $("#send-btn").on('click', function(e) {
                var messageText = $('#message-input').val().trim();
                if (messageText.length > 400) {
                    alert('Please limit your message to 400 characters');
                }
                if (messageText.length !== 0 && messageText.length <= 400) {
                    var message = {
                        username: username,
                        message: messageText,
                        channelId: channelId,
                        sent_on: Date.now()
                    };
                    $('#message-input').val('');
                    $('#message-input').focus();
                    $('#chars').text('400');
                    socket.emit('newMessage', message);
                    app.workers.postMessage(message, true);
                }
            });
            $('#message-input').keypress(function(e) {
                var messageText = $('#message-input').val().trim();
                if (messageText.length > 400) {
                    alert('Please limit your message to 400 characters');
                }
                if(e.which == 13 && messageText.length !== 0 && messageText.length <= 400) {
                    var message = {
                        username: username,
                        message: messageText,
                        channelId: channelId,
                        sent_on: Date.now()
                    };
                    $('#message-input').val('');
                    $('#message-input').focus();
                    $('#chars').text('400');
                    socket.emit('newMessage', message);
                    app.workers.postMessage(message, true);
                }
            });

            // New Message
            socket.on('postMessage', function(message) {
                app.workers.postMessage(message, false);
            });
        });
    },
    workers: {
        verifyChannel: function() {
            var channelName = $('#chan-name').val();
            var channelPassword = $('#chan-pass').val();
            var format = /^[a-z0-9_-]{2,15}$/igm;
            var format2 = /^[a-z0-9_-]{1,32}$/igm;
            if ($('#pass-check').prop('checked') === true) {
                if (channelName !== '' && format.test(channelName)) {
                    if(channelPassword !== '' && format2.test(channelPassword)) {
                        return true;
                    } else {
                        alert('Please enter a valid channel password');
                    }
                } else {
                    alert('Please enter a valid channel name');
                }
            } else if ($('#pass-check').prop('checked') === false) {
                if (channelName !== '' && format.test(channelName)) {
                    return false;
                } else {
                    alert('Please enter a valid channel name');
                }
            } else {
                alert('Error: Please try again later');
            }
        },
        clearChannelVal: function() {
            $('#chan-name').val('');
            $('#chan-pass').val('');
            $('#chan-pass').css({ 'display' : 'none' });
            $('#chan-pass-note').css({ 'display' : 'none' });
            $('#pass-check').prop('checked', false);
        },
        // Update channel list on home pages
        updateChannelList: function(channel) {
            $('#channel-list').append(
                '<li id="channel-' + channel._id.toString() + '" class="channel-block">' +
                '<a href="/channel/' + channel._id.toString() + '">' +
                '<span class="channel-name">' + channel.channelName + '</span>' +
                '<span class="channel-users">Users: <span class="channel-users-num">' + channel.connections.length.toString() + '</span></span>' +
                '</a>' +
                '</li>'
            );
            this.updateNumChannel();
        },
        // Update number of users on channel block - home page
        updateChannelUsers: function(channels) {
            for(var i = 0; i < channels.length; i++) {
                var chan = $('#channel-' + channels[i]._id.toString());
                var chanUsers = chan.find('.channel-users-num').html();
                if (chan && chan.length !== 0) {
                    var users = (channels[i].connections.length).toString();
                    if(chanUsers !== users) {
                        chan.find('.channel-users-num').html(users);
                    }
                }
            }
        },
        // Update user list on channel page
        updateUserList: function(users, clear) {
            var exists;
            if(users.constructor !== Array) {
                users = [users];
            }
            var newList = '';
            for(var i = 0; i < users.length; i++) {
                if(!$('li#user-' + users[i]._id.toString()).length) {
                    newList += '<li id="user-' + users[i]._id.toString() + '" class="user-box">' +
                    '<i class="fa fa-user-circle user-icon" aria-hidden="true"></i> ' +
                    '<span class="user-conn-name">' + users[i].username + '</span>' +
                    '</li>'
                }
            }
            if(newList === '') return;

            if(clear != null && clear == true) {
                $('#user-list').html('').html(newList);
            } else {
                $('#user-list').prepend(newList);
            }

            this.updateNumUser();
        },
        // Add message to channel
        postMessage: function(message, ownMessage) {
            message.sent_on = (new Date(message.sent_on)).toLocaleTimeString("en-US", {hour: '2-digit', minute: '2-digit'});
            var whichMsg;
            if (ownMessage == true) { whichMsg = 'own';
            } else { whichMsg = 'oth'; }

            $('#message-list').append(
                '<li class="message message-' + whichMsg + '">' +
                '<span class="message-cont">' + message.username + '</span>' +
                '<span class="message-cont">' + message.message + '</span>' +
                '<span class="message-date">' + message.sent_on + '</span>' +
                '</li>'
            );
            this.autoScroll(true);
        },
        // Update number of channels
        updateNumChannel: function() {
            clen = $('#channel-list li').length;
            $('#channel-count').html('Channels: ' + clen.toString());
        },
        // Update number of users
        updateNumUser: function() {
            var numUser = $('.user-box').length;
            $('#user-count').html(numUser.toString() + ' User(s) Connected');
        },
        autoScroll: function(onLoad) {
            var messageBox = document.getElementById('message-list-box');
            //var scrolled = messageBox.scrollHeight - messageBox.clientHeight <= messageBox.scrollTop + 1;
            messageBox.scrollTop = messageBox.scrollHeight;
        }
    }
};
