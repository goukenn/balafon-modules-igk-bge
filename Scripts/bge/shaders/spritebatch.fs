precision mediump float;

varying vec3 fColor; //fragment color passed from vertex shader

void main(){
	gl_FragColor = vec4(fColor, 1.0);
}
