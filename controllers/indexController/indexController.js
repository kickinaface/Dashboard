function IndexController(){
    this.init = function init(app, router, pageFile, User){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
        //Page Routing
        app.route("/").get(function (req, res){
            var heldToken = req.cookies.myDashboardAppToken;
            var clientUserAgent = req.headers['user-agent'];
            if(heldToken != undefined){
                User.findOne({token:heldToken, userAgent:clientUserAgent}, function(err, foundUser){
                    if(foundUser){
                        if(tokenMethods.authenticateToken(heldToken) == true){
                            res.redirect('/dashboard');
                        } else {
                            foundUser.token = null;
                            foundUser.userAgent = null;
                            foundUser.save();
                            res.sendFile(pageFile);
                        }
                    }
                });
            } else{
                res.sendFile(pageFile);
            }
        });
    }
}

var indexController = new IndexController();
module.exports = indexController;