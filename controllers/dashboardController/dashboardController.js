function DashboardController(){
    this.init = function init(app, router, pageFile, adminPageFile, User){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
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
                        res.send({name:(foundUser.firstName + ' '+ foundUser.lastName)})
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

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
                                        createdDate: allUsers[u].createdDate
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