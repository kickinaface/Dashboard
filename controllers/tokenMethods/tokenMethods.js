function TokenMethods() {
    const   jwt = require('jsonwebtoken');
    var moment = require("moment");
    this.generateAccessToken = function generateAccessToken(username, time) {
        console.log("User: "+username.username+ " has logged in with a: "+time+" valid session. At: "+moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
        return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: time });
    };

    this.authenticateToken = function authenticateToken(token) {
        return jwt.verify(token, process.env.TOKEN_SECRET, function (err, user) {
            if(err){
                return false;
            } else {
                return true;
            }
        });
    };
};

var tokenMethods = new TokenMethods();
module.exports = tokenMethods;