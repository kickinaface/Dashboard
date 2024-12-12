import modA from '/js/modules/modA.js';

function ModularMain(){
    var superUtil = new SuperUtil();
    this.init = function init(){
        // console.log('initializing ModularMain');
        // modA({"title":"My Module A", "id": 0});
        // console.log(socket);

        document.addEventListener("DOMContentLoaded", function(){
            // Set Default Theme
            superUtil.appUiTheme = "Charcoal";
            superUtil.applyUiTheme();
        });
    }
};

var modularMain = new ModularMain();
modularMain.init();