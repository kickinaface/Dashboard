var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TaskSchema = new Schema({
    taskName: String,
    taskDetails: String,
    createdBy: String,
    createdDate: Date,
    completedDate:Date,
    taskSteps:Array,
    taskMembers:Array
});

TaskSchema.index({'taskName':'text', 'createdBy':'text'});

module.exports = mongoose.model('Task', TaskSchema);