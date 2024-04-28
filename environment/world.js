// Fungsi untuk melakukan generate garis lengkung
function normalizeScreen(x, y, width, height) {
    var nx = 2 * x / width - 1
    var ny = -2 * y / height + 1

    return [nx, ny]
}

function generateBSpline(controlPoint, m, degree, z) {
    var curves = [];
    var knotVector = []

    var n = controlPoint.length / 2;


    // Calculate the knot values based on the degree and number of control points
    for (var i = 0; i < n + degree + 1; i++) {
        if (i < degree + 1) {
            knotVector.push(0);
        } else if (i >= n) {
            knotVector.push(n - degree);
        } else {
            knotVector.push(i - degree);
        }
    }



    var basisFunc = function (i, j, t) {
        if (j == 0) {
            if (knotVector[i] <= t && t < (knotVector[(i + 1)])) {
                return 1;
            } else {
                return 0;
            }
        }

        var den1 = knotVector[i + j] - knotVector[i];
        var den2 = knotVector[i + j + 1] - knotVector[i + 1];

        var term1 = 0;
        var term2 = 0;


        if (den1 != 0 && !isNaN(den1)) {
            term1 = ((t - knotVector[i]) / den1) * basisFunc(i, j - 1, t);
        }

        if (den2 != 0 && !isNaN(den2)) {
            term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i + 1, j - 1, t);
        }

        return term1 + term2;
    }


    for (var t = 0; t < m; t++) {
        var x = 0;
        var y = 0;

        var u = (t / m * (knotVector[controlPoint.length / 2] - knotVector[degree])) + knotVector[degree];

        //C(t)
        for (var key = 0; key < n; key++) {

            var C = basisFunc(key, degree, u);
            // console.log(C);
            x += (controlPoint[key * 2] * C);
            y += (controlPoint[key * 2 + 1] * C);
            // console.log(t + " " + degree + " " + x + " " + y + " " + C);
        }
        curves.push(x);
        curves.push(y);
        curves.push(z, 252 / 255, 15 / 255, 192 / 255);

    }
    // console.log(curves)
    return curves;
}

var GL;
class MyObject {
    object_vertex = [];
    OBJECT_VERTEX = GL.createBuffer();
    object_faces = [];
    OBJECT_FACES = GL.createBuffer();

    child = [];

    // Shader (Merupakan format sehingga gaperlu dihafal)
    compile_shader = function (source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert('ERROR IN ' + typeString + ' SHADER: ' + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    }

    shader_vertex;
    shader_fragment;
    SHADER_PROGRAM;
    _Pmatrix;
    _Vmatrix;
    _Mmatrix;
    _color;
    _position;

    MOVEMATRIX = LIBS.get_I4();

    constructor(object_vertex, object_faces, shader_vertex_source, shader_fragment_source) {
        this.object_vertex = object_vertex;
        this.object_faces = object_faces;
        this.shader_vertex_source = shader_vertex_source;
        this.shader_fragment_source = shader_fragment_source;

        this.shader_vertex = this.compile_shader(this.shader_vertex_source, GL.VERTEX_SHADER, 'VERTEX');
        this.shader_fragment = this.compile_shader(this.shader_fragment_source, GL.FRAGMENT_SHADER, 'FRAGMENT');
        this.SHADER_PROGRAM = GL.createProgram();

        GL.attachShader(this.SHADER_PROGRAM, this.shader_vertex);
        GL.attachShader(this.SHADER_PROGRAM, this.shader_fragment);

        GL.linkProgram(this.SHADER_PROGRAM);

        // Menghubungkan dengan shader
        this._Pmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, 'Pmatrix');
        this._Vmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, 'Vmatrix');
        this._Mmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, 'Mmatrix');

        this._color = GL.getAttribLocation(this.SHADER_PROGRAM, 'color');
        this._position = GL.getAttribLocation(this.SHADER_PROGRAM, 'position');

        GL.enableVertexAttribArray(this._color);
        GL.enableVertexAttribArray(this._position);

        GL.useProgram(this.SHADER_PROGRAM);

        this.initializeBuffer();
    }

    initializeBuffer() {
        GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        // Pake float soalnya koordinatnya mentok di 1, jdi klo koordinatnya mw lebih kecil pake 0, sekian
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.object_vertex), GL.STATIC_DRAW);

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        // Data yang diberikan pasti integer
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.object_faces), GL.STATIC_DRAW);
    }

    setUniformMatrix4(PROJMATRIX, VIEWMATRIX) {
        GL.useProgram(this.SHADER_PROGRAM);
        GL.uniformMatrix4fv(this._Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(this._Vmatrix, false, VIEWMATRIX);
        GL.uniformMatrix4fv(this._Mmatrix, false, this.MOVEMATRIX);
    }

    draw() {
        // Drawing
        // Drawing Triangle (Perlu dipanggil bindbuffer untuk me-spesifikasikan apa yang ingin digambar ke OpenGL)
        // memberi tau kalo yg dipanggil objek 2
        GL.useProgram(this.SHADER_PROGRAM);
        GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);

        // Memberikan detail dari triangle (dari perhitungan 4*(2+3) didapat 4 (merupakan tipe data antara byte ato bit ato mbo opo lol) dikali 2 posisi + 3 warna)
        GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);

        // Dia 2*4 soalnya colornya mulai dari setelah angka ke-2 di variable triangle_vertex dan dikali 4 soalnya tipe datanya
        GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);

        // Buffer faces
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        // Angka 3 bergantung pada jumlah isi array face
        GL.drawElements(GL.TRIANGLES, this.object_faces.length, GL.UNSIGNED_SHORT, 0);

        for (let i = 0; i < this.child.length; i++) {
            this.child[i].draw();
        }
    }

    drawLine() {
        GL.useProgram(this.SHADER_PROGRAM);
        GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);

        // Memberikan detail dari triangle (dari perhitungan 4*(2+3) didapat 4 (merupakan tipe data antara byte ato bit ato mbo opo lol) dikali 2 posisi + 3 warna)
        GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);

        // Dia 2*4 soalnya colornya mulai dari setelah angka ke-2 di variable triangle_vertex dan dikali 4 soalnya tipe datanya
        GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);

        // Buffer faces
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        // Angka 3 bergantung pada jumlah isi array face
        GL.drawElements(GL.LINE_STRIP, this.object_faces.length, GL.UNSIGNED_SHORT, 0);
    }

    setRotateMove(PHI, THETA, r) {
        LIBS.rotateZ(this.MOVEMATRIX, r);
        LIBS.rotateY(this.MOVEMATRIX, THETA);
        LIBS.rotateX(this.MOVEMATRIX, PHI);
    }

    setTranslateMove(x, y, z) {
        LIBS.translateZ(this.MOVEMATRIX, z);
        LIBS.translateY(this.MOVEMATRIX, y);
        LIBS.translateX(this.MOVEMATRIX, x);
    }

    setScale(s) {
        var scale = LIBS.scale(s);
        this.scaling(scale);
    }
    scaling(m4) {
        this.MOVEMATRIX = LIBS.mul(this.MOVEMATRIX, m4);
    }

    setIdentityMove() {
        LIBS.set_I4(this.MOVEMATRIX);
    }

    addChild(child) {
        this.child.push(child);
    }
}

// Fungsi main
function main() {
    var CANVAS = document.getElementById('myCanvas');

    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    var drag = false; // menentukan apakah diputar atau tidak
    var x_prev, y_prev; // menyimpan koordinat awal

    // perubahan
    var dX = 0, dY = 0;
    // end of perubahan

    var THETA = 0, PHI = 0;

    // variable untuk menghentikan benda dari bergerak setelah mouse dilepas
    var AMORTIZATION = -0.45;

    var mouseDown = function (e) {
        drag = true;
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();
        return false;
    }

    var mouseUp = function (e) {
        drag = false;
    }

    var mouseMove = function (e) {
        // pengecekan apabila mousenya ngapa"in soalnya gaurus mousenya ngapain
        if (!drag) return false;

        // sblm perubahan
        // var dX = e.pageX - x_prev; // mengurangi x sekarang dengan x sblmnya
        // var dY = e.pageY - y_prev; // mengurangi y sekarang dengan y sblmnya
        // THETA += dX * 2 * Math.PI / CANVAS.width;
        // PHI += dY * 2 * Math.PI / CANVAS.height;

        // setelah perubahan (menambah dx dan dy di atas)
        dX = (e.pageX - x_prev) * 2 * Math.PI / CANVAS.width;
        dY = (e.pageY - y_prev) * 2 * Math.PI / CANVAS.height;
        THETA += dX;
        PHI += dY

        // Untuk mengupdate variable penanda awalan tempat mouse berada
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();

    }

    CANVAS.addEventListener('mousedown', mouseDown, false); // Tahan mouse
    CANVAS.addEventListener('mouseup', mouseUp, false); // Lepas mouse
    CANVAS.addEventListener('mouseout', mouseUp, false); // Apabila mouse keluar dri canvas
    CANVAS.addEventListener('mousemove', mouseMove, false); // Mouse gerak


    try {
        GL = CANVAS.getContext('webgl', { antialias: false });
    } catch (error) {
        alert('WebGL context cannot be initialized');
        return false;
    }

    // Shaders
    // Nama variable selain GL boleh diubah"
    var shader_vertex_source = `
    attribute vec3 position;
    attribute vec3 color;

    // Untuk dapat dijadikan 3D
    uniform mat4 Pmatrix;
    uniform mat4 Vmatrix;
    uniform mat4 Mmatrix;

    varying vec3 vColor;
    void main(void) {
        gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
        vColor = color;
    }
    `

    var shader_fragment_source = `
    precision mediump float;
    varying vec3 vColor;
    void main(void) {
        gl_FragColor = vec4(vColor, 1.0);
    }
    `
    // mulX, mulY, mulZ = multiplier X, Y, Z
    // pX, pY, pZ = posisi sumbu X, Y, Z
    var generateSphere = function (radius, r, g, b, mulX, mulY, mulZ, pX, pY, pZ) {
        let stackAngle, sectorAngle;
        const sectorCount = 72;
        const stackCount = 24;

        let sectorStep = 2 * Math.PI / sectorCount;
        let stackStep = Math.PI / stackCount;

        const vertices = [];

        for (let i = 0; i <= sectorCount; i++) {
            stackAngle = Math.PI / 2 - i * stackStep;

            var xy = radius * Math.cos(stackAngle);
            var z = radius * Math.sin(stackAngle);

            for (let j = 0; j <= sectorCount; j++) {
                sectorAngle = j * sectorStep;

                x = mulX * xy * Math.cos(sectorAngle);
                y = mulY * xy * Math.sin(sectorAngle);
                vertices.push(x + pX);
                vertices.push(y + pY);
                vertices.push(z * mulZ + pZ);
                vertices.push(r / 255, g / 255, b / 255);
            }
        }

        var object_faces = [];

        var k1, k2;
        for (let i = 0; i < stackCount; ++i) {
            k1 = i * (sectorCount + 1);
            k2 = k1 + sectorCount + 1;

            for (let j = 0; j < sectorCount; ++j, ++k1, ++k2) {
                if (i != 0) {
                    object_faces.push(k1);
                    object_faces.push(k2);
                    object_faces.push(k1 + 1);
                }
                if (i != (stackCount - 1)) {
                    object_faces.push(k1 + 1);
                    object_faces.push(k2);
                    object_faces.push(k2 + 1);
                }
            }
        }
        return [vertices, object_faces];
    }

    var generateHalfSphere = function (radius, r, g, b, mulXy, pX, pY, pZ) {
        let stackAngle, sectorAngle;
        const sectorCount = 36;
        const stackCount = 18;

        let sectorStep = 2 * Math.PI / sectorCount;
        let stackStep = Math.PI / stackCount;

        const vertices = [];

        for (let i = 0; i <= stackCount / 2; i++) {
            stackAngle = Math.PI / 2 - i * stackStep;

            var xy = mulXy * radius * Math.cos(stackAngle);
            var z = radius * Math.sin(stackAngle);

            for (let j = 0; j <= sectorCount; j++) {
                sectorAngle = j * sectorStep;

                x = xy * Math.cos(sectorAngle);
                y = xy * Math.sin(sectorAngle);
                vertices.push(x + pX);
                vertices.push(y + pY);
                vertices.push(z + pZ);
                vertices.push(r / 255, g / 255, b / 255);
            }
        }

        var object_faces = [];

        var k1, k2;
        for (let i = 0; i < stackCount; ++i) {
            k1 = i * (sectorCount + 1);
            k2 = k1 + sectorCount + 1;

            for (let j = 0; j < sectorCount; ++j, ++k1, ++k2) {
                if (i != 0) {
                    object_faces.push(k1);
                    object_faces.push(k2);
                    object_faces.push(k1 + 1);
                }

                // k1+1 => k2 => k2+1
                if (i != (stackCount - 1)) {
                    object_faces.push(k1 + 1);
                    object_faces.push(k2);
                    object_faces.push(k2 + 1);
                }
            }
        }
        return [vertices, object_faces];
    }

    // mX, mY, mZ = titik tengah sb X, Y, Z
    // pX, pY, pZ = radius berdasarkan sumbu (kalo x besar y kecil jdie lonjong ke arah sb y dan sebaliknya)
    var generateCircle = function (mX, mY, mZ, pX, pY, pZ, r, g, b) {
        var circle_vertex = [];

        circle_vertex.push(mX, mY, mZ);
        circle_vertex.push(r, g, b);

        for (let i = 0; i <= 360; i++) {
            circle_vertex.push(mX + pX * Math.cos(i / Math.PI));
            circle_vertex.push(mY + pY * Math.sin(i / Math.PI));
            circle_vertex.push(mZ + pZ);
            circle_vertex.push(r / 255);
            circle_vertex.push(g / 255);
            circle_vertex.push(b / 255);
        }

        var circle_faces = [];
        for (let i = 0; i < 360; i++) {
            circle_faces.push(0, i, i + 1);
        }

        return [circle_vertex, circle_faces];
    }

    var generateHalfCircle = function (mX, mY, mZ, pX, pY, pZ, r, g, b) {
        var circle_vertex = [];

        circle_vertex.push(mX, mY, mZ);
        circle_vertex.push(r / 255, g / 255, b / 255);

        for (var i = 0; i <= 180; i++) {            
            var x = pX * Math.cos(LIBS.degToRad(i));
            var y = pY * Math.sin(LIBS.degToRad(i));
            circle_vertex.push(x + mX, y + mY, pZ + mZ);
            circle_vertex.push(r / 255, g / 255, b / 255);
        }

        var circle_faces = [];
        for (var i = 1; i <= 180; i++) {
            circle_faces.push(0, i, i + 1);
        }        

        return [circle_vertex, circle_faces];
    }

    var generateCone = function (mX1, mY1, mZ1, mX2, mY2, mZ2, rX1, rY1, r, g, b) {
        var cone_vertex = [];
        var cone_faces = [];

        cone_vertex.push(mX1, mY1, mZ1);
        cone_vertex.push(r / 255, g / 255, b / 255);
        for (var i = 0; i <= 360; i++) {
            var radian = i / Math.PI;
            var x = rX1 * Math.cos(radian);
            var y = rY1 * Math.sin(radian);
            cone_vertex.push(x + mX2, y + mY2, mZ2);
            cone_vertex.push(r / 255, g / 255, b / 255);
        }

        for (var i = 0; i < 360; i++) {
            cone_faces.push(0, i, i + 1);
        }  
        
        return [cone_vertex, cone_faces];
    }

    // mX, mY, mZ = titik tengah sb X, Y, Z
    // rX, rY, rZ = radius berdasarkan sumbu (kalo x besar y kecil jdie lonjong ke arah sb y dan sebaliknya)
    var generateTabung = function (mX1, mY1, mZ1, mX2, mY2, mZ2, rX1, rY1, rZ1, rX2, rY2, rZ2, r, g, b) {
        var tabung_vertex = [];
        var tabung_faces = [];
        tabung_vertex.push(mX1, mY1, mZ1);
        tabung_vertex.push(r / 255, g / 255, b / 255);

        // lingkaran 1
        for (var i = 0; i <= 360; i++) {
            var radian = i / Math.PI;
            var x = rX1 * Math.cos(radian);
            var z = rZ1 * Math.sin(radian);
            tabung_vertex.push(x + mX1, rY1 + mY1, z + mZ1);
            tabung_vertex.push(r / 255, g / 255, b / 255);
        }

        // middle lingkaran 2
        tabung_vertex.push(mX2, mY2, mZ2);
        tabung_vertex.push(r / 255, g / 255, b / 255);

        // lingkaran 2
        for (var i = 0; i <= 360; i++) {
            var radian = i / Math.PI;
            var x = rX2 * Math.cos(radian);
            var z = rZ2 * Math.sin(radian);
            tabung_vertex.push(x + mX2, rY2 + mY2, z + mZ2);
            tabung_vertex.push(r / 255, g / 255, b / 255);
        }

        for (var i = 1; i < 360; i++) {
            tabung_faces.push(0, i, i + 1);
        }
    
        for (var i = 1; i < 360; i++) {
            tabung_faces.push(361, i + 361, i + 361 + 1);
        }
    
        for (var i = 1; i < 360; i++) {
            tabung_faces.push(i, i + 361, i + 1);
            tabung_faces.push(i + 361, i + 361 + 1, i + 1);
        }

        return [tabung_vertex, tabung_faces];
    }

    var generateCurve = function (array, z) {
        var curve = [];
        var vertex = [];
        var faces = [];

        for (let i = 0; i < array.length;) {
            var node = normalizeScreen(array[i], array[i + 1], CANVAS.width, CANVAS.height);
            curve.push(node[0], node[1]);
            i += 2;
        }
        vertex = generateBSpline(curve, 100, 2, z);

        for (let i = 0; i < vertex.length / 6; i++) {
            faces.push(i);
        }

        return [vertex, faces];
    }

    var object;

    // SPHERE: radius, r, g, b, mulX, mulY, mulZ, pX, pY, pZ
    // CIRCLE: mX, mY, mZ, pX, pY, pZ, r, g, b
    // HALF SPHERE: radius, r, g, b, mulXy, pX, pY, pZ

    var world = new MyObject([], [], shader_vertex_source, shader_fragment_source);

    var pohon = new MyObject([],[], shader_vertex_source, shader_fragment_source);

    object = generateSphere(1.0, 29, 140, 27, 1, 1, 1, 5, 2, -3.5);
    var daun1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.7, 29, 140, 27, 1, 1, 1, 6, 2, -3.5);
    var daun2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.8, 29, 140, 27, 1, 1, 1, 4, 2, -3.5);
    var daun3 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.7, 29, 140, 27, 1, 1, 1, 5, 3, -3.5);
    var daun4 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.5, 29, 140, 27, 1, 1, 1, 6, 3, -3.5);
    var daun5 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.5, 29, 140, 27, 1, 1, 1, 4.1, 2.9, -3.5);
    var daun6 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(5, -1, -3.5, 5, 2, -3.5, 0.35, 0, 0.35, 0.2, 1.2, 0.1, 51, 39, 14)
    var batang = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.15, 250, 0, 0, 1, 1, 1, 3.8, 1.8, -2.7);
    var apel1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.15, 250, 0, 0, 1, 1, 1, 4.8, 2.1, -2.5);
    var apel2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.15, 250, 0, 0, 1, 1, 1, 5.9, 1.8, -2.8);
    var apel3 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.15, 250, 0, 0, 1, 1, 1, 4.1, 2.7, -2.8);
    var apel4 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.15, 250, 0, 0, 1, 1, 1, 5.7, 2.7, -2.8);
    var apel5 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    pohon.addChild(daun1);
    pohon.addChild(daun2);
    pohon.addChild(daun3);
    pohon.addChild(daun4);
    pohon.addChild(daun5);
    pohon.addChild(daun6);
    pohon.addChild(batang);
    pohon.addChild(apel1);
    pohon.addChild(apel2);
    pohon.addChild(apel3);
    pohon.addChild(apel4);
    pohon.addChild(apel5);

    // pohon 2
    var pohon2 = new MyObject([],[], shader_vertex_source, shader_fragment_source);

    object = generateSphere(1.0, 61, 163, 57, 1, 1, 1, -4, 2, -2.5);
    var daun1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.7, 61, 163, 57, 1, 1, 1, -5, 2, -2.5);
    var daun2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.8, 61, 163, 57, 1, 1, 1, -3, 2, -2.5);
    var daun3 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.7, 61, 163, 57, 1, 1, 1, -4, 3, -2.5);
    var daun4 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.5, 61, 163, 57, 1, 1, 1, -5, 3, -2.5);
    var daun5 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.5, 61, 163, 57, 1, 1, 1, -3.1, 2.9, -2.5);
    var daun6 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-4, -0.6, -2.5, -4, 2, -2.5, 0.3, 0, 0.3, 0.2, 1.2, 0.1, 51, 39, 14)
    var batang = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    pohon2.addChild(daun1);
    pohon2.addChild(daun2);
    pohon2.addChild(daun3);
    pohon2.addChild(daun4);
    pohon2.addChild(daun5);
    pohon2.addChild(daun6);
    pohon2.addChild(batang);

    // tanah
    var tanah_vertex = [
        // yellow
        -3.5, -1, -2.5,     92/255, 59/255, 36/255, 
        3.5, -1, -2.5,     92/255, 59/255, 36/255,
        3.5,  -0.8, -2.5,     92/255, 59/255, 36/255,
        -3.5,  -0.8, -2.5,     92/255, 59/255, 36/255,
    
        // blue
        -3.5, -1, 2.5,     92/255, 59/255, 36/255,
        3.5, -1, 2.5,     92/255, 59/255, 36/255,
        3.5,  -0.8, 2.5,     92/255, 59/255, 36/255,
        -3.5,  -0.8, 2.5,     92/255, 59/255, 36/255,
    
        // cyan
        -3.5, -1, -2.5,     92/255, 59/255, 36/255,
        -3.5,  -0.8, -2.5,     92/255, 59/255, 36/255,
        -3.5,  -0.8,  2.5,     92/255, 59/255, 36/255,
        -3.5, -1,  2.5,     92/255, 59/255, 36/255,
    
        // red
        3.5, -1, -2.5,     92/255, 59/255, 36/255,
        3.5,  -0.8, -2.5,     92/255, 59/255, 36/255,
        3.5,  -0.8,  2.5,     92/255, 59/255, 36/255,
        3.5, -1,  2.5,     92/255, 59/255, 36/255,
    
        // pink
        -3.5, -1, -2.5,     92/255, 59/255, 36/255,
        -3.5, -1,  2.5,     92/255, 59/255, 36/255,
        3.5, -1,  2.5,     92/255, 59/255, 36/255,
        3.5, -1, -2.5,     92/255, 59/255, 36/255,
    
        // green
        -3.5, -0.8, -2.5,    25/255, 97/255, 29/255,
        -3.5, -0.8,  2.5,    25/255, 97/255, 29/255,
        3.5, -0.8,  2.5,     25/255, 97/255, 29/255,
        3.5, -0.8, -2.5,     25/255, 97/255, 29/255,
      ];

    var balok_faces = [
        0, 1, 2,
        0, 2, 3,
   
        4, 5, 6,
        4, 6, 7,
   
        8, 9, 10,
        8, 10, 11,
   
        12, 13, 14,
        12, 14, 15,
   
        16, 17, 18,
        16, 18, 19,
   
        20, 21, 22,
        20, 22, 23
    ];

    var tanah = new MyObject(tanah_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

    // path
    var path_vertex = [
        -3.49, -0.9, -0.5,     150/255, 144/255, 137/255, 
        3.49, -0.9, -0.5,     150/255, 144/255, 137/255,
        3.49,  -0.79, -0.5,     150/255, 144/255, 137/255,
        -3.49,  -0.79, -0.5,     150/255, 144/255, 137/255,
    
        -3.49, -0.9, 1,     150/255, 144/255, 137/255,
        3.49, -0.9, 1,     150/255, 144/255, 137/255,
        3.49,  -0.79, 1,     150/255, 144/255, 137/255,
        -3.49,  -0.79, 1,     150/255, 144/255, 137/255,
    
        -3.49, -0.9, -0.5,     150/255, 144/255, 137/255,
        -3.49,  -0.79, -0.5,     150/255, 144/255, 137/255,
        -3.49,  -0.79,  1,     150/255, 144/255, 137/255,
        -3.49, -0.9,  1,     150/255, 144/255, 137/255,
    
        3.49, -0.9, -0.5,     150/255, 144/255, 137/255,
        3.49,  -0.79, -0.5,     150/255, 144/255, 137/255,
        3.49,  -0.79,  1,     150/255, 144/255, 137/255,
        3.49, -0.9,  1,     150/255, 144/255, 137/255,
    
        -3.49, -0.9, -0.5,     150/255, 144/255, 137/255,
        -3.49, -0.9,  1,     150/255, 144/255, 137/255,
        3.49, -0.9,  1,     150/255, 144/255, 137/255,
        3.49, -0.9, -0.5,     150/255, 144/255, 137/255,
    
        -3.49, -0.79, -0.5,    150/255, 144/255, 137/255,
        -3.49, -0.79,  1,    150/255, 144/255, 137/255,
        3.49, -0.79,  1,     150/255, 144/255, 137/255,
        3.49, -0.79, -0.5,     150/255, 144/255, 137/255,
      ];

      var path = new MyObject(path_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence1
    var fence1_vertex = [
        -3.4, -0.8, -2.2,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -2.2,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -2.2,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -2.2,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -2.1,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -2.1,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -2.1,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -2.2,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -2.2,     150/255, 114/255, 71/255, 
        -3.4,  -0.45,  -2.1,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  -2.1,     150/255, 114/255, 71/255, 
    
        -3.35, -0.8, -2.2,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -2.2,     150/255, 114/255, 71/255, 
        -3.35,  -0.45,  -2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  -2.1,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -2.2,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  -2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  -2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -2.2,     150/255, 114/255, 71/255, 
    
        -3.4, -0.45, -2.2,    150/255, 114/255, 71/255, 
        -3.4, -0.45,  -2.1,    150/255, 114/255, 71/255, 
        -3.35, -0.45,  -2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.45, -2.2,     150/255, 114/255, 71/255, 
      ];

      var fence1 = new MyObject(fence1_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

    // fence2
    var fence2_vertex = [
        -3.4, -0.8, -1.8,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -1.8,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -1.8,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -1.8,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -1.7,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -1.7,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -1.7,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -1.8,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -1.8,     150/255, 114/255, 71/255, 
        -3.4,  -0.45,  -1.7,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  -1.7,     150/255, 114/255, 71/255, 
    
        -3.35, -0.8, -1.8,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -1.8,     150/255, 114/255, 71/255, 
        -3.35,  -0.45,  -1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  -1.7,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -1.8,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  -1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  -1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -1.8,     150/255, 114/255, 71/255, 
    
        -3.4, -0.45, -1.8,    150/255, 114/255, 71/255, 
        -3.4, -0.45,  -1.7,    150/255, 114/255, 71/255, 
        -3.35, -0.45,  -1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.45, -1.8,     150/255, 114/255, 71/255, 
      ];

      var fence2 = new MyObject(fence2_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence3
    var fence3_vertex = [
        -3.4, -0.8, -1.4,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -1.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -1.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -1.4,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -1.3,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -1.3,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -1.3,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -1.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -1.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.45,  -1.3,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  -1.3,     150/255, 114/255, 71/255, 
    
        -3.35, -0.8, -1.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -1.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.45,  -1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  -1.3,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -1.4,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  -1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  -1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -1.4,     150/255, 114/255, 71/255, 
    
        -3.4, -0.45, -1.4,    150/255, 114/255, 71/255, 
        -3.4, -0.45,  -1.3,    150/255, 114/255, 71/255, 
        -3.35, -0.45,  -1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.45, -1.4,     150/255, 114/255, 71/255, 
      ];

      var fence3 = new MyObject(fence3_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence4
    var fence4_vertex = [
        -3.4, -0.8, -1,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -1,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -1,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -1,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -0.9,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -0.9,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -0.9,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -0.9,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -1,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, -1,     150/255, 114/255, 71/255, 
        -3.4,  -0.45,  -0.9,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  -0.9,     150/255, 114/255, 71/255, 
    
        -3.35, -0.8, -1,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, -1,     150/255, 114/255, 71/255, 
        -3.35,  -0.45,  -0.9,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  -0.9,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, -1,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  -0.9,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  -0.9,     150/255, 114/255, 71/255, 
        -3.35, -0.8, -1,     150/255, 114/255, 71/255, 
    
        -3.4, -0.45, -1,    150/255, 114/255, 71/255, 
        -3.4, -0.45,  -0.9,    150/255, 114/255, 71/255, 
        -3.35, -0.45,  -0.9,     150/255, 114/255, 71/255, 
        -3.35, -0.45, -1,     150/255, 114/255, 71/255, 
      ];

      var fence4 = new MyObject(fence4_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

            // fence5
    var fence5_vertex = [
        3.4, -0.8, -2.2,     150/255, 114/255, 71/255, 
        3.35, -0.8, -2.2,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -2.2,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -2.2,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -2.1,     150/255, 114/255, 71/255, 
        3.35, -0.8, -2.1,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -2.1,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -2.1,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -2.2,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -2.2,     150/255, 114/255, 71/255, 
        3.4,  -0.45,  -2.1,     150/255, 114/255, 71/255, 
        3.4, -0.8,  -2.1,     150/255, 114/255, 71/255, 
    
        3.35, -0.8, -2.2,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -2.2,     150/255, 114/255, 71/255, 
        3.35,  -0.45,  -2.1,     150/255, 114/255, 71/255, 
        3.35, -0.8,  -2.1,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -2.2,     150/255, 114/255, 71/255, 
        3.4, -0.8,  -2.1,     150/255, 114/255, 71/255, 
        3.35, -0.8,  -2.1,     150/255, 114/255, 71/255, 
        3.35, -0.8, -2.2,     150/255, 114/255, 71/255, 
    
        3.4, -0.45, -2.2,    150/255, 114/255, 71/255, 
        3.4, -0.45,  -2.1,    150/255, 114/255, 71/255, 
        3.35, -0.45,  -2.1,     150/255, 114/255, 71/255, 
        3.35, -0.45, -2.2,     150/255, 114/255, 71/255, 
      ];

      var fence5 = new MyObject(fence5_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

    // fence6
    var fence6_vertex = [
        3.4, -0.8, -1.8,     150/255, 114/255, 71/255, 
        3.35, -0.8, -1.8,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -1.8,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -1.8,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -1.7,     150/255, 114/255, 71/255, 
        3.35, -0.8, -1.7,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -1.7,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -1.7,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -1.8,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -1.8,     150/255, 114/255, 71/255, 
        3.4,  -0.45,  -1.7,     150/255, 114/255, 71/255, 
        3.4, -0.8,  -1.7,     150/255, 114/255, 71/255, 
    
        3.35, -0.8, -1.8,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -1.8,     150/255, 114/255, 71/255, 
        3.35,  -0.45,  -1.7,     150/255, 114/255, 71/255, 
        3.35, -0.8,  -1.7,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -1.8,     150/255, 114/255, 71/255, 
        3.4, -0.8,  -1.7,     150/255, 114/255, 71/255, 
        3.35, -0.8,  -1.7,     150/255, 114/255, 71/255, 
        3.35, -0.8, -1.8,     150/255, 114/255, 71/255, 
    
        3.4, -0.45, -1.8,    150/255, 114/255, 71/255, 
        3.4, -0.45,  -1.7,    150/255, 114/255, 71/255, 
        3.35, -0.45,  -1.7,     150/255, 114/255, 71/255, 
        3.35, -0.45, -1.8,     150/255, 114/255, 71/255, 
      ];

      var fence6 = new MyObject(fence6_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence7
    var fence7_vertex = [
        3.4, -0.8, -1.4,     150/255, 114/255, 71/255, 
        3.35, -0.8, -1.4,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -1.4,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -1.4,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -1.3,     150/255, 114/255, 71/255, 
        3.35, -0.8, -1.3,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -1.3,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -1.3,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -1.4,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -1.4,     150/255, 114/255, 71/255, 
        3.4,  -0.45,  -1.3,     150/255, 114/255, 71/255, 
        3.4, -0.8,  -1.3,     150/255, 114/255, 71/255, 
    
        3.35, -0.8, -1.4,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -1.4,     150/255, 114/255, 71/255, 
        3.35,  -0.45,  -1.3,     150/255, 114/255, 71/255, 
        3.35, -0.8,  -1.3,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -1.4,     150/255, 114/255, 71/255, 
        3.4, -0.8,  -1.3,     150/255, 114/255, 71/255, 
        3.35, -0.8,  -1.3,     150/255, 114/255, 71/255, 
        3.35, -0.8, -1.4,     150/255, 114/255, 71/255, 
    
        3.4, -0.45, -1.4,    150/255, 114/255, 71/255, 
        3.4, -0.45,  -1.3,    150/255, 114/255, 71/255, 
        3.35, -0.45,  -1.3,     150/255, 114/255, 71/255, 
        3.35, -0.45, -1.4,     150/255, 114/255, 71/255, 
      ];

      var fence7 = new MyObject(fence7_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence8
    var fence8_vertex = [
        3.4, -0.8, -1,     150/255, 114/255, 71/255, 
        3.35, -0.8, -1,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -1,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -1,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -0.9,     150/255, 114/255, 71/255, 
        3.35, -0.8, -0.9,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -0.9,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -0.9,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -1,     150/255, 114/255, 71/255, 
        3.4,  -0.45, -1,     150/255, 114/255, 71/255, 
        3.4,  -0.45,  -0.9,     150/255, 114/255, 71/255, 
        3.4, -0.8,  -0.9,     150/255, 114/255, 71/255, 
    
        3.35, -0.8, -1,     150/255, 114/255, 71/255, 
        3.35,  -0.45, -1,     150/255, 114/255, 71/255, 
        3.35,  -0.45,  -0.9,     150/255, 114/255, 71/255, 
        3.35, -0.8,  -0.9,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, -1,     150/255, 114/255, 71/255, 
        3.4, -0.8,  -0.9,     150/255, 114/255, 71/255, 
        3.35, -0.8,  -0.9,     150/255, 114/255, 71/255, 
        3.35, -0.8, -1,     150/255, 114/255, 71/255, 
    
        3.4, -0.45, -1,    150/255, 114/255, 71/255, 
        3.4, -0.45,  -0.9,    150/255, 114/255, 71/255, 
        3.35, -0.45,  -0.9,     150/255, 114/255, 71/255, 
        3.35, -0.45, -1,     150/255, 114/255, 71/255, 
      ];

      var fence8 = new MyObject(fence8_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence11
    var fence11_vertex = [
        -3.4, -0.8, 1.4,     150/255, 114/255, 71/255, 
        -3.35, -0.8, 1.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, 1.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, 1.4,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, 1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.8, 1.3,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, 1.3,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, 1.3,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, 1.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, 1.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.45,  1.3,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  1.3,     150/255, 114/255, 71/255, 
    
        -3.35, -0.8, 1.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, 1.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.45,  1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  1.3,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, 1.4,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.8, 1.4,     150/255, 114/255, 71/255, 
    
        -3.4, -0.45, 1.4,    150/255, 114/255, 71/255, 
        -3.4, -0.45,  1.3,    150/255, 114/255, 71/255, 
        -3.35, -0.45,  1.3,     150/255, 114/255, 71/255, 
        -3.35, -0.45, 1.4,     150/255, 114/255, 71/255, 
      ];

      var fence11 = new MyObject(fence11_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

    // fence12
    var fence12_vertex = [
        -3.4, -0.8, 1.8,     150/255, 114/255, 71/255, 
        -3.35, -0.8, 1.8,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, 1.8,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, 1.8,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, 1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.8, 1.7,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, 1.7,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, 1.7,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, 1.8,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, 1.8,     150/255, 114/255, 71/255, 
        -3.4,  -0.45,  1.7,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  1.7,     150/255, 114/255, 71/255, 
    
        -3.35, -0.8, 1.8,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, 1.8,     150/255, 114/255, 71/255, 
        -3.35,  -0.45,  1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  1.7,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, 1.8,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.8, 1.8,     150/255, 114/255, 71/255, 
    
        -3.4, -0.45, 1.8,    150/255, 114/255, 71/255, 
        -3.4, -0.45,  1.7,    150/255, 114/255, 71/255, 
        -3.35, -0.45,  1.7,     150/255, 114/255, 71/255, 
        -3.35, -0.45, 1.8,     150/255, 114/255, 71/255, 
      ];

      var fence12 = new MyObject(fence12_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence13
    var fence13_vertex = [
        -3.4, -0.8, 2.2,     150/255, 114/255, 71/255, 
        -3.35, -0.8, 2.2,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, 2.2,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, 2.2,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, 2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.8, 2.1,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, 2.1,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, 2.1,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, 2.2,     150/255, 114/255, 71/255, 
        -3.4,  -0.45, 2.2,     150/255, 114/255, 71/255, 
        -3.4,  -0.45,  2.1,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  2.1,     150/255, 114/255, 71/255, 
    
        -3.35, -0.8, 2.2,     150/255, 114/255, 71/255, 
        -3.35,  -0.45, 2.2,     150/255, 114/255, 71/255, 
        -3.35,  -0.45,  2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  2.1,     150/255, 114/255, 71/255, 
    
        -3.4, -0.8, 2.2,     150/255, 114/255, 71/255, 
        -3.4, -0.8,  2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.8,  2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.8, 2.2,     150/255, 114/255, 71/255, 
    
        -3.4, -0.45, 2.2,    150/255, 114/255, 71/255, 
        -3.4, -0.45,  2.1,    150/255, 114/255, 71/255, 
        -3.35, -0.45,  2.1,     150/255, 114/255, 71/255, 
        -3.35, -0.45, 2.2,     150/255, 114/255, 71/255, 
      ];

      var fence13 = new MyObject(fence13_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

    // fence14
    var fence14_vertex = [
        3.4, -0.8, 1.4,     150/255, 114/255, 71/255, 
        3.35, -0.8, 1.4,     150/255, 114/255, 71/255, 
        3.35,  -0.45, 1.4,     150/255, 114/255, 71/255, 
        3.4,  -0.45, 1.4,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, 1.3,     150/255, 114/255, 71/255, 
        3.35, -0.8, 1.3,     150/255, 114/255, 71/255, 
        3.35,  -0.45, 1.3,     150/255, 114/255, 71/255, 
        3.4,  -0.45, 1.3,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, 1.4,     150/255, 114/255, 71/255, 
        3.4,  -0.45, 1.4,     150/255, 114/255, 71/255, 
        3.4,  -0.45,  1.3,     150/255, 114/255, 71/255, 
        3.4, -0.8,  1.3,     150/255, 114/255, 71/255, 
    
        3.35, -0.8, 1.4,     150/255, 114/255, 71/255, 
        3.35,  -0.45, 1.4,     150/255, 114/255, 71/255, 
        3.35,  -0.45,  1.3,     150/255, 114/255, 71/255, 
        3.35, -0.8,  1.3,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, 1.4,     150/255, 114/255, 71/255, 
        3.4, -0.8,  1.3,     150/255, 114/255, 71/255, 
        3.35, -0.8,  1.3,     150/255, 114/255, 71/255, 
        3.35, -0.8, 1.4,     150/255, 114/255, 71/255, 
    
        3.4, -0.45, 1.4,    150/255, 114/255, 71/255, 
        3.4, -0.45,  1.3,    150/255, 114/255, 71/255, 
        3.35, -0.45,  1.3,     150/255, 114/255, 71/255, 
        3.35, -0.45, 1.4,     150/255, 114/255, 71/255, 
      ];

      var fence14 = new MyObject(fence14_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

    // fence15
    var fence15_vertex = [
        3.4, -0.8, 1.8,     150/255, 114/255, 71/255, 
        3.35, -0.8, 1.8,     150/255, 114/255, 71/255, 
        3.35,  -0.45, 1.8,     150/255, 114/255, 71/255, 
        3.4,  -0.45, 1.8,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, 1.7,     150/255, 114/255, 71/255, 
        3.35, -0.8, 1.7,     150/255, 114/255, 71/255, 
        3.35,  -0.45, 1.7,     150/255, 114/255, 71/255, 
        3.4,  -0.45, 1.7,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, 1.8,     150/255, 114/255, 71/255, 
        3.4,  -0.45, 1.8,     150/255, 114/255, 71/255, 
        3.4,  -0.45,  1.7,     150/255, 114/255, 71/255, 
        3.4, -0.8,  1.7,     150/255, 114/255, 71/255, 
    
        3.35, -0.8, 1.8,     150/255, 114/255, 71/255, 
        3.35,  -0.45, 1.8,     150/255, 114/255, 71/255, 
        3.35,  -0.45,  1.7,     150/255, 114/255, 71/255, 
        3.35, -0.8,  1.7,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, 1.8,     150/255, 114/255, 71/255, 
        3.4, -0.8,  1.7,     150/255, 114/255, 71/255, 
        3.35, -0.8,  1.7,     150/255, 114/255, 71/255, 
        3.35, -0.8, 1.8,     150/255, 114/255, 71/255, 
    
        3.4, -0.45, 1.8,    150/255, 114/255, 71/255, 
        3.4, -0.45,  1.7,    150/255, 114/255, 71/255, 
        3.35, -0.45,  1.7,     150/255, 114/255, 71/255, 
        3.35, -0.45, 1.8,     150/255, 114/255, 71/255, 
      ];

      var fence15 = new MyObject(fence15_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence16
    var fence16_vertex = [
        3.4, -0.8, 2.2,     150/255, 114/255, 71/255, 
        3.35, -0.8, 2.2,     150/255, 114/255, 71/255, 
        3.35,  -0.45, 2.2,     150/255, 114/255, 71/255, 
        3.4,  -0.45, 2.2,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, 2.1,     150/255, 114/255, 71/255, 
        3.35, -0.8, 2.1,     150/255, 114/255, 71/255, 
        3.35,  -0.45, 2.1,     150/255, 114/255, 71/255, 
        3.4,  -0.45, 2.1,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, 2.2,     150/255, 114/255, 71/255, 
        3.4,  -0.45, 2.2,     150/255, 114/255, 71/255, 
        3.4,  -0.45,  2.1,     150/255, 114/255, 71/255, 
        3.4, -0.8,  2.1,     150/255, 114/255, 71/255, 
    
        3.35, -0.8, 2.2,     150/255, 114/255, 71/255, 
        3.35,  -0.45, 2.2,     150/255, 114/255, 71/255, 
        3.35,  -0.45,  2.1,     150/255, 114/255, 71/255, 
        3.35, -0.8,  2.1,     150/255, 114/255, 71/255, 
    
        3.4, -0.8, 2.2,     150/255, 114/255, 71/255, 
        3.4, -0.8,  2.1,     150/255, 114/255, 71/255, 
        3.35, -0.8,  2.1,     150/255, 114/255, 71/255, 
        3.35, -0.8, 2.2,     150/255, 114/255, 71/255, 
    
        3.4, -0.45, 2.2,    150/255, 114/255, 71/255, 
        3.4, -0.45,  2.1,    150/255, 114/255, 71/255, 
        3.35, -0.45,  2.1,     150/255, 114/255, 71/255, 
        3.35, -0.45, 2.2,     150/255, 114/255, 71/255, 
      ];

      var fence16 = new MyObject(fence16_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

       // fence_h1
    var fence_h1_vertex = [
        3.4, -0.65, -2.4,     150/255, 114/255, 71/255, 
        3.35, -0.65, -2.4,     150/255, 114/255, 71/255, 
        3.35,  -0.55, -2.4,     150/255, 114/255, 71/255, 
        3.4,  -0.55, -2.4,     150/255, 114/255, 71/255, 
    
        3.4, -0.65, -0.7,     150/255, 114/255, 71/255, 
        3.35, -0.65, -0.7,     150/255, 114/255, 71/255, 
        3.35,  -0.55, -0.7,     150/255, 114/255, 71/255, 
        3.4,  -0.55, -0.7,     150/255, 114/255, 71/255, 
    
        3.4, -0.65, -2.4,     150/255, 114/255, 71/255, 
        3.4,  -0.55, -2.4,     150/255, 114/255, 71/255, 
        3.4,  -0.55,  -0.7,     150/255, 114/255, 71/255, 
        3.4, -0.65,  -0.7,     150/255, 114/255, 71/255, 
    
        3.35, -0.65, -2.4,     150/255, 114/255, 71/255, 
        3.35,  -0.55, -2.4,     150/255, 114/255, 71/255, 
        3.35,  -0.55,  -0.7,     150/255, 114/255, 71/255, 
        3.35, -0.65,  -0.7,     150/255, 114/255, 71/255, 
    
        3.4, -0.65, -2.4,     150/255, 114/255, 71/255, 
        3.4, -0.65,  -0.7,     150/255, 114/255, 71/255, 
        3.35, -0.65,  -0.7,     150/255, 114/255, 71/255, 
        3.35, -0.65, -2.4,     150/255, 114/255, 71/255, 
    
        3.4, -0.55, -2.4,    150/255, 114/255, 71/255, 
        3.4, -0.55,  -0.7,    150/255, 114/255, 71/255, 
        3.35, -0.55,  -0.7,     150/255, 114/255, 71/255, 
        3.35, -0.55, -2.4,     150/255, 114/255, 71/255, 
      ];

      var fence_h1 = new MyObject(fence_h1_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence_h2
    var fence_h2_vertex = [
        -3.4, -0.65, -2.4,     150/255, 114/255, 71/255, 
        -3.35, -0.65, -2.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.55, -2.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.55, -2.4,     150/255, 114/255, 71/255, 
    
        -3.4, -0.65, -0.7,     150/255, 114/255, 71/255, 
        -3.35, -0.65, -0.7,     150/255, 114/255, 71/255, 
        -3.35,  -0.55, -0.7,     150/255, 114/255, 71/255, 
        -3.4,  -0.55, -0.7,     150/255, 114/255, 71/255, 
    
        -3.4, -0.65, -2.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.55, -2.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.55,  -0.7,     150/255, 114/255, 71/255, 
        -3.4, -0.65,  -0.7,     150/255, 114/255, 71/255, 
    
        -3.35, -0.65, -2.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.55, -2.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.55,  -0.7,     150/255, 114/255, 71/255, 
        -3.35, -0.65,  -0.7,     150/255, 114/255, 71/255, 
    
        -3.4, -0.65, -2.4,     150/255, 114/255, 71/255, 
        -3.4, -0.65,  -0.7,     150/255, 114/255, 71/255, 
        -3.35, -0.65,  -0.7,     150/255, 114/255, 71/255, 
        -3.35, -0.65, -2.4,     150/255, 114/255, 71/255, 
    
        -3.4, -0.55, -2.4,    150/255, 114/255, 71/255, 
        -3.4, -0.55,  -0.7,    150/255, 114/255, 71/255, 
        -3.35, -0.55,  -0.7,     150/255, 114/255, 71/255, 
        -3.35, -0.55, -2.4,     150/255, 114/255, 71/255, 
      ];

      var fence_h2 = new MyObject(fence_h2_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

             // fence_h3
    var fence_h3_vertex = [
        3.4, -0.65, 1.1,     150/255, 114/255, 71/255, 
        3.35, -0.65, 1.1,     150/255, 114/255, 71/255, 
        3.35,  -0.55, 1.1,     150/255, 114/255, 71/255, 
        3.4,  -0.55, 1.1,     150/255, 114/255, 71/255, 
    
        3.4, -0.65, 2.4,     150/255, 114/255, 71/255, 
        3.35, -0.65, 2.4,     150/255, 114/255, 71/255, 
        3.35,  -0.55, 2.4,     150/255, 114/255, 71/255, 
        3.4,  -0.55, 2.4,     150/255, 114/255, 71/255, 
    
        3.4, -0.65, 1.1,     150/255, 114/255, 71/255, 
        3.4,  -0.55, 1.1,     150/255, 114/255, 71/255, 
        3.4,  -0.55,  2.4,     150/255, 114/255, 71/255, 
        3.4, -0.65,  2.4,     150/255, 114/255, 71/255, 
    
        3.35, -0.65, 1.1,     150/255, 114/255, 71/255, 
        3.35,  -0.55, 1.1,     150/255, 114/255, 71/255, 
        3.35,  -0.55,  2.4,     150/255, 114/255, 71/255, 
        3.35, -0.65,  2.4,     150/255, 114/255, 71/255, 
    
        3.4, -0.65, 1.1,     150/255, 114/255, 71/255, 
        3.4, -0.65,  2.4,     150/255, 114/255, 71/255, 
        3.35, -0.65,  2.4,     150/255, 114/255, 71/255, 
        3.35, -0.65, 1.1,     150/255, 114/255, 71/255, 
    
        3.4, -0.55, 1.1,    150/255, 114/255, 71/255, 
        3.4, -0.55,  2.4,    150/255, 114/255, 71/255, 
        3.35, -0.55,  2.4,     150/255, 114/255, 71/255, 
        3.35, -0.55, 1.1,     150/255, 114/255, 71/255, 
      ];

      var fence_h3 = new MyObject(fence_h3_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

      // fence_h4
    var fence_h4_vertex = [
        -3.4, -0.65, 1.1,     150/255, 114/255, 71/255, 
        -3.35, -0.65, 1.1,     150/255, 114/255, 71/255, 
        -3.35,  -0.55, 1.1,     150/255, 114/255, 71/255, 
        -3.4,  -0.55, 1.1,     150/255, 114/255, 71/255, 
    
        -3.4, -0.65, 2.4,     150/255, 114/255, 71/255, 
        -3.35, -0.65, 2.4,     150/255, 114/255, 71/255, 
        -3.35,  -0.55, 2.4,     150/255, 114/255, 71/255, 
        -3.4,  -0.55, 2.4,     150/255, 114/255, 71/255, 
    
        -3.4, -0.65, 1.1,     150/255, 114/255, 71/255, 
        -3.4,  -0.55, 1.1,     150/255, 114/255, 71/255, 
        -3.4,  -0.55,  2.4,     150/255, 114/255, 71/255, 
        -3.4, -0.65,  2.4,     150/255, 114/255, 71/255, 
    
        -3.35, -0.65, 1.1,     150/255, 114/255, 71/255, 
        -3.35,  -0.55, 1.1,     150/255, 114/255, 71/255, 
        -3.35,  -0.55,  2.4,     150/255, 114/255, 71/255, 
        -3.35, -0.65,  2.4,     150/255, 114/255, 71/255, 
    
        -3.4, -0.65, 1.1,     150/255, 114/255, 71/255, 
        -3.4, -0.65,  2.4,     150/255, 114/255, 71/255, 
        -3.35, -0.65,  2.4,     150/255, 114/255, 71/255, 
        -3.35, -0.65, 1.1,     150/255, 114/255, 71/255, 
    
        -3.4, -0.55, 1.1,    150/255, 114/255, 71/255, 
        -3.4, -0.55,  2.4,    150/255, 114/255, 71/255, 
        -3.35, -0.55,  2.4,     150/255, 114/255, 71/255, 
        -3.35, -0.55, 1.1,     150/255, 114/255, 71/255, 
      ];

      var fence_h4 = new MyObject(fence_h4_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

    // kursi
    var papan_vertex = [
        -1, -0.45, -2,     66/255, 56/255, 43/255, 
        1, -0.45, -2,     66/255, 56/255, 43/255,
        1,  -0.35, -2,     66/255, 56/255, 43/255,
        -1,  -0.35, -2,     66/255, 56/255, 43/255,
    
        -1, -0.45, -1.5,     66/255, 56/255, 43/255,
        1, -0.45, -1.5,     66/255, 56/255, 43/255,
        1,  -0.35, -1.5,     66/255, 56/255, 43/255,
        -1,  -0.35, -1.5,     66/255, 56/255, 43/255,
    
        -1, -0.45, -2,     66/255, 56/255, 43/255,
        -1,  -0.35, -2,     66/255, 56/255, 43/255,
        -1,  -0.35,  -1.5,     66/255, 56/255, 43/255,
        -1, -0.45,  -1.5,     66/255, 56/255, 43/255,
    
        1, -0.45, -2,     66/255, 56/255, 43/255,
        1,  -0.35, -2,     66/255, 56/255, 43/255,
        1,  -0.35,  -1.5,     66/255, 56/255, 43/255,
        1, -0.45,  -1.5,     66/255, 56/255, 43/255,
    
        -1, -0.45, -2,     66/255, 56/255, 43/255,
        -1, -0.45,  -1.5,     66/255, 56/255, 43/255,
        1, -0.45,  -1.5,     66/255, 56/255, 43/255,
        1, -0.45, -2,     66/255, 56/255, 43/255,
    
        -1, -0.35, -2,    92/255, 59/255, 36/255,
        -1, -0.35,  -1.5,    92/255, 59/255, 36/255,
        1, -0.35,  -1.5,     92/255, 59/255, 36/255,
        1, -0.35, -2,     92/255, 59/255, 36/255,
      ];

    var tiang1_vertex = [
        -1, -0.8, -2,     133/255, 133/255, 133/255, 
        -0.9, -0.8, -2,     133/255, 133/255, 133/255,
        -0.9,  -0.45, -2,     133/255, 133/255, 133/255,
        -1,  -0.45, -2,     133/255, 133/255, 133/255,
    
        -1, -0.8, -1.5,     133/255, 133/255, 133/255,
        -0.9, -0.8, -1.5,     133/255, 133/255, 133/255,
        -0.9,  -0.45, -1.5,     133/255, 133/255, 133/255,
        -1,  -0.45, -1.5,     133/255, 133/255, 133/255,
    
        -1, -0.8, -2,     133/255, 133/255, 133/255,
        -1,  -0.45, -2,     133/255, 133/255, 133/255,
        -1,  -0.45,  -1.5,     133/255, 133/255, 133/255,
        -1, -0.8,  -1.5,     133/255, 133/255, 133/255,
    
        -0.9, -0.8, -2,     133/255, 133/255, 133/255,
        -0.9,  -0.45, -2,     133/255, 133/255, 133/255,
        -0.9,  -0.45,  -1.5,     133/255, 133/255, 133/255,
        -0.9, -0.8,  -1.5,     133/255, 133/255, 133/255,
    
        -1, -0.8, -2,     133/255, 133/255, 133/255,
        -1, -0.8,  -1.5,     133/255, 133/255, 133/255,
        -0.9, -0.8,  -1.5,     133/255, 133/255, 133/255,
        -0.9, -0.8, -2,     133/255, 133/255, 133/255,
    
        -1, -0.45, -2,    133/255, 133/255, 133/255,
        -1, -0.45,  -1.5,    133/255, 133/255, 133/255,
        -0.9, -0.45,  -1.5,     133/255, 133/255, 133/255,
        -0.9, -0.45, -2,     133/255, 133/255, 133/255,
      ];

      var tiang2_vertex = [
        1, -0.8, -2,     133/255, 133/255, 133/255, 
        0.9, -0.8, -2,     133/255, 133/255, 133/255,
        0.9,  -0.45, -2,     133/255, 133/255, 133/255,
        1,  -0.45, -2,     133/255, 133/255, 133/255,
    
        1, -0.8, -1.5,     133/255, 133/255, 133/255,
        0.9, -0.8, -1.5,     133/255, 133/255, 133/255,
        0.9,  -0.45, -1.5,     133/255, 133/255, 133/255,
        1,  -0.45, -1.5,     133/255, 133/255, 133/255,
    
        1, -0.8, -2,     133/255, 133/255, 133/255,
        1,  -0.45, -2,     133/255, 133/255, 133/255,
        1,  -0.45,  -1.5,     133/255, 133/255, 133/255,
        1, -0.8,  -1.5,     133/255, 133/255, 133/255,
    
        0.9, -0.8, -2,     133/255, 133/255, 133/255,
        0.9,  -0.45, -2,     133/255, 133/255, 133/255,
        0.9,  -0.45,  -1.5,     133/255, 133/255, 133/255,
        0.9, -0.8,  -1.5,     133/255, 133/255, 133/255,
    
        1, -0.8, -2,     133/255, 133/255, 133/255,
        1, -0.8,  -1.5,     133/255, 133/255, 133/255,
        0.9, -0.8,  -1.5,     133/255, 133/255, 133/255,
        0.9, -0.8, -2,     133/255, 133/255, 133/255,
    
        1, -0.45, -2,    133/255, 133/255, 133/255,
        1, -0.45,  -1.5,    133/255, 133/255, 133/255,
        0.9, -0.45,  -1.5,     133/255, 133/255, 133/255,
        0.9, -0.45, -2,     133/255, 133/255, 133/255,
      ];

    var kursi = new MyObject(papan_vertex, balok_faces, shader_vertex_source, shader_fragment_source);
    var tiang1 = new MyObject(tiang1_vertex, balok_faces, shader_vertex_source, shader_fragment_source);
    var tiang2 = new MyObject(tiang2_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

    kursi.addChild(tiang1);
    kursi.addChild(tiang2);

    var cone = new MyObject([],[], shader_vertex_source, shader_fragment_source);

    object = generateCone(-2, 2, -0.1, -2, 2, -0.8, 0.2, 0.2, 240, 91, 5);
    var cone_atas = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-2, -0.8, -2, -2, -0.8, -2, 0.25, 0, 0.25, 0.25, 0.07, 0.25, 125, 52, 10)
    var cone_bawah = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    cone.addChild(cone_atas);
    cone.addChild(cone_bawah);

    var lampu = new MyObject([],[], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.13, 235, 210, 52, 1, 1, 1, 1.4, 0.45, -1.5);
    var bola_lampu = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(1.4, 0.3, -1.5, 1.4, 0.3, -1.5, 0.15, 0, 0.15, 0.15, 0.1, 0.15, 0, 128, 128, 128)
    var bawah_bola = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(1.4, 0.25, -1.5, 1.4, 0.25, -1.5, 0.1, 0, 0.1, 0.1, 0.07, 0.1, 0, 128, 128, 128)
    var bawah_bola2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(1.4, 0.25, -1.5, 1.4, 0.25, -1.5, 0.04, 0, 0.04, 0.04, -1, 0.04, 0, 128, 128, 128)
    var tiang_lampu = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(1.4, -0.8, -1.5, 1.4, -0.8, -1.5, 0.15, 0, 0.15, 0.15, 0.05, 0.15, 0, 128, 128, 128)
    var bawah_tiang = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    var lampu2 = new MyObject([],[], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.13, 235, 210, 52, 1, 1, 1, -1.4, 0.45, -1.5);
    var bola_lampu2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-1.4, 0.3, -1.5, -1.4, 0.3, -1.5, 0.15, 0, 0.15, 0.15, 0.1, 0.15, 0, 128, 128, 128)
    var bawah_bola12 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-1.4, 0.25, -1.5, -1.4, 0.25, -1.5, 0.1, 0, 0.1, 0.1, 0.07, 0.1, 0, 128, 128, 128)
    var bawah_bola22 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-1.4, 0.25, -1.5, -1.4, 0.25, -1.5, 0.04, 0, 0.04, 0.04, -1, 0.04, 0, 128, 128, 128)
    var tiang_lampu2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-1.4, -0.8, -1.5, -1.4, -0.8, -1.5, 0.15, 0, 0.15, 0.15, 0.05, 0.15, 0, 128, 128, 128)
    var bawah_tiang2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    lampu.addChild(bola_lampu);
    lampu.addChild(bawah_bola);
    lampu.addChild(bawah_bola2);
    lampu.addChild(tiang_lampu);
    lampu.addChild(bawah_tiang);

    lampu2.addChild(bola_lampu2);
    lampu2.addChild(bawah_bola12);
    lampu2.addChild(bawah_bola22);
    lampu2.addChild(tiang_lampu2);
    lampu2.addChild(bawah_tiang2);

    var bush = new MyObject([],[], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.3, 29, 56, 28, 1, 1, 1, -2.55, -0.4, -1);
    var daun_bush = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.2, 29, 56, 28, 1.3, 1, 1, -2.25, -0.4, -1.2);
    var daun_bush2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.2, 29, 56, 28, 1.2, 1, 1, -2.95, -0.5, -1);
    var daun_bush3 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    bush.addChild(daun_bush);
    bush.addChild(daun_bush2);
    bush.addChild(daun_bush3);

    var awan = new MyObject([],[], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.6, 235, 232, 232, 1.5, 0.5, 1, 1, 3, -4);
    var awan11 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.5, 235, 232, 232, 1.3, 0.3, 1, 0, 3, -4);
    var awan12 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.5, 235, 232, 232, 1.8, 0.2, 1, 2, 3, -4);
    var awan13 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    var awan2 = new MyObject([],[], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.6, 235, 232, 232, 1.2, 0.6, 1, 0, 1.5, -4);
    var awan21 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.5, 235, 232, 232, 1.1, 0.5, 1, -1, 1.5, -4);
    var awan22 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.5, 235, 232, 232, 1, 0.3, 1, 0.8, 1.5, -4);
    var awan23 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    awan.addChild(awan11);
    awan.addChild(awan12);
    awan.addChild(awan13);

    awan2.addChild(awan21);
    awan2.addChild(awan22);
    awan2.addChild(awan23);

    world.addChild(pohon);
    world.addChild(pohon2);
    world.addChild(tanah);
    world.addChild(path);
    world.addChild(kursi);
    world.addChild(cone);
    world.addChild(lampu);
    world.addChild(lampu2);
    world.addChild(bush);
    world.addChild(awan);
    world.addChild(awan2);
    world.addChild(fence1);
    world.addChild(fence2);
    world.addChild(fence3);
    world.addChild(fence4);
    world.addChild(fence5);
    world.addChild(fence6);
    world.addChild(fence7);
    world.addChild(fence8);
    world.addChild(fence11);
    world.addChild(fence12);
    world.addChild(fence13);
    world.addChild(fence14);
    world.addChild(fence15);
    world.addChild(fence16);
    world.addChild(fence_h1);
    world.addChild(fence_h2);
    world.addChild(fence_h3);
    world.addChild(fence_h4);
    
    // Matriks
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    var VIEWMATRIX = LIBS.get_I4();

    LIBS.translateZ(VIEWMATRIX, -7);
    LIBS.translateY(VIEWMATRIX, 0.2);

    GL.clearColor(0.0, 0.0, 0.0, 0.0);

    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);

    GL.clearDepth(1.0);
    var time_prev = 0;
    // Drawing
    var animate = function (time) {
        if (time > 0) {
            var dt = (time - time_prev);
            if (!drag) {                
                dX *= AMORTIZATION;
                dY *= AMORTIZATION;
                THETA += dX;
                PHI += dY;
            }

            world.setIdentityMove();        
            world.setRotateMove(PHI, THETA, 0);  
            world.setTranslateMove(0, 0, 0);

            pohon.setScale(0.5);
            pohon2.setScale(0.7);

            for (let i = 0; i < world.child.length; i++) {
                world.child[i].setIdentityMove();
                world.child[i].setRotateMove(PHI, THETA, 0);
            }

            for (let i = 0; i < pohon.child.length; i++) {
                pohon.child[i].setIdentityMove();
                pohon.child[i].setRotateMove(PHI, THETA, 0);
                pohon.child[i].setScale(0.5);
            }

            for (let i = 0; i < pohon2.child.length; i++) {
                pohon2.child[i].setIdentityMove();
                pohon2.child[i].setRotateMove(PHI, THETA, 0);
                pohon2.child[i].setScale(0.7);
            }

            for (let i = 0; i < kursi.child.length; i++) {
                kursi.child[i].setIdentityMove();
                kursi.child[i].setRotateMove(PHI, THETA, 0);
            }

            for (let i = 0; i < cone.child.length; i++) {
                cone.child[i].setIdentityMove();
                cone.child[i].setRotateMove(PHI, THETA, 0);
            }

            for (let i = 0; i < lampu.child.length; i++) {
                lampu.child[i].setIdentityMove();
                lampu.child[i].setRotateMove(PHI, THETA, 0);
                lampu2.child[i].setIdentityMove();
                lampu2.child[i].setRotateMove(PHI, THETA, 0);
            }

            for (let i = 0; i < bush.child.length; i++) {
                bush.child[i].setIdentityMove();
                bush.child[i].setRotateMove(PHI, THETA, 0);
            }

            for (let i = 0; i < awan.child.length; i++) {
                awan.child[i].setIdentityMove();
                awan.child[i].setRotateMove(PHI, THETA, 0);
            }

            for (let i = 0; i < awan.child.length; i++) {
                awan2.child[i].setIdentityMove();
                awan2.child[i].setRotateMove(PHI, THETA, 0);
            }

            if (time >= 1000 && time <= 3000) {
                apel1.setTranslateMove(0, -(time - 1000) / 1550, 0);
            } else if (time >= 3000 && time <= 5000) {
                apel1.setTranslateMove(0, -(3000 - 1000) / 1550, 0);
                apel2.setTranslateMove(0, -(time - 3000) / 1350, 0);
            } else if (time >= 5000 && time <= 7000) {
                apel1.setTranslateMove(0, -(3000 - 1000) / 1550, 0);
                apel2.setTranslateMove(0, -(5000 - 3000) / 1350, 0);
                apel3.setTranslateMove(0, -(time - 5000) / 1550, 0);
            } else if (time > 7000) {
                apel1.setTranslateMove(0, -(3000 - 1000) / 1550, 0);
                apel2.setTranslateMove(0, -(5000 - 3000) / 1350, 0);
                apel3.setTranslateMove(0, -(7000 - 5000) / 1550, 0);
            }

            if (time >= 1000 && time <= 10000) {
                awan11.setTranslateMove(-(time - 1000) / 3500, 0, 0);
                awan12.setTranslateMove(-(time - 1000) / 3500, 0, 0);
                awan13.setTranslateMove(-(time - 1000) / 3500, 0, 0);
                awan21.setTranslateMove((time - 1000) / 3500, 0, 0);
                awan22.setTranslateMove((time - 1000) / 3500, 0, 0);
                awan23.setTranslateMove((time - 1000) / 3500, 0, 0);
            } 

            if (time > 10000) {
                awan11.setTranslateMove(-(10000 - 1000) / 3500, 0, 0);
                awan12.setTranslateMove(-(10000 - 1000) / 3500, 0, 0);
                awan13.setTranslateMove(-(10000 - 1000) / 3500, 0, 0);
                awan21.setTranslateMove((10000 - 1000) / 3500, 0, 0);
                awan22.setTranslateMove((10000 - 1000) / 3500, 0, 0);
                awan23.setTranslateMove((10000 - 1000) / 3500, 0, 0);
            }
            
            if (time >= 10000 && time <= 22000) {
                awan11.setTranslateMove((time - 10000) / 3500, 0, 0);
                awan12.setTranslateMove((time - 10000) / 3500, 0, 0);
                awan13.setTranslateMove((time - 10000) / 3500, 0, 0);
                awan21.setTranslateMove(-(time - 10000) / 3500, 0, 0);
                awan22.setTranslateMove(-(time - 10000) / 3500, 0, 0);
                awan23.setTranslateMove(-(time - 10000) / 3500, 0, 0);
            }

            glMatrix.mat4.rotateX(tanah.MOVEMATRIX, tanah.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(path.MOVEMATRIX, path.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(kursi.MOVEMATRIX, kursi.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(tiang1.MOVEMATRIX, tiang1.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(tiang2.MOVEMATRIX, tiang2.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(cone_atas.MOVEMATRIX, cone_atas.MOVEMATRIX, LIBS.degToRad(-75));
            glMatrix.mat4.rotateX(cone_bawah.MOVEMATRIX, cone_bawah.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(bola_lampu.MOVEMATRIX, bola_lampu.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(bawah_bola.MOVEMATRIX, bawah_bola.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(bawah_bola2.MOVEMATRIX, bawah_bola2.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(tiang_lampu.MOVEMATRIX, tiang_lampu.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(bawah_tiang.MOVEMATRIX, bawah_tiang.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(bola_lampu2.MOVEMATRIX, bola_lampu2.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(bawah_bola12.MOVEMATRIX, bawah_bola12.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(bawah_bola22.MOVEMATRIX, bawah_bola22.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(tiang_lampu2.MOVEMATRIX, tiang_lampu2.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(bawah_tiang2.MOVEMATRIX, bawah_tiang2.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence1.MOVEMATRIX, fence1.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence2.MOVEMATRIX, fence2.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence3.MOVEMATRIX, fence3.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence4.MOVEMATRIX, fence4.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence5.MOVEMATRIX, fence5.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence6.MOVEMATRIX, fence6.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence7.MOVEMATRIX, fence7.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence8.MOVEMATRIX, fence8.MOVEMATRIX, LIBS.degToRad(15));

            glMatrix.mat4.rotateX(fence11.MOVEMATRIX, fence11.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence12.MOVEMATRIX, fence12.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence13.MOVEMATRIX, fence13.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence14.MOVEMATRIX, fence14.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence15.MOVEMATRIX, fence15.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence16.MOVEMATRIX, fence16.MOVEMATRIX, LIBS.degToRad(15));

            glMatrix.mat4.rotateX(fence_h1.MOVEMATRIX, fence_h1.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence_h2.MOVEMATRIX, fence_h2.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence_h3.MOVEMATRIX, fence_h3.MOVEMATRIX, LIBS.degToRad(15));
            glMatrix.mat4.rotateX(fence_h4.MOVEMATRIX, fence_h4.MOVEMATRIX, LIBS.degToRad(15));
            

            time_prev = time;
        }
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);

        world.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        pohon.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        pohon2.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        kursi.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        tanah.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        path.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        cone.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        lampu.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        lampu2.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        bush.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        awan.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        awan2.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence1.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence2.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence3.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence4.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence5.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence6.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence7.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence8.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence11.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence12.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence13.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence14.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence15.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence16.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence_h1.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence_h2.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence_h3.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        fence_h4.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);

        for (let i = 0; i < pohon.child.length; i++) {
            pohon.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        for (let i = 0; i < pohon2.child.length; i++) {
            pohon2.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        for (let i = 0; i < kursi.child.length; i++) {
            kursi.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        for (let i = 0; i < cone.child.length; i++) {
            cone.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        for (let i = 0; i < lampu.child.length; i++) {
            lampu.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
            lampu2.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        for (let i = 0; i < bush.child.length; i++) {
            bush.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        for (let i = 0; i < awan.child.length; i++) {
            awan.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        for (let i = 0; i < awan.child.length; i++) {
            awan2.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        world.draw();
        GL.flush();
        window.requestAnimationFrame(animate);
    }

    // Menjalankan function animate untuk looping draw
    animate();
}

window.addEventListener('load', main);