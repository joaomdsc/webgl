// An attribute will receive data from a buffer
attribute vec2 a_pos;

// This matrix will now include *all* the transformations
uniform mat3 u_matrix;

// All shaders have a main function
void main() {
    // Multiply the position by the matrix
    gl_Position = vec4((u_matrix*vec3(a_pos, 1)).xy, 0, 1);
}
