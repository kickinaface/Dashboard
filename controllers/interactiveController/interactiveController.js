function InteractiveController(){
    this.init = function init(app, router, pageFile, User){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
        //Page Routing
        app.route("/dashboard/interactive").get(function (req, res){
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
    }
}

var interactiveController = new InteractiveController();
module.exports = interactiveController;