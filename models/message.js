var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    fromUser: String,
	toUser: String,
	message: String,
    createdDate: Date,
});

//MessageSchema.index({'fromUser':'text', 'toUser':'text'});

module.exports = mongoose.model('Message', MessageSchema);