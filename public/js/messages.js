var superUtil = new SuperUtil();
// const socket = io();
// var currentUrl = window.location.href;
// console.log("currentUrl ", currentUrl);
// const protocol = window.location.protocol;
// console.log(protocol);
// const host = window.location.host;
// const pathname = window.location.pathname;
// const search = window.location.search;
// const hash = window.location.hash;
// console.log("host: ", host);
// console.log("pathname: ", pathname);
// console.log("search: ", search);
// console.log("hash: ", hash);

// socket = io.connect("http://localhost:3000", {
//     transports:['websocket', 'polling']
// });
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
        document.addEventListener("DOMContentLoaded", function (){
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
        });
        //socket.emit('getClientId');
        // socket.on('clientId', function (data) {
        //     var clientId = data;
        //      // Get Name
        //     superUtil.grabJSON('/api/dashboard/getName', function (status, data) {
        //         if(status == 200){
        //             var savedPerson = {
        //                 name: data.name,
        //                 email: data.email,
        //                 id: clientId,
        //                 x: 0,
        //                 y: 0
        //             }
        //             _that.savedPerson = savedPerson;
        //             socket.emit('user joined', savedPerson );
        //         }
        //     });
        // });

        // // Handle new messages coming in
        // socket.on('get messages', function (message) {
        //     messagesArray.push(message);
        // });

        // socket.on("updateUsers", function(users){
        //     knownUsers = users;
        //     var usersObject = Object.entries(knownUsers)[0][1];
        //     var usersList = document.querySelector(".usersList ul");
        //     usersList.innerHTML = "";
        //     //
        //     for(var u =0; u<=usersObject.length-1; u++){
        //         usersList.innerHTML += "<li><strong>"+usersObject[u].name+"</strong> <button onclick=interactive.sendDirectMessage('"+usersObject[u].email+"');>Send Message</button></li>";
        //     }
        // });

        // socket.on("chatMessageReceived", function(data){
        //     messagesArray.push(data);
        //     var globalChatWrapper = document.querySelector(".globalChatWrapper ul");
        //     globalChatWrapper.innerHTML = "";
        //     //
        //     for(var m=0; m<=messagesArray.length-1; m++){
        //         globalChatWrapper.innerHTML += "<li><strong>"+messagesArray[m].from+":</strong> "+messagesArray[m].chatMessage+"</li>";
        //     }
        // });
    };

    this.sendDirectMessage = function sendDirectMessage(toEmail){
        // later use a parameter instead of saying the same html again.
        if(toEmail != null){
            document.querySelector('.fullScreenWrapper').style.display = 'block';
            document.querySelector('.fullScreenWrapper').innerHTML = 
                '<div class="modalContentWrapper">'+
                    '<h2>Send A Message</h2>'+
                    '<span>Sending To:</span>'+
                    '<input id="fromEmail" value='+toEmail+' disabled></input>'+
                    '<p><textArea id="shortMessage" placeholder="Enter a short message" cols="40" rows="8"></textArea></p>'+
                    '<div class="modalMessages"></div>'+
                    '<button onclick="messagesControl.sendMessage(this);">Send</button>'+
                    '<div class="closeModal" onclick="messagesControl.closeModal();">Cancel (X)</div>'+
                '</div>';
        } else {
            document.querySelector('.fullScreenWrapper').style.display = 'block';
            document.querySelector('.fullScreenWrapper').innerHTML = 
                '<div class="modalContentWrapper">'+
                    '<h2>Send A Message</h2>'+
                    '<span>Sending To:</span>'+
                    '<input id="fromEmail" placeholder="userEmail@validEmail.com"></input>'+
                    '<p><textArea id="shortMessage" placeholder="Enter a short message" cols="40" rows="8"></textArea></p>'+
                    '<div class="modalMessages"></div>'+
                    '<button onclick="messagesControl.sendMessage(this);">Send</button>'+
                    '<div class="closeModal" onclick="messagesControl.closeModal();">Cancel (X)</div>'+
                '</div>';
        }
        
    }

    this.deleteMessages = function deleteMessages(withUser){
        superUtil.sendJSON({withUser:withUser},"/api/dashboard/messages/removeMessages/", function(status, data){
            if(status == 200){
                console.log("message was deleted, refresh page");
                console.log('data ', data);
                window.location = "/dashboard/messages";
            } else {
                console.log("There was an error...");
                console.log("data", data);
                console.log("status ", status);
            }
        }, "DELETE");
    }

    this.showUsers = function showUsers(){
        socket.emit("getUsers");
        document.querySelector(".usersList").style.display = "block";
        document.querySelector(".globalChatWrapper").style.display = "none";
        document.querySelector(".MyMessagesWrapper").style.display = "none";
    };

    this.showGlobalChat = function showGlobalChat(){
        document.querySelector(".usersList").style.display = "none";
        document.querySelector(".globalChatWrapper").style.display = "block";
        document.querySelector(".MyMessagesWrapper").style.display = "none";
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

function MessagesControl(){
    var that = this;
    var myMessages = [];
    var conversationIsOpen = false;
    var currentUserEmail;
    var oldMessagesLength = 0;
    var oldConversationLength = 0;
    //
    this.init = function init(){
        // setTimeout(function(){
        //     messagesControl.getMyMessages();
        // },500);
        document.addEventListener("DOMContentLoaded", function (){
            messagesControl.getMyMessages();
        });
    }

    this.sendMessage = function sendMessage(messageObject){
        var toEmail = messageObject.parentNode.querySelector("#fromEmail").value;
        var usersMessage = messageObject.parentNode.querySelector("#shortMessage").value;
        var sendObject = {
            toEmail:toEmail,
            usersMessage:usersMessage
        }
        //
        superUtil.sendJSON(sendObject,"/api/dashboard/messages/sendMessage",function(status, data){
            if(status == 200){
                document.querySelector(".modalMessages").innerHTML = "<span class='green'>"+data.message+"</span>";
                setTimeout(function(){
                    that.closeModal();
                },1000);
            } else {
                console.log(status);
                document.querySelector(".modalMessages").innerHTML = "<span class='red'>"+data.message+"</span>";
            }
        }, "POST");
    }

    this.closeModal = function closeModal(){
        document.querySelector(".fullScreenWrapper").style.display = 'none';
    }
    

    this.getMyMessages = function (){
        document.querySelector(".usersList").style.display = "none";
        document.querySelector(".globalChatWrapper").style.display = "none";
        document.querySelector(".MyMessagesWrapper").style.display = "block";
        document.querySelector(".conversationWrapper").style.display ="none";
        document.querySelector(".leftPanel").style.display ="block";
        conversationIsOpen = false;
        getMessagesFromServer();
    }

    function getMessagesFromServer(){
        // Get users email address
        superUtil.grabJSON('/api/dashboard/getName', function (status, data) {
            if(status == 200){
                currentUserEmail = data.email;
                superUtil.grabJSON("/api/dashboard/messages", function(status, data){
                    if(status == 200){
                        var dataList = Object.entries(data);
                        var numConversations = dataList.length;
                        var allCombinedMessages = [];
                        var leftPanel = document.querySelector(".leftPanel");
                        if(dataList.length ==0){
                            document.querySelector(".MyMessagesWrapper").innerHTML = "<span>There are no messages here.</span>";
                        }else {
                            // Empty the array of the previous messages
                            myMessages = [];
                            for(var m = 0; m <=numConversations-1; m++){
                                allCombinedMessages.push(dataList[m][1]);
                            }
                            // Loop through the allCombinedMessages and refomat array for later use.
                            for(var l = 0; l <=allCombinedMessages.length-1; l++){
                                for(var n = 0; n<= allCombinedMessages[l].length-1; n++){
                                    myMessages.push(allCombinedMessages[l][n]);
                                }
                            }
                            
                            // Only update the interface if we have new messages
                            if(myMessages.length > oldMessagesLength || myMessages.length < oldMessagesLength){
                                // Set new and old message values to be compared for populating new messages
                                oldMessagesLength = myMessages.length;
                                // Reset and build the left panel;
                                leftPanel.innerHTML = "";
                                var heldDataList = dataList;
                                var orderedByDateList = [];
                                for(var i =0; i<=heldDataList.length-1; i++){
                                    var userEmailAddress = dataList[i][1][0].fromUser;
                                    var usersDisplayName = dataList[i][1][0].name;
                                    var creationDate = dataList[i][1][dataList[i][1].length-1].creationDate;
                                    var avatarImage = dataList[i][1][0].avatarImage;
                                    
                                    if(userEmailAddress == currentUserEmail){
                                        // Do nothing these are your messages
                                    } else {
                                        // Place the grouped contents in a new array to be reordered by their date.
                                        //var formattedDate = moment(creationDate).format('MMMM DD, YYYY h:mm a');
                                        orderedByDateList.push({
                                            avatar: avatarImage,
                                            name: usersDisplayName,
                                            email: userEmailAddress,
                                            sentDate: creationDate
                                        });
                                    }
                                }
                                // sort the ordered list group by their dates
                                orderedByDateList = _.sortBy(orderedByDateList, function(d){ return new moment(d.sentDate)}).reverse();
                                // append the list to the document.
                                for(var i=0; i<= orderedByDateList.length-1; i++){
                                    var formattedDate = moment(orderedByDateList[i].sentDate).format('MMMM DD, YYYY h:mm a');
                                    leftPanel.innerHTML += '<div class="messageWrapper" onclick=messagesControl.loadMessagesWithUser("'+orderedByDateList[i].email+'");>'+
                                                                    '<div class="messageicon">'+
                                                                        '<img class="leftPanelAvatar" src="'+orderedByDateList[i].avatar+'" width="50px" height="50px" alt="">'+
                                                                            '<div class="messagePreview">'+
                                                                                '<div class="messageFromUser">'+orderedByDateList[i].name+'</div>'+
                                                                            '</div>'+
                                                                    '</div>'+
                                                                    '<div class="userEmailAddress">'+orderedByDateList[i].email+'</div>'+
                                                                    "<br>"+
                                                                    '<div class="messageCreationDate">'+formattedDate+'</div>'+
                                                                '</div>';
                                }
                            }

                            if(leftPanel.innerHTML == ""){
                                document.querySelector(".MyMessagesWrapper").innerHTML = "<span>There are no messages here.</span>";
                            }
                        }
                    } else {
                        console.log(status, data);
                    }
                });
            } else {
                console.log(status, data);
            }
        });
    }

    this.loadMessagesWithUser = function loadMessagesWithUser(fromEmail){
        var conversation = [];
        conversationIsOpen = true;
        document.querySelector(".leftPanel").style.display = "none";
        var conversationList = document.querySelector(".conversationWrapper ul");
        
        // Push all messages from this user into a group
        for(var m=0; m<=myMessages.length-1;m++){
            if(myMessages[m].toUser == fromEmail){
                conversation.push(myMessages[m]);
            }
            if(myMessages[m].fromUser == fromEmail){
                conversation.push(myMessages[m]);
                document.querySelector("#chattingWith").innerHTML=myMessages[m].name;
                document.querySelector("#chattingWithEmail").innerHTML=fromEmail;
            }

            if(m == myMessages.length-1){
                // Only update the interface if we have new messages
                if(conversation.length > oldConversationLength || conversation.length < oldConversationLength){
                    // Set new and old message values to be compared for populating new messages
                    oldConversationLength = conversation.length;
                    // Format the conversation by date
                    var sortedConversation = _.sortBy(conversation, function(o) { return new moment(o.creationDate); }).reverse();
                    // Clear out previous content for updated content
                    conversationList.innerHTML="";
                    document.querySelector(".conversationWrapper").style.display ="block";
                    for(var convo = 0; convo<=sortedConversation.length-1;convo++){
                        var formattedDate = moment(sortedConversation[convo].creationDate).format('MMMM DD, YYYY h:mm a');
                        //
                        if(sortedConversation[convo].toUser == currentUserEmail) {
                            //sendMessageToUser = sortedConversation[convo].fromUser;
                            conversationList.innerHTML+= "<li>"+
                                                "<div class='leftMessage'>"+
                                                    "<div class='chatAvatar'><img src='"+sortedConversation[convo].avatarImage+"' width='50px' height='50px'></div>"+
                                                    "From: "+sortedConversation[convo].name+
                                                    "<br/>"+
                                                    "Date: "+formattedDate+
                                                    "<br/>"+
                                                    "<p>"+sortedConversation[convo].message+"</p>"+
                                                "</div>"+
                                            "</li>";
                        } else {
                            //sendMessageToUser = sortedConversation[convo].toUser;
                            conversationList.innerHTML+= "<li>"+
                                                "<div class='rightMessages'>"+
                                                    "<div class='chatAvatar'><img src='"+sortedConversation[convo].avatarImage+"' width='50px' height='50px'></div>"+
                                                    "From: You"+
                                                    "<br/>"+
                                                    "Date: "+formattedDate+
                                                    "<br/>"+
                                                    "<p>"+sortedConversation[convo].message+"</p>"+
                                                "</div>"+
                                            "</li>";
                        }
                    }
                }
                
            }
        }
    }

    this.sendMessageInConversation = function sendMessageInConversation(){
        var chattingWithEmail = document.querySelector("#chattingWithEmail").innerHTML;
        interactive.sendDirectMessage(chattingWithEmail);
    }

    this.deleteMessageInConversation = function deleteMessageInConversation(){
        var chattingWithEmail = document.querySelector("#chattingWithEmail").innerHTML;
        console.log('Delete all messages between user: ', chattingWithEmail);
        if(confirm("Are you sure you wish to delete this conversation?")){
            interactive.deleteMessages(chattingWithEmail);
        }
    }

    setInterval(function (){
        getMessagesFromServer();
        if(conversationIsOpen){
            that.loadMessagesWithUser(document.querySelector("#chattingWithEmail").innerHTML);
        }
    },5000);
}
var messagesControl = new MessagesControl();
messagesControl.init();