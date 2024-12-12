function InteractiveController(){
    const phoneCarriers = require("../dashboardController/mobileCarriers");
    this.init = function init(app, router, pageFile, User, MessageModel){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
        var mailController = require("../mailController/mailController");
        var moment = require('moment');
        //Page Routing
        app.route("/dashboard/messages").get(function (req, res){
            var heldToken = req.cookies.myDashboardAppToken;
            var clientUserAgent = req.headers['user-agent'];
            if(heldToken != undefined){
                User.findOne({token:heldToken, userAgent:clientUserAgent}, function(err, foundUser){
                    if(foundUser){
                        if(tokenMethods.authenticateToken(heldToken) == true){
                            res.sendFile(pageFile);
                        } else {
                            res.redirect("/login");
                        }
                    }
                });
            } else{
                res.redirect("/login");
            }
        });

        router.route("/dashboard/messages").get(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            var preparedMessages = [];
                            var _ = require('lodash');
                            //
                            MessageModel.find(function(err, msgs){
                                if(err){
                                    res.send({message:err})
                                } else {
                                    // Loop through all messages and place all associated messages together by user
                                    for(let m = 0; m<= msgs.length-1; m++){
                                        // Put all messages with users name both to and from in array
                                        if(msgs[m].toUser == foundUser.username || msgs[m].fromUser == foundUser.username){                                            
                                            // For each message, find the from user and set their name
                                            User.findOne({username:msgs[m].fromUser}, function(err, user){
                                                if(err){
                                                    console.log(err);
                                                } else{
                                                    var heldMessageObject = msgs[m];
                                                    var avatarImageUrl = user.avatarPhotoLink;
                                                    if(!avatarImageUrl){
                                                        avatarImageUrl = "/img/default-image.png";
                                                    }
                                                    var preparedMessageObject = {
                                                        _id: heldMessageObject._id,
                                                        fromUser: heldMessageObject.fromUser,
                                                        toUser: heldMessageObject.toUser,
                                                        name: (user.firstName + " "+ user.lastName),
                                                        message: heldMessageObject.message,
                                                        creationDate: heldMessageObject.createdDate,
                                                        avatarImage: avatarImageUrl
                                                    }
                                                    // Push the newly prepared object to the array
                                                    preparedMessages.push(preparedMessageObject);
                                                }
                                            });
                                        }
                                    }
                                }
                                setTimeout(function(){
                                        //Sort by most recent date
                                        var orderedMessages = _(preparedMessages)
                                                .groupBy(user =>user.fromUser)
                                                .sortBy(group => moment(group.creationDate).format("dddd, MMMM Do YYYY, h:mm:ss a"), ["asc"]).value();
                                        res.send(orderedMessages);
                                },1000);
                            });
                        } else {
                            res.sendStatus(403);
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/messages/sendMessage").post(function (req, res){
            var toEmail = req.body.toEmail;
            var usersMessage = req.body.usersMessage;
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var msgModel = new MessageModel();
            //
            if(!toEmail || !usersMessage){
                res.status(404).send({message:"You must complete the form."});
            }else{
                if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                    User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                        if(err){
                            res.send({message:err});
                        } else {
                            if(foundUser){
                                var heldUserName = (foundUser.firstName+" "+foundUser.lastName);
                                if(foundUser.username == toEmail){
                                    res.status(404).send({message:"You cannot send a message to yourself."});
                                } else {
                                    // Check if the person you are sending to exists
                                    User.findOne({username:toEmail}, function(err, userToSend){
                                        if(err){
                                            console.log(err);
                                            res.send(err);
                                        } else {
                                            if(userToSend != null){
                                                // Add the new message to the DB
                                                msgModel.fromUser = foundUser.username;
                                                msgModel.toUser = toEmail;
                                                msgModel.message = usersMessage;
                                                msgModel.createdDate = moment().format();
                                                //save the message and check for errors
                                                msgModel.save(function (err) {
                                                    if (err){
                                                        res.send(err);
                                                    } else {
                                                        // Send Email
                                                        mailController.sendMessageToUser(toEmail, foundUser.username, usersMessage);
                                                        // Send Text if notification is enabled
                                                        User.findOne({username:toEmail}, function(err, foundUser){
                                                            if(foundUser){
                                                                //if enabled
                                                                if(foundUser.mobileNotifications == true){
                                                                    mailController.sendText((foundUser.mobileNumber+"@"+phoneCarriers.carriers[foundUser.mobileCarrier].domain), 
                                                                                            {message:usersMessage}, heldUserName);
                                                                }
                                                            } else{
                                                                res.status(403).send({message:"No user by that address"});
                                                            }
                                                        });
                                                        res.send({message:"Your message has been sent."});
                                                    }
                                                });
                                            } else {
                                                res.status(403).send({message:"There is no such user."});
                                            }
                                            
                                        }
                                    });
                                    
                                }
                            } else {
                                res.sendStatus(403);
                            }
                        }
                    });
                } else {
                    res.sendStatus(403);
                }
            }
        });

        router.route("/dashboard/messages/removeMessages").delete(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var withUser = req.body.withUser;
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        // Find all messages where users are communicating with each other.
                        MessageModel.deleteMany({fromUser: withUser, toUser:foundUser.username}, function(err, data){
                            if(err){
                                console.log(err);
                            } else if(data.n == 1){
                                console.log('deleted FROM');
                            }
                        });
                        MessageModel.deleteMany({toUser: withUser, fromUser:foundUser.username}, function(err, data){
                            if(err){
                                console.log(err);
                            } else if(data.n == 1){
                                console.log('deleted TO');
                            }
                        });
                        setTimeout(function(){
                            res.send({message:'This conversation has been deleted'});
                        },1000);
                    };
                });
            } else {
                res.sendStatus(403);
            }
        });
    }
}

var interactiveController = new InteractiveController();
module.exports = interactiveController;