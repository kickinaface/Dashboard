var superUtil = new SuperUtil();
function Tasker(){
    var savedUser;
    var myTasks;
    this.init = function init(){
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
        document.querySelector(".myTasksWrapper").style.display = "block";
        document.querySelector(".singleTaskWrapper").style.display = "none";
        document.querySelector(".myTasksWrapper ul").innerHTML ="";
        superUtil.grabJSON("/api/dashboard/tasker/getTasks", function(status, data){
            if(status != 200){
                console.log("status: ",status);
            } else {
                myTasks = data;
                for(var t=0;t<=myTasks.length-1; t++){
                    document.querySelector(".myTasksWrapper ul").innerHTML += "<li><h2 onclick=tasker.goToTask('"+t+"');>"+myTasks[t].taskName+"</h2></p><p><i>"+myTasks[t].taskDetails+"</i></p></li>";
                    if(myTasks[t].completedDate == null){
                        document.querySelector(".myTasksWrapper ul").innerHTML += "<li>Task Status: <i>Not Complete</i></li>";
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
        var singleTask = myTasks[taskIndex];
        console.log("singleTask: ", singleTask);
        document.querySelector(".singleTaskWrapper").style.display = "block";
        document.querySelector(".myTasksWrapper").style.display = "none";
        document.querySelector("#singleTaskId").value = taskIndex;
        document.querySelector(".singleTaskWrapper h2").innerHTML = singleTask.taskName;
        document.querySelector(".taskDetails").innerHTML = singleTask.taskDetails;
        if(singleTask.taskSteps.length == 0){
            document.querySelector(".taskSteps").innerHTML ="<i>There are no task steps please add some.</i>";
        } else {
            console.log("display list steps");
        }
        
        if(singleTask.taskMembers.length == 0){
            document.querySelector(".taskMembers").innerHTML ="<i>There are no task members on this task. Click Add to add some.</i>";
        } else {
            console.log("display members");
        }

        if(singleTask.completedDate == null){
            document.querySelector(".taskStatus").innerHTML = "<i>Not Complete</i>";
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
                document.querySelector(".singleTaskWrapper h2").innerHTML = data.postData.taskName;
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
        console.log(e);
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
                myTasks[taskId].taskSteps.push(data.postData.taskSteps);
                //myTasks[taskId].taskDetails = data.postData.taskDetails;
                document.querySelector(".modalMessages").innerHTML ="<span class='green'>"+data.message+"</span>";
                console.log("build loop through step ", myTasks[taskId].taskSteps);
                // document.querySelector(".singleTaskWrapper h2").innerHTML = data.postData.taskName;
                // document.querySelector(".taskDetails").innerHTML = data.postData.taskDetails;

                // setTimeout(function(){
                //     tasker.closeModal();
                // },1000);
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
                '<button onclick="tasker.addMember(this);">Add Member</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.markComplete = function markComplete(e){
        var singleTaskId = e.parentNode.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Mark Task As Completed</h2>'+
                "<br><span>Warning! Are you sure you want to make this task marked as completed?</span>"+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.addMember(this);">Mark Completed</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }

    this.deleteTask = function deleteTask(e){
        var singleTaskId = e.parentNode.querySelector("#singleTaskId").value;
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Delete Task</h2>'+
                "<br><span>Warning! Are you sure you want to delete this task? <br>This cannot be undone!</span>"+
                '<div class="modalMessages"></div>'+
                '<button onclick="tasker.deleteTaskConfirm(this);">Delete</button>'+
                '<div class="closeModal" onclick="tasker.closeModal();">Cancel (X)</div>'+
            '</div>';
    }
}

var tasker = new Tasker();
tasker.init();