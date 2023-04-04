function MailController(){
    const nodemailer = require("nodemailer");
    const { google } = require("googleapis");
    const OAuth2 = google.auth.OAuth2;
    const CLIENT_ID = process.env.EMAIL_CLIENT_ID;
    const CLIENT_SECRET = process.env.EMAIL_CLIENT_SECRET;
    const REDIRECT_URL = "https://developers.google.com/oauthplayground";
    const REFRESH_TOKEN = process.env.EMAIL_REFRESH_TOKEN;
    //
    const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    var accessToken;
    
    oAuth2Client.getAccessToken().then(function(value){
        accessToken = value;
    }).catch(function (err){
        console.log('err')
        console.log(err);
    });
    //
    const transporter = nodemailer.createTransport({
        service:"Gmail",
        auth:{
            type:"OAuth2",
            user:"ccarterathome@gmail.com",
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken
        }
    });

    const User = require("../../models/user");
    const Tasker = require("../../controllers/taskerController/taskerController");

    this.sendForgotPasswordEmail = function sendForgotPasswordEmail(toEmail, udid){
        var mailOptions  = {
            from: "Christopher's Digital Solutions: Notifications",
            to: toEmail,
            subject: "Christopher's Digital Solutions: Forgot Password <Do Not Reply>",
            html:"<div>Your temporary password is: <br><b>"+udid+"</b><br> You must immediately change your password after login because this password will be deleted.</div>"
        };
        //
        return transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log(err);
                return false;
            } else{
                return true;
            }
        });
    }

    // Messages emails
    // when sending out from messages
    this.sendMessageToUser = function sendMessageToUser(toEmail, fromEmail, message){
        User.findOne({username:fromEmail}, function (err, foundUser){
            if(err){
                console.log(err)
            } else {
                var mailOptions  = {
                    from: "Christopher's Digital Solutions: Notifications",
                    to: toEmail,
                    subject: "Christopher's Digital Solutions: Messages <Do Not Reply>",
                    html:"<div>Message From: <strong>"+foundUser.firstName + " "+foundUser.lastName+": </strong><br><br>"+message+"</div><br><br> <i>Login to your account to reply to this message.</i>"
                };
                //
                return transporter.sendMail(mailOptions, function(err, data){
                    if(err){
                        console.log(err);
                        return false;
                    } else{
                        return true;
                    }
                });
            }
        });
    };
    
    // Creating a new task
    this.createdTask = function createdTask(fromEmail, message){
        var mailOptions  = {
            from: "Christopher's Digital Solutions: Notifications",
            to: fromEmail,
            subject: "Christopher's Digital Solutions: Tasker <Do Not Reply>",
            html:"<div>You have created a Task!<br><br>"+message.taskName+"<br>"+message.taskDetails+"</div><br><br> <i>Login to your account to view to this task.</i>"
        };
        //
        return transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log(err);
                return false;
            } else{
                return true;
            }
        });
    }

    // Editing tasks and task details
    this.updatedTask = function updatedTask(fromName, fromEmail, taskMembers, message){
        // email createdby and all task members that the task has been updated
        var recipients = fromEmail+",";
        if(taskMembers.length != 0){
            for(var i=0; i<=taskMembers.length-1; i++){
                recipients+= (taskMembers[i].email+",");
            }
        }
        var mailOptions  = {
            from: "Christopher's Digital Solutions: Notifications",
            to: recipients,
            subject: "Christopher's Digital Solutions: Tasker <Do Not Reply>",
            html:"<div><strong>"+fromName+" </strong>has updated a task <br><br>"+message.taskName+"<br>"+message.taskDetails+"</div><br><br> <i>Login to your account to view in Tasker.</i>"
        };
        //
        return transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log(err);
                return false;
            } else{
                return true;
            }
        });
    }
    this.addStep = function addStep(fromName, fromEmail, taskMembers, message){
        // email created by and all task members that a step was added.
        var recipients = fromEmail+",";
        if(taskMembers.length != 0){
            for(var i=0; i<=taskMembers.length-1; i++){
                recipients+= (taskMembers[i].email+",");
            }
        }
        var mailOptions  = {
            from: "Christopher's Digital Solutions: Notifications",
            to: recipients,
            subject: "Christopher's Digital Solutions: Tasker <Do Not Reply>",
            html:"<div><strong>"+fromName+" </strong>has added a step:<br><br>"+message.stepName+"<br>"+message.stepDetails+"</div><br><br> <i>Login to your account to view to this task.</i>"
        };
        //
        return transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log(err);
                return false;
            } else{
                return true;
            }
        });
    }
    this.updatedStep = function updatedStep(fromName, fromEmail, taskMembers, message){
        // email createdby and all task members that task step has been updated
        var recipients = fromEmail+",";
        if(taskMembers.length != 0){
            for(var i=0; i<=taskMembers.length-1; i++){
                recipients+= (taskMembers[i].email+",");
            }
        }
        var mailOptions  = {
            from: "Christopher's Digital Solutions: Notifications",
            to: recipients,
            subject: "Christopher's Digital Solutions: Tasker <Do Not Reply>",
            html:"<div><strong>"+fromName+" </strong>has updated a task step <br><br>"+message.taskName+"<br>"+message.taskDetails+"</div><br><br> <i>Login to your account to view in Tasker.</i>"
        };
        //
        return transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log(err);
                return false;
            } else{
                return true;
            }
        });
    }
    this.deleteStep = function deleteStep(fromName, fromEmail, taskMembers){
        // email createdBy and all task members that this task step has been deleted
        var recipients = fromEmail+",";
        if(taskMembers.length != 0){
            for(var i=0; i<=taskMembers.length-1; i++){
                recipients+= (taskMembers[i].email+",");
            }
        }
        var mailOptions  = {
            from: "Christopher's Digital Solutions: Notifications",
            to: recipients,
            subject: "Christopher's Digital Solutions: Tasker <Do Not Reply>",
            html:"<div><strong>"+fromName+" </strong>has deleted a step.</div><br><br> <i>Login to your account to view in Tasker.</i>"
        };
        //
        return transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log(err);
                return false;
            } else{
                return true;
            }
        });
    }
    this.completeStep = function completeStep(fromName, fromEmail, taskMembers, message){
        // email createdBy and all task members that this task step has been completed.
        var recipients = fromEmail+",";
        if(taskMembers.length != 0){
            for(var i=0; i<=taskMembers.length-1; i++){
                recipients+= (taskMembers[i].email+",");
            }
        }
        var mailOptions  = {
            from: "Christopher's Digital Solutions: Notifications",
            to: recipients,
            subject: "Christopher's Digital Solutions: Tasker <Do Not Reply>",
            html:"<div><strong>"+fromName+" </strong>has marked this step completed.<br><br>"+message.stepName+"<br>"+message.stepDetails+"</div><br><br> <i>Login to your account to view in Tasker.</i>"
        };
        //
        return transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log(err);
                return false;
            } else{
                return true;
            }
        });
    }
    
    this.addedMember = function addedMember(fromName, toEmail, message){
        // email new member that they have been added to this task.
        var mailOptions  = {
            from: "Christopher's Digital Solutions: Notifications",
            to: toEmail,
            subject: "Christopher's Digital Solutions: Tasker <Do Not Reply>",
            html:"<div><strong>"+fromName+" </strong>has added you as a team member to this task.<br><br>"+message.taskName+"<br>"+message.taskDetails+"</div><br><br> <i>Login to your account to view to this task.</i>"
        };
        //
        return transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log(err);
                return false;
            } else{
                return true;
            }
        });
    }
    this.markTaskComplete = function markTaskComplete(fromName, fromEmail, taskMembers, message){
        // email createdby and all task members that the task has been complete
        var recipients = fromEmail+",";
        if(taskMembers.length != 0){
            for(var i=0; i<=taskMembers.length-1; i++){
                recipients+= (taskMembers[i].email+",");
            }
        }
        var mailOptions  = {
            from: "Christopher's Digital Solutions: Notifications",
            to: recipients,
            subject: "Christopher's Digital Solutions: Tasker <Do Not Reply>",
            html:"<div><strong>"+fromName+" </strong>has marked this task completed.<br><br>"+message.taskName+"<br>"+message.taskDetails+"</div><br><br> <i>Login to your account to view in Tasker.</i>"
        };
        //
        return transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log(err);
                return false;
            } else{
                return true;
            }
        });
    }

};

var mailController = new MailController();
module.exports = mailController;