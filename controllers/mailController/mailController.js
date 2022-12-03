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
};

var mailController = new MailController();
module.exports = mailController;