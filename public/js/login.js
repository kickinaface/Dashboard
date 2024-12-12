var superUtil = new SuperUtil();
document.addEventListener("DOMContentLoaded", function(){
    // Set Default Theme
    superUtil.appUiTheme = "Charcoal";
    superUtil.applyUiTheme();
});
function loginUser(e){
    e.preventDefault();
    document.querySelector('.fullScreenWrapper').innerHTML = "";
    document.querySelector('.fullScreenWrapper').style.display = 'block';
    var loginUsername = document.querySelector('.loginUsername').value;
    var loginPassword = document.querySelector('.loginPassword').value;
    var preparedObject = {
        username: loginUsername,
        password: loginPassword
    };
    superUtil.sendJSON(preparedObject, '/api/login', function(status, data){
        if(status == 200){
            window.location = '/dashboard';
        } else {
            document.querySelector('.statusMessages').innerHTML = "<p class='red'>"+data.message+"</p>"
            document.querySelector('.fullScreenWrapper').style.display = 'none';
        }
    },'POST');
};

function forgotPassModal(){
    var fullScreenWrapper = document.querySelector('.fullScreenWrapper');
    fullScreenWrapper.innerHTML= "<div class='modalContentWrapper'>"+
        "<h2>Forgot My Password</h2>"+
        "<br/>"+
        "<h4>Enter the email address you used to register below. <br/>Then, click 'Reset Password'.</h4>"+
        "<input class='resetPasswordEmail' type='text' placeholder='youremail@domain.com'> "+
        "<button class='resetPassBtn' onclick='resetPassword();'>Reset Password</button>"+
        "<div class='modalStatusMessages'></div>"+
        "<div class='closeModal' onclick='closeModal()'>Close (X)</div>"+
    "</div>";
    //
    fullScreenWrapper.style.display = 'block';
};

function resetPassword(){
    var forUserEmail = document.querySelector(".resetPasswordEmail").value;
    //
    superUtil.sendJSON({forUserEmail:forUserEmail},"/api/login/forgotPassword", function(status, data){
        if(status == 200){
            document.querySelector(".modalStatusMessages").innerHTML = "<span class='green'>"+data.message+"</span>";
            document.querySelector(".resetPassBtn").style.opacity = .5;
            document.querySelector(".resetPassBtn").disabled = true;
        } else {
            console.log(status);
            console.log(data);
            document.querySelector(".modalStatusMessages").innerHTML = "<span class='red'>"+data.message+"</span>";
        }
    },"POST");
};

function closeModal(){
    document.querySelector(".fullScreenWrapper").style.display = 'none';
};