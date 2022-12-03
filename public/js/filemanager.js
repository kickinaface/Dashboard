var superUtil = new SuperUtil();

function FileManager(){
    var that = this;
    this.init = function init(){
        setInterval(function (){
            checkToken();
        }, (1000*60)*5);

        getDrives();
    };
    this.isDownloading = false;

    function checkToken(){
        superUtil.grabJSON('/api/dashboard/checkToken', function(status, data){
            if(status == 200){
                console.log('token is valid', data)
            } else {
                window.location = '/logout';
            }
        },'GET');
    };

    function getDrives(){
        superUtil.grabJSON('/api/dashboard/filemanager/getDrives', function (status, data) {
            if(status == 200){
                for(var d=0; d<= data.drives.length-1; d++){
                    document.querySelector('.displayDrives ul').innerHTML += "<li><button onclick=fileManager.showDriveContents('"+d+"')>"+data.drives[d].name+"</buton></li>";
                }
            } else {
                window.location = '/logout';
            }
        }, 'GET');
    };
    
    this.showDriveContents = function showDriveContents(driveNumIndex){
        document.querySelector('.fullScreenWrapper').innerHTML = "";
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        //
        superUtil.grabJSON(('/api/dashboard/filemanager/showDriveContents/'+driveNumIndex), function(status, data){
            if(status == 200){
                document.querySelector('.fullScreenWrapper').style.display = 'none';
                document.querySelector('.driveContentsWrapper ul').innerHTML = '';
                document.querySelector('.driveContentsWrapper').style.display = 'block';
                //document.querySelector('.fullScreenWrapper').style.display = 'none';
                for(var d=0; d<=data.length-1; d++){
                    var formattedString = (data[d].path);
                    if(formattedString.includes(" ")){
                        console.log('space')
                    }
                    document.querySelector('.driveContentsWrapper ul').innerHTML+= "<li onclick='fileManager.getContentsFromPath(`"+formattedString+"`);'>"+data[d].name+"</li>";
                }
            }else {
                // TODO: Handle Error messages
                console.log(status);
                console.log(data);
            }
        });
    };

    this.getContentsFromPath = function getContentsFromPath(path){
        document.querySelector('.fullScreenWrapper').innerHTML = "";
        document.querySelector('.fullScreenWrapper').style.display = 'block';
        //
        superUtil.sendJSON({requestPath:path}, '/api/dashboard/filemanager/getContentsFromPath', function (status, data){
            if(status == 200){                
                if(data.filePath !=undefined){
                    document.querySelector('.fullScreenWrapper').style.display = 'block';
                    document.querySelector('.fullScreenWrapper').innerHTML = 
                        '<div class="modalContentWrapper">'+
                            '<h2>Perform File Actions</h2>'+
                            '<button class="downloadButton" onclick="fileManager.downloadFileFromPath(`'+data.filePath+'`);">Download File</button>'+
                            '<button class="deleteFileButton" onclick="fileManager.deleteFileFromPath(`'+data.filePath+'`);">Delete File</button>'+
                            '<div class="downloadProgressWrapper">'+
                                '<div class="downloadProgress">'+
                                    '<div>0%</div>'+
                                '</div>'+
                            '</div>'+
                            '<div class="downloadStatusMessages"></div>'+
                            '<div class="closeModal" onclick="fileManager.closeModal()">Close (X)</div>'+
                        '</div>';
                }else {
                    document.querySelector('.fullScreenWrapper').style.display = 'none';
                    document.querySelector('.driveContentsWrapper ul').innerHTML = '';
                    document.querySelector('.driveContentsWrapper').style.display = 'block';
                    //
                    for(var d=0; d<=data.length-1; d++){
                        document.querySelector('.driveContentsWrapper ul').innerHTML+= "<li onclick=fileManager.getContentsFromPath('"+data[d].path+"')>"+data[d].name+"</li>";
                    }
                }
                
            } else {
                // TODO: Handle Error messages
                console.log(status);
                console.log(data);
            }
        }, 'POST');
    };

    this.downloadFileFromPath = function downloadFileFromPath(downloadPath){
        document.querySelector(".downloadButton").disabled = true;
        document.querySelector(".downloadButton").style.opacity = '.5';
        document.querySelector(".deleteFileButton").disabled = true;
        document.querySelector(".deleteFileButton").style.opacity = '.5';
        //
        downloadFile({requestFile:downloadPath}, '/api/dashboard/filemanager/downloadFileFromPath', function (status, data){
            console.log(status);
            console.log(data);
        }, 'POST');

        function downloadFile(postData, address, callback, postType){
            that.isDownloading = true;
            var xhr = new XMLHttpRequest();
            var url = address;
            //
            xhr.open(postType, url, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.responseType = 'blob';
            xhr.addEventListener("progress", function (e){
                if(e.lengthComputable) {
                    var percentComplete = e.loaded / e.total * 100;
                    //
                    document.querySelector(".downloadProgress").style.width = (percentComplete+ "%");
                    document.querySelector(".downloadProgress div").innerHTML = (Math.round(percentComplete)+ "%");
                } else {
                    // unable to compute progress information since the total size is unknown
                }
            })
            xhr.onreadystatechange = function (e) {
                var urlCreator = window.URL || window.webkitURL;
                if(xhr.response != undefined){
                    that.isDownloading = false;
                    var imageUrl = urlCreator.createObjectURL(xhr.response);
                    document.querySelector('.fullScreenWrapper').style.display = 'none';
                    window.location = imageUrl;
                }
            }
            var data = JSON.stringify(postData);
            xhr.send(data);
        };
    };

    this.closeModal = function closeModal(){
        if(that.isDownloading == true){
            alert("You must not close the window while downloading the file.");
        } else if(that.isDownloading == false){
            document.querySelector(".fullScreenWrapper").style.display = 'none';
        }
    }

    this.uploadFileModal = function uploadFileModal(){
        document.querySelector(".fullScreenWrapper").style.display = 'block';
        document.querySelector('.fullScreenWrapper').innerHTML = 
            '<div class="modalContentWrapper">'+
                '<h2>Upload a File</h2>'+
                "<form action='/api/dashboard/filemanager/uploadFile' method='post' enctype='multipart/form-data' class='uploadFileForm'>"+
                    "<input type='file' id='fileUploadInput' name='fileUploadInput' />"+
                    "<p><span>Please specifiy a path below:</span></p>"+
                    "<input type='text' id='fileUploadPath' name='fileUploadPath' placeholder='path/for/file'/>"+
                    "<p><button type='submit'>Upload File</button></p>"+
                    "<div class='modalMessages'></div>"+
                "</form>"+
                '<div class="closeModal" onclick="fileManager.closeModal()">Close (X)</div>'+
            '</div>';
    };

    this.deleteFileFromPath = function deleteFileFromPath(filePath){
        document.querySelector(".downloadButton").disabled = true;
        document.querySelector(".downloadButton").style.opacity = '.5';
        document.querySelector(".deleteFileButton").disabled = true;
        document.querySelector(".deleteFileButton").style.opacity = '.5';
        //
        superUtil.sendJSON({filePath:filePath},"/api/dashboard/filemanager/deleteFile", function (status, data){
            if(status == 200){
                window.location.reload();
            } else {
                document.querySelector(".downloadStatusMessages").innerHTML = "<span class='red'>"+data.message+"</span>";
            }
        }, "POST");
    }
}

var fileManager = new FileManager();
fileManager.init();