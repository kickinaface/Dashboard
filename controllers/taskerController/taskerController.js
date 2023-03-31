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
                                    setTimeout(function(){
                                        res.send(preparedTasks.reverse());
                                    },300);
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
                                    if(!updateTask.taskName || !updateTask.taskDetails){
                                        res.status(403).send({message:"You must fill out all the input fields."})
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

        router.route("/dashboard/tasker/addStep").post(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var updateTask = req.body.postData;

            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){                            
                            Tasker.findOne({_id:updateTask.taskId}, function(err, foundTask){
                                if(err){
                                    console.log(err);
                                    res.send(err)
                                } else {
                                    if(!updateTask.taskStepName || !updateTask.shortStepMessage){
                                        res.status(404).send({message:"You must complete the input fields. Do not leave blank."});
                                    } else {
                                        var preparedStep = {
                                            stepName: updateTask.taskStepName,
                                            stepDetails: updateTask.shortStepMessage,
                                            createdDate: moment().format(),
                                            completedDate: null
                                        }
                                        foundTask.taskSteps.push(preparedStep);
                                        foundTask.save(function(err){
                                            if(err){
                                                res.send(err)
                                            } else {
                                                res.send({message:"Task step was added!", postData:foundTask.taskSteps});
                                            }
                                        });
                                    }
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

        router.route("/dashboard/tasker/updateStep").post(function (req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var updateTask = req.body.postData;

            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            if(!updateTask.stepName || !updateTask.stepDetails){
                                res.status(403).send({message:"You must not leave any input fields blank."});
                            } else {
                                Tasker.findOne({_id:updateTask.taskId}, function(err, task){
                                    if(err){
                                        console.log(err);
                                        res.send(err);
                                    } else {
                                        task.taskSteps[updateTask.stepIndex].stepName = updateTask.stepName;
                                        task.taskSteps[updateTask.stepIndex].stepDetails = updateTask.stepDetails;
                                        task.markModified("taskSteps");
                                        task.save(function(err){
                                            if(err){
                                                console.log(err);
                                                res.send(err);
                                            } else {
                                                res.send({message:"Your task step was successfully updated.", postData:task.taskSteps});
                                            }
                                        });
                                    }
                                })
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

        router.route("/dashboard/tasker/removeStep").delete(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var updateTask = req.body.postData;

            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            if(!updateTask.taskId || !updateTask.stepIndex){
                                res.status(404).send({message:"You must not leave fields blank."});
                            } else {
                                Tasker.findOne({_id:updateTask.taskId}, function(err, foundTask){
                                    if(err){
                                        console.log(err);
                                        res.send(err);
                                    } else {
                                        foundTask.taskSteps.splice(updateTask.stepIndex, 1);
                                        foundTask.save(function (err){
                                            if(err){
                                                console.log(err);
                                                res.send(err);
                                            } else {
                                                res.send({message:"Step has been removed.", postData:foundTask.taskSteps});
                                            }
                                        });
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

        router.route("/dashboard/tasker/completeStep").post(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var updateTask = req.body.postData;
            
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            Tasker.findOne({_id:updateTask.taskId}, function(err, foundTask){
                                if(err){
                                    console.log(err);
                                    res.send(err);
                                } else {
                                    foundTask.taskSteps[updateTask.stepIndex].completedDate = moment().format();
                                    foundTask.markModified("taskSteps");
                                    foundTask.save(function (err){
                                        if(err){
                                            console.log(err);
                                            res.send(err);
                                        } else {
                                            res.send({message:"This step is completed.", postData:foundTask.taskSteps});
                                        }
                                    });
                                }
                            });
                        } else{
                            res.sendStatus(403);
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/tasker/addMember").post(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var updateTask = req.body.postData;

            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            Tasker.findOne({_id:updateTask.taskId}, function(err, foundTask){
                                if(err){
                                    console.log(err);
                                    res.send(err)
                                } else {
                                    if(updateTask.memberEmail == foundUser.username){
                                        res.status(404).send({message:"You cannot add yourself as a member if you created the task."});
                                    } else {
                                        if(!updateTask.memberEmail){
                                            res.status(403).send({message:"You must not leave the input field blank."});
                                        } else {
                                            // loop through current array and make sure you dont already exist
                                            var doesAlreadyExist = function doesAlreadyExist(){
                                                var isFound = false;
                                                for(var m =0; m<=foundTask.taskMembers.length-1; m++){
                                                    if(foundTask.taskMembers[m].email == updateTask.memberEmail){
                                                        isFound = true;
                                                    }
                                                }
                                                return isFound;
                                            }
                                            if(doesAlreadyExist()){
                                                res.status(403).send({message:"This user already exists in this task."})
                                            } else if(!doesAlreadyExist()){
                                                User.findOne({username:updateTask.memberEmail}, function(err, userExist){
                                                    if(err){
                                                        console.log(err)
                                                        res.status(403).send({message:err});
                                                    } else {
                                                        if(!userExist){
                                                            res.status(404).send({message:"That user doesn't exist."})
                                                        } else {
                                                            var preparedMember = {
                                                                email: updateTask.memberEmail,
                                                                dateAdded: moment().format()
                                                            }
                                                            foundTask.taskMembers.push(preparedMember);
                                                            foundTask.save(function(err){
                                                                if(err){
                                                                    console.log(err);
                                                                    res.send(err)
                                                                } else {
                                                                    res.send({message:"Member was sucessfully added to the task.", postData:foundTask.taskMembers});
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    }
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

        router.route("/dashboard/tasker/removeMember").delete(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var updateTask = req.body.postData;

            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            Tasker.findOne({_id:updateTask.taskId}, function(err, foundTask){
                                if(err){
                                    console.log(err);
                                    res.send(err)
                                } else {
                                    foundTask.taskMembers.splice(updateTask.memberIndex, 1);
                                    foundTask.save(function(err){
                                        if(err){
                                            console.log(err);
                                            res.send(err);
                                        } else {
                                            res.send({message:"Member was removed.", postData: foundTask.taskMembers});
                                        }
                                    });
                                }
                            })
                        } else {
                            res.sendStatus(403);
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/tasker/completeTask").post(function(req, res){
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
                                    res.send(err);
                                } else {
                                    foundTask.completedDate = moment().format();
                                    foundTask.save(function(err){
                                        if(err){
                                            console.log(err);
                                            res.send(err);
                                        } else {
                                            res.send({message:"This task has been marked complete!"});
                                        }
                                    });
                                }
                            });
                        }else {
                            res.sendStatus(403);
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/tasker/removeTask").delete(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var updateTask = req.body.postData;

            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            Tasker.deleteOne({_id:updateTask.taskId, createdBy: foundUser.username}, function (err){
                                if(err){
                                    console.log(err);
                                    res.send({message:err});
                                } else {
                                    res.send({message:"This task has been removed."});
                                }
                            })
                        } else {
                            res.sendStatus(403);
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });
        
        // Team Task routes
        router.route("/dashboard/tasker/getTeamTasks").get(function(req, res){
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
                                        // Get all the tasks where the username is a team member
                                        for(var m=0; m<=tasks[t].taskMembers.length-1; m++){
                                            if(tasks[t].taskMembers[m].email == foundUser.username){
                                                preparedTasks.push(tasks[t]);
                                            }
                                        }
                                    }
                                    setTimeout(function(){
                                        res.send(preparedTasks.reverse());
                                    },300);
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
        
        router.route("/dashboard/tasker/getSingleTeamTask/:taskId").get(function(req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            var taskId = req.params.taskId;

            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(err){
                        res.send({message:err});
                    } else {
                        if(foundUser){
                            Tasker.findOne({_id:taskId}, function(err, foundTask){
                                if(err){
                                    console.log(err);
                                    res.send(err);
                                } else {
                                    res.send({postData: foundTask});
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