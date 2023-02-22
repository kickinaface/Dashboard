function Login(){
    var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
    this.init = function init(app, router, pageFile, User){
        // Page routing
        app.route("/login").get(function (req, res){
            var heldToken = req.cookies.myDashboardAppToken;
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(heldToken != undefined){
                User.findOne({token:heldToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function(err, foundUser){
                    if(foundUser){
                        if(tokenMethods.authenticateToken(heldToken) == true){
                            res.redirect('/dashboard');
                        } else {
                            res.sendFile(pageFile);
                        }
                    }
                });
            } else{
                res.sendFile(pageFile);
            }
        });
        // API Routing for Login
        router.route("/login").post(function (req, res){
            var bcrypt = require('bcrypt');
            var clientUserAgent = req.headers['user-agent'];
            var errorMessage = 'Incorrect login credentials. Please check and try again.';
            var username = req.body.username;
            var password = req.body.password;
            var ipAddress = req.socket.remoteAddress;
            username = username.toLowerCase();
            if(username === undefined || password === undefined || username === '' || password === '') {
                res.status(403).send({ message: 'ERROR: You must define a username and password'});
            } else {
                User.findOne({username:username}, function(err, foundUser){
                    if(foundUser == null || foundUser == undefined){
                        res.status(403).send({message: errorMessage});
                    } else {
                        if(bcrypt.compareSync(password, foundUser.password) || password == foundUser.forgotPass) {
                            var token = tokenMethods.generateAccessToken({ username: username });
                            foundUser.token = token;
                            foundUser.userAgent = clientUserAgent;
                            foundUser.forgotPass = null;
                            foundUser.ipAddress = ipAddress;
                            foundUser.save();
                            res.cookie('myDashboardAppToken', token);
                            res.json({
                                token: token
                            });
                        } else {
                            res.status(403).send({message: errorMessage});
                        }
                    }
                });
            }
        });

        router.route("/login/forgotPassword").post(function (req, res){
            var userToCheck = req.body.forUserEmail;
            userToCheck = userToCheck.toLowerCase();
            if(userToCheck === undefined || userToCheck === ''){
                res.status(403).send({message:"You must define an email address"});
            } else {
                User.findOne({username: userToCheck}, function (err, foundUser){
                    if(foundUser) {
                        var genudid = require("../../controllers/serviceMethods/generateUdid");
                        var forgotPass = genudid.gen();
                        foundUser.forgotPass = forgotPass
                        console.log("foundUser.forgotPass: ",foundUser.forgotPass);
                        foundUser.save();
                        res.send({message:"Please check your email."});
                        var mailController = require("../../controllers/mailController/mailController");
                        mailController.sendForgotPasswordEmail(foundUser.username, forgotPass);
                    }else {
                        res.status(403).send({message:"There is no user by that email."});
                    }
                });
            }
        });
    }
}

var loginController = new Login();

module.exports = loginController;