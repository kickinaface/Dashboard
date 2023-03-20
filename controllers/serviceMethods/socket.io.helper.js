(function() {
    'use strict';
  
    let currentUsers = [];
  
    function manageSocketIO(io) {
        io.on('connection', function (socket) {
            console.log('client connected: ', socket.id);
            // Send an ID to all connecting clients
            sendIdToClient(socket);
  
            // Update the users array for new users
            updateNewlyJoined(io, socket);
  
            // Display all users for clients requesting the array.
            getAllUsers(io, socket);
  
            // Take care of what happens when users move their direction
            handleDirectionChange(io, socket);
  
            // Public chat for all users
            handleChatMessage(io, socket);
  
            // Handle messages
            handleUserMessages(io, socket);
  
            // Handle user disconnection
            handleDisconnect(io, socket);
  
        });
    };
  
    function sendIdToClient(socket) {
        // Send the connected user their client id.
        socket.on('getClientId', function () {
            socket.emit('clientId', socket.client.id );
        });
    };
  
    function updateNewlyJoined(io, socket) {
        // Everytime a user joins, push their data to the currentUsers array
        // Then update the other users
        socket.on('user joined', function (data) {
            currentUsers.push(data);
            updateCurrentUsers(io);
        });
    };
  
    function getAllUsers(io, socket) {
        // Get users and display them back to client
        socket.on('getUsers', function (data) {
            updateCurrentUsers(io);
        })
    };
  
    function handleDirectionChange(io, socket) {
        // Update the direction of the user's position
        socket.on('changeUserDirection', function (client) {
            // Search through the array for the client and then change their direction
            // Then update the other users
            for (var u=0; u<=(currentUsers.length-1); u++) {
                if (currentUsers[u].id === client.id) {
                    currentUsers[u].x = (currentUsers[u].x + client.x);
                    currentUsers[u].y = (currentUsers[u].y + client.y);
                    updateCurrentUsers(io);
                } else {
                    // No user found possible error to throw
                }
            }
        });
    };
  
    function handleChatMessage(io, socket) {
        // User sends a chat message
        socket.on('sendChatMessage', function(data) {
            // Broadcast chat message to all users
            io.emit('chatMessageReceived', data);
        });
    };
  
    function handleUserMessages(io, socket) {
        socket.on('new message', function (newMessage) {
            if (io.sockets.connected[newMessage.to]) {
                io.sockets.connected[newMessage.to].emit('get messages', newMessage);
            } else {
                // Throw an error as there is no user by that id.
            }
        })
    };
  
    function handleDisconnect(io, socket) {
        socket.on('disconnect', function (data) {
            console.log('disconnect: ', data);
            // Loop through the array, find the socket that has disconnected
            // Then remove them from the array.
            for (var i=0; i<=(currentUsers.length-1); i++) {
                if (currentUsers[i].id === socket.client.id) {
                    currentUsers.splice(i, 1);
                    updateCurrentUsers(io);
                } else {
                    // No user found possible error to throw
                }
            }
        });
    };
  
    function updateCurrentUsers(io) {
        io.sockets.emit('updateUsers', { users: currentUsers });
    }
  
    module.exports = {
        manageSocketIO: (io) => { manageSocketIO (io) }
    };
  
  }());
  