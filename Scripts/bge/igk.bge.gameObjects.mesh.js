"use strict";


(function(){
var gobj = igk.system.createNS("igk.bge.gameObjects",{
mesh:function(){
	
	igk.appendProperties(this, {
		load:function(f,callback){
			console.debug("try to load :" + f);
			//load files
			igk.io.file.load(f, {complete: function(s){
				console.debug(s);
				
			},
			error:function(){
					console.log("error append");
			}
			
			},"text/html");
		}
	});

}});






})();


