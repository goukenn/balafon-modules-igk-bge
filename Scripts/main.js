"uses strict";
// Entry BGE FILE 
// AUTHOR: C.A.D. BONDJE DOUE
// Date: 25/09/2018
// Version : 1.0

(function () {
	//used to store bge resources
	var _iniR = 0;
	var _scriptLoc = igk.getScriptLocation();
	var _lang = igk.dom.html().getAttribute("lang") || igk.navigator.getLang();


	//load shaders
	var loc = igk.getScriptLocation();
	//define NS
	igk.system.createNS("igk.bge.R", {});
	igk.system.createNS("igk.bge.events", {});


	//utility function
	function _getBufferBit(gl, c) {

		if (igk.isUndef(typeof (c))) {
			return gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
		}
		o = 0;
		for (var i = 0; i < c.length; i++) {
			if (c[i] in gl) {
				o |= gl[c[i]];
			}
		}
		return o;

	}

	function __unloadSurface(gx) {
		return function () {
			gx.dispose();
		};
	}
	// + | ---------------------------------------------------------------------------
	// + | global scope variable
	var _clGameObj = null;

	// -------------------------------------------------------------------------------
	// <game> Bge Game Surface</game>
	// -------------------------------------------------------------------------------

	function BgeGameSurface(mainScript, options) {

		_clGameObj = igk.bge.gameObjects;
		try {
			eval(mainScript);
		}
		catch (e) {
			console.error("main.js script evaluation failed: " + e.message);
			return;
		}
		var __primaryFunc = {
			"clearScene": function () {
				gl.clearColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a);
				gl.clear(clearBit);
			},
			"update": function () {
				//update element on the scene
			},
			"render": function () {
				//render the scene
			}
		};

		//
		// manage double click or double touch on .
		// note: dbltouch is a custom event on balafonjs
		//

		$igk(options.canvas).on("dbltouch click dblclick", function (evt) {
			var doc = $igk(document);
			if (doc.isFullScreen || doc.fullscreenElement == options.canvas)
				return;
			if (/(dbltouch)/.test(evt.type)) {
				options["dbltouch"] = 1;
			}
			if ((evt.type == "dblclick") || (options["dbltouch"] && (evt.type == "click"))) {
				var c = $igk(options.canvas);
				var fc = igk.fn.getItemFunc(c.o, "requestFullScreen");
				if (fc) {
					fc.apply(c.o);
				}
				options["dbltouch"] = 0;
			}
		});

		//inline primary function
		for (var i in __primaryFunc) {
			if (eval("typeof(" + i + ")") == 'undefined') {
				eval("var " + i + "= __primaryFunc[i];");
			}
		}


		//initialize shaders




		var gamepause = !1;
		var gl = options.glContext;
		var bgColor = options.info.profile.sceneBackgroundColor || { r: 0, g: 0, b: 0, a: 1 };
		var clearBit = _getBufferBit(gl, options.info.sceneBufferBit);
		var surface = this;
		igk.defineProperty(this, "gl", { get: function () { return gl; } });


		var shader = options.uriBase + "/shaders";
		var _shadersl = options.info.shaders || [];
		this.shaders = {};
		this.canvas = options.canvas;
		var _c = igk.createNode("event");
		var _e = {};
		_c.addEvent("sizeChanged", _e);

		this.on = function (n, c) {
			_c.reg_event(n, c);
		};
		igk.winui.reg_event(window, "resize", function () {
			_updateSize();

			igk.winui.events.raise(_c, "sizeChanged", { item: surface });//_c.raiseEvent("sizeChanged");
		});


		_updateSize();

		function _updateSize() {
			var c = $igk(options.canvas);
			c.o.width = igk.getNumber(c.getComputedStyle("width"));
			c.o.height = igk.getNumber(c.getComputedStyle("height"));
		}

		// chain loader
		function chainLoader(_shadersl) {
			var _i = 0;
			var _promise = new igk.system.Promise();
			function _chainLoader(i, fc) {
				// console.debug("chain:: "+_i);
				if (_i >= _shadersl.length) {
					_promise.resolve();
					return;
				}
				var u = shader + "/" + [_shadersl[_i]];
				igk.system.io.getData(u, function (s) {
					var key = _shadersl[_i];
					var idx = key.indexOf(".", -1);
					key = key.substring(0, idx) + key.substring(idx + 1).toUpperCase();
					surface.shaders[key] = s.data;

				}).then(function (s) {
					_i++;
					_chainLoader(_i, fc);
				}).error(function (s) {
					console.debug("failed to load " + u);
				});
			}
			igk.invokeAsync(function () {
				_chainLoader(0, _chainLoader);
			});
			return _promise;
		}

		var _gameStart = Date.now();
		var _gameTime = 0;
		var _initialize = 0;


		chainLoader(_shadersl).then(function () {
			//animate context
			try {
				initialize();
			} catch (e) {
				console.error("failed to initialize: " + e.message);
				return;
			}
			_initialize = 1;
			igk.html5.animate(Tick);
		});



		// game tick on only
		function Tick() {
			update();
			render();
			return 1;
		}
		// used tick on time
		function TickTime() {
			//update game time
			_gameTime = Date.now() - _gameStart;
			return Tick(_gameTime);
		}

		function Initializing() {

			if (_initialize)
				return 0;

			clearScene();
			return 1;
		}

		igk.html5.animate(Initializing);
	};
	function __initSurface() {
		var c = this.add("canvas");
		var _folder = this.getAttribute("bge:uribase");
		var _glContext = igk.html5.createWebGLContext(c.o);
		var _engineinfo = null;
		//console.debug("loadidng surface");
		if (!_glContext) {
			igk.log.write(igk.bge.R.err_context_failed);
			return;
		}

		igk.dom.body().on("unload", __unloadSurface(_glContext));
		if (_folder!=null){
			igk.system.io.getData(_folder + "/.bge.json", function (s) {
				var _e = igk.JSON.parse(s.data);
				_engineinfo = _e;
				//load main script engine			
			}).then(function () {
				//initialize game engine
				if (_engineinfo) {
					igk.system.io.getData(_folder + "/main.js", function (s) {
						igk.invokeAsync(function () {
							new BgeGameSurface(s.data, {
								uriBase: _folder,
								canvas: c.o,
								glContext: _glContext,
								info: _engineinfo
							});
						});
					});
				}
			}).error(function () {
					console.debug("failed to load game setting");
			});
		}
	}


	// start game control
	igk.winui.initClassControl("igk-bge-game-surface", __initSurface);
})();


//
// webgl surface
//

(function(){
	let surfaces = [];
	const _NS = igk.system.createNS("igk.bge.webgl", {
		webgl_surface(options){
			let gl = options.gl; 		
			let properties = {
				backgroundColor: [1,0,1,1],
				clearBit: options.clearBit || gl.COLOR_BUFFER_BIT
			};
			let update_timeout=0;
			let pause = 0;
			let is_created = 0;
			// overridable function
			let tick = function(){};
			let render = function(){ };
			let updateTick = function(){};
			let created = function(){
				if (is_created){
					return;
				}
				let self = this;
				$igk(options.target).on("click", function(){					 
					self.pause();
				});
				is_created = true;
			};
			gl.clearColor(
				properties.backgroundColor[0],
				properties.backgroundColor[1],
				properties.backgroundColor[2],
				properties.backgroundColor[3]
			);

			return {
				toString(){
					return "webGLApp";
				},
				clear(){
					gl.clear(properties.clearBit);			 
				},
				updateFrame(){
					
				},
				animFrame(){					
					let self= this; 
					if (pause){
						return;
					}
					self.clear();
					self.render(gl);
					self.flush();
					window.requestAnimationFrame(()=> self.animFrame());
				},
				flush(){
					gl.flush();
				},
				run(){
					let self= this;
					self.created();
					update_timeout = setInterval(()=> self.updateFrame(), 66);
					window.requestAnimationFrame(()=> self.animFrame());
					 
				},
				pause(){
					pause = !pause;
					if (pause){
						if (update_timeout){
							clearInterval(update_timeout);
							update_timeout = 0;
						}
					} else {
						this.run();
					}
				},
				tick,
				updateTick,
				render,
				created,
			};
		},
		createContext(o, options){
			return o.getContext("webgl", options) || o.getContext("experimental-webgl", options);
		}
	});
	 

	// init web gl game surface 
	function _init(){ 
		const { webgl_surface, createContext } = _NS;
		let t = JSON.parse(this.getAttribute("igk-data-options"));
		let p = this.add('canvas');
		let options = {
			alpha: true, // important to render overloay image
			enableDebug:false,
			antialias:true,
			width : 640,
			height: 320
		};


		p.setAttribute("width", options.width);
		p.setAttribute("height", options.height);

		let context = createContext(p.o, options);
		let _debug = context.debug;
		if (!context){
			this.remove();
			_debug && console.log("failed to create webgl context");
			return;
		}

		_debug && console.log("web context created");
		webgl_surface({
			gl:context,
			target:p.o,
			options: options
		}).run();
	};
	igk.winui.initClassControl("igk-webgl-surface", _init);
})();
