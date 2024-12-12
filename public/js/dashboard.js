var superUtil = new SuperUtil();

function Dashboard(){
    this.init = function init(){
        setInterval(function (){
            checkToken();
        }, (1000*60)*5);

        document.addEventListener("DOMContentLoaded", function(){
            // Display Name
            superUtil.grabJSON('/api/dashboard/getName', function (status, data) {
                if(status == 200){
                    document.querySelector('.usersName').innerHTML = data.name;
                }
            });

            // Get Theme
            superUtil.grabJSON("/api/dashboard/getTheme", function (status, data) {
                if(status == 200){
                    if(!data.uiTheme){
                        superUtil.appUiTheme = "Charcoal";
                        superUtil.applyUiTheme();
                    } else {
                        superUtil.appUiTheme = data.uiTheme;
                        superUtil.applyUiTheme();
                    }
                } else {
                    console.log(status, "There was an error", data);
                }
            });

            // Get Avatar
            superUtil.grabJSON("/api/dashboard/getAvatar", function (status, data) {
                if(status == 200){
                    // change profile image to user's image
                    if(data.url != undefined){
                        document.querySelector("#dashboardAvatar").src = data.url;
                    }
                }
            });
        });
    };

    function checkToken(){
        superUtil.grabJSON('/api/dashboard/checkToken', function(status, data){
            if(status == 200){
                console.log('token is valid', data)
            } else {
                window.location = '/logout';
            }
        });
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
                    "<div class='modalMessages'></div><br>"+
                '<div class="closeModal" onclick="dashboard.closeModal()">Cancel (X)</div>'+
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

    this.updateThemeModal = function updateThemeModal(){
        document.querySelector(".fullScreenWrapper").style.display = "block";
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Update Theme</h2>'+
                    "<br>"+
                    "Select a theme below."+
                    "<br>"+
                    "<select id='newThemeSelection'>"+
                        "<option value='-1'>Not Selected</option>"+
                        "<option value='Red'>Red</option>"+
                        "<option value='Orange'>Orange</option>"+
                        "<option value='Yellow'>Yellow</option>"+
                        "<option value='Green'>Green</option>"+
                        "<option value='Blue'>Blue</option>"+
                        "<option value='Pink'>Pink</option>"+
                        "<option value='Purple'>Purple</option>"+
                        "<option value='Charcoal'>Charcoal</option>"+
                    "</select>"+                    
                    "<p><button type='submit' onclick='dashboard.updateThemeColor();'>Save</button></p>"+
                    "<div class='modalMessages'></div>"+
                '<div class="closeModal" onclick="dashboard.closeModal()">Close (X)</div>'+
            '</div>';
    };

    this.updateThemeColor = function updateThemeColor(){
        var newThemeSelection = document.getElementById("newThemeSelection").value;
        //
        superUtil.sendJSON({uiTheme:newThemeSelection}, "/api/dashboard/changeTheme", function(status, data){
            if(status == 200){
                console.log("Change theme to; ", data);
                superUtil.appUiTheme = data.name;
                superUtil.applyUiTheme();
            } else {
                console.log(status);
                console.log(data);
                document.querySelector(".modalMessages").innerHTML = "<span class='red'>"+data.message+"</span>";
            }
        },"POST");
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
                    "<i>Minimum 10-16 characters, no whitespace, at least one uppercase character, at least one lowercase character, at least one digit, at least one special character.</i>"+
                    
                    "<p><button type='submit' onclick='dashboard.changePassword();'>Save</button></p>"+
                    "<br><b>WARNING! Do not forget your new password.</b><br>"+
                    "<div class='modalMessages'></div><br><br/>"+
                '<div class="closeModal" onclick="dashboard.closeModal()">Cancel (X)</div>'+
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

    this.updateMobileModal = function updateMobileModal(){
        // Get mobile phone carrer settings
        superUtil.grabJSON("/api/dashboard/mobileSettings", function(status, data){
            if(status == 200){
                var carriersList = data.carriers;
                document.querySelector(".fullScreenWrapper").style.display = "block";
                document.querySelector('.fullScreenWrapper').innerHTML = 
                    '<div class="modalContentWrapper">'+
                        '<h2>Mobile Notification Settings</h2>'+
                            "<br>"+
                            "Add a mobile device phone number below."+
                            "<br>"+
                            "<input type='text'  id='phoneNumberEntry' placeholder='1234567890 *No spaces, dashes or dots.'><br><br><br>"+
                            "Select your current phone carrier.<br><br>"+
                            "<select id='newCarrierSelection'>"+
                                "<option value='-1'>Not Selected</option>"+
                            "</select>"+ 
                            "<br><br><br>"+
                            "<div class='enabledCheckboxHolder'>"+
                                "<input type='checkbox' id='isMobileEnabledCheckbox' name='isMobileEnabled'></input>"+
                                "<label for='isMobileEnabledCheckbox' style='cursor:pointer';>Enable Mobile Notifications</label><br>"+
                            "</div>"+
                            "<p><button type='submit' onclick='dashboard.updateMobileSettings();'>Save</button>"+
                            "<button class='closeModal' type='submit' onclick='dashboard.deleteMobileNumber();'>Remove</button></p>"+
                            
                            "<div class='modalMessages'></div>"+
                        '<div class="closeModal" onclick="dashboard.closeModal()">Cancel (X)</div>'+
                    '</div>';
                // Populate Carriers
                var carrierSelection = document.querySelector('#newCarrierSelection');
                for(var i=0; i<= carriersList.length-1; i++){
                    carrierSelection.innerHTML +="<option value="+i+">"+carriersList[i].name+"</option>";
                }

                // Populate user's prestored values if they exist
                if(data.userSettings.number){
                    document.querySelector("#phoneNumberEntry").value = data.userSettings.number;
                }
                if(data.userSettings.carrier){
                    document.querySelector("#newCarrierSelection").value = data.userSettings.carrier;
                }
                if(data.userSettings.enabled){
                    document.querySelector("#isMobileEnabledCheckbox").checked = data.userSettings.enabled
                }
            } else {
                console.log("status: ", status);
                console.log("data: ", data);
            }
        });
        
    };

    this.deleteMobileNumber = function deleteMobileNumber(){
        var isRemove = confirm("Do you wish to remove any stored phone number on your account?");
        if(isRemove){
            superUtil.sendJSON({},"/api/dashboard/removeNumber", function(status, data){
                if(status == 200){
                    document.querySelector(".modalMessages").innerHTML = "<span class='green'>"+data.message+"</span>";
                    location.reload();
                } else {
                    console.log("status", status);
                    console.log("data ", data);
                }
            },"POST");
        }
    };

    this.updateMobileSettings = function updateMobileSettings(){
        var phoneNumberEntry = document.querySelector("#phoneNumberEntry").value;
        var newCarrierSelection = document.querySelector("#newCarrierSelection").value;
        var isMobileEnabledCheckbox = document.querySelector("#isMobileEnabledCheckbox").checked;
        var preparedSettings = {
            number:phoneNumberEntry,
            carrier:newCarrierSelection,
            isEnabled:isMobileEnabledCheckbox
        };
        superUtil.sendJSON(preparedSettings,"/api/dashboard/updateMobileSettings", function(status, data){
            if(status == 200){
                document.querySelector(".modalMessages").innerHTML = "<span class='green'>"+data.message+"</span>";
                setTimeout(function(){
                    //dashboard.closeModal();
                    location.reload();
                },1500);
            } else {
                document.querySelector(".modalMessages").innerHTML = "<span class='red'>"+data.message+"</span>";
            }
        },"POST");
    }

    this.updateAvatarModal = function updateAvatarModal(){
        document.querySelector(".fullScreenWrapper").style.display = "block";
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Change your avatar image.</h2>'+
                    "<br>"+
                    "Please enter the url of the image you would like to use."+
                    "<input type='text'  id='newAvatarPath' placeholder='image url path'><br>"+
                    "<br>"+
                    "<p><button type='submit' onclick='dashboard.updateAvatar();'>Update</button></p>"+
                    "<br><b>TIP: Use small sized square shaped images for best results.</b><br>"+
                    "<div class='modalMessages'></div><br><br/>"+
                '<div class="closeModal" onclick="dashboard.closeModal()">Cancel (X)</div>'+
            '</div>';
    }

    this.updateAvatar = function updateAvatar(){
        var newAvatarPath = document.querySelector("#newAvatarPath");
        superUtil.sendJSON({url:newAvatarPath.value},"/api/dashboard/updateAvatar", function(status, data){
            if(status == 200){
                document.querySelector(".modalMessages").innerHTML = "<span class='green'>"+data.message+"</span>";
                setTimeout(function(){
                    //dashboard.closeModal();
                    location.reload();
                },1500);
            } else {
                document.querySelector(".modalMessages").innerHTML = "<span class='red'>"+data.message+"</span>";
            }
        }, "POST");
    }
}

var dashboard = new Dashboard();
dashboard.init();