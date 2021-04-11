precision mediump float;

// Make the fragment shader take a color uniform input
uniform vec4 u_color;

void main() {
    gl_FragColor = u_color;
}
