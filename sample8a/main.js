// Vertex shader GLSL code
let vertex_shader_2d = `
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
    let u_matrix_loc = gl.getUniformLocation(p, "u_matrix")

    // Create a buffer, and bind it (think ARRAY_BUFFER = buf)
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)

    // Put geometry into the buffer. This is only called once!! It's no longer
    // inside drawScene()
    setGeometry(gl)

    // New in sample 4
    let translation = [100, 150]
    let angleRad = 0
    let scale = [1, 1]
    let color = [Math.random(), Math.random(), Math.random(), 1]
    
    drawScene()

    // Setup a UI
    webglLessonsUI.setupSlider("#x", {value: translation[0], slide: updatePosition(0), max: gl.canvas.width})
    webglLessonsUI.setupSlider("#y", {value: translation[1], slide: updatePosition(1), max: gl.canvas.height})
    webglLessonsUI.setupSlider("#angle", {slide: updateAngle, max: 360})
    webglLessonsUI.setupSlider("#scaleX", {value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2})
    webglLessonsUI.setupSlider("#scaleY", {value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2})

    function updatePosition(index) {
	return function(event, ui){
	    translation[index] = ui.value
	    drawScene()
	}
    }

    function updateAngle(event, ui) {
	let angleDeg = 360 - ui.value
	angleRad = angleDeg*Math.PI/180
	drawScene()
    }

    function updateScale(index) {
	return function(event, ui){
	    scale[index] = ui.value
	    drawScene()
	}
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

	// Compute the matrices
	let transMat = m3.translation(translation[0], translation[1])
	let rotMat = m3.rotation(angleRad)
	let scaleMat = m3.scale(scale[0], scale[1])

	// Multiply the matrices
	let matrix = m3.multiply(transMat, rotMat)
	matrix = m3.multiply(matrix, scaleMat)
	
	// Set the matrix
	gl.uniformMatrix3fv(u_matrix_loc, false, matrix)

	// Draw the rectangle
	let count = 18
	gl.drawArrays(gl.TRIANGLES, offset, count)
    }
}

let m3 = {
    translation: function(tx, ty) {
	return [
	    1, 0, 0,
	    0, 1, 0,
	    tx, ty, 1
	]
    },
    rotation: function(angleRad) {
	let c = Math.cos(angleRad)
	let s = Math.sin(angleRad)
	return [
	    c, -s, 0,
	    s, c, 0,
	    0, 0, 1
	]
    },
    scale: function(sx, sy) {
	return [
	    sx, 0, 0,
	    0, sy, 0,
	    0, 0, 1
	]
    },
    multiply: function(a, b) {
	var a00 = a[0 * 3 + 0];
	var a01 = a[0 * 3 + 1];
	var a02 = a[0 * 3 + 2];
	var a10 = a[1 * 3 + 0];
	var a11 = a[1 * 3 + 1];
	var a12 = a[1 * 3 + 2];
	var a20 = a[2 * 3 + 0];
	var a21 = a[2 * 3 + 1];
	var a22 = a[2 * 3 + 2];
	var b00 = b[0 * 3 + 0];
	var b01 = b[0 * 3 + 1];
	var b02 = b[0 * 3 + 2];
	var b10 = b[1 * 3 + 0];
	var b11 = b[1 * 3 + 1];
	var b12 = b[1 * 3 + 2];
	var b20 = b[2 * 3 + 0];
	var b21 = b[2 * 3 + 1];
	var b22 = b[2 * 3 + 2];
	
	return [
	    // This looks like it's multiplying b x a (first column of a comes
	    // over the first row of b), transposed again ? 
	    b00 * a00 + b01 * a10 + b02 * a20,
	    b00 * a01 + b01 * a11 + b02 * a21,
	    b00 * a02 + b01 * a12 + b02 * a22,
	    b10 * a00 + b11 * a10 + b12 * a20,
	    b10 * a01 + b11 * a11 + b12 * a21,
	    b10 * a02 + b11 * a12 + b12 * a22,
	    b20 * a00 + b21 * a10 + b22 * a20,
	    b20 * a01 + b21 * a11 + b22 * a21,
	    b20 * a02 + b21 * a12 + b22 * a22,
	];
    }
}

main()
