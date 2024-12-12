function SuperUtil(){
	var _that = this;
	this.init = function init(doc) {
		console.log('SuperUtil initiated');
	//	runExtensions();
	};
	this.currentPath = "";

	// Get JSON from server
	this.grabJSON = function grabJSON(address, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', address, true);
		xhr.reponseType = 'json';
		xhr.onload = function () {
			var status = xhr.status;
			if(status === 200){
				callback(status, JSON.parse(xhr.response));
			}else {
				callback(status, xhr.response);
			}
		}
		xhr.send();
	};

	// Send JSON to server
	this.sendJSON = function sendJSON(postData, address, callback, postType){
		var xhr = new XMLHttpRequest();
		var url = address;
		xhr.open(postType, url, true);
		xhr.setRequestHeader("Content-type", "application/json");
		xhr.onreadystatechange = function () { 
			var json = JSON.parse(xhr.responseText);
		    if (xhr.readyState == 4 && xhr.status == 200) {
				callback(xhr.status,json);
		    } else {
				callback(xhr.status, json);
			}
		}
		var data = JSON.stringify(postData);
		xhr.send(data);
	};

	this.appUiTheme = null;
	this.applyUiTheme = function applyUiTheme(){
		var customStyleSheet = document.getElementById("cssThemes");
		customStyleSheet.href = "/css/"+this.appUiTheme.toLowerCase()+".css";
		document.querySelector(".closeModal").click();
	};

	this.fileUploadExtensions = function fileUploadExtensions(extentionType, currentPath){
		// set the filepath
		_that.currentPath = currentPath;

		function reEnableDialog(){
		    var fullScreenWrapper = document.querySelector(".fullScreenWrapper");
		    var downloadButton = document.querySelector(".downloadButton");
		    //
		    downloadButton.addEventListener("click", function(e){
		        var checkDownloadComplete = setInterval(function(){
		            var isShowing = fullScreenWrapper.style.display;
		            if(isShowing != "block"){
		                //alert("Download complete. Choose what to do with the file.");
		                fullScreenWrapper.style.display = "block";
		                document.querySelector(".deleteFileButton").disabled = false;
		                document.querySelector(".deleteFileButton").style.opacity = 1;
		                downloadButton.disabled = false;
		                downloadButton.style.opacity = 1;
		                clearInterval(checkDownloadComplete);
		            }
		        },500);
		    });
		};
		function runBatchDownload(){
			var allFiles = document.querySelectorAll(".driveContentsWrapper ul li");
			var currentPath = _that.currentPath;//document.querySelector(".currentPath").innerHTML.replace("<i>Current Path: </i>","");
			document.querySelector(".wholeFolderButton").disabled = true;
			document.querySelector(".wholeFolderButton").style.opacity = .5;
			document.querySelector(".closeModal").style.display = "none";
			// Loop through all files and download them. Place a second delay for processing or the loop might skip some.
			for(let i =0; i<=allFiles.length-1; i++){
				download(i);
			}
			// check to see if all the files have been downloaded. If they have, allow the use to close the window.
			var completeCounter = 0;
			var checkDownloadsComplete = setInterval(function(){
				var percentComplete =  document.querySelector(".downloadProgress div").innerHTML;
				//console.log("The batch download is: ", percentComplete, " complete.", completeCounter);
				if(percentComplete == "100%" && percentComplete != 5){
					completeCounter++;
				} 
				if(percentComplete != "100%"){
					completeCounter = 0;
				}
				if(percentComplete == "100%" && completeCounter >= 5){
					completeCounter = 0;
					document.querySelector(".closeModal").style.display = "block";
					clearInterval(checkDownloadsComplete);
				}
			},1000);
			function download(i){
				setTimeout(function(){
					var newPath = htmlDecode(currentPath+"/"+allFiles[i].innerHTML);
					fileManager.downloadFileFromPath(newPath);
				}, 1000);
			}
			function htmlDecode(input) {
				var doc = new DOMParser().parseFromString(input, "text/html");
				return doc.documentElement.textContent;
			}
		}
		if(extentionType == "reEnableDialog"){
			reEnableDialog();
		} else if(extentionType == "downloadWholeFolder"){
			var batchDownload = "Im about to download the entire folder's contents. (ALL FILES). DO NOT close any windows until completion.";
			if(confirm(batchDownload)){
				runBatchDownload();
			}
		}
		
	}
};
