function LogoutController(){
    this.init = function init(app, router, pageFile, User){
        app.route("/logout").get(function (req, res){
            if(req.cookies.myDashboardAppToken != undefined){
                User.findOne({token: req.cookies.myDashboardAppToken}, function (err, foundUser){
                    if(foundUser != null){
                        foundUser.token = null;
                        foundUser.userAgent = null;
                        foundUser.save();
                        var moment = require("moment");
                        console.log("User: ", foundUser.username, " has logged out.", "At: ", moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
                        res.sendFile(pageFile);
                    }
                })
            } else {
                res.redirect('/login');
            }
            
        });
    }
}

var logoutController = new LogoutController();
module.exports = logoutController;