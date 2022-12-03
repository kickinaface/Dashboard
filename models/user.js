var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    firstName: String,
    lastName: String,
    username: String,
    password: String,
    role: String,
    token: String,
    userAgent: String,
    forgotPass: String,
    isHidden: Boolean,
    createdDate: Date
});

UserSchema.index({'firstName':'text', 'lastName':'text', 'username':'text'});

module.exports = mongoose.model('User', UserSchema);