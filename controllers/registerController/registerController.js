function RegisterController(){
    this.init = function init(app, router, pageFile, User){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
        // Page routing
        app.route("/register").get(function (req, res){
            var heldToken = req.cookies.myDashboardAppToken;
            var clientUserAgent = req.headers['user-agent'];
            if(heldToken != undefined){
                User.findOne({token:heldToken, userAgent:clientUserAgent}, function(err, foundUser){
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

         // API Routing for Register
        router.route("/register").post(function (req, res){
            var bcrypt = require('bcrypt');
            var newUser = new User();
            var emailAddress = req.body.username;
            var password = req.body.password;
            var firstName = req.body.firstName;
            var lastName = req.body.lastName;
            var alreadyExists = 'This user already exists, please sign in.';

            if(emailAddress === undefined || password === undefined || emailAddress === '' || password === '') {
                res.status(403).send({message: 'ERROR: You must provide a username and password' });
            } else if(ValidateEmail(emailAddress) == false){
                res.status(403).send({ message:'ERROR: You must provide a valid email address.' })
            } else if(ValidatePassword(password) == false){
                res.status(403).send({ message:"Minimum eight characters, at least one letter and one number." });
            } else {
                User.findOne({username: emailAddress}, function (err, foundUser){
                    if(foundUser == null || foundUser == undefined){
                        if(firstName === undefined || firstName === ''  || lastName === undefined || lastName === ''){
                            res.status(403).send({ message: 'ERROR: You must provide your First and Last name.' });
                        } else{
                            var moment = require("moment");
                            newUser.username = emailAddress;
                            newUser.password = bcrypt.hashSync(password, 10);
                            newUser.firstName = firstName;
                            newUser.lastName = lastName;
                            newUser.role = 'Basic';
                            newUser.createdDate = moment().format();
                            //
                            newUser.save(function (err) {
                                if(err){
                                    res.send(err);
                                } else {
                                    res.json({ message:'Registration Success! Please Login.' });
                                }
                            });
                        }
                    } else {
                        res.status(403).send({message: alreadyExists});
                    }
                });
            }
        });
    }

    function ValidateEmail(email){
        if(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)){
            return (true);
        } else {
            return (false);
        }
    };

    function ValidatePassword(password){
        if(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)){
            return (true);
        } else {
            return (false);
        }
    }
}

var registerController = new RegisterController();
module.exports = registerController;