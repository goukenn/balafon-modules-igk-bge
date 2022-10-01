"use strict";

igk.system.module("gltf");

(function(){
var gobj = igk.system.createNS("igk.bge.gameObjects",{
	gltf:function(){
		igk.appendProperties(this, {
			load:function(file, callback){
				//load gltf file 
				file = igk.system.module.getFileUri(file);
				console.debug(file);
				console.debug(igk.system.module.currentModuleInfo);
				igk.io.file.load(file, {
					complete:function(){
						
					},
					error:function(){
						
					}
				});
			}
		});
	}
});

})();