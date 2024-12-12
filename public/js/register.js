var superUtil = new SuperUtil();
document.addEventListener("DOMContentLoaded", function(){
    // Set Default Theme
    superUtil.appUiTheme = "Charcoal";
    superUtil.applyUiTheme();
});
function registerUser(e){
    e.preventDefault();
    document.querySelector('.fullScreenWrapper').style.display = 'block';
    var registerFirstName = document.querySelector('.registerFirstName').value;
    var registerLastName = document.querySelector('.registerLastName').value;
    var registerUsername = document.querySelector('.registerUsername').value;
    var registerPassword = document.querySelector('.registerPassword').value;
    var preparedObject = {
        firstName: registerFirstName,
        lastName: registerLastName,
        username: registerUsername,
        password: registerPassword
    };
    console.log(preparedObject)
    superUtil.sendJSON(preparedObject, '/api/register', function(status, data){
        if(status == 200){
            document.querySelector('.statusMessages').innerHTML = "<p class='green'>"+data.message+"</p>";
        } else {
            document.querySelector('.statusMessages').innerHTML = "<p class='red'>"+data.message+"</p>";
        }
        document.querySelector('.fullScreenWrapper').style.display = 'none';
    },'POST');
};