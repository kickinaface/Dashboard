var superUtil = new SuperUtil();

function Dashboard(){
    this.init = function init(){
        setInterval(function (){
            checkToken();
        }, (1000*60)*5);

        
        // Update Name
        superUtil.grabJSON('/api/dashboard/getName', function (status, data) {
            if(status == 200){
                document.querySelector('.usersName').innerHTML = data.name;
            }
        });
    };

    function checkToken(){
        superUtil.grabJSON('/api/dashboard/checkToken', function(status, data){
            if(status == 200){
                console.log('token is valid', data)
            } else {
                window.location = '/logout';
            }
        },'GET');
    };

    this.editName = function editName(){
        document.querySelector(".fullScreenWrapper").style.display = "block";
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Edit Name</h2>'+
                    "<br>"+
                    "Please enter your first or last name within the input fields below.<br>"+
                    "<input type='text'  class='changeFirstName' placeholder='First Name'>"+
                    "<input type='text'  class='changeLastName' placeholder='Last Name'>"+
                    "<p><button type='submit' onclick='dashboard.updateName();'>Save</button></p>"+
                    "<div class='modalMessages'></div>"+
                '<div class="closeModal" onclick="dashboard.closeModal()">Close (X)</div>'+
            '</div>';
    };
    this.updateName = function updateName(){
        var changeFirstName = document.querySelector(".changeFirstName").value;
        var changeLastName = document.querySelector(".changeLastName").value;
        var preparedName = {
            firstName: changeFirstName,
            lastName: changeLastName
        };
        //
        superUtil.sendJSON({preparedName:preparedName}, "/api/dashboard/updateName", function (status, data){
            if(status == 200){
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+" Please wait...</span>";
                setTimeout(function(){
                    window.location.reload();
                },1500);
            } else {
                console.log(status);
                console.log(data);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            }
        },"POST");
    };

    this.closeModal = function closeModal(){
        document.querySelector(".fullScreenWrapper").style.display = 'none';
    };

    this.openChangePasswordModal = function openChangePasswordModal(){
        document.querySelector(".fullScreenWrapper").style.display = "block";
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Change Password</h2>'+
                    "<br>"+
                    "Please enter your new password twice in the input fields below."+
                    "<input type='password'  id='newPassword1' placeholder='new password'><br>"+
                    "<input type='password'  id='newPassword2' placeholder='new password again'>"+
                    "<br>"+
                    "<i>Minimum eight characters, at least one letter and one number.</i>"+
                    
                    "<p><button type='submit' onclick='dashboard.changePassword();'>Save</button></p>"+
                    "<br><b>WARNING! Do not forget your new password.</b><br>"+
                    "<div class='modalMessages'></div>"+
                '<div class="closeModal" onclick="dashboard.closeModal()">Close (X)</div>'+
            '</div>';
    };

    this.changePassword = function changePassword(){
        var newPassword1 = document.getElementById("newPassword1").value;
        var newPassword2 = document.getElementById("newPassword2").value;
        var preparedNewpass = {
            newPassword1:newPassword1,
            newPassword2:newPassword2
        };
        //
        superUtil.sendJSON({preparedNewpass:preparedNewpass}, "/api/dashboard/changePassword", function(status, data){
            if(status == 200){
                document.querySelector(".modalMessages").innerHTML = "<span class='green'>"+data.message+"</span>";
                window.location = "/logout";
            } else {
                console.log(status);
                console.log(data);
                document.querySelector(".modalMessages").innerHTML = "<span class='red'>"+data.message+"</span>";
            }
        },"POST");
    };
}

var dashboard = new Dashboard();
dashboard.init();