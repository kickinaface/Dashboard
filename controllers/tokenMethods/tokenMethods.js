function TokenMethods() {
    const jwt = require('jsonwebtoken');

    this.generateAccessToken = function generateAccessToken(username) {
        return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1h' });
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