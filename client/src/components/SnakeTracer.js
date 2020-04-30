import React from 'react'

export default function SnakeTracer(props){  
    const canvas = React.createRef(null);
    const WIDTH = window.screen.width;
    const FACTOR = window.screen.height > WIDTH ? 1.0 : 0.75;
    
    React.useEffect(() => {
        function crossProduct(a, b) {
            return [a[1]*b[2] - a[2]*b[1],
                    a[2]*b[0] - a[0]*b[2],
                    a[0]*b[1] - a[1]*b[0]];
        }
        function dotProduct(a, b) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        }
        function addVec(a, b){
            return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
        }
        function subVec(a, b){
            return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        }
        function multVec(vec, scalar){
            return [scalar * vec[0], scalar * vec[1], scalar * vec[2]];
        }
        function quatRot(point, axis, angle, origin = [0.0, 0.0, 0.0]){
            const r = multVec(axis, Math.sin(angle / 2.0));
            const P = subVec(point, origin);
            const Q = addVec(point, crossProduct( multVec(r, 2.0), addVec(crossProduct(r, P), multVec(P, Math.cos(angle/2.0)))));
            return Q;
        }
        
        let canvasFull = false;
        let changePerspective = false;
        let rightDown = false;
        let mouseX = 0;
        let mouseY = 0;
        let touchX, touchY;
        let grow = true;
        let cameraAngleX = 0;
        let cameraAngleY = 0;
        let cameraOldAngleX = 0;
        let cameraOldAngleY = 0;
        let vaos = [];
        let vbos = [];
        let cameraInitPos = [2550.0, 2700.0, 3750.0];
        let cameraInitDirection = [-0.48, -0.51, -Math.sqrt(1.0 - 0.48 * 0.48 - 0.51 * 0.51)];
        let cameraInitRight = crossProduct(cameraInitDirection, [0.0, 1.0, 0.0]);
        cameraInitRight = multVec(cameraInitRight, 1.0 / Math.sqrt(dotProduct(cameraInitRight, cameraInitRight)));
        let cameraInitUp = crossProduct(cameraInitRight, cameraInitDirection);
        
        var alpha = 0.0;
        let canvasRect = canvas.current.getBoundingClientRect();
        const gl = canvas.current.getContext("webgl2");
        if (!gl) {
            alert("Unable to initialize WebGL2. Your browser or machine may not support it.");
        }
        canvas.current.oncontextmenu = function(e){e.preventDefault();};
        canvas.current.onmousemove = function(e){
            if(rightDown === true){
                cameraAngleX += ((mouseX - e.clientX)/canvasRect.width) * Math.PI;
                mouseX = e.clientX;
                cameraAngleY += ((mouseY - e.clientY)/canvasRect.height) * Math.PI;
                mouseY = e.clientY;
            }
        }
        canvas.current.onmouseout = function(e){
            //document.getElementById("demo").innerHTML = "";
            //document.getElementById("angle").innerHTML = "";
        };
        canvas.current.onmousedown = function (e){
            if(e.button === 0){
                //leftDown = true;
                return
            }
            else if(e.button === 2){
                rightDown = true;
                changePerspective = true;
                mouseX = e.clientX;
                mouseY = e.clientY;
            }
        };
        canvas.current.onmouseup = function (e){
            if(e.button === 0){
                fullscreen();
            }
            else if(e.button === 2){
                rightDown = false;
                changePerspective = false;
            }
        };
        canvas.current.ontouchstart = function(e){
            touchX = e.touches[0].clientX;
            touchY = e.touches[0].clientY;
        }
        canvas.current.ontouchmove = function(e){
            e.preventDefault()
            e.stopPropagation()
        }
        canvas.current.ontouchend = function(e){
            e.preventDefault()
            e.stopPropagation()
            const deltaX = e.changedTouches[0].clientX - touchX;
            const deltaY = e.changedTouches[0].clientY - touchY;
            const ratio = Math.abs(deltaY/deltaX);
            let axis, dir
            let move = false;
    
            if(ratio > 5.0){
                axis = 1;
                dir = deltaY>0?-1:1;
                move = true;
            } else if(ratio < 0.2){
                axis = 0;
                dir = deltaX>0?1:-1;
                move = true;
            } else if(deltaX * deltaY > 0){
                axis = 2;
                dir = deltaX > 0?-1:1
                move = true;
            }
            if(move) createCylinder(axis, dir, renderer.cylinders.length === 0)
        }
        function createCylinder(orientation, direction, first = false){
            if(first){
                renderer.cylinders.push(renderer.spheres[0]);
                renderer.cylinder_axes.push([0.0, 0.0, 0.0]);
                renderer.cylinder_axes[0][orientation] = direction;
                renderer.cylinder_colors.push(renderer.sphere_colors[0]);
                renderer.cylinder_radius.push(Math.sqrt(renderer.sphere_radius2[0]));
                renderer.cylinder_length.push(0.0);
                renderer.spheres.push(renderer.spheres[0]);
                renderer.sphere_colors.push(renderer.sphere_colors[0]);
                renderer.sphere_radius2.push(renderer.sphere_radius2[0]);
                renderer.sphere_inv_radius.push(renderer.sphere_inv_radius[0]);
            }
            else{
                if(renderer.cylinder_axes[renderer.cylinders.length - 1][orientation] === 0.0){
                    renderer.cylinders.push(renderer.spheres[renderer.spheres.length - 1]);
                    renderer.cylinder_axes.push([0.0, 0.0, 0.0]);
                    renderer.cylinder_axes[renderer.cylinder_axes.length - 1][orientation] = direction;
                    renderer.cylinder_colors.push(renderer.sphere_colors[0]);
                    renderer.cylinder_radius.push(renderer.cylinder_radius[0]);
                    renderer.cylinder_length.push(0.0);
                    renderer.spheres.push(renderer.spheres[renderer.spheres.length - 1]);
                    renderer.sphere_colors.push(renderer.sphere_colors[0]);
                    renderer.sphere_radius2.push(renderer.sphere_radius2[0]);
                    renderer.sphere_inv_radius.push(renderer.sphere_inv_radius[0]);
                }
            }
        };
        
        document.onkeydown = function(e){
            switch(e.keyCode){
                case 87://W
                    cameraInitPos = addVec(cameraInitPos, multVec(renderer.cameraDirection, 10.0));
                    //e.preventDefault();
                    break;
                case 83://S
                    cameraInitPos = subVec(cameraInitPos, multVec(renderer.cameraDirection, 10.0));
                    //e.preventDefault();
                    break;
                case 65://A
                    cameraInitPos = subVec(cameraInitPos, multVec(renderer.cameraRight, 10.0));
                    //e.preventDefault();
                    break;
                case 68://D
                    cameraInitPos = addVec(cameraInitPos, multVec(renderer.cameraRight, 10.0));
                    //e.preventDefault();
                    break;
                case 71://g key
                    grow = !grow;
                    //e.preventDefault();
                    break;
                case 37://left key = left
                    if(renderer.cylinders.length > 0){
                        createCylinder(0, -1.0);
                    }
                    else{
                        createCylinder(0, -1.0, true);
                    }
                    e.preventDefault();
                    break;
                case 38://up key = back
                if(renderer.cylinders.length > 0){
                        createCylinder(2, -1.0);
                    }
                    else{
                        createCylinder(2, -1.0, true);
                    }
                    e.preventDefault();
                    break;
                case 39://right key = right
                    if(renderer.cylinders.length > 0){
                            createCylinder(0, 1.0);
                        }
                    else{
                        createCylinder(0, 1.0, true);
                    }
                    e.preventDefault();
                    break;
                case 40://down key = forth
                    if(renderer.cylinders.length > 0){
                            createCylinder(2, 1.0);
                        }
                    else{
                        createCylinder(2, 1.0, true);
                    }
                    e.preventDefault();
                    break;
                case 17:
                    if(renderer.cylinders.length > 0){
                            createCylinder(1, -1.0);
                        }
                    else{
                        createCylinder(1, -1.0, true);
                    }
                    e.preventDefault();
                    break;
                case 16:
                    if(renderer.cylinders.length > 0){
                            createCylinder(1, 1.0);
                        }
                    else{
                        createCylinder(1, 1.0, true);
                    }
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        };
        
        function fullscreen(){
            if(canvasFull === false){
                if(canvas.current.webkitRequestFullscreen) {
                    canvas.current.webkitRequestFullScreen();
                }
                else {
                    canvas.current.mozRequestFullScreen();
                }            
            }
            else{
                return;
            }
        }
        class Renderer {
            constructor(){
                this.SPEED = 400.0;
                this.MAX_SPHERES = 30;
                this.MAX_CYLINDERS = 30;
                this.cameraDirection = cameraInitDirection;
                this.cameraUp = cameraInitUp;
                this.cameraRight = cameraInitRight;
                this.cameraPos = cameraInitPos;
        
                this.cylinders = [];
                this.cylinder_axes = [];
                this.cylinder_colors = [];
                this.cylinder_radius = [];
                this.cylinder_length = [];
        
                this.spheres = [];
                this.sphere_radius2 = [];
                this.sphere_inv_radius = [];
                this.sphere_colors = [];
        
                this.squares = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]];
                this.square_length = 1800.0;
                this.square_dir= [[0.0, 0.0, 1.0], [1.0, 0.0, 0.0], [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];
                this.square_norm = [[0.0, 1.0, 0.0], [0.0, 0.0, 1.0], [1.0, 0.0, 0.0]];
                this.square_colors = [[0.4, 0.78, 0.8], [0.8, 0.65, 0.6], [0.8, 0.9, 0.7]];
        
                this.spheres.push([900.0, 900.0, 900.0]);
                this.sphere_radius2.push(6400.0);
                this.sphere_inv_radius.push(1.0 / 80.0);
                this.sphere_colors.push([0.75, 0.75, 0.75]);
        
                this.lightLocation = [1400.0, 2800.0, 1400.0];
                this.cos_phi = [];
                this.sin_phi = [];
                for(let j = 0; j < 12; j++){
                    const phi = Math.PI / 6.0 * j;
                    this.cos_phi.push(Math.cos(phi));
                    this.sin_phi.push(Math.sin(phi));
                }
                for(let j = 0; j < 8; j++){
                    const phi = Math.PI / 4.0 * j;
                    this.cos_phi.push(2.0 / 3.0 * Math.cos(phi));
                    this.sin_phi.push(2.0 / 3.0 * Math.sin(phi));
                }
                for(let j = 0; j < 4; j++){
                    const phi = Math.PI / 2.0 * j;
                    this.cos_phi.push(1.0 / 3.0 * Math.cos(phi));
                    this.sin_phi.push(1.0 / 3.0 * Math.sin(phi));
                }
            }
            drawScene(program, model, deltaTime) {
                gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
                if(this.cylinders.length > 0 && this.spheres.length > 0){
                    this.cylinder_length[this.cylinders.length - 1] = this.cylinder_length[this.cylinders.length - 1] + deltaTime * this.SPEED;
                    this.spheres[this.spheres.length - 1] = addVec(this.spheres[this.spheres.length - 1], 
                    multVec(this.cylinder_axes[this.cylinders.length - 1], deltaTime * this.SPEED));
                    if(!grow){
                        this.spheres[0] = addVec(this.spheres[0], multVec(this.cylinder_axes[0], deltaTime * this.SPEED));
                        this.cylinders[0] = addVec(this.cylinders[0], multVec(this.cylinder_axes[0], deltaTime * this.SPEED));
                        this.cylinder_length[0] -= deltaTime * this.SPEED;
                        if(this.cylinder_length[0] <= 0.0){
                            this.spheres.shift();
                            this.sphere_colors.shift();
                            this.sphere_inv_radius.shift();
                            this.sphere_radius2.shift();
                            this.cylinders.shift();
                            this.cylinder_axes.shift();
                            this.cylinder_colors.shift();
                            this.cylinder_length.shift();
                            this.cylinder_radius.shift();
                        }
                    }
                }
                this.lightLocation = quatRot(this.lightLocation, [0.0, 1.0, 0.0], deltaTime, [1100.0, 2800.0, 1100.0]);
                program.start();
                this.cameraPos = cameraInitPos;
                gl.uniform3fv(program.uniformLocations.cameraDirLoc, 
                    this.cameraDirection);
                gl.uniform3fv(program.uniformLocations.cameraUpLoc, 
                    this.cameraUp);
                gl.uniform3fv(program.uniformLocations.cameraRightLoc, 
                    this.cameraRight);
                gl.uniform3fv(program.uniformLocations.cameraPosLoc, 
                    this.cameraPos);
                gl.uniform3fv(program.uniformLocations.lightLoc, 
                    this.lightLocation);
                gl.uniform1f(program.uniformLocations.timeLoc,
                    alpha);
                gl.uniform1i(program.uniformLocations.numSpheresLoc,
                    this.spheres.length);
                gl.uniform1i(program.uniformLocations.numCylindersLoc,
                    this.cylinders.length);
        
                for(let j=0; j < this.spheres.length; j++){
                    gl.uniform3fv(program.uniformLocations.sphereCenLoc[j], this.spheres[j]);
                    gl.uniform3fv(program.uniformLocations.sphereColLoc[j], this.sphere_colors[j]);
                    gl.uniform1f(program.uniformLocations.sphereRadius2Loc[j], this.sphere_radius2[j]);
                    gl.uniform1f(program.uniformLocations.sphereInvRadiusLoc[j], this.sphere_inv_radius[j]);
                }
        
                for(let j=0; j < this.cylinders.length; j++){
                    gl.uniform3fv(program.uniformLocations.cylinderCenLoc[j], this.cylinders[j]);
                    gl.uniform3fv(program.uniformLocations.cylinderAxisLoc[j], this.cylinder_axes[j]);
                    gl.uniform3fv(program.uniformLocations.cylinderColLoc[j], this.cylinder_colors[j]);
                    gl.uniform1f(program.uniformLocations.cylinderRadiusLoc[j], this.cylinder_radius[j]);
                    gl.uniform1f(program.uniformLocations.cylinderLengthLoc[j], this.cylinder_length[j]);
                }
        
                for(let j=0; j < this.squares.length; j++){
                    gl.uniform3fv(program.uniformLocations.squareLoc[j], this.squares[j]);
                    gl.uniform3fv(program.uniformLocations.squareNormLoc[j], this.square_norm[j]);
                    gl.uniform3fv(program.uniformLocations.squareUDirLoc[j], this.square_dir[2*j]);
                    gl.uniform3fv(program.uniformLocations.squareVDirLoc[j], this.square_dir[2*j + 1]);
                    gl.uniform3fv(program.uniformLocations.squareColLoc[j], this.square_colors[j]);
                    gl.uniform1f(program.uniformLocations.squareLenLoc[j], this.square_length);
                }
                
                for(let j = 0; j < 24; j++){
                    gl.uniform1f(program.uniformLocations.cosLoc[j], this.cos_phi[j]);
                    gl.uniform1f(program.uniformLocations.sinLoc[j], this.sin_phi[j]);
                }
                model.prepare();
                gl.drawElements(gl.TRIANGLES, model.vertexCount, gl.UNSIGNED_SHORT, 0);
                model.unbind();
                program.stop();
            }
        }
        const renderer = new Renderer()
        class Model {
            constructor(vaoID, vertexCount){
                this.vaoID = vaoID;
                this.vertexCount = vertexCount;
            }
            prepare() {
                gl.bindVertexArray(this.vaoID);
                gl.enableVertexAttribArray(0);
            }
            unbind() {
                gl.disableVertexAttribArray(0);
                gl.bindVertexArray(null);
            }
        }
        class ShaderProgram {
            constructor(shaders, numSquares){
                function loadShader(source, type){
                    const shaderID = gl.createShader(type);
                    gl.shaderSource(shaderID, source);
                    gl.compileShader(shaderID);
                    var compiled = gl.getShaderParameter(shaderID, gl.COMPILE_STATUS);
                    if(!compiled){
                        var errors = gl.getShaderInfoLog(shaderID);
                        alert('Failed to compile ' + type + ' with these errors:' + errors);
                        gl.deleteShader(shaderID);
                        return null;
                    }
                    return shaderID;
                }
                this.vertexShaderID = loadShader(shaders.vsSource, gl.VERTEX_SHADER);
                this.fragmentShaderID = loadShader(shaders.fsSource, gl.FRAGMENT_SHADER);
                this.programID = gl.createProgram();
                gl.attachShader(this.programID, this.vertexShaderID);
                gl.attachShader(this.programID, this.fragmentShaderID);
                gl.bindAttribLocation(this.programID, 0, 'aVertexPosition');
                gl.linkProgram(this.programID);
                if (!gl.getProgramParameter(this.programID, gl.LINK_STATUS)) {
                    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.programID));
                return null;
                }
                var sphereLocations = [];
                var sphereColorLocations = [];
                var sphereRadius2Locations = [];
                var sphereInvRadiusLocations = [];
        
                var cylinderLocations = [];
                var cylinderAxisLocations = [];
                var cylinderColorLocations = [];
                var cylinderRadiusLocations = [];
                var cylinderLengthLocations = [];
        
                var squareLocations = [];
                var squareColors = [];
                var squareNormLocations = [];
                var squareUDirLocations = [];
                var squareVDirLocations = [];
                var squareLenLocations = [];
                var cosLocations = [];
                var sinLocations = [];
        
                for(let j = 0; j < 24; j++){
                    let locStr = 'cosPhi[' + j  + ']';
                    cosLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'sinPhi[' + j  + ']';
                    sinLocations.push(gl.getUniformLocation(this.programID, locStr));
                }
        
                for(let j=0; j < renderer.MAX_SPHERES; j++){
                    let locStr = 'spheres[' + j +'].center';
                    sphereLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'spheres[' + j +'].color';
                    sphereColorLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'spheres[' + j +'].radius2';
                    sphereRadius2Locations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'spheres[' + j +'].inv_radius';
                    sphereInvRadiusLocations.push(gl.getUniformLocation(this.programID, locStr));
                }
        
                for(var j=0; j < renderer.MAX_CYLINDERS; j++){
                    var locStr = 'cylinders[' + j +'].pos';
                    cylinderLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'cylinders[' + j +'].axis';
                    cylinderAxisLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'cylinders[' + j +'].color';
                    cylinderColorLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'cylinders[' + j +'].radius';
                    cylinderRadiusLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'cylinders[' + j +'].length';
                    cylinderLengthLocations.push(gl.getUniformLocation(this.programID, locStr));
                }
        
                for(let j = 0; j < numSquares; j++){
                    let locStr = 'squares[' + j +'].pos';
                    squareLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'squares[' + j +'].color';
                    squareColors.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'squares[' + j +'].norm';
                    squareNormLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'squares[' + j +'].uDir';
                    squareUDirLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'squares[' + j +'].vDir';
                    squareVDirLocations.push(gl.getUniformLocation(this.programID, locStr));
                    locStr = 'squares[' + j +'].length';
                    squareLenLocations.push(gl.getUniformLocation(this.programID, locStr));
                }
                
                this.uniformLocations = {
                    cameraDirLoc: gl.getUniformLocation(this.programID, 'camera_dir'),
                    cameraUpLoc: gl.getUniformLocation(this.programID, 'camera_up'),
                    cameraRightLoc: gl.getUniformLocation(this.programID, 'camera_right'),
                    cameraPosLoc: gl.getUniformLocation(this.programID, 'camera_pos'),
                    lightLoc: gl.getUniformLocation(this.programID, 'light'),
                    timeLoc: gl.getUniformLocation(this.programID, 'time'),
                    numCylindersLoc: gl.getUniformLocation(this.programID, 'numCylinders'),
                    numSpheresLoc: gl.getUniformLocation(this.programID, 'numSpheres'),
                    cosLoc: cosLocations,
                    sinLoc: sinLocations,
                    squareLenLoc: squareLenLocations,
                    sphereCenLoc: sphereLocations,
                    sphereColLoc: sphereColorLocations,
                    sphereRadius2Loc: sphereRadius2Locations,
                    sphereInvRadiusLoc: sphereInvRadiusLocations,
                    cylinderCenLoc: cylinderLocations,
                    cylinderAxisLoc: cylinderAxisLocations,
                    cylinderColLoc: cylinderColorLocations,
                    cylinderRadiusLoc: cylinderRadiusLocations,
                    cylinderLengthLoc: cylinderLengthLocations,
                    squareLoc: squareLocations,
                    squareNormLoc: squareNormLocations,
                    squareUDirLoc: squareUDirLocations,
                    squareVDirLoc: squareVDirLocations,
                    squareColLoc: squareColors,
                }
            }
        
            start() {
                gl.useProgram(this.programID);
            }
        
            stop() {
                gl.useProgram(null);
            }
        
            cleanUp() {
                this.stop();
                gl.detachShader(this.programID, this.vertexShaderID);
                gl.detachShader(this.programID, this.fragmentShaderID);
                gl.deleteShader(this.vertexShaderID);
                gl.deleteShader(this.fragmentShaderID);
                gl.deleteProgram(this.programID);
            }
        }
        class Loader{
            static loadToVAO(data){
                const vaoID = gl.createVertexArray();
                vaos.push(vaoID);
                gl.bindVertexArray(vaoID);
                
                var vboID = gl.createBuffer();
                vbos.push(vboID);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vboID);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);
                
                vboID = gl.createBuffer();
                vbos.push(vboID);
                gl.bindBuffer(gl.ARRAY_BUFFER, vboID);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.positions), gl.STATIC_DRAW);
                
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                gl.bindVertexArray(null);
                return new Model(vaoID, data.indices.length);
            }
        }
        
        function main() {
            console.log(window.devicePixelRatio)
            const shaders = {
                vsSource: `#version 300 es
                    in vec2 aVertexPosition;
                    void main(void) {
                        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
                    }`,
                fsSource: `#version 300 es
                    precision highp float;
                    out vec4 fragmentColor;
                    uniform vec3 camera_dir;
                    uniform vec3 camera_up;
                    uniform vec3 camera_right;
                    uniform vec3 camera_pos;
                    
                    struct HitInfo{
                        bool hit;
                        float dist_from_cam;
                    };
        
                    struct Square{
                        vec3 pos, norm, uDir, vDir, color;
                        float length;
                    };
        
                    struct Sphere{
                        vec3 center, color;
                        float radius2, inv_radius;
                    };
        
                    struct Ray{
                        vec3 origin, direction;
                    };
                    struct Cylinder{
                        vec3 pos, axis, color;
                        float radius, length;
                    };
        
                    uniform Square squares[3];
                    uniform Sphere spheres[`+ renderer.MAX_SPHERES + `];
                    uniform Cylinder cylinders[`+ renderer.MAX_CYLINDERS + `];
                    uniform vec3 light;
                    uniform float cosPhi[24];
                    uniform float sinPhi[24];
                    uniform float time;
                    uniform int numCylinders, numSpheres;
        
                    #define MAX pow(10.0, 6.0)
                    const float width = float(`+ Math.min(WIDTH, 800.0)+`);
                    const float height = float(`+ Math.min(WIDTH, 800.0) * FACTOR +`);
                    const float screen_dist = 1.0 * width;
                    const float light_radius = 200.0;
                    const float light_radius2 = 40000.0;
                    
                    HitInfo shoot_ray_at_cylinder(Ray ray, Cylinder cylinder, float closest_dist){
                        bool hit = false;
                        float min_dist = 0.0;
                        vec3 Dir = cylinder.pos - ray.origin;
                        float RayCyl = dot(ray.direction, cylinder.axis);
                        float oneMinRayCyl2 = 1.0 - RayCyl * RayCyl;
                        float DirRay = dot(Dir, ray.direction);
                        float DirCyl = dot(Dir, cylinder.axis);
                        float DirDir = dot(Dir, Dir);
                        float dist2 = 2.0 * DirRay * DirCyl * RayCyl - DirCyl * DirCyl
                                    - DirRay * DirRay + oneMinRayCyl2 * DirDir;
                        dist2 = dist2 / oneMinRayCyl2;
                        if( dist2 < cylinder.radius * cylinder.radius){
                            float origin_to_closest = (DirRay - RayCyl * DirCyl)/oneMinRayCyl2;
                            min_dist = origin_to_closest - sqrt((cylinder.radius * cylinder.radius - dist2)/oneMinRayCyl2);
                            if( min_dist > 0.0 && min_dist < closest_dist){
                                vec3 cylinder_to_intersect = min_dist * ray.direction - Dir;
                                float dist_from_cylinder_pos2 = dot(cylinder.axis, cylinder_to_intersect);
                                if(dist_from_cylinder_pos2 < cylinder.length && dist_from_cylinder_pos2 >= 0.0){
                                    hit = true;
                                }
                            }
                        }
                        return HitInfo(hit, min_dist);
                    }
        
                    HitInfo shoot_ray_at_sphere(Ray ray, Sphere sphere, float closest_dist){
                        bool hit = false;
                        float dist_from_cam = 0.0;
                        float dist_origin_to_closest = dot(ray.direction, sphere.center - ray.origin);
                        if(dist_origin_to_closest > 0.0 && dist_origin_to_closest < closest_dist){
                            vec3 closest_to_center = ray.origin + dist_origin_to_closest * ray.direction - sphere.center;
                            float dist_closest_to_center2 = dot(closest_to_center, closest_to_center);
                            if(dist_closest_to_center2 <= sphere.radius2){
                                dist_from_cam = dist_origin_to_closest - sqrt(sphere.radius2 - dist_closest_to_center2);
                                if(dist_from_cam < closest_dist){
                                    hit = true;
                                }
                            }
                        }
                        return HitInfo(hit, dist_from_cam);
                    }
        
                    HitInfo shoot_ray_at_square(Ray ray, Square square, float closest_dist){
                        float cos_ray_normal = dot(ray.direction, square.norm);
                        vec3 orig_to_square = square.pos - ray.origin;
                        float rho = dot(orig_to_square, square.norm) / cos_ray_normal;
                        bool hit = false;
                        if(rho >= 0.0 && rho < closest_dist){
                            float sigma = -dot(cross(orig_to_square, square.vDir), ray.direction) / cos_ray_normal;
                            float rest = mod(sigma, 600.0);
                            if(sigma >= 0.0 && sigma <= square.length && rest >= 10.0){
                                float theta = dot(cross(orig_to_square, square.uDir), ray.direction) / cos_ray_normal;
                                rest = mod(theta, 600.0);
                                if(theta >= 0.0 && theta <= square.length && rest >= 10.0){
                                    hit = true;
                                }
                            }
                        }    
                        return HitInfo(hit, rho);
                    }
                    
                    void main() {
                        vec3 ray_dir = normalize(screen_dist * camera_dir 
                                                + (gl_FragCoord.x - (width / 2.0)) * camera_right 
                                                + (gl_FragCoord.y - (height / 2.0)) * camera_up);
                        vec3 color = vec3(0.0, 0.0, 0.0);
                        Ray ray = Ray(camera_pos, ray_dir);
                        float weight = 1.0;
        
                        for(int bounces = 0; bounces < 3; bounces++){
                            int hitObjectId = 0;
                            HitInfo bestHit = HitInfo(false, MAX);
                            for(int j = 0; j < 3; j++){
                                HitInfo thisHit = shoot_ray_at_square(ray, squares[j], bestHit.dist_from_cam);
                                if(thisHit.hit){    
                                    bestHit = thisHit;
                                    hitObjectId = j;
                                }
                            }
        
                            for(int j = 0; j < `+ renderer.MAX_SPHERES + `; j++){
                                if( j >= numSpheres){
                                    break;
                                }
                                else{
                                    HitInfo thisHit = shoot_ray_at_sphere(ray, spheres[j], bestHit.dist_from_cam);
                                    if(thisHit.hit){
                                        bestHit = thisHit;
                                        hitObjectId = 3 + j;
                                    }
                                }
                            }
        
                            for(int j = 0; j < `+ renderer.MAX_CYLINDERS + `; j++){
                                if( j >= numCylinders){
                                    break;
                                }
                                else{
                                    HitInfo thisHit = shoot_ray_at_cylinder(ray, cylinders[j], bestHit.dist_from_cam);
                                    if(thisHit.hit){
                                        bestHit = thisHit;
                                        hitObjectId = 3 + numSpheres + j;
                                    }
                                }
                            }
        
                            if(bestHit.hit){
                                float diff_coeff = 0.0;
                                vec3 normal_at_point, hit_color;
                                vec3 intersect_point = ray.origin + 0.99999 * bestHit.dist_from_cam * ray.direction;
                                if ( hitObjectId < 3){
                                    normal_at_point = squares[hitObjectId].norm;
                                    hit_color = squares[hitObjectId].color;
                                }
                                else if( hitObjectId < 3 + numSpheres){
                                    normal_at_point = spheres[hitObjectId - 3].inv_radius * (ray.origin + bestHit.dist_from_cam * ray.direction - spheres[hitObjectId - 3].center);
                                    hit_color = spheres[hitObjectId - 3].color;
                                }
                                else{
                                    int hitCylinderId = hitObjectId - 3 - numSpheres;
                                    vec3 cylinder_pos_to_intersect = ray.origin + bestHit.dist_from_cam * ray.direction - cylinders[hitCylinderId].pos;
                                    normal_at_point = normalize(cylinder_pos_to_intersect - dot(cylinders[hitCylinderId].axis, cylinder_pos_to_intersect) * cylinders[hitCylinderId].axis);
                                    hit_color = cylinders[hitCylinderId].color;
                                }
                                vec3 point_to_light = light - intersect_point;
                                float dist_from_light2 = dot(point_to_light, point_to_light);
                                vec3 shadow_ray = point_to_light / sqrt(dist_from_light2);
        
                                bool hit_light = true;
                                float light_cos = dot(normal_at_point, shadow_ray);
                                Ray shadowRay = Ray(intersect_point, shadow_ray);
                                if(light_cos > 0.0){
                                    for (int j = 0; j < 3; j++){
                                        if(shoot_ray_at_square( shadowRay, squares[j], MAX ).hit){
                                            hit_light = false;
                                            break;
                                        }
                                    }
        
                                    if(hit_light){
                                        for (int j = 0; j < `+ renderer.MAX_SPHERES + `; j++){
                                            if( j >= numSpheres){
                                                break;
                                            }
                                            else{
                                                if(shoot_ray_at_sphere( shadowRay, spheres[j], MAX ).hit){
                                                    hit_light = false;
                                                    break;
                                                }
                                            }
                                        }
                                    }
        
                                    if(hit_light){
                                        for (int j = 0; j < `+ renderer.MAX_CYLINDERS + `; j++){
                                            if( j >= numCylinders){
                                                break;
                                            }
                                            else{
                                                if(shoot_ray_at_cylinder( shadowRay, cylinders[j], MAX ).hit){
                                                    hit_light = false;
                                                    break;
                                                }
                                            }
                                        }
                                    }
        
                                    if(hit_light){
                                        diff_coeff = light_cos;
                                    }
                                }
                                
                                ray = Ray(intersect_point, reflect(ray.direction, normal_at_point));
                                float spec_coeff = pow(max(0.0, dot(shadow_ray, ray.direction)), 40.0);
                                diff_coeff = max(0.3, diff_coeff);
                                vec3 light_color = vec3(1.0, 1.0, 1.0);
                                hit_color = vec3(hit_color.x * light_color.x, hit_color.y * light_color.y, hit_color.z * light_color.z);
                                color += weight * diff_coeff * (hit_color + spec_coeff * light_color);
                                weight *= 0.5 * diff_coeff;
                            }
                            else{
                                if(bounces == 0){ color = vec3(0.7,0.7,0.7); }
                                break;
                            }
                                                
                            if(weight < 0.001){
                                break;
                            }
                        }
                        fragmentColor = vec4(color, 1.0);
                    }`,
            };
            
            const shaderProgram = new ShaderProgram(shaders, renderer.squares.length);
            const cubeData = {
                positions: [
                -1.0, 1.0,// 1.0,
                -1.0, -1.0,// 1.0,
                1.0, -1.0,// 1.0,
                1.0, 1.0,// 1.0,
                ],
                indices: [
                0,  1,  2, 
                0,  2,  3]
            }
            const cubeModel = Loader.loadToVAO(cubeData);
            var then = 0;
            //var delta_time_fps = 0.0;
            //var num_frames = 0;
        
            function render(now) {
                now *= 0.001;  // convert to seconds
                const deltaTime = now - then;
                //delta_time_fps += deltaTime;
                //num_frames += 1;
                then = now;
                if(changePerspective === true){
                    var deltaX = cameraAngleX - cameraOldAngleX;
                    var deltaY = cameraAngleY - cameraOldAngleY;
                                
                    renderer.cameraDirection = quatRot(renderer.cameraDirection, [0.0, 1.0, 0.0], deltaX);
                    renderer.cameraRight = quatRot(renderer.cameraRight, [0.0, 1.0, 0.0], deltaX);
                    renderer.cameraDirection = quatRot(renderer.cameraDirection, renderer.cameraRight, deltaY);
                    renderer.cameraUp = crossProduct(renderer.cameraRight, renderer.cameraDirection);
                    cameraOldAngleX = cameraAngleX;
                    cameraOldAngleY = cameraAngleY;
                }   
        
                renderer.drawScene(shaderProgram, cubeModel, deltaTime);
                // if(Math.floor(delta_time_fps) >= 1){
                //     var fps = Math.ceil(num_frames / delta_time_fps);
                //     delta_time_fps = 0.0;
                //     num_frames = 0;
                //     document.getElementById("angle").innerHTML = "fps: " + fps;
                // }
                requestAnimationFrame(render);
            }
        
            requestAnimationFrame(render);
        }
        main();
    },[canvas, WIDTH, FACTOR])
    
    return <canvas 
        ref             = {canvas} 
        width           = {Math.min(WIDTH, 800)} 
        height          = {Math.min(WIDTH, 800) * FACTOR} 
        style           = {{marginTop: '20px'}}></canvas>
}