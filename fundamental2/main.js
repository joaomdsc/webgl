// Vertex shader GLSL code
let vertex_shader_2d = `
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
`
// Fragment shader GLSL code
let fragment_shader_2d = `
// Fragment shaders don't have a defaut precision, so we need to pick
// one. medium is a good default.
precision mediump float;
    
void main() {
    // gl_FragColor is a special variable a fragment shader is responsible for
    // setting
    gl_FragColor = vec4(1, 0, 0.5, 1); // return reddsih-purple
}
`
// Create a shader, upload the GLSL source, and compile the source
function createShader(gl, type, src) {
    let sh = gl.createShader(type)
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    let success = gl.getShaderParameter(sh, gl.COMPILE_STATUS)
    if(success) {
        return sh
    }
    console.log(gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
}

// Link two shaders into a program
function createProgram(gl, vsh_src, fsh_src) {
    let vsh = createShader(gl, gl.VERTEX_SHADER, vsh_src)
    let fsh = createShader(gl, gl.FRAGMENT_SHADER, fsh_src)
    let p = gl.createProgram()
    gl.attachShader(p, vsh)
    gl.attachShader(p, fsh)
    gl.linkProgram(p)
    let success = gl.getProgramParameter(p, gl.LINK_STATUS)
    if(success) {
        return p
    }
    console.log(gl.getProgramInfoLog(p))
    gl.deleteProgram(p)
}

function main() {
    //--------------------------------------------------------------------------
    // Initialization code
    //--------------------------------------------------------------------------
    
    let canvas = document.querySelector('#c')
    let gl = canvas.getContext("webgl")
    if(!gl) {
        console.log("No WebGL for you")
        return
    }

    // Call our function to create shaders and link them into a program
    let p = createProgram(gl, vertex_shader_2d, fragment_shader_2d)

    // Look up the location of the attribute
    let a_loc = gl.getAttribLocation(p, "a_pos")

    // Look up the location of the uniform
    let u_loc = gl.getUniformLocation(p, "u_resolution")

    // Create a buffer, and bind it (think ARRAY_BUFFER = buf)
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    
    // Put data (six 2d points) into the buffer
    let positions = [
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30,
    ]
    // Transform the JavaScript array into strongly typed data
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    //--------------------------------------------------------------------------
    // Rendering code
    //--------------------------------------------------------------------------

    // See https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    webglUtils.resizeCanvasToDisplaySize(gl.canvas)

    // Tell WebGL how to convert clip space values to pixels (in screen space)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    // Clear the canvas (we're making it transparent, actually)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Tell it to use our program (pair of shaders)
    gl.useProgram(p)

    // Tell WebGL how to take data from the buffer we setup above, and supply
    // it to the attribute in the shader.

    // First we need to turn the attribute on:
    gl.enableVertexAttribArray(a_loc)

    // Specify how to pull the data out:

    // // FIXME binding here is redundant, but what if rendering was separated
    // from initializing ?
    // // Bind the position buffer (again)
    // gl.bindBuffer(gl.ARRAY_BUFFER, buf)

    // Tell the attribute how to get data out of buf (ARRAY_BUFFER)
    let size = 2          // 2 components per iteration
    let type = gl.FLOAT   // the data is 32-bit floats
    let normalize = false // don't normalize the data
    let stride = 0        // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0        // start at the beginning of the buffer

    // A hidden part of gl.vertexAttribPointer is that it binds the current
    // ARRAY_BUFFER to the attribute.
    gl.vertexAttribPointer(a_loc, size, type, normalize, stride, offset)

    // Set the resolution. A uniform is kind of a global variable, and the
    // uniform2f function sets a value for it, as a couple of lfoats.
    gl.uniform2f(u_loc, gl.canvas.width, gl.canvas.height)
    
    // We can finally ask WebGL to execute our GLSL program and draw
    let count = 6
    gl.drawArrays(gl.TRIANGLES, offset, count)
}

main()
