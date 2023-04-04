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
        {
            name: '(L:) Drive',
            path:'L:'
        }
    ];
    this.init = function init(app, router, pageFile, basicUserFileManagerPage, User){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
        
        // Page routing
        app.route("/dashboard/filemanager").get(function(req, res) {
            var heldToken = req.cookies.myDashboardAppToken;
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(heldToken != undefined){
                User.findOne({token:heldToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function(err, foundUser){
                    if(err){
                        res.send(err);
                    }
                    if(foundUser){
                        if(tokenMethods.authenticateToken(heldToken) == true){
                            if(foundUser.role == "Basic"){
                                res.sendFile(basicUserFileManagerPage);
                            } else {
                                res.sendFile(pageFile);
                            }
                            
                        } else {
                            res.redirect("/login");
                        }
                        
                    } else {
                        res.redirect("/login");
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
                            res.send({drives: [diskDrives[2]]});
                        } else if(foundUser.role == "Basic" || foundUser.role == "Team_I"){
                            res.send({drives: [diskDrives[0]]});
                        }else if(foundUser.role == "Team_J"){
                            res.send({drives: [diskDrives[1]]});
                        }else if(foundUser.role == "Admin"){
                            res.send({drives:diskDrives});
                        }
                    } else {
                        res.sendStatus(403);
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
                            driveArray = [diskDrives[2]];
                        } else if(foundUser.role == "Basic" || foundUser.role == "Team_I"){
                            driveArray = [diskDrives[0]];
                        }else if(foundUser.role == "Team_J"){
                            driveArray = [diskDrives[1]];
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
                    } else {
                        res.sendStatus(403);
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
            // Decode url do allow for %20 in path.
            requestedPath = decodeURIComponent(requestedPath);
            //
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        if(err){
                            console.log(err);
                            res.status(404).send({message:err});
                        }
                        // Validate upload priviledges by role
                        if(isValidUserRole(foundUser, requestedPath)){
                            fs.stat(requestedPath, function(err, stats){
                                if(err){
                                    res.status(403).send({message:err})
                                } else {
                                    if(stats.isDirectory() == true){
                                        // Load directory it is not a file.
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
                                                res.status(403).send({message:"This file cannot be opened."});
                                            }
                                        });
                                    } else if(stats.isFile() == true){
                                        // Show file it is not a directory
                                        res.send({filePath:requestedPath});
                                    }
                                }
                            });
                            
                        } else {
                            res.status(403).send({message:"You must be an admin to open these files/folders"});
                        }
                    } else {
                        res.sendStatus(403);
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
                        if(isValidUserRole(foundUser, req.body.requestFile)){
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
                        } else {
                            res.status(403).send({message:"You must be an administrator to download these files."});
                        }
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/filemanager/uploadFile").post(function (req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(req.body.fileUploadPath != null && req.files != null){
                var fileUploadPath = req.body.fileUploadPath;
                var fileUploadInput = req.files.fileUploadInput;
                if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                    User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                        if(foundUser){
                            if(foundUser.role != "Basic" && isValidUserRole(foundUser, fileUploadPath, true)){
                                if(!req.files || Object.keys(req.files).length === 0 || !fileUploadPath || !fileUploadInput){
                                    res.status(404).send({message:'No files were uploaded. Please complete the form.'});
                                } else {
                                    if(fs.existsSync(fileUploadPath)){
                                        fileUploadInput.mv((fileUploadPath+"/"+fileUploadInput.name), function (err){
                                            if(err){
                                                res.status(404).send(err);
                                            } else {
                                                console.log("File was uploaded: ",(fileUploadPath+"/"+fileUploadInput.name))
                                                res.send({message:"File was successfully uploaded."});
                                            }
                                        });
                                    } else {
                                        fs.mkdir(fileUploadPath, function(err) {
                                            if(err){
                                                res.status(404).send(err);
                                            } else {
                                                fileUploadInput.mv((fileUploadPath+"/"+fileUploadInput.name), function (err){
                                                    if(err){
                                                        res.status(404).send(err);
                                                    } else {
                                                        console.log("File was uploaded: ",(fileUploadPath+"/"+fileUploadInput.name))
                                                        res.send({message:"File was successfully uploaded."});
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            } else {
                                console.log("Invalid role, is not dowloading");
                                res.status(403).send({message:"You must be an administrator or have the proper role to upload files."});
                            }
                        } else {
                            res.sendStatus(403);
                        }
                    });
                } else {
                    res.sendStatus(403);
                }
            } else {
                res.status(404).send({message:'No files were uploaded. Please complete the form.'});
            }
            
            
        });

        router.route("/dashboard/filemanager/deleteFile").post(function (req, res){
            var clientUserAgent = req.headers['user-agent'];
            var ipAddress = req.socket.remoteAddress;
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, userAgent:clientUserAgent, ipAddress:ipAddress}, function (err, foundUser) {
                    if(foundUser){
                        var fileUploadPath = req.body.filePath;
                        // Validate role to allow who can delete fies. Only admin and team roles can delete
                        if(foundUser.role != "Basic" && isValidUserRole(foundUser, fileUploadPath)){
                            fs.unlink(fileUploadPath, function (err){
                                if(err){
                                    res.status(500).send(err);
                                }else {
                                    res.send({message:"File was successfully deleted."});
                                }
                            });
                        } else {
                            res.status(403).send({message:"You must be an administrator to delete files."});
                        }
                    } else {
                        res.sendStatus(403);
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
        var isUnixHiddenPath = function isUnixHiddenPath(path) {
            return (/(^|\/)\.[^\/\.]/g).test(path);
        };

        var isValidUserRole = function isValidUserRole(foundUser, filePath, stopBasicUser){
            var isValidTeamK = false;
            var isValidTeamI = false;
            var isValidTeamJ = false;
            var isValidAdmin = false;
            //
            if(foundUser.role == "Team_K"){
                var isValidPath = filePath.indexOf("K:");
                if(isValidPath != -1 && filePath[0].toLowerCase()=="k" && filePath[1]==":"){
                    isValidTeamK = true;
                }
            } else if(foundUser.role == "Team_I" || foundUser.role == "Basic" && stopBasicUser != true){
                var isValidPath = filePath.indexOf("I:");
                if(isValidPath != -1 && filePath[0].toLowerCase()=="i" && filePath[1]==":"){
                    isValidTeamI = true;
                }
            } else if(foundUser.role == "Team_J"){
                var isValidPath = filePath.indexOf("J:");
                if(isValidPath != -1 && filePath[0].toLowerCase()=="j" && filePath[1]==":"){
                    isValidTeamJ = true;
                }
            } else if(foundUser.role == "Admin"){
                isValidAdmin = true;
            }

            if(isValidTeamI || isValidTeamJ || isValidTeamK || isValidAdmin){
                return true;
            } else {
                return false;
            }
        }
        
    }
};

var filemanagerController = new FilemanagerController();
module.exports = filemanagerController;