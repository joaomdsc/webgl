// Vertex shader GLSL code
let vertex_shader_2d = `
// An attribute will receive data from a buffer
attribute vec2 a_pos;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;

// All shaders have a main function
void main() {
    // Rotate the position
    vec2 rotatedPos = vec2(
			   a_pos.x*u_rotation.y + a_pos.y*u_rotation.x,
			   a_pos.y*u_rotation.y - a_pos.x*u_rotation.x);
    
    // Add in the translation
    vec2 pos = rotatedPos + u_translation;
    
    // Convert the position from pixels to 0.0 to 1.0
    vec2 zero2one = pos / u_resolution;

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
function setGeometry(gl) {
    let x = 0
    let y = 0
    let width = 100
    let height = 150
    let t = 30  // thickness

    let positions = [
	// left column
        x, y,
	x + t, y,
	x, y + height,
	x, y + height,
	x + t, y,
	x + t, y + height,

	// top rung
	x + t, y,
	x + width, y,
	x + t, y + t,
	x + t, y + t,
	x + width, y,
	x + width, y + t,

	// middle rung
	x + t, y + 2*t,
	x + 2/3*width, y + 2*t,
	x + t, y + 3*t,
	x + t, y + 3*t,
	x + 2/3*width, y + 2*t,
	x + 2/3*width, y + 3*t,
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

    // Look up the location of the attribute (where the vertex data needs to go)
    let a_loc = gl.getAttribLocation(p, "a_pos")

    // Look up the location of the uniforms
    let u_loc = gl.getUniformLocation(p, "u_resolution")
    let u_color_loc = gl.getUniformLocation(p, "u_color")
    let u_trans_loc = gl.getUniformLocation(p, "u_translation")
    let u_rot_loc = gl.getUniformLocation(p, "u_rotation")

    // Create a buffer, and bind it (think ARRAY_BUFFER = buf)
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)

    // Put geometry into the buffer. This is only called once!! It's no longer
    // inside drawScene()
    setGeometry(gl)

    // New in sample 4
    let translation = [0, 0]
    let rotation = [0, 1]
    let color = [Math.random(), Math.random(), Math.random(), 1]
    
    drawScene()

    // Setup a UI
    webglLessonsUI.setupSlider("#x", {slide: updatePosition(0), max: gl.canvas.width})
    webglLessonsUI.setupSlider("#y", {slide: updatePosition(1), max: gl.canvas.height})
    webglLessonsUI.setupSlider("#angle", {slide: updateAngle, max: 360})

    function updatePosition(index) {
	return function(event, ui){
	    translation[index] = ui.value
	    drawScene()
	}
    }

    function updateAngle(event, ui) {
	let angleDeg = 90 + ui.value
	let angleRad = angleDeg*Math.PI/180
	rotation[0] = Math.cos(angleRad)
	rotation[1] = Math.sin(angleRad)
	drawScene()
    }

    function drawScene() {
	// See https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
	webglUtils.resizeCanvasToDisplaySize(gl.canvas)

	// Tell WebGL how to convert clip space values to pixels (in screen space)
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

	// Clear the canvas (we're making it transparent, actually)
	gl.clearColor(0, 0, 0, 0)
	gl.clear(gl.COLOR_BUFFER_BIT)

	// Tell it to use our program (pair of shaders)
	gl.useProgram(p)

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
	
	// Set the color
	gl.uniform4fv(u_color_loc, color)

	// Set the translation (that gets changed by the sliders)
	gl.uniform2fv(u_trans_loc, translation)

	// Set the rotation
	gl.uniform2fv(u_rot_loc, rotation)

	// Draw the rectangle
	let count = 18
	gl.drawArrays(gl.TRIANGLES, offset, count)
    }
}

main()
