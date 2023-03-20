function InteractiveController(){
    this.init = function init(app, router, pageFile, User, MessageModel){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
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
                                                    var preparedMessageObject = {
                                                        _id: heldMessageObject._id,
                                                        fromUser: heldMessageObject.fromUser,
                                                        toUser: heldMessageObject.toUser,
                                                        name: (user.firstName + " "+ user.lastName),
                                                        message: heldMessageObject.message,
                                                        creationDate: heldMessageObject.createdDate
                                                    }
                                                    // Push the newly prepared object to the array
                                                    preparedMessages.push(preparedMessageObject);
                                                    
                                                    // At the end of the loop, re-arrange and sort the message array
                                                    if(m == msgs.length-1){
                                                        setTimeout(function(){
                                                            //Sort by most recent date
                                                            var newMessages = _.sortBy(preparedMessages, function(o){
                                                                return new moment(o.createdDate);
                                                            }).reverse();

                                                            // Create new Object that is grouped by fromUser
                                                            var groupedMessages = _.groupBy(newMessages, function(o){
                                                                return o.fromUser;
                                                            });
                                                            //
                                                            res.send(groupedMessages);
                                                        },500);
                                                    }
                                                }
                                            });
                                            
                                        }
                                    }
                                }
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
                                if(foundUser.username == toEmail){
                                    res.status(404).send({message:"You cannot send a message to yourself."});
                                } else {
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
                                            // Check if user enabled email notifications/
                                            // if(admin.emailMessages == true){
                                            //     var preparedMessage = ('<strong>From: '+ fromUserKey+ '</strong><br/>'+messageKey);
                                            //     mailController.sendEmailFromMessages(toUserKey, preparedMessage);
                                            // }
                                            res.send({message:"Your message has been sent."});
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
    }
}

var interactiveController = new InteractiveController();
module.exports = interactiveController;