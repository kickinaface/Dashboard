function FilemanagerController(){
    const fs = require('fs');
    const diskDrives = [
        {
            name:'(I:) Drive',
            path:'I:'
        },
        {
            name:'(J:) Drive',
            path:'J:'
        },
        {
            name:'(K:) Drive',
            path:'K:'
        },
    ];
    this.init = function init(app, router, pageFile, User){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
        
        // Page routing
        app.route("/dashboard/filemanager").get(function(req, res) {
            var heldToken = req.cookies.myDashboardAppToken;
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(heldToken != undefined){
                User.findOne({token:heldToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function(err, foundUser){
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
        // API Routes
        router.route("/dashboard/filemanager/getDrives").get(function (req, res) {
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(foundUser.role == "Team_K"){
                            res.send({drives: [{
                                name:'(K:) Drive',
                                path:'K:/'
                            }]});
                        } else if(foundUser.role == "Basic" || foundUser.role == "Team_I"){
                            res.send({drives: [{
                                name:'(I:) Drive',
                                path:'I:/'
                            }]});
                        }else if(foundUser.role == "Team_J"){
                            res.send({drives: [{
                                name:'(J:) Drive',
                                path:'J:/'
                            }]});
                        }else if(foundUser.role == "Admin"){
                            res.send({drives:diskDrives});
                        }
                        
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/filemanager/showDriveContents/:driveNum").get(function (req, res){
            var driveNum = req.params.driveNum;
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            //
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        var driveArray = [];
                        if(foundUser.role == "Team_K"){
                            driveArray = [{
                                name:'(K:) Drive',
                                path:'K:/'
                            }];
                        } else if(foundUser.role == "Basic" || foundUser.role == "Team_I"){
                            driveArray = [{
                                name:'(I:) Drive',
                                path:'I:/'
                            }];
                        }else if(foundUser.role == "Team_J"){
                            driveArray = [{
                                name:'(J:) Drive',
                                path:'J:/'
                            }];
                        }else if(foundUser.role == "Admin"){
                            driveArray = diskDrives;
                        }
                        fs.readdir(driveArray[driveNum].path, (err, files) =>{
                            if(err){
                                console.log(err)
                                res.send(err);
                            } else {
                                var diskFileContents = [];
                                files.forEach(file => {
                                    if(!isUnixHiddenPath(file)){
                                        if(file != "System Volume Information" && file != "$RECYCLE.BIN"){
                                            var preparedFileObject = {
                                                name: file,
                                                path: (driveArray[driveNum].path+file)
                                            };
                                            diskFileContents.push(preparedFileObject);
                                        }
                                    }
                                });
                                res.send(diskFileContents);
                            }
                            
                        });
                    }
                });
            } else {
                res.sendStatus(403);
            }
            
        });

        router.route("/dashboard/filemanager/getContentsFromPath").post(function (req, res){
            var requestedPath = req.body.requestPath;
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            //
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(fs.statSync(requestedPath).isDirectory() == true){
                            // Load directory
                            fs.readdir(requestedPath, (err, files) =>{
                                var folderContents = [];
                                //
                                if(files != undefined){
                                    files.forEach(file => {
                                        if(!isUnixHiddenPath(file)){
                                            if(file != "System Volume Information" && file != "$RECYCLE.BIN"){
                                                var preparedFileObject = {
                                                    name: file,
                                                    path: (requestedPath+"/"+file)
                                                };
                                                folderContents.push(preparedFileObject);
                                            }
                                        }
                                    });
                                    res.send(folderContents);
                                } else {
                                    res.status(403).send({message:"This file cannot be opened."})
                                }
                            });
                        } else if(fs.statSync(requestedPath).isDirectory() == false){
                            // download file
                            res.send({filePath:requestedPath});
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/filemanager/downloadFileFromPath").post(function (req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(req.body.requestFile.includes('C:')){
                            res.sendStatus(403);
                        } else {
                            var path = require("path");
                            var fileName = (path.basename(req.body.requestFile).toString());
                            res.download(req.body.requestFile, fileName, function(err){
                                if(err){
                                    console.log(err);
                                } else {
                                    console.log("Filename: ", fileName, " was downloaded");
                                }
                            });
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/filemanager/uploadFile").post(function (req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(!req.files || Object.keys(req.files).length === 0){
                            res.status(404).send('No files uploaded.');
                        } else {
                            var fileUploadPath = req.body.fileUploadPath;
                            var fileUploadInput = req.files.fileUploadInput;
                            var isValidTeamK = false;
                            var isValidTeamI = false;
                            var isValidTeamJ = false;
                            var isValidAdmin = false;
                            // Validate upload priviledges by role
                            if(foundUser.role == "Team_K"){
                                var isValidPath = fileUploadPath.indexOf("K:/");
                                if(isValidPath != -1 && fileUploadPath[0].toLowerCase()=="k" && fileUploadPath[1]==":"){
                                    isValidTeamK = true;
                                }
                            } else if(foundUser.role == "Team_I"){
                                var isValidPath = fileUploadPath.indexOf("I:/");
                                if(isValidPath != -1 && fileUploadPath[0].toLowerCase()=="i" && fileUploadPath[1]==":"){
                                    isValidTeamI = true;
                                }
                            } else if(foundUser.role == "Team_J"){
                                var isValidPath = fileUploadPath.indexOf("J:/");
                                if(isValidPath != -1 && fileUploadPath[0].toLowerCase()=="j" && fileUploadPath[1]==":"){
                                    isValidTeamJ = true;
                                }
                            } else if(foundUser.role == "Admin"){
                                isValidAdmin = true;
                            }
                            // If you are either Admin or part of a role, isolate to that path only for upload
                            if(isValidAdmin || isValidTeamK || isValidTeamI || isValidTeamJ){
                                // Make directory and or upload file to that directory
                                if(fs.existsSync(fileUploadPath)){
                                    fileUploadInput.mv((fileUploadPath+"/"+fileUploadInput.name), function (err){
                                        if(err){
                                            res.status(404).send(err);
                                        } else {
                                            res.redirect('/dashboard/filemanager');
                                        }
                                    });
                                } else {
                                    fs.mkdir(fileUploadPath, function(err) {
                                        if(err){
                                            res.status(500).send(err);
                                        } else {
                                            fileUploadInput.mv((fileUploadPath+"/"+fileUploadInput.name), function (err){
                                                if(err){
                                                    res.status(404).send(err);
                                                } else {
                                                    res.redirect('/dashboard/filemanager');
                                                }
                                            });
                                        }
                                    });
                                }
                            } else {
                                res.status(403).send("You must be an administrator to upload files.");
                            }
                        }
                    } else {
                        res.status(403).send("You must be an administrator to upload files.");
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/filemanager/deleteFile").post(function (req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        var isValidTeamK = false;
                        var isValidAdmin = false;
                        var fileUploadPath = req.body.filePath;
                        // Validate role to allow who can delete fies. only team-k and admin can delete
                        if(foundUser.role == "Team_K"){
                            if(fileUploadPath[0].toLowerCase()=="k" && fileUploadPath[1]==":"){
                                isValidTeamK = true;
                            }
                        } else if(foundUser.role =="Admin"){
                            isValidAdmin = true;
                        }
                        // If valid admin or team-k with valid k-path
                        if(isValidAdmin || isValidTeamK){
                            fs.unlink(fileUploadPath, function (err){
                                if(err){
                                    res.status(500).send(err);
                                }else {
                                    res.send({message:"File was successfully deleted."});
                                }
                            });
                        }
                        
                    } else {
                        res.status(403).send({message:"You must be an administrator to delete files."});
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        /**
         * Checks whether a path starts with or contains a hidden file or a folder.
         * @param {string} source - The path of the file that needs to be validated.
         * returns {boolean} - `true` if the source is blacklisted and otherwise `false`.
         */
        var isUnixHiddenPath = function (path) {
            return (/(^|\/)\.[^\/\.]/g).test(path);
        };
        
    }
};

var filemanagerController = new FilemanagerController();
module.exports = filemanagerController;