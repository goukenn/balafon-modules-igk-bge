//---------------------------------------------------------------
// BALAFON GAME ENGINE 
//----------------------------------------------------------------

// require igk.js

"use strict";
//define current the module call
igk.system.module("bge");


(function () {

	var __ERROR__ATTRIBNOT_FOUND__ = 0xe001;
	//global private var
	var _version = 1.0;
	var _rdate = "14/07/16";
	var _author = "C.A.D. BONDJE DOUE";
	var _NS = "igk.bge";
	var _BGE = igk.system.createNS(_NS);
	var _NSGameObj = igk.system.createNS(_NS + ".gameObjects");
	var _matrix;
	var _currentGame; //single game apps
	var mg_currentProgram; //store global current program in used




	//
	//extends array manipulation
	//
	igk.appendProperties(Array.prototype, {
		toFloatArray: function () {
			return new Float32Array(this);
		},
	});


	function __initIGK() {
		throw "No BalafonJS IGK found";
	}
	if (!igk) {
		__initIGK();
	}

	igk.system.createNS(_NS, {
		drawImage: function (c, i, x, y, w, h, filters_args) {
			//c:canvas
			//i:image to draw,
			//x:pos x,
			//y:pos y,
			//w:width,
			//height:h,
			//filter_args

			var canvas = $igk(c).o;//document.getElementById("game-surface");	
			var img = $igk(i).o;
			var gl = igk.html5.createWebGLContext(canvas);

			if (!gl) {
				return 0;
			}
			// console.debug(gl.getParameter(gl.VERSION));
			// console.debug(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
			// console.debug(gl.getParameter(gl.VENDOR));
			//(cl.r*(1 - (f * 0.2126))) + (cl.g*(1 + f *0.7152)) + (((f * 0.0722) + 1) *cl.b)
			var filters =
				"float gc = dot(cl,  vec3(0.299,1.587, 0.114));" +
				"float rf= 0.0; " +
				"float f=0.0;  cl =( (1.0-rf)  * cl) + (rf * vec3(gc));";


			var program = igk.bge.shader.loadAndCompile(gl,
				["precision mediump float; uniform mat4 uGlobalView; uniform mat4 uProjection; uniform mat4 uModelView; attribute vec3 inPosition; attribute vec3 inColor; attribute vec2  intextCoord; varying vec3 fColor; varying vec2 textCoord;void main(){fColor =  inColor;textCoord = intextCoord;	gl_Position =  uGlobalView * uProjection * uModelView * vec4(inPosition,1.0);}"],
				["precision mediump float; varying vec3 fColor; uniform sampler2D sample; varying vec2  textCoord; void main(){	vec3 cl = texture2D(sample, textCoord).rgb; " + filters + " gl_FragColor =  vec4(cl, 1);}"]);

			if (!program) {
				return -1;
			}
			program.useIt(gl);
			// console.debug("create context");
			var txt = new igk.bge.texture.texture2d(gl, img);
			var _w = img.width; 
			var _h = img.height; 
			var mat = igk.bge.math.mat4.createIdentity();
			
			//pass identity matrix to all uniform mat4
			program.setUniform("uGlobalView", mat);
			program.setUniform("uProjection", mat);
			program.setUniform("uModelView", mat);
			//set inPosition attribute value and enable the vertex buffer
			var _vertices = [
				-1, -1, 1, 1, 1,
				-1, 1, 1, 1, 1,
				1, 1, 1, 1, 1,
				1, -1, 1, 1, 1
			];
			var _indices = [
				0, 1, 2,
				0, 2, 3
			];

			var data = _vertices.toFloatArray();

			program.setAttribute("inPosition", data, 2, 5);
			program.setAttribute("inColor", data, 3, 5, 2);

			//le mappage des texture coord sur les vertices. attention il n'est fonction des indices mais bien du nombre de vertice
			program.setAttribute("intextCoord", [
				0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1, 0
			].toFloatArray(), 2, 2, 0);

			program.buffers.indiceBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program.buffers.indiceBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(_indices), gl.STATIC_DRAW);

			//self.updateSize(gl, _w, _h);
			txt.bind(gl);
			gl.uniform1i(program.uniforms.sample, txt.id);

			gl.clearColor(1.0, 1.0, 0.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.drawElements(gl.TRIANGLES,
				6,//count of indices 
				gl.UNSIGNED_SHORT, //type of transfered data
				0);
			return 1;
		},
		gameContext: function () {//game context			
			var m = {};
			igk.system.diagnostic.traceinfo(m, new Error(), 1);
			var m_install_dir = m.dir;
			//console.debug(m);		

			igk.html5.drawing.gameContextListener.apply(this);
			_currentGame = this;
			var m_scene = null;
			igk.appendProperties(this, {
				updateSize: function (gl, _w, _h) {
					var c = $igk(this.canvas).getParent().select(".scene").first();
					_w = _w || c.getPixel("width");//this.getSceneWidth();// window.innerWidth;
					_h = _h || c.getPixel("height");//this.getSceneHeight()//window.innerHeight;


					// console.debug(" >>> " +_w);
					// console.debug(" >>> " +_h);
					// console.debug(" >>> " +c.getComputedStyle("width"))

					this.canvas.width = _w;
					this.canvas.height = _h;
					gl.viewport(0, 0, _w, _h);
					this.raise("updateSize", { gl: gl, w: _w, h: _h });
				},
				getBaseDir: function () {
					return m_install_dir;
				},
				getScene: function () {
					return m_scene || $igk(this.canvas).getParent().select(".scene").first();
				},
			});

			var m_assets = new igk.bge.assetManager(this);

			igk.defineProperty(this, "assets", { get: function () { return m_assets; } });

			//configuration
			//diseable context menu
			$igk(this.canvas).reg_event("contextmenu", igk.bge.events.stop);
			//disable mouse wheel
			igk.winui.reg_window_event("wheel", function (evt) {
				igk.bge.events.stop.apply(this, [evt]);
				// alert("wheel");
			});

		}
	});

	igk.system.createNS(_NS + ".errors", {
		//error message
	});

	igk.system.createNS(_NS + ".R", {

	});

	//define error constants
	igk.bge.errors.VS_NOT_VALID = 0x1001;




	igk.defineProperty(_BGE, "version", { get: function () { return _version; } });
	igk.defineProperty(_BGE, "release", { get: function () { return _rdate; } });
	igk.defineProperty(_BGE, "author", { get: function () { return _author; } });
	igk.defineProperty(_BGE, "currentGame", { get: function () { return _currentGame; } });
	igk.defineProperty(_BGE, "currentProgram", { get: function () { return mg_currentProgram; } });

	//bge global ns 
	igk.system.createNS(_NS + ".app", {});
	igk.system.createNS(_NS + ".input", {});
	igk.system.createNS(_NS + ".drawing2D", {});
	igk.system.createNS(_NS + ".drawing2D.utility", {
		setArcOffset: function (ctx, width, angle, offset, cw) {

			// v_ctx.setLineDash([(2*Math.PI*200) * ((270)/360),(2*Math.PI*200) * ((360-270)/360)]);
			var a = angle;
			var T = (2 * Math.PI * width) / 360;
			//commence a 0
			//v_ctx.setLineDash([0, (2*Math.PI*200) * ((360-a)/360), (2*Math.PI*200) * ((360+a)/360)]);

			// v_ctx.setLineDash([0, T * (90-a)/360, T *180/360, 0, T * 45/360 , T * 45/360]);//(2*Math.PI*200) * ((360-a)/360), (2*Math.PI*200) * ((360+a)/360)]);
			//var x = 0;				
			offset = -offset; //270;// +90;
			// if (a < 90){
			// v_ctx.setLineDash([ 0 * T, T * (90-a), T * a, T * (360-90+a)]);//(2*Math.PI*200) * ((360-a)/360), (2*Math.PI*200) * ((360+a)/360)]);
			// }else{			
			// v_ctx.setLineDash([T * offset, T * (360-a), T * (a-offset)]);
			// }				

			// v_ctx.setLineDash([T * offset, T * (360-a), T * (a-offset)]);
			//clock wize angle arc				
			ctx.setLineDash([T * a, T * (360 - a)]);
			if (cw) {
				ctx.lineDashOffset = T * (360 - offset + a);
			}
			else {
				// anti-clock wize angle arc					
				ctx.lineDashOffset = T * (offset); // T * ( 360 -offset+a);
			}
		}
	});
	igk.system.createNS(_NS + ".drawing3D", {});
	var g_math = igk.system.createNS(_NS + ".math", {
		mat4: function () {
		}
	});

	igk.system.createNS(_NS + ".texture", {
		texture2d: function (gl, img) {
			// console.debug("create texture 2D");
			// console.debug(img);
			var m_texture = gl.createTexture();
			igk.appendProperties(this, {
				bind: function (gl) {
					this.useIt(gl);
					gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);// make texture to flip y axes 
					//gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);
					var ver = gl.getParameter(gl.VERSION);
					var r = parseFloat(ver.split(' ')[1]);
					var w = 0;
					var h = 0;
					if (img.tagName == "VIDEO") {
						h = img.videoHeight;
						w = img.videoWidth;
					} else {
						h = img.width;
						w = img.height;
					}
					if ((r >= 1) || (isPowerOf2(w) && isPowerOf2(h))) {
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
					}
					else {
						//create a dummy power of 2 image
						// console.debug("create a dummy power of 2 image");


						var cmp = igk.createNode("canvas");
						cmp.o.width = Math.pow(2, Math.floor(Math.log(w) / Math.log(2)) + 1);
						cmp.o.height = Math.pow(2, Math.floor(Math.log(h) / Math.log(2)) + 1);
						var ex = cmp.o.width / w;
						var ey = cmp.o.height / h;
						ex = Math.min(ex, ey);
						var ctx = cmp.o.getContext('2d');
						ctx.drawImage(img, 0, 0, w * ex, h * ex);

						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cmp.o);



					}
					// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,256,256,0, gl.RGBA, gl.UNSIGNED_BYTE, img);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT  );
					// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );		

					// non power of 2 texture must be clamp to edge
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				},
				useIt: function (gl) {
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, m_texture);
				},
				unloadContent: function (gl) {
					gl.deleteTexture(m_texture);
				}

			});
			function isPowerOf2(v) {
				return (v & (v - 1)) == 0;
			};

			igk.defineProperty(this, "id", { get: function () { return m_texture; }, readonly: 1 });
			this.bind(gl);
		}
	});




	// igk.appendProperties(igk.bge.texture.texture2d,{
	// magFilter: {
	// nearest: gl.NEAREST
	// linear: gl.LINEAR
	// }
	// wrapMode:{
	// repeat:  gl.REPEAT ,
	// gl.CLAMP_TO_EDGE
	// }
	// })


	function __keyMaps(win) {
		var m_mappings = [];
		var m_downkeys = [];
		for (var i = 0; i < 255; i++) {
			m_mappings[i] = 0;
		}
		igk.appendProperties(this, {
			update: function () {
				return this;
			},
			isKeyDown: function (key) {

				if (m_mappings[key]) {
					return 1;
				}
				return 0;
			},
			isKeyRelease: function (key) {
				if (this.isKeyDown(key)) {
					m_downkeys[key] = 1;
					return 0;
				}
				if (m_downkeys[key]) {
					m_downkeys[key] = 0;
					return 1;
				}
				return 0;
			}
		});
		function __downKey(evt) {
			if (evt.keyCode) {
				m_mappings[evt.keyCode] = 1;
			}
		};
		function __upKey(evt) {
			if (evt.keyCode) {
				m_mappings[evt.keyCode] = 0;
			}
		};
		igk.winui.reg_window_event("keydown", __downKey);
		igk.winui.reg_window_event("keyup", __upKey);
	}

	var m_maps = null;
	igk.defineProperty(igk.bge.input, "keyMaps",
		{
			get: function () {
				if (m_maps == null)
					m_maps = new __keyMaps(window);
				return m_maps;
			}
		}
	);




	function _copyArray(tab1, tab2) {
		for (var i = 0; i < 16; i++) {
			tab1[i] = tab2[i];
		}
		return tab1;
	};

	var g_math = igk.system.createNS(_NS + ".math", {
		mat4: function () {
			var fm = [];
			var cp = []; //store state

			igk.defineProperty(this, "elements", { get: function () { return fm; } });

			igk.appendProperties(this, {
				save: function () {
					var tcp = [];
					this.copy(tcp);
					cp.push(tcp);
				},
				restore: function () {
					if (cp.length > 0) {
						this.set(cp.pop());
					}
				},
				copy: function (d) { // copy the current array elements to d
					return _copyArray(d, fm);
				},
				set: function (d) {// copy the current d to arrary elements
					return _copyArray(fm, d);
				},
				// mult:function(d){
				// var o = [];
				// mat4.multiply(o, this.elements, d);
				// return o;
				// },
				translate: function (dx, dy, dz) {
					fm[12] += dx;
					fm[13] += dy;
					fm[14] += dz;
					return this;
				},
				rotate: function (angle, ux, uy, uz) {
					var rad = angle * Math.PI / 180.0;
					//var a = fm;
					var //a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
						s = Math.sin(rad),
						c = Math.cos(rad);
					var C = 1 - c;
					var mult = [
						(ux * ux * C) + c, ux * uy * C - uz * s, ux * uz * C + uy * s, 0,
						(ux * uy * C) + uz * s, uy * uy * C + c, uy * uz * C - ux * s, 0,
						(ux * uz * C) - uy * s, uy * uz * C - ux * s, uz * uz * C + c, 0,
						0, 0, 0, 1
					];
					this.mult(mult);

					// 	fm[0] = a0 * c + a2 * s;
					// fm[1] = a1 * c + a3 * s;
					// fm[2] = a0 * -s + a2 * c;
					// fm[3] = a1 * -s + a3 * c;
					return this;
				},
				scale: function (ex, ey, ez) {
					fm[0] *= ex;
					fm[5] *= (ey || ex || 1);
					fm[10] *= (ez ||ex || 1);
					return this;
				},
				scaleXYZ: function (e) {
					fm[0] *= e;
					fm[5] *= e;
					fm[10] *= e;
					return this;
				},
				makeIdentity: function () {
					for (var i = 0; i < 16; i++) {
						fm[i] = ((i % 5) == 0) ? 1 : 0;
					}
					return this;
				},
				makeLookAt: function (eyex, eyey, eyez, centerx, centery, centerz, upx, upy, upz) {
					var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;



					if (Math.abs(eyex - centerx) < glMatrix.EPSILON &&
						Math.abs(eyey - centery) < glMatrix.EPSILON &&
						Math.abs(eyez - centerz) < glMatrix.EPSILON) {
						return mat4.identity(out);
					}

					z0 = eyex - centerx;
					z1 = eyey - centery;
					z2 = eyez - centerz;

					len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
					z0 *= len;
					z1 *= len;
					z2 *= len;

					x0 = upy * z2 - upz * z1;
					x1 = upz * z0 - upx * z2;
					x2 = upx * z1 - upy * z0;
					len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
					if (!len) {
						x0 = 0;
						x1 = 0;
						x2 = 0;
					} else {
						len = 1 / len;
						x0 *= len;
						x1 *= len;
						x2 *= len;
					}

					y0 = z1 * x2 - z2 * x1;
					y1 = z2 * x0 - z0 * x2;
					y2 = z0 * x1 - z1 * x0;

					len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
					if (!len) {
						y0 = 0;
						y1 = 0;
						y2 = 0;
					} else {
						len = 1 / len;
						y0 *= len;
						y1 *= len;
						y2 *= len;
					}

					fm[0] = x0;
					fm[1] = y0;
					fm[2] = z0;
					fm[3] = 0;
					fm[4] = x1;
					fm[5] = y1;
					fm[6] = z1;
					fm[7] = 0;
					fm[8] = x2;
					fm[9] = y2;
					fm[10] = z2;
					fm[11] = 0;
					fm[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
					fm[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
					fm[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
					fm[15] = 1;


					return this;
				},
				makeFov: function (fov, aspect, near, far) {
					var h = cot((fov / 2.0) * (Math.PI / 180.0));
					var w = - aspect * h;
					var t = [
						w, 0, 0, 0,
						0, h, 0, 0,
						0, 0, far / (far - near), 1,
						0, 0, -near * far / (far - near), 0
					];
					//copy 
					for (var i = 0; i < 16; i++) {
						fm[i] = t[i];
					}
				},
				makeOrtho: function (lx, mx, ly, my, znear, zfar) {



					fm[0] = 2 / (mx - lx); fm[1] = 0; fm[2] = 0; fm[3] = 0;

					fm[4] = 0; fm[5] = 2 / (my - ly); fm[6] = 0; fm[7] = 0;

					fm[8] = 0; fm[9] = 0; fm[10] = 2 / (zfar - znear); fm[11] = 0;

					fm[12] = -(mx + lx) / (mx - lx); fm[13] = -(my + ly) / (my - ly); fm[14] = -(zfar + znear) / (zfar - znear); fm[15] = 1;

					var lr = 1 / (lx - mx),
						bt = 1 / (ly - my),
						nf = 1 / (znear - zfar);
					var out = [];
					out[0] = -2 * lr;
					out[1] = 0;
					out[2] = 0;
					out[3] = 0;
					out[4] = 0;
					out[5] = -2 * bt;
					out[6] = 0;
					out[7] = 0;
					out[8] = 0;
					out[9] = 0;
					out[10] = 2 * nf;
					out[11] = 0;
					out[12] = (lx + mx) * lr;
					out[13] = (my + ly) * bt;
					out[14] = (zfar + znear) * nf;
					out[15] = 1;
					fm = out;
					// important to do it in order to render item correctly
					// this.transpose();
					return this;
				},
				makeFrustum: function (lx, mx, ly, my, znear, zfar) {
					var A = (lx + mx) / (mx - lx);
					var B = (ly + my) / (my - ly);
					var C = -(znear + zfar) / (zfar - znear);
					var D = -2 * (znear * zfar) / (zfar - znear);

					fm[0] = 2 * (znear) / (mx - lx); fm[1] = 0; fm[2] = 0; fm[3] = 0;
					fm[4] = 0; fm[5] = 2 * (znear) / (my - ly); fm[6] = 0; fm[7] = 0;
					fm[8] = A; fm[9] = B; fm[10] = C; fm[11] = -1;
					fm[12] = 0; fm[13] = 0; fm[14] = D; fm[15] = 0;

					return this;
				},
				transpose: function () {
					var tmp = [];
					//copy
					for (var i = 0; i < 16; i++) {
						tmp[i] = fm[i];
					}
					fm[0] = tmp[0];
					fm[1] = tmp[4];
					fm[2] = tmp[8];
					fm[3] = tmp[12];

					fm[4] = tmp[1];
					fm[5] = tmp[5];
					fm[6] = tmp[9];
					fm[7] = tmp[13];


					fm[8] = tmp[2];
					fm[9] = tmp[6];
					fm[10] = tmp[10];
					fm[11] = tmp[14];


					fm[12] = tmp[3];
					fm[13] = tmp[7];
					fm[14] = tmp[11];
					fm[15] = tmp[15];

					return this;
				},
				mult: function (d) {
					if (d instanceof igk.bge.math.mat4) {
						d = d.elements;
					}
					var g = [];
					g = _copyArray(g, fm);
					var k = 0;
					var s = 0;
					var offset = 0;
					// for(var k = 0; k < 16; k++){
					for (var js = 0; js < 4; js++) {
						for (var x = 0; x < 4; x++) {
							s = 0;
							for (var j = 0; j < 4; j++) {
								s += g[offset + j] * d[(j * 4) + x];
							}
							fm[k] = s;
							k++;
						}
						offset += 4;
					}

					// }
					return this;
				}
			});

			this.makeIdentity();
		}
	});

	igk.appendProperties(g_math.mat4.prototype, {
		make: function () {
			return new Float32Array(this.elements);
		}
	});



	igk.appendProperties(_BGE, {
		exception: function (m, c) {//exception object			
			this.message = m;
			this.code = c;

			igk.appendProperties(this, {
				toString: function () {
					return c + ":" + m;
				}
			});
		}
	});

	igk.system.createNS("igk.bge.math.mat4", {
		createIdentity: function () {
			return new g_math.mat4();
		}
	});
	var _identity = igk.bge.math.mat4.createIdentity();
	igk.defineProperty(igk.bge.math.mat4, "identity", {
		get: function () {
			return _identity;
		}
	});
	igk.system.createNS("igk.bge.math.matrix", {
		create: function () { return Float32Array(16); }
	});

	_matrix = igk.bge.math.matrix;
	//var getLocationUriDir = 0;
	igk.system.createNS("igk.bge.shaders", {
		loadShaders: function(u, ns){
			 		
			var buri = eval(igk.scripts["@injectlocation"]); 			 
			if (buri=="")
			{
				return;
			}
			
			// load shaders 
			var _P = new igk.system.Promise();
			var _opt = igk.bge.getOption() || window._igk_bge_options;
			var _uri = _opt ? _opt.shader_uri : null;  
			if (_uri)
			igk.ajx.post(_uri, 'ns='+escape(ns)+"&u="+escape(u)+"&lib="+escape(igk.bge.baseUri || document.baseURI), function(xhr){
				if (this.isReady()){
					// console.debug(xhr.responseText);
					var c = igk.createNode("script");
					// c.on("load", function(){
					// console.debug("loading and execute");
					// });
					if (document.head)
						$igk(document.head).add(c);  
					if(xhr.responseText > 0)
						c.setHtml(xhr.responseText);					
					else 
						c.setHtml("");
					_P.resolve([{data:xhr.responseText}]);
					c.remove();
				}
			}); 
			return _P;
			
			
		},
		
	}, {
		desc: "used namespace of shaders"
	});

	 

	(function () {
		var sm_shader = null; //atomic shaders.....
		var sm_counter = 0;   //store number of total program created on this glcontext
		var sm_programs = []; //list of program created
		var m_errors = [];
		var m_ecode = 0;
		var __CLASS_NAME__ = "igk.bge.shader.shaderProgram";

		var _fc = function () {//singleton shader object
			if (sm_shader) {
				// console.debug("single ton instance");
				return sm_shader;
			}
			if (this instanceof igk.object) {
				return new _fshader();
			}
			// console.debug(this);
			// console.debug(this instanceof igk.object);			
			igk.appendProperties(this, {
				getError: function () {
					return m_errors.join("\n");
				},
				loadAndCompile: function (gl, arraylistVShader, arraylistFShader) {//create an compile
					//igk.winui.toast.make("load and compile").show();
					m_errors = [];
					var p = null; //program data
					//return null if failed
					var vshader = [];
					var fshader = [];
					var program = gl.createProgram();
					var vertexShader = "";
					var fragmentShader = "";
					var v_str = "";

					for (var i = 0; i < arraylistVShader.length; i++) {
						v_str = arraylistVShader[i];
						if (!v_str) {
							m_errors.push("string is empty is not a valid vertex shader");
							m_ecode = igk.bge.errors.VS_NOT_VALID;
							return;
						}
						vertexShader = gl.createShader(gl.VERTEX_SHADER);
						gl.shaderSource(vertexShader, v_str);
						gl.compileShader(vertexShader);

						if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
							console.error("Error when compiling vertex shader ! ", gl.getShaderInfoLog(vertexShader));
							// console.log(v_str);
							// console.log(vertexShader);
							return;
						}
						vshader[i] = { id: vertexShader, src: v_str };

						gl.attachShader(program, vertexShader);
					}

					for (var i = 0; i < arraylistFShader.length; i++) {

						v_str = arraylistFShader[i];
						if (!v_str) {
							throw new igk.bge.exception(v_str + " is not a valid fragment shader", igk.bge.errors.FS_NOT_VALID);
						}
						fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
						gl.shaderSource(fragmentShader, v_str);
						gl.compileShader(fragmentShader);
						if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
							console.error("Error when compiling fragment shader ! ", gl.getShaderInfoLog(fragmentShader));
							return;
						}
						fshader[i] = { id: fragmentShader, src: v_str };
						gl.attachShader(program, fragmentShader);

					}



					//link program
					gl.linkProgram(program);
					if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
						console.error("Error when compiling program link failed shader ! ", gl.getProgramInfoLog(program));
						return;
					}

					gl.validateProgram(program);
					if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
						console.error("Validate program ! ", gl.getProgramInfoLog(program));
						return;
					}
					p = new function () { //program encapsulation
						var m_gl = 0;
						var m_index = (sm_counter);
						sm_counter++; //

						// expand program attribute properties
						igk.appendProperties(this, {
							vertexShaders: vshader,
							fragmentShaders: fshader,
							attributes: {}, //store shader attributes variable location
							uniforms: {}, //store shader uniforms variable location
							buffers: {}, //store the created buffer
							toString: function () {
								return __CLASS_NAME__;
							},
							useIt: function (gl) {
								gl.useProgram(this.id);
								if (mg_currentProgram && (mg_currentProgram != this)) {
									mg_currentProgram.m_gl = 0;
								}
								m_gl = gl;
								mg_currentProgram = this;
							},
							freeIt: function () {
								if (m_gl) {
									m_gl.useProgram(null);
									if (mg_currentProgram && (mg_currentProgram == this)) {
										mg_currentProgram = null;
									}
									m_gl = null;
								}

							},
							setAttribute: function (n, tab, bpe, stride, offset) {
								// @n: name of attribute to update
								// @tab: attribute passing
								// @bpe: number of entries per vertex must be [1, 2, 3 or 4]
								// @stride : stride in data
								// @offset : offset in data list 						
								var gl = m_gl;
								offset = offset || 0;
								stride = stride || 0;

								var s = gl.getAttribLocation(this.id, n);
								if (s == null) igk.die("no attribute location found {" + n + "}" + s, __ERROR__ATTRIBNOT_FOUND__);
								
								if (tab==null){
									gl.disableVertexAttribArray(s);
									return;
								}
								var buffer = this.buffers[n] || (this.buffers[n] = gl.createBuffer());// buffer=g
								
								// gl.enableVertexAttribArray(s);
								gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
								// passing data
								gl.bufferData(gl.ARRAY_BUFFER, tab, gl.STATIC_DRAW);

								// console.debug(n);
								gl.vertexAttribPointer(
									s,// attribute variable index
									bpe,//3,//number of elements 
									gl.FLOAT,
									gl.FALSE,
									stride * Float32Array.BYTES_PER_ELEMENT, //strited
									offset * Float32Array.BYTES_PER_ELEMENT);
								gl.enableVertexAttribArray(s);
							},
							setAttribute3f: function (n, x, y, z) {
								this.setAttribute(n,
									new Float32Array([x, y, z, x, y, z, x, y, z]),
									3);
							},
							initAttribLocation: function (gl, tn) {
								//init attrib list
								//@gl : context
								//@tn : list of name to initiailze
								var k = 0;
								var f = 1;
								for (var i = 0; i < tn.length; i++) {
									k = gl.getAttribLocation(this.id, tn[i]);
									this.attributes[tn[i]] = k;
									f = f && (k != null);
								}
								return f;
							},
							initUniform: function (gl, tn) {//init uniform list
								var k = 0;
								var f = 1;
								for (var i = 0; i < tn.length; i++) {
									k = gl.getUniformLocation(this.id, tn[i]);
									this.uniforms[tn[i]] = k;
									f = f && (k != null);
								}
								return f;
							},
							setUniform: function (n, v) {//n:name; v:value matrix 4
								return this.setUniformMat4(n, v.make());
							},
							setUniformMat4: function (n, v) {

								if (!m_gl) {
									console.error("you must first set gl with useIt");
									return this;
								}
								var k = 0;
								var i = m_gl.getUniformLocation(this.id, n);
								if (i != -1) {
									m_gl.uniformMatrix4fv(i, gl.GL_FALSE, v);
								}
								return this;
							},
							setUniform1f: function (n, v) {
								var i = m_gl.getUniformLocation(this.id, n);
								if (i != -1) {
									m_gl.uniform1f(i, v);
								}
								return this;
							},
							getUniform: function (n) {
								var i = m_gl.getUniformLocation(this.id, n);
								if (i && i != -1) {
									return m_gl.getUniform(this.id, i);
								}
								return null;
							}
						});


						igk.defineProperty(this, "id", { get: function () { return program; } });
						igk.defineProperty(this, "index", { get: function () { return m_index; } });

					};
					return p;
				},
				toString: function () { return "igk.bge.shader"; }
			});
			sm_shader = this;
			return sm_shader;
		};

		//create a singleton shader manager
		new _fc();
		igk.defineProperty(igk.bge, "shader", {
			get: function () {
				return sm_shader;
			}
		});

		//console.debug("shader "+igk.bge.shader);

	})();

	(function () {
		//manage game object
		var _sp = 0;//set parent

		igk.system.createNS(_NS, {
			gameObject: function () {
				var _program = null;//store program used to render this object
				var _parent = null;//store the parent of this game object
				var _transform = null;
				// var _vsh = []; //array of vertex shader
				// var _fsh = []; //array of fragment shader
				igk.appendProperties(this, {
					init: function () {

					},
					render: function (gl) {	//render game object				
					},
					loadContent: function (gl) {
					},
					setProgram: function (p) {
						_program = p;
					},
					setParent: function (p) {
						if (_sp) {
							_parent = p;
						}
					}
				});

				igk.defineProperty(this, "program", {
					get: function () { return _program; }
				});
				igk.defineProperty(this, "parent", {
					get: function () { return _parent; }
				});
				igk.defineProperty(this, "transform", {
					get: function () {
						if (!_transform)
							_transform = igk.bge.math.mat4.createIdentity();
						return _transform; //model view transform 
					}
				});

			},
			gameContainer: function () {//data object that can have on or more children
				_BGE.gameObject.prototype.constructor.apply(this);

				var m_clist = new igk.system.collections.list();
				var base = igk.system.getBindFunctions(this);
				var q = this;
				igk.appendProperties(this, {
					add: function (item) {
						if (_sp) return;
						_sp = 1;
						m_clist.add(item);
						item.setParent(this);
						_sp = 0;
						return q;
					},
					remove: function (item) {
						if (_sp) return;
						_sp = 1;
						m_clist.add(item);
						item.setParent(null);
						_sp = 0;
						return q;
					},
					getchildCount: function () {
						return m_clist.getCount();
					},
					getChilds: function () {
						return m_clist.to_array();
					},
					eachChild: function (callback) {
						m_clist.forEach(callback);
						return this;
					},
					loadContent: function (gl) {
						base.loadContent(gl);
						this.eachChild(function (item, index) {
							item.loadContent(gl);
						})
					},
					render: function (gl) {
						this.eachChild(function (item, index) {
							item.render(gl);
						});
					}

				});
			}
		});

		_BGE.gameContainer.prototype = _BGE.gameObject.prototype;

		igk.appendProperties(igk.bge.gameObject.prototype, {
			getGame: function () {
				//return the game object attached to game container
				var g = null;
				var q = this;
				while ((igk.isUndef(typeof (q.game)) || !q.game) && ((q = q.parent) != null));

				if (q)
					g = q.game;
				return g;
			}
		});



	})();

	(function () {//manage game object

		var __base_spriteBatch = null;
		var __gContainer = _BGE.gameContainer;
		var __gobjects = igk.system.createNS(_NS + ".gameObjects", {
			create: function (name) {
				//create a game object by name
				var c = _NSGameObj;
				if ((name in c) && (typeof (c[name]) == 'function') && (name != 'create')) {
					var r = arguments.length > 1 ? igk.system.array.slice(arguments, 1) : 0;
					var t = new c[name]();
					if (r)
						t.init.apply(t, r);
					return t;
				}
				return null;
			},
			spriteBatch: function (host) {
				_BGE.gameContainer.apply(this);
				var base = __base_spriteBatch || (__base_spriteBatch = igk.system.getBindFunctions(this));
				var uG = _BGE.math.mat4.createIdentity();
				var pG = _BGE.math.mat4.createIdentity();
				var vG = _BGE.math.mat4.createIdentity();
				this.game = host;


				//  uGlobalView * uProjection * uModelView *
				// _NSGameObj.apply(this);
				igk.appendProperties(this, {
					"bind": function () {
						this.program.useIt();
					},
					setProgram: function (p) {
						//do nothing
					},
					render: function (gl) {
						if (!this.program) return;
						this.program.useIt(gl);
						this.eachChild(function (item, index) {
							item.render(gl);
						});
						this.program.freeIt(gl);
					},
					loadContent: function (gl) {
						//load sprite batch files
						if (_BGE.shaders.spritebatchVS && _BGE.shaders.spritebatchFS) {
							var p = _BGE.shader.loadAndCompile(gl,
								[_BGE.shaders.spritebatchVS],
								[_BGE.shaders.spritebatchFS]);
							if (!p) {
								throw "can't load spritebatch program";
							}
							//set program to root
							base.setProgram.apply(this, [p]);
						} else {
							//basic spriteBatch
							var p = _BGE.shader.loadAndCompile(gl,
								[this.game.shaders.spritebatchVS],
								[this.game.shaders.spritebatchFS]);
							if (!p) {
								throw "can't load spritebatch program";
							}
							//set program to root
							base.setProgram.apply(this, [p]);
						}
						// initialize child parent
						base.loadContent(gl);
						// console.debug("program id "+this.program.id.id);

						var q = this;


						//console.d
						function setupUniform() {
							//mg_currentProgram = this.program;
							// console.debug(uG);
							//console.debug(this.program);
							var p = this.program;
							if (!p)
								return;
							var w = this.game.canvas.width;
							var h = this.game.canvas.height;
							p.useIt(gl);

							//sample frustum
							//pG.makeIdentity().makeFrustum(-1, 1, -1, 1, 0.4, 10));//
							//vG.makeLookAt(0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0)
							gl.viewport(0, 0, w, h);
							//console.debug(w);
							pG = _BGE.math.mat4.createIdentity();
							//var up = pG.makeIdentity().makeOrtho(0,w, h,0, -0.1, 100);//.scale(1,-1, 1);							
							p.setUniform("uGlobalView", uG.makeIdentity());
							// p.setUniform("uProjection4", pG.makeIdentity().makeOrtho(0, w, h, 0, -0.1, 100));
							p.setUniform("uProjection4", pG.makeIdentity().makeOrtho(0, w, h, 0,2, 10));
							p.setUniform("uModelView", vG.makeIdentity());
							p.freeIt();
						};
						if (this.program) {
							this.game.on("sizeChanged", function () {
								setupUniform.apply(q);
							});
						}
						setupUniform.apply(q);
						
					}
				});
			},
			container: function () {
				_BGE.gameContainer.apply(this);
				var base = igk.system.getBindFunctions(this);
				igk.appendProperties(this, {
					render: function (gl) {
						base.render(gl);
					}
				});
			},
			// ----------------------------------------------------------------------------------------
			// triangle object
			// ----------------------------------------------------------------------------------------
			triangle: function () {
				_BGE.gameContainer.apply(this);
				var _vertices = [0, 0.8, 0.5, -0.5, -0.5, -0.5]; //init default vertice
				var _settings = null;
				var base = igk.system.getBindFunctions(this);
				var vertexBufferObject = null;
				var self = this;

				this.toString = function () {
					return "triangle[GameObject]";
				};
				this.setVertices = function (gl, vertices, types, sizes) {
					if (!vertices || !types || !sizes || (types.length != sizes.length))
						return !1;

					vertexBufferObject = vertexBufferObject || gl.createBuffer();
					_vertices = vertices;
					_settings = [types, sizes];
					return 1;
				};

				this.getProgram = function () {
					return this.program || mg_currentProgram;
				};

				function _initVertex(gl) {

					gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
					gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_vertices), gl.STATIC_DRAW);

					var pid = self.getProgram() || (function () {
						var g = this.getGame();
						var p = _BGE.shader.loadAndCompile(gl,
							[g.shaders.spritebatchVS],
							[g.shaders.spritebatchFS]);
						if (!p) {
							throw "can't load spritebatch program";
						}
						//set program to root
						base.setProgram.apply(this, [p]);
					}).apply(self);
					if (!pid) {
						throw ("No active program");
					}

					pid.initAttribLocation(gl, ['inPosition', 'inColor']);

					var positionAttribLocation = pid.attributes.inPosition; // gl.getAttribLocation(pid, 'inPosition');
					var colorAttribLocation = pid.attributess.inColor; //gl.getAttribLocation(pid, 'inColor');

					var offset = 0;
					for (var i = 0; i < types.length; i++) {


						switch (types[i]) {
							case gl.VERTEX_BUFFER:
								gl.vertexAttribPointer(
									positionAttribLocation,
									sizes[i],//number of elements 
									gl.FLOAT,
									gl.FALSE,
									2 * Float32Array.BYTES_PER_ELEMENT,
									offset);
								gl.enableVertexAttribArray(positionAttribLocation);

								break;
							case gl.COLOR_BUFFER:
								gl.vertexAttribPointer(
									positionAttribLocation,
									sizes[i],//number of elements 
									gl.FLOAT,
									gl.FALSE,
									2 * Float32Array.BYTES_PER_ELEMENT,
									offset);
								gl.enableColorAttribArray(colorAttribLocation);
								break;
						}

					}

				}
				function _bindAttrib(gl, pid, vertexBufferObject, vertices) {
					var positionAttribLocation = gl.getAttribLocation(pid, 'inPosition');

					gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
					gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
					//console.debug(positionAttribLocation);
					gl.vertexAttribPointer(
						positionAttribLocation,
						2,//number of elements 
						gl.FLOAT,
						gl.FALSE,
						2 * Float32Array.BYTES_PER_ELEMENT,
						0);
					gl.enableVertexAttribArray(positionAttribLocation);
				}
				//console.debug(base);
				//override 
				igk.appendProperties(this, {
					loadVertices: function (gl, vertices) {
						_vertices = vertices;
						if (mg_currentProgram)
							_bindAttrib(gl, mg_currentProgram.id, vertexBufferObject, vertices);
					},
					render: function (gl) {

						if (this.program) {
							this.program.useIt(gl);
							//console.debug(vertexBufferObject);
							// gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
							//console.debug("primal obj");
						}
						else {
							if (!mg_currentProgram)
								return;

							var m = mg_currentProgram.getUniform("uModelView");
							this.transform.save();
							mg_currentProgram.setUniformMat4("uModelView", this.transform.mult(m).elements.toFloatArray());
							_bindAttrib(gl, mg_currentProgram.id, vertexBufferObject, _vertices);
							gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);
							this.eachChild(function (item, index) {
								item.render(gl);
							});

							mg_currentProgram.setUniformMat4("uModelView", m);//restore matrix
							this.transform.restore();
						}
					},
					loadContent: function (gl) {
						base.loadContent(gl);
						vertexBufferObject = vertexBufferObject || gl.createBuffer();
						gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
						if (_settings) {
							_initVertex(gl);
						}
						else {
							gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_vertices), gl.STATIC_DRAW);
						}
						if (this.program) {
							//bind to program

							var positionAttribLocation = gl.getAttribLocation(this.program.id, 'inPosition');
							//console.debug(positionAttribLocation);
							gl.vertexAttribPointer(
								positionAttribLocation,
								2,//number of elements 
								gl.FLOAT,
								gl.FALSE,
								2 * Float32Array.BYTES_PER_ELEMENT,
								0);

							gl.enableVertexAttribArray(positionAttribLocation);
						}
					}
				});
			}

			, DagNode: function (host) {
				_BGE.gameObject.apply(this);
				var m_local = _BGE.math.mat4.createIdentity();
				var m_host = host;

				igk.appendProperties(this, {
					render: function () {
						m_local.bind();
					}
				});
			}

		});
		//heritance chain
		var cproto = __gContainer.prototype;
		var t = ["triangle", "container", "spriteBatch"];
		for (var i = 0; i < t.length; i++) {
			__gobjects[t[i]].prototype = cproto;
		}
	}



	)();






	igk.system.createNS("igk.bge.demos", {
		redtriangle: function () { //basics demos
			var _w = 0;
			var _h = 0;
			var m_program;
			_BGE.gameContext.apply(this);

			var _triangle = new _BGE.gameObjects.triangle();
			var _base = { "loadContent": this.loadContent };
			igk.appendProperties(this, {
				initGame: function () {
					//GameComponent.add(gameFactory.create("spritebatch")new SpriteBatch());

				},
				loadContent: function (gl) {
					// _triangle.loadShader(
					// ["precision mediump float; attribute vec2 inPosition; varying vec4 inFrag; void main(){ inFrag = vec4(1.0,0,0,1.0) ; gl_Position = vec4(inPosition, 0, 1);  } "],
					// ["precision mediump float; varying vec4 inFrag; void main(){ gl_FragColor = inFrag; }"]);
					_triangle.loadContent(gl);
				},
				render: function render(gl) {
					// super(gl);
					// igk.html5.drawing.gameContextListener.render.apply(this,[gl]);
					gl.clearColor(0.2, 0.2, 0.2, 1.0);
					gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
					_triangle.render(gl);
				}
			});
		}
	});

	//---------------------------------------------------------------
	//initialize module
	//---------------------------------------------------------------
	(function () {
		var f = function (script){
			// console.debug("loaded : "+script.getAttribute('src'));
			igk.publisher.publish("sys://module/loaded",{
				target: script
			});
			// console.debug("loaded : "+script.getHtml());
		};
		// basic modules
		
		// alert(  igk.getScriptLocation().location );
		
		
		igk.system.module.load("/igk.bge.input.gamepad.js",f);
		igk.system.module.load("/igk.bge.gameObjects.mesh.js",f);
		igk.system.module.load("/igk.bge.gameObjects.gltf.js",f);
		igk.system.module.load("/igk.bge.assetManager.js",f);
		igk.system.module.load("/igk.bge.drawing2D.graphics.js",f);
		igk.system.module.load("/gl-matrix.js",f);

		var modulelocation = igk.system.module.getModuleLocation();
	})();


	//---------------------------------------------------------------
	//controls
	//---------------------------------------------------------------

	(function () {

		var _game;
		var _utils;

		function renderClock(v_ctx) {
			_utils = _utils || _BGE.drawing2D.utility;
			var time = new Date(Date.now());


			// v_ctx.save();
			// v_ctx.setTransform(0.7130237,0.7011399,-0.7011399,0.7130237,116.0119,-63.4176);
			// v_ctx.fillStyle = "#5224FF";
			// v_ctx.fillRect(62,50, 293, 111);
			// v_ctx.strokeStyle = "#002AFF";
			// v_ctx.lineCap = "butt";
			// v_ctx.lineJoin = "miter";
			// v_ctx.strokeRect(62,50, 293, 111);
			// v_ctx.restore();

			v_ctx.save();
			v_ctx.beginPath();
			v_ctx.arc(512, 768 / 2, 200, 0, 2 * Math.PI, true);
			v_ctx.closePath();
			v_ctx.fillStyle = "transparent";
			v_ctx.fill("evenodd");
			v_ctx.strokeStyle = "#333";

			v_ctx.lineCap = "butt";
			v_ctx.lineJoin = "miter";

			_utils.setArcOffset(v_ctx, 200, 360, -90, 1);
			v_ctx.lineCap = 'round';
			v_ctx.lineWidth = 2;
			v_ctx.stroke();
			v_ctx.restore();

			v_ctx.save();
			v_ctx.beginPath();
			v_ctx.arc(512, 768 / 2, 200, 0, 2 * Math.PI, true);
			v_ctx.closePath();
			v_ctx.fillStyle = "transparent";
			v_ctx.fill("evenodd");
			v_ctx.strokeStyle = "rgba(255,230,0,1)";
			v_ctx.lineCap = "butt";
			v_ctx.lineJoin = "miter";

			var a = (time.getSeconds() / 60) * 360;
			_utils.setArcOffset(v_ctx, 200, a, -90, 1);
			v_ctx.lineCap = 'round';
			v_ctx.lineWidth = 4;
			v_ctx.stroke();
			v_ctx.restore();


			v_ctx.save();
			v_ctx.beginPath();
			v_ctx.arc(512, 768 / 2, 150, 0, 2 * Math.PI, true);
			v_ctx.closePath();
			v_ctx.fillStyle = "transparent";
			v_ctx.fill("evenodd");
			v_ctx.strokeStyle = "rgba(0,255,125,1)";
			v_ctx.lineCap = "butt";
			v_ctx.lineJoin = "miter";

			a = (time.getMinutes() / 60) * 360;
			_utils.setArcOffset(v_ctx, 150, a, -90, 1);
			v_ctx.lineCap = 'round';
			v_ctx.lineWidth = 8;
			v_ctx.stroke();
			v_ctx.restore();


			v_ctx.save();
			v_ctx.beginPath();
			v_ctx.arc(512, 768 / 2, 100, 0, 2 * Math.PI, true);
			v_ctx.closePath();
			v_ctx.fillStyle = "transparent";
			v_ctx.fill("evenodd");
			v_ctx.strokeStyle = "rgba(255,0,125,1)";
			v_ctx.lineCap = "butt";
			v_ctx.lineJoin = "miter";

			a = ((time.getHours() % 12) + (time.getMinutes() / 60)) * (360 / 12.0);
			//console.debug("data : "+(time.getHours() % 12) );
			_utils.setArcOffset(v_ctx, 100, a, -90, 1);
			v_ctx.lineCap = 'round';
			v_ctx.lineWidth = 12;
			v_ctx.stroke();
			v_ctx.restore();

			v_ctx.font = "20px Georgia";

			var txt = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
			var g = v_ctx.measureText(txt);

			v_ctx.fillText(txt, 512 - (g.width / 2), 768 / 2);

		}
		function renderDemo(v_ctx) {

			/* Layer : Layer_17094261*/
			v_ctx.save();
			v_ctx.globalAlpha = 0.2;
			v_ctx.save();
			v_ctx.beginPath();
			v_ctx.arc(182, 95, 73.66138, 0, 2 * Math.PI, true);
			v_ctx.closePath();
			v_ctx.fillStyle = "#FFF";
			v_ctx.fill("evenodd");
			v_ctx.strokeStyle = "#000";
			v_ctx.lineCap = "square";
			v_ctx.lineJoin = "miter";
			v_ctx.stroke();
			v_ctx.restore();
			v_ctx.save();
			v_ctx.setTransform(1, 0,
				0, 1,
				15, -14);
			v_ctx.beginPath();
			v_ctx.arc(224, 154, 19.64688, 0, 2 * Math.PI, true);
			v_ctx.closePath();
			v_ctx.fillStyle = "#1AFF30";
			v_ctx.fill("evenodd");
			v_ctx.lineCap = "square";
			v_ctx.lineJoin = "miter";
			v_ctx.stroke();
			v_ctx.restore();
			v_ctx.save();
			v_ctx.setTransform(1, 0,
				0, 1,
				50, 123);
			v_ctx.beginPath();
			v_ctx.arc(128, 44, 13.60147, 0, 2 * Math.PI, true);
			v_ctx.closePath();
			v_ctx.fillStyle = "#FF7800";
			v_ctx.fill("evenodd");
			v_ctx.lineCap = "square";
			v_ctx.lineJoin = "miter";
			v_ctx.stroke();
			v_ctx.restore();
			v_ctx.restore();
			/* Layer : Layer_56095918*/
			v_ctx.save();
			v_ctx.save();
			v_ctx.beginPath();
			v_ctx.arc(182, 95, 73.66138, 0, 2 * Math.PI, true);
			v_ctx.closePath();
			v_ctx.fillStyle = "#0071FF";
			v_ctx.fill("evenodd");
			v_ctx.strokeStyle = "Transparent";
			v_ctx.globalAlpha = 0;
			v_ctx.lineCap = "square";
			v_ctx.lineJoin = "miter";
			v_ctx.stroke();
			v_ctx.restore();
			v_ctx.restore();


		}

		function BgeGame(_host) {
			igk.appendProperties(this, {
				Run: function () {

					var v_ctx = _context;
					_utils = _utils || _BGE.drawing2D.utility;
					v_ctx.clearRect(0, 0, 1024, 768);
					renderClock(v_ctx);
					//renderDemo(v_ctx);



					return true;
				},
				Update: function () {

				},
				Render: function () {

				}
			});



			var _canva = igk.createNode("canvas");
			var _basedir = _host.getAttribute("gamedir");
			//screen display
			_canva.o.width = 1024;
			_canva.o.height = 768;

			var _context = _canva.o.getContext('2d');
			var _animFrame = igk.animation.getAnimationFrame();

			//initialize game environment
			igk.js.require([_basedir + "/main.js"]).promise(function () {
				_host.setHtml("");
				_host.add(_canva);
				//run loop
				var fc = function () {
					if (_game.Run()) {
						_animFrame(fc);
					}
				};
				_animFrame(fc);
			});
		}

		igk.winui.initClassControl("igk-winui-balafon-gameapp", function () {
			_game = new BgeGame(this);
		});


	})();

	var _options = null;

	igk.system.createNS("igk.bge", {
		setOption: function(o){
			_options = o;	
			console.debug("option", o)		
		},
		getOption: function(){
			return _options;
		},
		shaderContainer: function(){
			var program = 0;
			igk.defineProperty(this, "program", {get:function(){ return program; }});
			igk.appendProperties(this,  
				{
					loadProgram: function(gl, vslist, fslist){
						var k = _BGE.shader.loadAndCompile(gl,vslist, fslist);						
						program = k;
						return k!=null;
					},
					useIt:function(gl){
						program.useIt(gl);
					}
			});
		}
	});

})();


(function () {
	// manage game application
	var v_gameApp = 0;
	function __scriptGameContext(fc) {
		_BGE.gameContext.apply(this);
		var base = igk.system.getBindFunctions(this);
		var _src = fc;
		//function _init_invokingList(q,t){ 
		var scr =
			"var t = ['render', 'updateWorld','unloadContent','loadContent','initGameLogic'];" +
			"var fc=0;" +
			"for(var i=0; i <t.length; i++){" +
			"try{" +
			"if(typeof( fc = eval(t[i])) == 'function') " +
			"this[t[i]] =fc;" +
			"}catch(e){}" +
			"}" +
			"this.setVar = function setVar(x, v){ var c={d:v}; eval(x+' = c.d;');};" +
			"this.getVar= function getVar(x){return eval(x)};"
			;
		igk.appendProperties(this, {
			getDeclaredVar: function () {
				var t = [];
				var bracket = 0;
				var s = "";
				var com_s = 0;
				for (var i = 0; i < _src.length; i++) {
					if (com_s == 2) {
						if (_src[i] != "\n")
							continue;
						com_s = 0; //finish comment
					}
					// console.debug(_src[i].charCodeAt(0));
					switch (_src[i]) {
						case "\r":
						case "\t":
							continue;

						case "{":
							bracket++;
							continue;
						case "}":
							bracket--;
							continue;
						case "/":
							if (com_s == 1) {
								//is comment
								com_s = 2;
							} else {
								com_s = 1;
							}
							continue;
						default:

							break;

					}
					if (bracket > 0)
						continue;
					s += _src[i];
					com_s = 0;
				}
				s = s.replace(/\n+/g, "\n");
				var pos = 0;
				var h = "";
				var end = 0;

				function _load(h) {
					if (h.trim().length > 0)
						t.push(h.trim());
				}

				while ((pos = s.indexOf("var ", pos)) >= 0) {
					pos += 4;
					h = "";
					end = 0;
					while ((pos <= s.length) && (s[pos] != ";")) {
						if (s[pos] == ",") {
							_load(h);
							h = "";
							pos++;
							continue;
						}
						if (s[pos] == "=") {
							//ignore value
							pos++;
							var m = 0;
							//read value expression
							while ((pos < s.length) && (m != 1)) {
								switch (s[pos]) {
									case ",":
									case ";":
										m = 1;
										break;
									case "'":
									case "\"":
										if (m == s[pos]) {
											m = 0; //finish read invalue
										}
										m = pos[s];
										break;

								}
								pos++;
							}
							if (m == 1) {
								_load(h);
								pos--;
								h = "";
								continue;
							}
						}
						h += s[pos];
						pos++;
					}
					_load(h);

				}
				// console.debug("source is d : "+s);
				//console.debug(/var \s*((\w+)(\s=\s([^,]))(,\s*(\w+)\s*=\*([^,])*);/g.exec(s));


				return t;
			}


		});

		eval(fc + " " + scr);


		this.setVar("_y", igk.createNode("div")
		);

		v_gameApp = this;

		igk.appendProperties(this, {

			getDelcaredVar: function () {
				var t = [];
				var bracket = 0;
				var s = "";
				for (var i = 0; i < _src.length; i++) {
					if (_src[i] == "{") {
						bracket++;
						continue;
					}
					if (_src[i] == "}") {
						bracket--;
						continue;
					}
					if (braket > 0)
						continue;
					s += _src[i];
				}
				console.debug("source is : " + s);
				return t;
			}
		});

	}
	function __bindSrc(q, g) {
		//console.debug("init "+q.o.tagName.toLowerCase());
		//igk.eval.apply(q,[g,q]);
		// var c = eval("(function(){"+g+"; return this; })" );


		// console.debug(c);//.test();
		var dv = q.getParent().add('div');
		dv.addClass("igk-bge-surface script");
		//passing a function is required because CreateContext will create the properties listener
		igk.html5.drawing.CreateContext(dv.add("canvas"), function () {
			return __scriptGameContext.apply(this, [g]);
		});
	}
	function __initGameApp() {
		if (v_gameApp)
			throw ("no multi game allowed ");
		if (this.o.tagName.toLowerCase() != "script")
			throw ("canvas is required for balafon/igk-winui-bge-script ? " + this.o.tagName.toLowerCase());

		var g = this.getAttribute("src");
		if (!g) {
			g = this.getText();
			__bindSrc(this, g);
		}
		else {
			throw ("not implement");
		}

	}


	igk.winui.initClassControl("igk-winui-bge-script", __initGameApp);
})();

