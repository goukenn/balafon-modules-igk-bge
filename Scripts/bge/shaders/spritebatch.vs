precision mediump float;


uniform mat4 uGlobalView; //global view
uniform mat4 uProjection; //projection view matrix
uniform mat4 uModelView;  //model view matrix

attribute vec3 inPosition; //in vertex position
attribute vec3 inColor;//in color attribute


varying vec3 fColor; //color pass to fragment shader



void main(){
	fColor = inColor;
	gl_Position =  uGlobalView * uProjection * uModelView * vec4(inPosition,1.0);
}