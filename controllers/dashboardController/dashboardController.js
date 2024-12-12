const mailController = require("../mailController/mailController");

function DashboardController(){
    this.init = function init(app, router, pageFile, adminPageFile, User){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
        var phoneCarriers = require("../../controllers/dashboardController/mobileCarriers");
        // Page routing
        app.route("/dashboard").get(function (req, res){
            var heldToken = req.cookies.myDashboardAppToken;
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(heldToken != undefined){
                User.findOne({token:heldToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function(err, foundUser){
                    if(foundUser){
                        if(tokenMethods.authenticateToken(heldToken) == true){
                            if(foundUser.role != "Admin"){
                                res.sendFile(pageFile);
                            } else if(foundUser.role == "Admin"){
                                res.sendFile(adminPageFile);
                            }
                        } else {
                            res.redirect("/login");
                        }
                    }
                });
            } else{
                res.redirect("/login");
            }
        });
        // API Routes
        router.route("/dashboard/checkToken").get(function (req, res) {
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                res.send({message:'token is valid'});
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/getName").get(function (req, res) {
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        res.send({name:(foundUser.firstName + ' '+ foundUser.lastName), email:foundUser.username});
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        // Avatar Routes
        router.route("/dashboard/getAvatar").get(function (req, res) {
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        res.send({url:foundUser.avatarPhotoLink});
                    } else {
                        res.status(403).send({message:"There is no user found by that name."});
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/updateAvatar").post(function (req, res){
            var avatarLink = req.body.url;
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(!avatarLink){
                            res.status(403).send({message:"You must not leave the input blank."});
                        } else {
                            foundUser.avatarPhotoLink = avatarLink;
                            foundUser.save();
                            res.send({message:"Successfully updated avatar image."});
                        }
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });
        // Mobile routes
        router.route("/dashboard/mobileSettings").get(function(req, res){
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        var preparedObject = {
                            carriers: phoneCarriers.carriers,
                            userSettings: {
                                number:foundUser.mobileNumber,
                                carrier:foundUser.mobileCarrier,
                                enabled:foundUser.mobileNotifications
                            }
                        };
                        res.send(preparedObject);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/updateMobileSettings").post(function(req, res){
            var userSettings = req.body;
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(!userSettings.number || isNaN(userSettings.number) || userSettings.number.length!=10){
                            res.status(403).send({message:"You must provide a valid phone number."});
                        } else if(!userSettings.carrier || userSettings.carrier == -1){
                            res.status(403).send({message:"You must select a carrier from the list. Contact your admin if not listed."});
                        } else {
                            foundUser.mobileNumber = userSettings.number;
                            foundUser.mobileCarrier = userSettings.carrier;
                            foundUser.mobileNotifications = userSettings.isEnabled; 
                            foundUser.save();
                            var message = "Successfully updated mobile settings!";
                            res.send({message:message});
                            // Send a text/email that it was updated.
                            mailController.sendText((foundUser.mobileNumber+"@"+phoneCarriers.carriers[foundUser.mobileCarrier].domain), 
                                                    {message:message}, 
                                                    null);
                        }
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/removeNumber").post(function(req, res){
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        foundUser.mobileNumber = undefined;
                        foundUser.mobileCarrier = undefined;
                        foundUser.mobileNotifications = undefined; 
                        foundUser.save();
                        res.send({message:"Successfully removed device."});
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        //Theme routes
        router.route("/dashboard/getTheme").get(function (req, res) {
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        res.send({uiTheme:foundUser.uiTheme});
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/changeTheme").post(function (req, res) {
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(!req.body.uiTheme){
                            res.status(404).send({message:"No theme updated"});
                        }else if(req.body.uiTheme == "Charcoal"){
                            foundUser.uiTheme = "Charcoal";
                            foundUser.save();
                            res.json({name:"Charcoal", color:"#424242"});
                        } else if(req.body.uiTheme == "Red"){
                            foundUser.uiTheme = "Red";
                            foundUser.save();
                            res.json({name:"Red", color:"#C41717"});
                        } else if(req.body.uiTheme == "Orange"){
                            foundUser.uiTheme = "Orange";
                            foundUser.save();
                            res.json({name:"Orange", color:"#ff8400"});
                        } else if(req.body.uiTheme == "Yellow"){
                            foundUser.uiTheme = "Yellow";
                            foundUser.save();
                            res.json({name:"Yellow", color:"#ffd000"});
                        } else if(req.body.uiTheme == "Green"){
                            foundUser.uiTheme = "Green";
                            foundUser.save();
                            res.json({name:"Green", color:"#09b200"});
                        } else if(req.body.uiTheme == "Blue"){
                            foundUser.uiTheme = "Blue";
                            foundUser.save();
                            res.json({name:"Blue", color:"#007bff"});
                        } else if(req.body.uiTheme == "Pink"){
                            foundUser.uiTheme = "Pink";
                            foundUser.save();
                            res.json({name:"Pink", color:"#ff00a6"});
                        } else if(req.body.uiTheme == "Purple"){
                            foundUser.uiTheme = "Purple";
                            foundUser.save();
                            res.json({name:"Purple", color:"#7700ff"});
                        } else {
                            res.status(404).send({message:"You must select a theme."});
                        }
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        // Admin route
        router.route("/dashboard/getAllUsers").get(function (req, res){
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, role: "Admin", userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        User.find(function (err, allUsers){
                            if(err){
                                res.send(err);
                            } else {
                                var preparedUserList = [];
                                for(var u=0; u<=allUsers.length-1; u++){
                                    var preparedUser = {
                                        _id:allUsers[u]._id,
                                        firstName: allUsers[u].firstName,
                                        lastName: allUsers[u].lastName,
                                        username: allUsers[u].username,
                                        role: allUsers[u].role,
                                        userAgent: allUsers[u].userAgent,
                                        isHidden: allUsers[u].isHidden,
                                        createdDate: allUsers[u].createdDate,
                                        lastLogin: allUsers[u].lastLogin
                                    }
                                    preparedUserList.push(preparedUser);
                                }
                                res.send(preparedUserList);
                            }
                        });
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else{
                res.sendStatus(403);
            }
        });
        // Admin route
        router.route("/dashboard/deleteUserbyId/:userId").delete(function (req, res){
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, role:"Admin", userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser){
                    if(foundUser){
                        var userToDeleteById = req.params.userId;
                        User.deleteOne({
                            _id: userToDeleteById
                        }, function(err, data){
                            console.log(data);
                            res.json({message:"User has been deleted."});
                        });
                    } else{
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });
        // Admin route
        router.route("/dashboard/updateUserRole").post(function(req, res){
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, role:"Admin", userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser){
                    if(foundUser){
                        var userToUpdate = req.body.userId;
                        var newRole = req.body.selectRole;
                        User.findOne({_id: userToUpdate}, function(err, toUpdateUser){
                            if(toUpdateUser){
                                // TODO: Add validation between roles or send an error.
                                toUpdateUser.role = newRole;
                                toUpdateUser.save();
                                res.json({message:"User's role has been updated successfully."});
                            } else {
                                res.status(404).send({message:"There is no user by that ID."});
                            }
                        });
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/updateName").post(function (req, res){
            var preparedName = req.body.preparedName;
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(preparedName.firstName == "" && preparedName.lastName == ""){
                            res.status(403).send({message:"Do not leave both fields blank."});
                        } else {
                            if(preparedName.firstName != ""){
                                foundUser.firstName = preparedName.firstName;
                            }
                            if(preparedName.lastName != ""){
                                foundUser.lastName = preparedName.lastName;
                            }
                            foundUser.save();
                            res.send({message:"Your name change has been saved."});
                        }
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/changePassword").post(function (req, res){
            var preparedNewpass = req.body.preparedNewpass;
            var ipAddress = req.socket.remoteAddress;
            var clientUserAgent = req.headers['user-agent'];
            //
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(preparedNewpass.newPassword1 != preparedNewpass.newPassword2){
                            res.status(403).send({message:"You must enter the same password twice."});
                        } else if(ValidatePassword(preparedNewpass.newPassword1) == false){
                            res.status(403).send({message:"Minimum 10-16 characters, no whitespace, at least one uppercase character, at least one lowercase character, at least one digit, at least one special character."});
                        } else {
                            var bcrypt = require("bcrypt");
                            foundUser.password = bcrypt.hashSync(preparedNewpass.newPassword1, 10);
                            foundUser.token = null;
                            foundUser.save();
                            res.send({message:"Success! Logging Out.. Please close your browser and login with your new password."})
                        }
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });
    };

    function ValidatePassword(password){
        if(/^(?!.*\s)(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹]).{10,16}$/.test(password)){
            return (true);
        } else {
            return (false);
        }
    }
}

var dashboardController = new DashboardController();
module.exports = dashboardController;