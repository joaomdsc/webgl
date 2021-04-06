// An attribute will receive data from a buffer
attribute vec2 a_pos;

uniform vec2 u_resolution;

// All shaders have a main function
void main() {
    // Convert the position from pixels to 0.0 to 1.0
    vec2 zero2one = a_pos / u_resolution;

    // Convert from 0->1 to 0->2
    vec2 zero2two = zero2one*2.0;

    // Convert from 0->2 to -1->+1 (clip space)
    vec2 clipspace = zero2two - 1.0;
    
    gl_Position = vec4(clipspace, 0, 1);
}
