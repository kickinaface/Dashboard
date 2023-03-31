var superUtil = new SuperUtil();
function Tasker(){
    var savedUser;
    var myTasks;
    var myTeamTasks;
    var teamCheckInterval;
    this.init = function init(){
        setInterval(function (){
            checkToken();
        }, (1000*60)*5);
        
        superUtil.grabJSON('/api/dashboard/getName', function (status, data) {
            if(status == 200){
                var savedPerson = {
                    name: data.name,
                    email: data.email,
                }
                savedUser = savedPerson;
            }
        });

        setTimeout(function(){
            tasker.getMyTasks();
        },1000);
    }

    function checkToken(){
        superUtil.grabJSON('/api/dashboard/checkToken', function(status, data){
            if(status == 200){
                console.log('token is valid', data)
            } else {
                window.location = '/logout';
            }
        },'GET');
    };

    this.createTask = function createTask(){
        console.log("build modal")
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Create A New Task</h2>'+
                '<br><span>Name this task:</span>'+
                '<br><input id="taskName" placeholder="Build Web Application"></input>'+
                '<br><span>Provide a short description of the task.</span>'+
                '<p><textArea id="shortTaskMessage" placeholder="Enter a short task description" cols="40" rows="8"></textArea></p>'+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.buildTask(this);">Create</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Close (X)</div>'+
            '</div>';
    }

    this.closeModal = function closeModal(){
        document.querySelector(".fullScreenWrapper").style.display = 'none';
        document.querySelector(".modalContentWrapper").innerHTML = "";
    }

    this.buildTask = function buildTask(e){
        var taskName = e.parentNode.querySelector("#taskName").value;
        var taskDetails = e.parentNode.querySelector("#shortTaskMessage").value;
        var postData = {
            taskName:taskName,
            taskDetails:taskDetails
        }
        superUtil.sendJSON(postData,"/api/dashboard/tasker/createTask", function(status, data){
            if(status != 200){
                console.log("status: ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                setTimeout(function(){
                    location.reload();
                },1000);
            }
        },"POST");
    }

    this.getMyTasks = function getMyTasks(){
        clearInterval(teamCheckInterval);
        document.querySelector(".myTasksWrapper").style.display = "block";
        document.querySelector(".singleTaskWrapper").style.display = "none";
        document.querySelector(".teamTasksWrapper").style.display = "none";
        document.querySelector(".singleTeamTask").style.display = "none";
        document.querySelector(".myTasksWrapper ul").innerHTML ="";
        superUtil.grabJSON("/api/dashboard/tasker/getTasks", function(status, data){
            if(status != 200){
                console.log("status: ",status);
            } else {
                myTasks = data;
                for(var t=0;t<=myTasks.length-1; t++){
                    document.querySelector(".myTasksWrapper ul").innerHTML += "<li><p><h2 onclick=tasker.goToTask('"+t+"');>"+myTasks[t].taskName+"</h2></p><p><i>"+myTasks[t].taskDetails+"</i></p></li>";
                    if(myTasks[t].completedDate == null){
                        document.querySelector(".myTasksWrapper ul").innerHTML += "<li><br>Task Status: <i>Not Complete</i></li>";
                    } else {
                        var formattedDate = moment(myTasks[t].completedDate).format('MMMM DD, YYYY h:mm a'); 
                        document.querySelector(".myTasksWrapper ul").innerHTML += "<li><br><span class='green'>Marked Completed: "+formattedDate+"</span></li>";
                    }
                    document.querySelector(".myTasksWrapper ul").innerHTML += "<br><br>";
                }

                if(myTasks.length == 0){
                    document.querySelector(".myTasksWrapper ul").innerHTML +="<li>There are no current tasks.</li>";
                }
            }
        });
    }

    this.goToTask = function goToTask(taskIndex){
        clearInterval(teamCheckInterval);
        var singleTask = myTasks[taskIndex];
        document.querySelector(".singleTaskWrapper").style.display = "block";
        document.querySelector(".myTasksWrapper").style.display = "none";
        document.querySelector(".teamTasksWrapper").style.display = "none";
        document.querySelector("#singleTaskId").value = taskIndex;
        document.querySelector(".singleTaskWrapper h1").innerHTML = singleTask.taskName;
        document.querySelector(".taskDetails").innerHTML = singleTask.taskDetails;
        document.querySelector(".taskSteps ul").innerHTML = "";
        document.querySelector(".taskMembers ul").innerHTML = "";
        if(singleTask.taskSteps.length == 0){
            document.querySelector(".taskSteps ul").innerHTML ="<li style='list-style:none;'><i>There are no task steps please add some.</i></li>";
        } else {
            for(var s= 0;s<=singleTask.taskSteps.length-1; s++){
                if(singleTask.taskSteps[s].completedDate != null){
                    var formattedDate = moment(singleTask.taskSteps[s].completedDate).format('MMMM DD, YYYY h:mm a');
                    document.querySelector(".taskSteps ul").innerHTML+="<li class='stepItem'><h3><i>"+singleTask.taskSteps[s].stepName+":</i></h3><div>"+singleTask.taskSteps[s].stepDetails+"</div>"+
                    "<span class='green'>Marked Complete: "+formattedDate+"</span></li><br>";
                } else {
                    document.querySelector(".taskSteps ul").innerHTML+="<li class='stepItem'><h3><i>"+singleTask.taskSteps[s].stepName+":</i></h3><div>"+singleTask.taskSteps[s].stepDetails+"</div>"+
                    "<button class='miniBtn' onclick=tasker.editStep("+s+");>Edit Step</button>"+
                    "<button class='miniBtn' onclick=tasker.deleteStep("+s+");>Delete Step</button>"+
                    "<button class='miniBtn' onclick=tasker.completeStep("+s+");>Complete Step</button></li><br>";
                }
                
            }
            
        }
        
        if(singleTask.taskMembers.length == 0){
            document.querySelector(".taskMembers ul").innerHTML ="<i style='list-style:none;'>There are no task members on this task. Click Add to add some.</i>";
        } else {
            //console.log("display members");
            for(var s= 0;s<=singleTask.taskMembers.length-1; s++){
                document.querySelector(".taskMembers ul").innerHTML+="<li class='taskMember'><h3><i>"+singleTask.taskMembers[s].email+"</i></h3><div></div><button class='miniBtn' onclick=tasker.removeUserModal("+s+")>Remove</button></li>";
            }
        }

        if(singleTask.completedDate == null){
            document.querySelector(".taskStatus").innerHTML = "<i>Not Complete</i><br><button onclick=tasker.markTaskCompleteModal(this);>Mark Task as Complete</button>";
        } else {
            var formattedDate = moment(singleTask.completedDate).format('MMMM DD, YYYY h:mm a');
            document.querySelector(".taskStatus").innerHTML="<span class='green'>Marked Complete: "+formattedDate+"</span>";
        }
    }

    this.editNameTitle = function editNameTitle(e){
        var singleTaskId = e.parentNode.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Edit Task Name & Details</h2>'+
                '<br><span>Name this task:</span>'+
                '<br><input id="taskName" placeholder="Build Web Application" value="'+myTasks[singleTaskId].taskName+'"></input>'+
                '<br><span>Provide a short description of the task.</span>'+
                '<p><textArea id="shortTaskMessage" placeholder="Enter a short task description" cols="40" rows="8">'+myTasks[singleTaskId].taskDetails+'</textArea></p>'+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.update(this, '+singleTaskId+');">Update</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }
    this.update = function update(e, taskId){
        var taskName = e.parentNode.querySelector("#taskName").value;
        var taskDetails = e.parentNode.querySelector("#shortTaskMessage").value;
        var postData = {
            taskId:myTasks[taskId]._id,
            taskName:taskName,
            taskDetails:taskDetails
        };
        superUtil.sendJSON({postData},"/api/dashboard/tasker/update", function(status, data){
            if(status != 200){
                console.log("status ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                myTasks[taskId].taskName = data.postData.taskName;
                myTasks[taskId].taskDetails = data.postData.taskDetails;
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                document.querySelector(".singleTaskWrapper h1").innerHTML = data.postData.taskName;
                document.querySelector(".taskDetails").innerHTML = data.postData.taskDetails;

                setTimeout(function(){
                    tasker.closeModal();
                },1000);
            }
        },"POST");
    }
    this.addTaskStep = function addTaskStep(e){
        var singleTaskId = e.parentNode.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Add A Task Step</h2>'+
                '<br><span>Name this step:</span>'+
                '<br><input id="taskStepName" placeholder="Buy the domain name."></input>'+
                '<br><span>Provide a short description of the step.</span>'+
                '<p><textArea id="shortStepMessage" placeholder="Enter a short step description. i.e. List details about domain name being bought. Describe specific actions within the step of the task." cols="40" rows="8"></textArea></p>'+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.addStep(this,'+singleTaskId+');">Add Step</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.addStep = function addStep(e, taskId){
        var taskStepName = e.parentNode.querySelector("#taskStepName").value;
        var shortStepMessage = e.parentNode.querySelector("#shortStepMessage").value;
        var postData = {
            taskId:myTasks[taskId]._id,
            taskStepName:taskStepName,
            shortStepMessage:shortStepMessage
        };

        superUtil.sendJSON({postData},"/api/dashboard/tasker/addStep", function(status, data){
            if(status != 200){
                console.log("status ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                myTasks[taskId].taskSteps = data.postData;
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                tasker.goToTask(taskId);
                setTimeout(function(){
                    tasker.closeModal();
                },1000);
            }
        },"POST");
    }

    this.editStep = function editStep(stepIndex){
        var singleTaskId = document.querySelector("#singleTaskId").value;
        var currentStep = myTasks[singleTaskId].taskSteps[stepIndex];
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Edit Task Step</h2>'+
                '<br><span>Change Name of this step:</span>'+
                '<br><input id="taskStepName" placeholder="Buy the domain name." value="'+currentStep.stepName+'"></input>'+
                '<br><span>Provide a short description of the step.</span>'+
                '<p><textArea id="shortStepMessage" placeholder="Enter a short step description." cols="40" rows="8">'+currentStep.stepDetails+'</textArea></p>'+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.editStepRequest('+singleTaskId+','+stepIndex+');">Edit Step</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.editStepRequest = function editStepRequest(index, stepIndex){
        var taskStepName = document.querySelector("#taskStepName").value;
        var shortStepMessage = document.querySelector("#shortStepMessage").value;
        var postData = {
            taskId:myTasks[index]._id,
            stepIndex:stepIndex,
            stepName:taskStepName,
            stepDetails:shortStepMessage
        };

        superUtil.sendJSON({postData},"/api/dashboard/tasker/updateStep", function(status, data){
            if(status != 200){
                console.log("status ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                myTasks[index].taskSteps = data.postData;
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                tasker.goToTask(index);
                setTimeout(function(){
                    tasker.closeModal();
                },1000);
            }
        },"POST");
    }

    this.deleteStep = function deleteStep(stepIndex){
        var singleTaskId = document.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Delete Task Step</h2>'+
                '<br><span>Warning! <br>Are you sure you want to delete this step? <br>This cannot be undone.</span>'+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.deleteStepRequest('+singleTaskId+','+stepIndex+');">Delete Step</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.deleteStepRequest = function deleteStepRequest(index, stepIndex){
        var postData = {
            taskId:myTasks[index]._id,
            stepIndex:stepIndex
        };

        superUtil.sendJSON({postData},"/api/dashboard/tasker/removeStep", function(status, data){
            if(status != 200){
                console.log("status ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                myTasks[index].taskSteps = data.postData;
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                tasker.goToTask(index);
                setTimeout(function(){
                    tasker.closeModal();
                },1000);
            }
        },"DELETE");
    }

    this.completeStep = function completeStep(stepIndex){
        var singleTaskId = document.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Complete This Step</h2>'+
                '<br><span>Warning! <br>Are you sure you want mark this step as completed? <br>This cannot be undone.</span>'+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.completeStepRequest('+singleTaskId+','+stepIndex+');">Complete Step</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.completeStepRequest = function(index, stepIndex){
        var postData = {
            taskId:myTasks[index]._id,
            stepIndex:stepIndex
        };
        superUtil.sendJSON({postData},"/api/dashboard/tasker/completeStep", function(status, data){
            if(status != 200){
                console.log("status ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                myTasks[index].taskSteps = data.postData;
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                tasker.goToTask(index);
                setTimeout(function(){
                    tasker.closeModal();
                },1000);
            }
        },"POST");
    }

    this.addMember = function addMember(e){
        var singleTaskId = e.parentNode.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Add A Task Member</h2>'+
                "<br><span>Enter a valid user's email address</span>"+
                '<br><input id="addAMemberEmail" placeholder="validmemberEmail@site.com"></input>'+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.addMemberToTask(this,'+singleTaskId+');">Add Member</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.addMemberToTask = function addMemberToTask(e, taskId){
        var memberEmail = e.parentNode.querySelector("#addAMemberEmail").value;
        var postData = {
            taskId:myTasks[taskId]._id,
            memberEmail:memberEmail
        };

        superUtil.sendJSON({postData},"/api/dashboard/tasker/addMember", function(status, data){
            if(status != 200){
                console.log("status ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                myTasks[taskId].taskMembers = data.postData;
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                tasker.goToTask(taskId);
                setTimeout(function(){
                    tasker.closeModal();
                },1000);
            }
        },"POST");  
    }

    this.removeUserModal = function removeUserModal(index){
        var singleTaskId = document.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Remove Member</h2>'+
                '<br><span>Warning! <br>Are you sure you want to remove this member?<br><br>'+myTasks[singleTaskId].taskMembers[index].email+'</span>'+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.removeMemberRequest('+singleTaskId+','+index+');">Remove Member</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.removeMemberRequest = function removeMemberRequest(index, memberIndex){
        var postData = {
            taskId:myTasks[index]._id,
            memberIndex:memberIndex
        };

        superUtil.sendJSON({postData},"/api/dashboard/tasker/removeMember", function(status, data){
            if(status != 200){
                console.log("status ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                myTasks[index].taskMembers = data.postData;
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                tasker.goToTask(index);
                setTimeout(function(){
                    tasker.closeModal();
                },1000);
            }
        },"DELETE");
    }

    this.markTaskCompleteModal = function markTaskCompleteModal(e){
        var singleTaskId = e.parentNode.parentNode.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Mark Task As Completed</h2>'+
                "<br><span>Warning! Are you sure you want to make this task marked as completed?</span>"+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.markCompletedRequest('+singleTaskId+');">Mark Completed</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.markCompletedRequest = function markCompletedRequest(taskId){
        var postData = {
            taskId:myTasks[taskId]._id
        };

        superUtil.sendJSON({postData},"/api/dashboard/tasker/completeTask", function(status, data){
            if(status != 200){
                console.log("status ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                setTimeout(function(){
                    location.reload();
                },1000);
            }
        },"POST"); 
    }

    this.deleteTask = function deleteTask(e){
        var singleTaskId = e.parentNode.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Delete Task</h2>'+
                "<br><span>Warning! Are you sure you want to delete this task? <br>This cannot be undone!</span>"+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.deleteTaskRequest('+singleTaskId+');">Delete</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.deleteTaskRequest = function deleteTaskRequest(taskId){
        var postData = {
            taskId:myTasks[taskId]._id
        };

        superUtil.sendJSON({postData},"/api/dashboard/tasker/removeTask", function(status, data){
            if(status != 200){
                console.log("status ",status);
                document.querySelector(".modalMessages").innerHTML ="<span class='red'>"+data.message+"</span>";
            } else {
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                setTimeout(function(){
                    location.reload();
                },1000);
            }
        },"DELETE");  
    }

    // Team tasks
    this.getTeamTasks = function getTeamTasks(){
        clearInterval(teamCheckInterval);
        document.querySelector(".teamTasksWrapper").style.display = "block";
        document.querySelector(".myTasksWrapper").style.display = "none";
        document.querySelector(".singleTaskWrapper").style.display = "none";
        document.querySelector(".singleTeamTask").style.display = "none";
        document.querySelector(".teamTasksWrapper ul").innerHTML = "";
        superUtil.grabJSON("/api/dashboard/tasker/getTeamTasks", function(status, data){
            if(status != 200){
                console.log("status: ",status);
            } else {
                myTeamTasks = data;
                for(var t=0;t<=myTeamTasks.length-1; t++){
                    document.querySelector(".teamTasksWrapper ul").innerHTML += "<li><p><h2 onclick=tasker.goToTeamTask('"+t+"');>"+myTeamTasks[t].taskName+"</h2></p><p><i>"+myTeamTasks[t].taskDetails+"</i></p></li>";
                    if(myTeamTasks[t].completedDate == null){
                        document.querySelector(".teamTasksWrapper ul").innerHTML += "<li><br>Task Status: <i>Not Complete</i></li>";
                    } else {
                        var formattedDate = moment(myTeamTasks[t].completedDate).format('MMMM DD, YYYY h:mm a'); 
                        document.querySelector(".teamTasksWrapper ul").innerHTML += "<li><br><span class='green'>Marked Completed: "+formattedDate+"</span></li>";
                    }
                    document.querySelector(".teamTasksWrapper ul").innerHTML += "<br><br>";
                }

                if(myTeamTasks.length == 0){
                    document.querySelector(".teamTasksWrapper ul").innerHTML +="<li>There are no current tasks.</li>";
                }
            }
        });
    }

    this.goToTeamTask = function goToTeamTask(index){
        //var singleTeamTask;
        
        teamCheckInterval = setInterval(function(){
            console.log("refresh and check the values and append them back");
            var taskId = singleTeamTask._id;
            console.log("update task id: ", taskId);
            superUtil.grabJSON(("/api/dashboard/tasker/getSingleTeamTask/"+taskId), function(status, data){
                if(status != 200){
                    console.log(status);
                } else {
                    myTeamTasks[index] = data.postData;
                    // after getting values back from server, redraw.
                    renderTeamTask();
                }
            });
        }, 5000);
        var renderTeamTask = function(){
            singleTeamTask = myTeamTasks[index];
            document.querySelector(".singleTeamTask").style.display = "block";
            document.querySelector(".singleTaskWrapper").style.display = "none";
            document.querySelector(".myTasksWrapper").style.display = "none";
            document.querySelector(".teamTasksWrapper").style.display = "none";
            document.querySelector(".singleTeamTask #singleTaskId").value = index;
            document.querySelector(".singleTeamTask h1").innerHTML = singleTeamTask.taskName;
            document.querySelector(".singleTeamTask .taskDetails").innerHTML = singleTeamTask.taskDetails;
            document.querySelector(".singleTeamTask .taskSteps ul").innerHTML = "";
            document.querySelector(".singleTeamTask .taskMembers ul").innerHTML = "";
            if(singleTeamTask.taskSteps.length == 0){
                document.querySelector(".taskSteps ul").innerHTML ="<li style='list-style:none;'><i>There are no task steps please add some.</i></li>";
            } else {
                for(var s= 0;s<=singleTeamTask.taskSteps.length-1; s++){
                    if(singleTeamTask.taskSteps[s].completedDate != null){
                        var formattedDate = moment(singleTeamTask.taskSteps[s].completedDate).format('MMMM DD, YYYY h:mm a');
                        document.querySelector(".singleTeamTask .taskSteps ul").innerHTML+="<li class='stepItem'><h3><i>"+singleTeamTask.taskSteps[s].stepName+":</i></h3><div>"+singleTeamTask.taskSteps[s].stepDetails+"</div>"+
                        "<span class='green'>Marked Complete: "+formattedDate+"</span></li><br>";
                    } else {
                        document.querySelector(".singleTeamTask .taskSteps ul").innerHTML+="<li class='stepItem'><h3><i>"+singleTeamTask.taskSteps[s].stepName+":</i></h3><div>"+singleTeamTask.taskSteps[s].stepDetails+"</div></li><br>";
                        // "<button class='miniBtn' onclick=tasker.editStep("+s+");>Edit Step</button>"+
                        // "<button class='miniBtn' onclick=tasker.deleteStep("+s+");>Delete Step</button>"+
                        // "<button class='miniBtn' onclick=tasker.completeStep("+s+");>Complete Step</button></li><br>";
                    }
                    
                }
                
            }
            
            if(singleTeamTask.taskMembers.length == 0){
                document.querySelector(".singleTeamTask .taskMembers ul").innerHTML ="<i style='list-style:none;'>There are no task members on this task. Click Add to add some.</i>";
            } else {
                //console.log("display members");
                for(var s= 0;s<=singleTeamTask.taskMembers.length-1; s++){
                    document.querySelector(".singleTeamTask .taskMembers ul").innerHTML+="<li class='taskMember'><h3><i>"+singleTeamTask.taskMembers[s].email+"</i></h3><div></div></li>";
                }
            }

            if(singleTeamTask.completedDate == null){
                document.querySelector(".singleTeamTask .taskStatus").innerHTML = "<i>Not Complete</i><br>";
            } else {
                var formattedDate = moment(singleTeamTask.completedDate).format('MMMM DD, YYYY h:mm a');
                document.querySelector(".singleTeamTask .taskStatus").innerHTML="<span class='green'>Marked Complete: "+formattedDate+"</span>";
            }
        }
        renderTeamTask();
    }
}

var tasker = new Tasker();
tasker.init();