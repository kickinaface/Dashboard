var superUtil = new SuperUtil();
const socket = io();

function Interactive(){
    var messagesArray = [];
    var knownUsers = [];
    var _that = this;
    this.savedPerson = null;
    this.init = function init(){
        setInterval(function (){
            checkToken();
        }, (1000*60)*5);
        function checkToken(){
            superUtil.grabJSON('/api/dashboard/checkToken', function(status, data){
                if(status == 200){
                    console.log('token is valid', data)
                } else {
                    window.location = '/logout';
                }
            },'GET');
        };
        socket.emit('getClientId');
        socket.on('clientId', function (data) {
            var clientId = data;
             // Get Name
            superUtil.grabJSON('/api/dashboard/getName', function (status, data) {
                if(status == 200){
                    var savedPerson = {
                        name: data.name,
                        id: clientId,
                        x: 0,
                        y: 0
                    }
                    _that.savedPerson = savedPerson;
                    socket.emit('user joined', savedPerson );
                }
            });
        });

        // Handle new messages coming in
        socket.on('get messages', function (message) {
            messagesArray.push(message);
        });

        socket.on("updateUsers", function(users){
            knownUsers = users;
            var usersObject = Object.entries(knownUsers)[0][1];
            var usersList = document.querySelector(".usersList ul");
            usersList.innerHTML = "";
            //
            for(var u =0; u<=usersObject.length-1; u++){
                usersList.innerHTML += "<li><strong>"+usersObject[u].name+"</strong> "+ usersObject[u].id+" <button>Send Message</button></li>";
            }
        });

        socket.on("chatMessageReceived", function(data){
            messagesArray.push(data);
            var globalChatWrapper = document.querySelector(".globalChatWrapper ul");
            globalChatWrapper.innerHTML = "";
            //
            for(var m=0; m<=messagesArray.length-1; m++){
                globalChatWrapper.innerHTML += "<li><strong>"+messagesArray[m].from+":</strong> "+messagesArray[m].chatMessage+"</li>";
            }
        });
    };

    this.showUsers = function showUsers(){
        socket.emit("getUsers");
        document.querySelector(".usersList").style.display = "block";
        document.querySelector(".globalChatWrapper").style.display = "none";
    };

    this.showGlobalChat = function showGlobalChat(){
        document.querySelector(".usersList").style.display = "none";
        document.querySelector(".globalChatWrapper").style.display = "block";
    };

    this.sendGlobalMessage = function sendGlobalMessage(){
        var globalChatInputField = document.getElementById("globalChatInputField");
        if(globalChatInputField.value==""){
            alert("You must not leave the input field blank.");
        } else {
            var newMessage = {
                chatMessage: globalChatInputField.value,
                from: _that.savedPerson.name
            };
            socket.emit("sendChatMessage", newMessage);
            globalChatInputField.value = "";
        }
    }
};

var interactive = new Interactive();
interactive.init();