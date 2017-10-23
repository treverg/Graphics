// assignment3.js -- A starting point for your work on Assignment 3

var canvas;
var gl;
var program;

var near = 0.3;
var far = 10.0;
var radius = 4.0;		// Used to establish eye point
var theta = 0.0;		// Used to establish eye point
var phi = 0.0;		    // Used to establish eye point
var rotation_by_5_deg = 5.0 * Math.PI / 180.0;

var fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;			// Established by radius, theta, phi as we move
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var numVerticesMoebiusBand = 2500;	// For the Moebius Band

var pointsArray1 = [];

var nRows = 25;
var nColumns = 25;
// data for the parametric surface
var datax = [];
var datay = [];
var dataz = [];

// data for the BuckyBall
var buckyBallX = 1.75;
var buckyBallY = 0.0;
var buckyBallZ = 0.0;
var buckyBallScale = .03;
var buckyBallYGoingToPi = true;

window.onload = function init() {
    // Moebius Band

    for (var i = 0; i <= nRows; ++i) {
        datax.push([]);
        datay.push([]);
        dataz.push([]);
        var u = 2.0 * Math.PI * (i / nRows);

        for (var j = 0; j <= nColumns; ++j) {
            var v = -0.3 + ((j / nColumns) * 0.6);
            datax[i].push(Math.cos(u) + v * Math.sin(u / 2.0) * Math.cos(u));
            datay[i].push(Math.sin(u) + v * Math.sin(u / 2.0) * Math.sin(u));
            dataz[i].push(v * Math.cos(u / 2.0));
        }
    }

    for (var i = 0; i < nRows; i++) {
        for (var j = 0; j < nColumns; j++) {
            pointsArray1.push(vec4(datax[i][j], datay[i][j], dataz[i][j], 1.0));
            pointsArray1.push(vec4(datax[i + 1][j], datay[i + 1][j], dataz[i + 1][j], 1.0));
            pointsArray1.push(vec4(datax[i + 1][j + 1], datay[i + 1][j + 1], dataz[i + 1][j + 1], 1.0));
            pointsArray1.push(vec4(datax[i][j + 1], datay[i][j + 1], dataz[i][j + 1], 1.0));
        }
    }
    //console.log(pointsArray1.length);
    ///////// End of vertex information for Moebius Band  ////////

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL( canvas );
    //gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl")); // For debugging
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = canvas.width / canvas.height;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);


    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray1), gl.STATIC_DRAW );
    // ***concat an array with all unique vertices from buckyBall onto pointsArray1***
    var array = [];
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray1.concat(array)), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // buttons for viewing parameters

    document.getElementById("Button1").onclick = function () { near *= 1.02; far *= 1.02; };
    document.getElementById("Button2").onclick = function () { near *= 0.98; far *= 0.98; };
    document.getElementById("Button3").onclick = function () { radius *= 1.1; };
    document.getElementById("Button4").onclick = function () { radius *= 0.9; };
    document.getElementById("Button5").onclick = function () { theta += rotation_by_5_deg; };
    document.getElementById("Button6").onclick = function () { theta -= rotation_by_5_deg; };
    document.getElementById("Button7").onclick = function () { phi += rotation_by_5_deg; };
    document.getElementById("Button8").onclick = function () { phi -= rotation_by_5_deg; };

    render();
};


var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

    // Moebius Band
    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = mult(modelViewMatrix, translate(-1.5, 0, 0));
    modelViewMatrix = mult(modelViewMatrix, scalem(0.5, 0.5, 0.5));
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Moebius Band colors
    //gl.uniform4fv(gl.getUniformLocation(program, "fColor"),
    //    flatten(vec4(0.0, 1.0, 0.0, 1.0)));
    //gl.drawArrays(gl.LINE_LOOP, 0, 36);

    for (var i = 0; i < pointsArray1.length; i += 4) {
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(0.0, 1.0, 0.0, 1.0)));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 0.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i, 4);
    }

    // The BuckyBall
    modelViewMatrix = lookAt(eye, at, up);
    var bounceAdjustment = .035;
    if (buckyBallYGoingToPi) {
        buckyBallY = buckyBallY + bounceAdjustment;
        if (buckyBallY > Math.PI / 2) {
            buckyBallYGoingToPi = false;
        }
    }
    else {
        buckyBallY = buckyBallY - bounceAdjustment;
        if (buckyBallY < 0) {
            buckyBallYGoingToPi = true;
        }
    }

    if (buckyBallX < -.3) {
        if (buckyBallX < -1.4) {
            buckyBallScale = buckyBallScale * .93;
        }
        else {
            buckyBallScale = buckyBallScale * .98;
        }
    }

    if (buckyBallX > -1.7) {
        buckyBallX = buckyBallX - .01;
    }
    else {
        buckyBallX = 1.75;
        buckyBallY = 0;
        buckyBallZ = 0;
        buckyBallScale = .03;
    }

    modelViewMatrix = mult(modelViewMatrix, translate(buckyBallX, Math.cos(buckyBallY) - (buckyBallY / 2), buckyBallZ));

    modelViewMatrix = mult(modelViewMatrix, scalem(buckyBallScale, buckyBallScale, buckyBallScale));
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // BuckyBall colors
    var hexEndIndex = 240;

    // ***once outlines array is set up, use gl.TRIANGLE_FAN instead of gl.TRIANGLES to create buckyBall***
    // shades the hexagons red and the pentagons blue
    gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 0.0, 0.0, 1.0)));
    gl.drawArrays(gl.TRIANGLES, numVerticesMoebiusBand, hexEndIndex);
    gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(0.0, 0.0, 1.0, 1.0)));
    gl.drawArrays(gl.TRIANGLES, numVerticesMoebiusBand + hexEndIndex, buckyBall.length - hexEndIndex);

    // outlines all of the hexagons in white (not working yet)
    for (var i = numVerticesMoebiusBand; i < numVerticesMoebiusBand + hexEndIndex; i += 12) {
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i, 1);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i + 1, 1);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i + 2, 1);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i + 5, 1);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i + 8, 1);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i + 10, 1);
    }

    // outlines all of the pentagons in white (not working yet)
    for (var i = numVerticesMoebiusBand + hexEndIndex; i < numVerticesMoebiusBand + hexEndIndex + buckyBall.length; i += 9) {
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i, 1);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i + 1, 1);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i + 2, 1);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i + 5, 1);
        gl.uniform4fv(gl.getUniformLocation(program, "fColor"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
        gl.drawArrays(gl.LINE_LOOP, i + 7, 1);
    }

    requestAnimFrame(render);
};