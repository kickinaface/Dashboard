const express		= require('express');
const app			= express();
const bodyParser	= require('body-parser');
const cookieParser 	= require('cookie-parser');
const mongoose = require('mongoose');
const dbUrl = "mongodb://localhost:27017/my-dashboard-app";
const https = require("https");
const ws = require("ws");
const fs = require("fs");
var helmet = require("helmet");
const ioHelper = require('./controllers/serviceMethods/socket.io.helper');

var serverCert = 
{
	cert: (fs.readFileSync('./certificates/cert.pem') + fs.readFileSync('./certificates/ca.pem')),
	key: fs.readFileSync("./certificates/cert-key.pem"),
	ca: (fs.readFileSync('./certificates/ca-key.pem') + fs.readFileSync('./certificates/ca.pem'))
};

mongoose.connect(dbUrl);
//
const fileUpload = require('express-fileupload');
//
const UserModel = require('./models/user');
const MessageModel = require('./models/message');
const TaskModel = require('./models/task');
const loginController = require('./controllers/loginController/loginController');
const registerController = require('./controllers/registerController/registerController');
const dashboardController = require('./controllers/dashboardController/dashboardController');
const indexController = require('./controllers/indexController/indexController');
const logoutController = require('./controllers/logoutController/logoutController');
const filemanagerController = require('./controllers/filemanagerController/filemanagerController');
const interactiveController = require('./controllers/interactiveController/interactiveController');
const taskerController = require('./controllers/taskerController/taskerController');
//
const dotenv = require('dotenv');
dotenv.config({path:"../.env"});
//

app.use(bodyParser.urlencoded({ extended: true, limit:'50mb' }));
app.use(bodyParser.json({limit:'50mb'}));
app.use(cookieParser());
app.use(fileUpload({useTempFiles: true}));
app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'"],
    },
}));
//
var port = process.env.PORT || 443;	//set port

//Router for the api
var router = express.Router();		//get an instance of the express router

router.use(function (req, res, next) {
	//do logging
	next();
});

loginController.init(app, router, (__dirname+'/pages/login.html'), UserModel);
logoutController.init(app, router, (__dirname+'/pages/logout.html'), UserModel);
registerController.init(app, router, (__dirname+'/pages/register.html'), UserModel);
indexController.init(app, router, (__dirname+'/public/index.html'), UserModel);
dashboardController.init(app, router, (__dirname+'/pages/dashboard.html'), (__dirname+'/pages/adminDashboard.html'), UserModel);
filemanagerController.init(app, router, (__dirname+'/pages/filemanager.html'), (__dirname+'/pages/basicUserFileManager.html'), UserModel);
interactiveController.init(app, router, (__dirname+'/pages/messages.html'), UserModel, MessageModel);
taskerController.init(app, router, (__dirname+'/pages/tasker.html'), UserModel, TaskModel);

app.use('/api', router);
app.use(express.static(__dirname + '/public'));

//START THE server
//=====================================================
var server = https.createServer(serverCert, app).listen(port, function(){
	console.log('The API is running on port: ', port);
});

/*
    Socket io stuff
 */
const { Server } = require("socket.io");
const io = new Server(server);
ioHelper.manageSocketIO(io);

