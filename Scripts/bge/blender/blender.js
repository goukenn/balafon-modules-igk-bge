"use strict";

(function(){
//BLENDER UTILILY

var _NS = "igk.bge.blender";
var _BL = igk.system.createNS(_NS,{});


igk.system.createNS(_NS+".io", {
    loadObjFromUri:function(uri){
        var _promise = new igk.system.Promise();
        igk.invokeAsync(function(){
            igk.system.io.getData(uri, function(){
                _promise.resolve();
            }, "text/plain");
        });
        return _promise;
    }
});

// _BL.io.loadObjFromUri("/march.obj").then(function(){
        // console.error("data");
// }).error(function(){
    // console.error("error");
// });


})();