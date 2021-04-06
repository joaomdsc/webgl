// Fragment shaders don't have a defaut precision, so we need to pick
// one. medium is a good default.
precision mediump float;
    
void main() {
    // gl_FragColor is a special variable a fragment shader is responsible for
    // setting
    gl_FragColor = vec4(1, 0, 0.5, 1); // return reddsih-purple
}
