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
    
    gl_Position = vec4(clipspace*vec2(1, -1), 0, 1);
}
`
// Fragment shader GLSL code
let fragment_shader_2d = `
precision mediump float;

// Make the fragment shader take a color uniform input
uniform vec4 u_color;

void main() {
    gl_FragColor = u_color;
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

// Return a random int from 0 to range - 1
function randomInt(range) {
    return Math.floor(Math.random()*range)
}

// Fill the buffer with the values that define a rectangle
function setRectangle(gl, x, y, width, height) {
    let x1 = x
    let x2 = x + width
    let y1 = y
    let y2 = y + height

    // Note: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect whatever buffer is
    // bound to the `ARRAY_BUFFER` bind point. So far we only have one buffer,
    // but if we had more than one, we'd want ot bind it to `ARRAY_BUFFER`
    // first.

    let positions = [
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
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

    // Look up the location of the uniforms
    let u_loc = gl.getUniformLocation(p, "u_resolution")
    let u_color_loc = gl.getUniformLocation(p, "u_color")

    // Create a buffer, and bind it (think ARRAY_BUFFER = buf)
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    
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
    
    // Draw 50 random rectangles in random colors
    for(let ii=0; ii<50; ++ii) {
	// Setup a random rectangle. This will write to buf because it's the
	// last thing we bound on the ARRAY_BUFFER bind point.
	setRectangle(gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300))

	// Set a random color
	gl.uniform4f(u_color_loc, Math.random(), Math.random(), Math.random(), 1)
	
	let count = 6
	gl.drawArrays(gl.TRIANGLES, offset, count)
    }
}

main()
