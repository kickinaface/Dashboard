function FilemanagerController(){
    const fs = require('fs');
    const diskDrives = [
        {
            name:'(E:) Drive (Book)',
            path:'E:/'
        },
    ];
    this.init = function init(app, router, pageFile, User){
        var tokenMethods = require("../../controllers/tokenMethods/tokenMethods");
        
        // Page routing
        app.route("/dashboard/filemanager").get(function(req, res) {
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
        // API Routes
        router.route("/dashboard/filemanager/getDrives").get(function (req, res) {
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken}, function (err, foundUser) {
                    if(foundUser){
                        res.send({drives: diskDrives});
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/filemanager/showDriveContents/:driveNum").get(function (req, res){
            var driveNum = req.params.driveNum;
            //
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken}, function (err, foundUser) {
                    if(foundUser){
                        fs.readdir(diskDrives[driveNum].path, (err, files) =>{
                            var diskFileContents = [];
                            files.forEach(file => {
                                if(!isUnixHiddenPath(file)){
                                    if(file != "System Volume Information" && file != "$RECYCLE.BIN"){
                                        var preparedFileObject = {
                                            name: file,
                                            path: (diskDrives[driveNum].path+file)
                                        };
                                        diskFileContents.push(preparedFileObject);
                                    }
                                }
                            });
                            res.send(diskFileContents);
                        });
                    }
                });
            } else {
                res.sendStatus(403);
            }
            
        });

        router.route("/dashboard/filemanager/getContentsFromPath").post(function (req, res){
            var requestedPath = req.body.requestPath;
            //
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken}, function (err, foundUser) {
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
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken}, function (err, foundUser) {
                    if(foundUser){
                        if(req.body.requestFile.includes('C:')){
                            res.sendStatus(403);
                        } else {
                            var path = require("path");
                            res.download(req.body.requestFile, (path.basename(req.body.requestFile).toString()));
                        }
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });

        router.route("/dashboard/filemanager/uploadFile").post(function (req, res){
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, role: 'Admin'}, function (err, foundUser) {
                    if(foundUser){
                        if(!req.files || Object.keys(req.files).length === 0){
                            res.status(404).send('No files uploaded.');
                        } else {
                            var fileUploadPath = req.body.fileUploadPath;
                            var fileUploadInput = req.files.fileUploadInput;
                            //
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
            if(tokenMethods.authenticateToken(req.cookies.myDashboardAppToken) == true){
                User.findOne({token: req.cookies.myDashboardAppToken, role:'Admin'}, function (err, foundUser) {
                    if(foundUser){
                        fs.unlink(req.body.filePath, function (err){
                            if(err){
                                res.status(500).send(err);
                            }else {
                                res.send({message:"File was successfully deleted."});
                            }
                        });
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