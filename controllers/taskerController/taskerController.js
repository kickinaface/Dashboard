function TaskerController(){
    this.init = function init(app, router, pageFile, User, Tasker){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
        var moment = require('moment');
        //Page Routing
        app.route("/dashboard/tasker").get(function (req, res){
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
        // Api routes
        router.route("/dashboard/tasker/createTask").post(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var taskName = req.body.taskName;
            var taskDetails = req.body.taskDetails;
            var taskModel = new Tasker();
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            if(!taskName || !taskDetails){
                                res.status(404).send({message:"You must provide the task name and the details."})
                            } else {
                                taskModel.taskName = taskName;
                                taskModel.taskDetails = taskDetails;
                                taskModel.createdBy = foundUser.username;
                                taskModel.createdDate = moment().format();
                                taskModel.completedDate = null;
                                taskModel.taskSteps = [];
                                taskModel.taskMembers = [];
                                // Save the task and check for errors
                                taskModel.save(function (err) {
                                    if (err){
                                        res.send(err);
                                    } else {
                                        // Check if user enabled email notifications/
                                        // if(admin.emailMessages == true){
                                        //     var preparedMessage = ('<strong>From: '+ fromUserKey+ '</strong><br/>'+messageKey);
                                        //     mailController.sendEmailFromMessages(toUserKey, preparedMessage);
                                        // }
                                        res.send({message: "Task was created!"});
                                    }
                                });
                            }
                        } else {
                            res.sendStatus(403);
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/tasker/getTasks").get(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            Tasker.find(function(err, tasks){
                                if(err){
                                    res.send({message:err});
                                } else {
                                    var preparedTasks = [];
                                    for(var t = 0; t<= tasks.length-1; t++){
                                        // Get all the tasks the user has created
                                        // Later say that, OR if user is in the list of task members
                                        if(tasks[t].createdBy == foundUser.username){
                                            preparedTasks.push(tasks[t]);
                                        }
                                    }
                                    res.send(preparedTasks.reverse());
                                }
                            });
                        } else {
                            res.sendStatus(403);
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/tasker/update").post(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var updateTask = req.body.postData;

            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){                            
                            Tasker.findOne({_id:updateTask.taskId, createdBy:foundUser.username}, function(err, foundTask){
                                if(err){
                                    console.log(err);
                                    res.send({message:err});
                                } else {
                                    foundTask.taskName = updateTask.taskName;
                                    foundTask.taskDetails = updateTask.taskDetails;
                                    foundTask.save(function(err){
                                        if (err){
                                            res.send(err);
                                        } else {
                                            // Check if user enabled email notifications/
                                            // if(admin.emailMessages == true){
                                            //     var preparedMessage = ('<strong>From: '+ fromUserKey+ '</strong><br/>'+messageKey);
                                            //     mailController.sendEmailFromMessages(toUserKey, preparedMessage);
                                            // }
                                            res.send({message: "Successfully update", postData:updateTask});
                                        }
                                    });
                                }
                            });
                        } else {
                            res.sendStatus(403);
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });
    }
}

var taskerController = new TaskerController();
module.exports = taskerController;