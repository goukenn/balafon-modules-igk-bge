//bge graphics 2D

(function(){
	
	igk.system.createNS("igk.bge.drawing2D",{
		graphics: function(gl, render){
			if (typeof(gl) =="undefined")
				throw new "gl not define";
			igk.bge.gameObject.apply(this);
			var base = igk.system.getBindFunctions(this);
			var m_canvas = igk.createNode("canvas");
			var m_ctx = m_canvas.o.getContext("2d");
			
			var m_texture =null;	
			var m_vertices = [ //position, color, textCoord
			-1,-1, 1 , 1 , 1, 0.0,0.0,
			-1, 1, 1 , 1 , 1, 0.0,1.0, 
			 1, 1, 1 , 1 , 1, 1.0,1.0,
			 1,-1, 1 , 1 , 1, 1.0,0.0
			];
			var m_indices = [
				0,1, 2,
				0,2, 3
			];
			var m_indiceBuffer =null;
			igk.appendProperties(this, {
				begin:function(){
					m_ctx.clearRect(0,0,m_canvas.o.width, m_canvas.o.height);
					// m_ctx.fillStyle=igk.system.colors.indianred;
					// m_ctx.fillRect(0,0,m_canvas.o.width,m_canvas.o.height);
				},
				setFillColor:function(s){
					m_ctx.fillStyle=s;
				},
				drawRect:function(x,y,w,h){
					m_ctx.fillRect(x,y,w,h);
					m_ctx.stroke();
				},
				drawText:function(txt, font, x, y, maxW){
					m_ctx.font = font;
					m_ctx.fillText(
					txt,
					x,
					y,
					maxW
					);
				},
				end:function(){
					m_texture = new igk.bge.texture.texture2d(gl, m_canvas.o);
					
					m_indiceBuffer = m_indiceBuffer || gl.createBuffer();
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m_indiceBuffer);					
					gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(m_indices), gl.STATIC_DRAW);
				},
				updateSize:function(gl, w, h){					
					m_canvas.o.width = w;
					m_canvas.o.height=h;
					if (m_texture)
					m_texture.bind(gl);
				},
				render:function(gl){
					var p = igk.bge.currentProgram;
					if (!p)
						return;					
					
					p.useIt(gl);
					// gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
					// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
					gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
					gl.enable(gl.BLEND);
					gl.disable(gl.DEPTH_TEST);
					var data = m_vertices.toFloatArray();

					// console.debug("attrib location "+p);//.getAttribLocation("inPosition"));
					p.setAttribute("inPosition", data, 2,7);								
					p.setAttribute("inColor",    data, 3, 7,2);
					p.setAttribute("intextCoord", data, 2, 7,5);
					//m_texture.bind(gl);
					gl.uniform1i(p.uniforms.sample,m_texture.id);	
					m_texture.useIt(gl);
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m_indiceBuffer);					
					
					gl.drawElements(gl.TRIANGLES,
					6,//count of indices 
					gl.UNSIGNED_SHORT, //type of transfered data
					0);
					gl.disable(gl.BLEND);
					gl.enable(gl.DEPTH_TEST);
				}
			});
		}
	});
	
})();