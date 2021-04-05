// Create a shader, upload the GLSL source, and compile the source
function createShader(gl, type, id) {
    let sh = gl.createShader(type)
    let src = document.querySelector(id).text
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
function createProgram(gl, vsh, fsh) {
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
    let vsh = createShader(gl, gl.VERTEX_SHADER, "#vertex-shader-2d")
    let fsh = createShader(gl, gl.FRAGMENT_SHADER, "#fragment-shader-2d")
    let p = createProgram(gl, vsh, fsh)

    // Look up the location of the attribute
    let loc = gl.getAttribLocation(p, "a_pos")

    // Create a buffer, and bind it (think ARRAY_BUFFER = buf)
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    
    // Put data (three 2d points) into the buffer
    let positions = [
        0, 0,
        0, 0.5,
        0.7, 0,
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
    gl.enableVertexAttribArray(loc)

    // Specify how to pull the data out:

    // Bind the position buffer (again)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)

    // Tell the attribute how to get data out of buf (ARRAY_BUFFER)
    let size = 2          // 2 components per iteration
    let type = gl.FLOAT   // the data is 32-bit floats
    let normalize = false // don't normalize the data
    let stride = 0        // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0        // start at the beginning of the buffer

    // A hiddent part of gl.vertexAttribPointer is that it binds the current
    // ARRAY_BUFFER to the attribute.
    gl.vertexAttribPointer(loc, size, type, normalize, stride, offset)

    // We can finally ask WebGL to execute our GLSL program and draw
    let ptype = gl.TRIANGLES
    offset = 0
    let count = 3
    gl.drawArrays(ptype, offset, count)
}

main()
