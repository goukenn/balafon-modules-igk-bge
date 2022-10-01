//author C.A.D. BONDJE DOUE
//desc: assetManager interface.

"use strict";



igk.system.module("assetManager");
//asset manager
(function(){
	var _folder = "/assets"; //the asset default folder	
	var INLINE_DATA = 2;
	var FILE_DATA = 1;
	var NAMEU_CALLBACK=3;
	
	igk.system.createNS("igk.bge", {
		assetManager:function(game){
			if (!game)
				throw "game is not initialized";
			//asset manager constructor		
			var _assetlist = new igk.system.collections.list(); // store this asset list		
			var _dictionary = new igk.system.collections.dictionary();
			
			igk.appendProperties(this , {
				add:function(){
					switch(arguments.length){
						case 1://add file name
						break;
						case 2://add (name, data)
							_assetlist.add({name:arguments[0], data:arguments[1],"type":INLINE_DATA});//
						break;
						case 3://add (name, uri, callback)
						
						break;
					}
					return this;
				},
				reset:function(){
					_assetlist.clear();
					return this;
				},
				load:function(callback){				
					var progress = {
						total: _assetlist.getCount()
					};
					function _raise(p){
						if (callback){
							callback.apply(this, [p]);
						}
					};
					
					
					
					_assetlist.forEach(function(i, m){						
						var iprogress = {};
						switch(i.type){
							case INLINE_DATA:
								iprogress.data = i.data;
								iprogress.info = i;
								iprogress.progress = 1;
								iprogress.index = m;
								_raise(iprogress);
							break;
						}
					});
					return this;
				},
				
				// load:function( uri, callback, mimeType){
					// //mimeType = "text/plain";
					// var self = this;
					
					// // igk.ajx.get(this.getUri(uri), null, function(xhr){
						// // if (this.isReady()){
						// //	console.debug(xhr);
							// // callback({src:xhr.responseURL});
						// // }
					// // }, false);
					
					// // igk.io.file.load(this.getUri(uri), function(d){
						
						// // console.debug("finish loading");
					// // });
					// igk.system.io.getData(this.getUri(uri), function(d){	
						// // console.debug("data loading "+d.data);					
						// callback({src:d.data});
					// },mimeType);
				// },
				getUri:function(uri){
					//console.debug("old "+uri);
					return (igk.validator.isUri(uri)) ? uri : this.game.getBaseDir()+_folder+uri;
				}
			
			});
			
			igk.defineProperty(this, "game", {get:function(){return game;}});
		}
	});

	
	// const igk.bge.assetManager.INLINE_DATA = 2;
})();