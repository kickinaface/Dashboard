function modA(pageData){
   console.log('Do Mod A things');
   handlePageData(pageData);
};

function handlePageData(data){
    console.log('handlePageData: ', data);
    document.addEventListener("DOMContentLoaded", loadModA);
}

function loadModA(event){
    console.log(event);
}

// Export Mod A
export default modA;