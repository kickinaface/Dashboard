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
    createdDate: Date,
    lastLogin:Date,
    ipAddress:String,
    uiTheme:String,
    mobileNumber:String,
    mobileCarrier:String,
    mobileNotifications:Boolean,
    avatarPhotoLink:String
});

UserSchema.index({'firstName':'text', 'lastName':'text', 'username':'text'});

module.exports = mongoose.model('User', UserSchema);