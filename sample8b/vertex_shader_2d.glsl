// An attribute will receive data from a buffer
attribute vec2 a_pos;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

// All shaders have a main function
void main() {
    // Multiply the position by the matrix
    vec2 pos = (u_matrix*vec3(a_pos, 1)).xy;
    
    // Convert the position from pixels to 0.0 to 1.0
    vec2 zero2one = pos / u_resolution;

    // Convert from 0->1 to 0->2
    vec2 zero2two = zero2one*2.0;

    // Convert from 0->2 to -1->+1 (clip space)
    vec2 clipspace = zero2two - 1.0;
    
    gl_Position = vec4(clipspace*vec2(1, -1), 0, 1);
}
