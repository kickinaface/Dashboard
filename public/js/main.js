import modA from '/js/modules/modA.js';

function ModularMain(){
    this.init = function init(){
        // console.log('initializing ModularMain');
        // modA({"title":"My Module A", "id": 0});
        // console.log(socket);
    }
};

var modularMain = new ModularMain();
modularMain.init();