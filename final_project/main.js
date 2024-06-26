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

function generateBSpline2(controlPoint, m, degree, xUp, yUp, zUp, r, g, b) {
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
            x += (controlPoint[key * 2] * C);
            y += (controlPoint[key * 2 + 1] * C);
        }
        curves.push(x + xUp);
        curves.push(y + yUp);
        curves.push(zUp);
        curves.push(r / 255, g / 255, b / 255);

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

        this.child.forEach(obj => {
            obj.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        })
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

        this.child.forEach(obj => {
            obj.draw();
        })
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
        this.child.forEach(obj => {
            obj.setRotateMove(PHI, THETA, r);
        });
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
        this.child.forEach(obj => {
            obj.setIdentityMove();
        });
    }

    setPosition(x, y, z) {
        LIBS.setPosition(this.MOVEMATRIX, x, y, z);
        this.child.forEach(obj => {
            obj.setPosition(x, y, z);
        });
    }

    addChild(child) {
        this.child.push(child);
    }

}

// Fungsi main
function main() {
    var CANVAS = document.getElementById('mycanvas');

    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    var drag = false; // menentukan apakah diputar atau tidak
    var x_prev, y_prev; // menyimpan koordinat awal

    // perubahan
    var dX = 0, dY = 0;
    // end of perubahan

    var THETA = 0, PHI = 0;

    // variable untuk menghentikan benda dari bergerak setelah mouse dilepas
    var AMORTIZATION = 0.95;

    var mouseDown = function (e) {
        drag = true;
        console.log(e.pageX);
        console.log(e.pageY);
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
        const sectorCount = 200;
        const stackCount = 50;

        let sectorStep = 2 * Math.PI / sectorCount;
        let stackStep = Math.PI / stackCount;

        const vertices = [];

        for (let i = 0; i <= stackCount; i++) {
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

    var generateHalfSphere = function (radius, r, g, b, mulXy, mulZ, pX, pY, pZ) {
        let stackAngle, sectorAngle;
        const sectorCount = 72;
        const stackCount = 24;

        let sectorStep = 2 * Math.PI / sectorCount;
        let stackStep = Math.PI / stackCount;

        const vertices = [];

        for (let i = 0; i <= stackCount / 2; i++) {
            stackAngle = Math.PI / 2 - i * stackStep;

            var xy = radius * Math.cos(stackAngle);
            var z = radius * Math.sin(stackAngle);

            for (let j = 0; j <= sectorCount; j++) {
                sectorAngle = j * sectorStep;

                x = mulXy * xy * Math.cos(sectorAngle);
                y = mulZ * xy * Math.sin(sectorAngle);
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
        circle_vertex.push(0, 0, 0);

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

    var generateConeRory = function (mX, mY, mZ, pX, pY, pZ, r, g, b) {
        var cone_vertex = [];

        cone_vertex.push(mX, mY, mZ);
        cone_vertex.push(r / 255, g / 255, b / 255);

        var sectorCount = 72;
        var sectorStep = 2 * Math.PI / sectorCount;

        for (let i = 0; i < 360; i++) { // Ubah menjadi < 360
            var x = pX * Math.cos(i * sectorStep);
            var y = pY * Math.sin(i * sectorStep);
            cone_vertex.push(x + mX, y + mY, pZ + mZ);
            cone_vertex.push(r / 255, g / 255, b / 255);
        }

        var cone_faces = [];
        for (let i = 1; i < 360; i++) {
            cone_faces.push(0, i, i + 1);
        }
        cone_faces.push(0, 360, 1);

        return [cone_vertex, cone_faces];
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
    var badtzMaru = new MyObject([], [], shader_vertex_source, shader_fragment_source);
    var chocoCat = new MyObject([], [], shader_vertex_source, shader_fragment_source);
    var rory = new MyObject([], [], shader_vertex_source, shader_fragment_source);

    // ======================================= Badtz Maru Objects =====================================================
    // kepala
    var radius = 1.0;
    object = generateSphere(radius, 0, 0, 0, 1.3, 1.1, 1, 0, 0.3, 0);
    var badtz_kepala = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // mata
    radius = 0.5;
    object = generateSphere(radius, 255, 255, 255, 1, 0.9, 1, -0.3, 0.4, 0.55);
    var badtz_mata_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(radius, 0, 0, 0, 1, 0.9, 1, -0.3, 0.5, 0.55)
    var penutup_mata_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(radius, 255, 255, 255, 1, 0.9, 1, 0.3, 0.4, 0.55);
    var badtz_mata_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(radius, 0, 0, 0, 1, 0.9, 1, 0.3, 0.5, 0.55);
    var penutup_mata_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    radius = 0.3;
    object = generateCircle(-radius, 0.45, 1.05, 0.09, 0.09, 0, 0, 0, 0);
    var pupil_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateCircle(radius, 0.45, 1.05, 0.09, 0.09, 0, 0, 0, 0);
    var pupil_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = [
        [
            -0.4, -0.2, 1,
            1, 1, 0,
            0, 0.15, 1,
            1, 1, 0,
            0.4, -0.2, 1,
            1, 1, 0,
            0, 0, 0,
            1, 1, 0,
            0, -0.05, 1,
            1, 1, 0
        ],
        [
            0, 1, 4,
            0, 1, 3,
            1, 2, 3,
            1, 2, 4,
            0, 3, 4,
            2, 3, 4
        ]
    ]
    var mulut_atas = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // prisma segitiga
    object = [
        [
            -0.4, -0.25, 1,
            1, 1, 0,
            0, -0.08, 1,
            1, 1, 0,
            0.4, -0.25, 1,
            1, 1, 0,
            -0.4, -0.3, 0,
            1, 1, 0,
            0, -0.2, 0,
            1, 1, 0,
            0.4, -0.3, 0,
            1, 1, 0,
        ],
        [
            0, 1, 2,
            0, 1, 3,
            1, 3, 4,
            1, 2, 5,
            1, 4, 5,
            3, 4, 5,
            0, 2, 3,
            2, 3, 5
        ]
    ]
    var mulut_bawah = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // tanduk
    radius = 1.3;
    object = generateSphere(radius, 0, 0, 0, 0.3, 1, 0.3, 0.1, 0.7, -0.1);
    var tanduk_1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(radius, 0, 0, 0, 0.3, 1, 0.3, 0, 0.7, -0.1);
    var tanduk_2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(radius, 0, 0, 0, 0.3, 1, 0.3, 0.15, 0.7, -0.1);
    var tanduk_3 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(radius, 0, 0, 0, 0.3, 1, 0.3, 0.05, 0.7, -0.1);
    var tanduk_4 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    badtz_kepala.addChild(badtz_mata_kanan);
    badtz_kepala.addChild(penutup_mata_kanan);
    badtz_kepala.addChild(badtz_mata_kiri);
    badtz_kepala.addChild(penutup_mata_kiri);
    badtz_kepala.addChild(pupil_kiri);
    badtz_kepala.addChild(pupil_kanan);
    badtz_kepala.addChild(mulut_atas);
    badtz_kepala.addChild(mulut_bawah);
    badtz_kepala.addChild(tanduk_1);
    badtz_kepala.addChild(tanduk_2);
    badtz_kepala.addChild(tanduk_3);
    badtz_kepala.addChild(tanduk_4);

    // badan
    radius = 1.5;
    object = generateSphere(radius, 0, 0, 0, 0.8, 1, 0.6, 0, -1, -0.2);
    // object = generateTabung(0, -1, -1, 0, -1, -0.3, 1, 1, 0, 0.5, 0.5, 0, 0, 0, 0);
    var badtz_badan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // kantong depan
    object = generateSphere(1.5, 255, 255, 255, 0.6, 0.8, 0.5, 0, -1.25, 0);
    var kantong = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // tangan
    radius = 1.3
    object = generateSphere(radius, 0, 0, 0, 0.3, 1, 0.3, -0.15, -0.7, 0);
    var badtz_tangan_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(radius, 0, 0, 0, 0.3, 1, 0.3, 0.15, -0.7, 0);
    var badtz_tangan_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // kaki
    radius = 0.6;
    object = generateTabung(radius, -2.5, -0.1, -0.2, -2, -0.1, 0.3, 0, 0.3, 0.1, 0, 0.1, 255, 215, 0)
    var badtz_kaki_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-radius, -2.5, -0.1, 0.2, -2, -0.1, 0.3, 0, 0.3, 0.1, 0, 0.1, 255, 215, 0)
    var badtz_kaki_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    badtz_badan.addChild(badtz_tangan_kanan);
    badtz_badan.addChild(badtz_tangan_kiri);
    badtz_badan.addChild(badtz_kaki_kanan);
    badtz_badan.addChild(badtz_kaki_kiri);
    badtz_badan.addChild(kantong);

    badtzMaru.addChild(badtz_kepala);
    badtzMaru.addChild(badtz_badan);

    var curveObjects = [];
    var rory_curveObjects = [];

    var z = 0.75;
    for (let i = 0; i <= 100; i++) {
        object = generateCurve([1568 - 750, 853 - 200, 1533 - 750, 798 - 200, 1444 - 750, 776 - 200, 1348 - 750, 822 - 200, 1430 - 750, 938 - 200, 1591 - 750, 980 - 200], z);
        var curveObject1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
        curveObjects.push(curveObject1);

        object = generateCurve([1568 - 750, 853 - 200, 1603 - 750, 798 - 200, 1692 - 750, 776 - 200, 1788 - 750, 822 - 200, 1706 - 750, 938 - 200, 1545 - 750, 980 - 200], z);
        var curveObject2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
        curveObjects.push(curveObject2);
        z -= 0.001;
    }

    curveObjects.forEach(obj => {
        badtz_badan.addChild(obj);
    });
    // ===========================================================================================================

    // ==================================================== ChocoCat Objects ======================================================================
    object = generateSphere(1.0, 20, 17, 17, 1.3, 1.1, 1, 0, 0.5, 0);
    var cat_kepala = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.4, 257, 257, 257, 1, 0.9, 1, -0.4, 0.4, 0.6);
    var cat_mata_kiri_putih = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.4, 257, 257, 257, 1, 0.9, 1, 0.4, 0.4, 0.6);
    var cat_mata_kanan_putih = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateCircle(-0.4, 0.38, 1, 0.09, 0.09, 0, 0, 0, 0);
    var cat_mata_kiri_hitam = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateCircle(0.4, 0.38, 1, 0.09, 0.09, 0, 0, 0, 0);
    var cat_mata_kanan_hitam = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.35, 184, 131, 108, 0.5, 0.4, 1, 0, 0.15, 0.65);
    var cat_mulut = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.75, 20, 17, 17, 1.0, 1.2, 0.7, 0, -0.8, 0);
    var cat_badan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(1.0, 94, 146, 209, 0.75, 0.12, 0.52, 0, -0.48, 0);
    var cat_kalung = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.32, 20, 17, 17, 1.4, 4, 0.7, 0.25, 0.8, 0);
    var cat_telinga_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.32, 20, 17, 17, 1.4, 4, 0.7, -0.25, 0.8, 0);
    var cat_telinga_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.22, 247, 226, 168, 1.3, 4, 0.7, 0.25, 1.05, 0.1);
    var cat_telinga_kanan_dalam = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.22, 247, 226, 168, 1.3, 4, 0.7, -0.25, 1.05, 0.1);
    var cat_telinga_kiri_dalam = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.42, 20, 20, 17, 0.48, 1.1, 0.4, 0.32, -1.2, 0);
    var cat_tangan_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.42, 20, 20, 17, 0.48, 1.1, 0.4, -0.32, -1.2, 0);
    var cat_tangan_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // TABUNG mX1, mY1, mZ1, mX2, mY2, mZ2, rX1, rY1, rZ1, rX2, rY2, rZ2, r, g, b
    object = generateTabung(0.35, -2, 0, -0.1, 0, 0, 0.28, 0, 0.3, 0.2, 1.2, 0.1, 20, 20, 17)
    var cat_kaki_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-0.35, -2, 0, 0.1, 0, 0, 0.28, 0, 0.3, 0.2, 1.2, 0.1, 20, 20, 17)
    var cat_kaki_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(0, 1, 0.45, 0, 1.3, 0.45, 0.025, 0, 0.025, 0.025, 0.2, 0.025, 20, 20, 17)
    var cat_kumis_kanan1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-0.25, 0.7, 0.45, -0.2, 1.2, 0.45, 0.025, 0, 0.025, 0.025, 0.2, 0.025, 20, 20, 17)
    var cat_kumis_kanan2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(0, 1, 0.45, 0, 1.3, 0.45, 0.025, 0, 0.025, 0.025, 0.2, 0.025, 20, 20, 17)
    var cat_kumis_kiri1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(0.25, 0.7, 0.45, 0.2, 1.2, 0.45, 0.025, 0, 0.025, 0.025, 0.2, 0.025, 20, 20, 17)
    var cat_kumis_kiri2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateCone(-0.5, -0.8, 1.85, -0.25, -0.2, 0.9, 0.5, 0.5, 94, 146, 209);
    var cat_topi = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.07, 227, 195, 107, 1, 1, 1, -0.5, 1.87, 0.82);
    var cat_bola_topi = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);


    chocoCat.addChild(cat_kepala);
    chocoCat.addChild(cat_badan);
    cat_kepala.addChild(cat_mata_kiri_putih);
    cat_kepala.addChild(cat_mata_kanan_putih);
    cat_kepala.addChild(cat_mata_kiri_hitam);
    cat_kepala.addChild(cat_mata_kanan_hitam);
    cat_kepala.addChild(cat_mulut);
    cat_kepala.addChild(cat_telinga_kiri);
    cat_kepala.addChild(cat_telinga_kanan);
    cat_kepala.addChild(cat_telinga_kanan_dalam);
    cat_kepala.addChild(cat_telinga_kiri_dalam);
    cat_kepala.addChild(cat_kumis_kanan1);
    cat_kepala.addChild(cat_kumis_kanan2);
    cat_kepala.addChild(cat_kumis_kiri1);
    cat_kepala.addChild(cat_kumis_kiri2);
    cat_kepala.addChild(cat_topi);
    cat_kepala.addChild(cat_bola_topi);
    cat_badan.addChild(cat_kalung);
    cat_badan.addChild(cat_kaki_kanan);
    cat_badan.addChild(cat_kaki_kiri);
    cat_badan.addChild(cat_tangan_kanan);
    cat_badan.addChild(cat_tangan_kiri);

    var cat_curve = [];
    var cat_ekor_curve = [];

    var curve = [0.075, -0.4, 0.19, 0.51, 0.42, -0.59, -0.15, 0.05, 0.65, 0.05, 0.035, -0.44];
    var y = -0.85;
    for (let index = 0; index < curve.length; index++) {
        var vertex = generateBSpline2(curve, 100, 2, -0.2, y, 0.53, 227, 143, 227);
        var faces = [];
        for (let index = 0; index < vertex.length / 6; index++) {
            faces.push(index);
        }
        var bintang = new MyObject(vertex, faces, shader_vertex_source, shader_fragment_source);
        y += 0.0035;
        cat_curve.push(bintang);
    }

    var curve = [
        1.344186046511628, 0.08369098712446355, 1.6372093023255814, -0.12017167381974247, 1.9813953488372094, -0.1759656652360515, 2.344186046511628, -0.19313304721030033, 2.683720930232558, -0.18240343347639487, 2.9209302325581397, -0.12660944206008584, 3.051162790697674, -0.05579399141630903, 3.2046511627906975, 0.3197424892703863, 3.07906976744186, 0.6545064377682404
    ];
    var y = -1.27;
    for (let index = 0; index < curve.length; index++) {
        var vertex = generateBSpline2(curve, 100, 2, -1.8, y, -0.1, 38, 36, 36);
        var faces = [];
        for (let index = 0; index < vertex.length / 6; index++) {
            faces.push(index);
        }
        var ekor = new MyObject(vertex, faces, shader_vertex_source, shader_fragment_source);
        y += 0.006;
        cat_ekor_curve.push(ekor);
    }

    cat_curve.forEach(obj => {
        cat_badan.addChild(obj);
    });

    cat_ekor_curve.forEach(obj => {
        cat_badan.addChild(obj);
    });
    // ============================================================================================================================================

    // ======================================================== Rory ==============================================================================
    // kepala
    radius = 0.8;
    object = generateSphere(radius, 247, 217, 18, 1.5, 1.1, 1, 0, 0.3, 0);
    var rory_kepala = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // mata
    radius = 0.3;
    object = generateSphere(radius, 0, 0, 0, 0.4, 0.6, 1, -0.45, 0.4, 0.55);
    var rory_pupil_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(radius, 0, 0, 0, 0.4, 0.6, 1, 0.45, 0.4, 0.55);
    var rory_pupil_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    //mulut
    radius = 0.3;
    object = generateSphere(radius, 255, 255, 255, 1, 0.9, 1, 0, 0.08, 0.6);
    var rory_mulut = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    //hidung
    object = generateSphere(radius, 255, 0, 0, 0.3, 0.2, 0.2, 0, 0.22, 0.9);
    var rory_hidung = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    //telinga
    // radius = 1.;
    // object = generateSphere(radius, 247, 217, 18, 0.3, 0.8, 0.3, 0.5, 0.7, -0.1);
    // var telinga_1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // object = generateSphere(radius, 247, 217, 18, 0.3, 0.8, 0.3, -0.5, 0.7, -0.1);
    // var telinga_2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    //telinga
    object = generateConeRory(0.35, -0.05, -1.4, 0.4, 0.4, 0.4, 247, 217, 18);
    var rory_telinga_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateConeRory(-0.35, -0.05, -1.4, 0.4, 0.4, 0.4, 247, 217, 18);
    var rory_telinga_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    rory_kepala.addChild(rory_pupil_kiri);
    rory_kepala.addChild(rory_pupil_kanan);
    rory_kepala.addChild(rory_mulut);
    rory_kepala.addChild(rory_hidung);
    rory_kepala.addChild(rory_telinga_kiri);
    rory_kepala.addChild(rory_telinga_kanan);

    //badan
    radius = 1;
    object = generateSphere(radius, 247, 217, 18, 0.8, 1, 0.6, 0, -1, -0.2);
    var rory_badan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    //baju
    radius = 0.8;
    object = generateSphere(radius, 0, 255, 0, 1, 1.2, 0.6, 0, -0.8, -0.35);
    var baju_1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
    object = generateSphere(radius, 0, 255, 0, 1, 1.2, 0.6, -0.1, -0.8, -0.3);
    var baju_2_1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
    object = generateSphere(radius, 0, 255, 0, 1, 1.2, 0.6, 0.1, -0.8, -0.3);
    var baju_2_2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
    object = generateSphere(radius, 0, 255, 0, 1, 1.2, 0.6, -0.15, -0.8, -0.2);
    var baju_3_1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
    object = generateSphere(radius, 0, 255, 0, 1, 1.2, 0.6, 0.15, -0.8, -0.2);
    var baju_3_2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    //tangan
    radius = 1
    object = generateSphere(radius, 247, 217, 18, 0.3, 1, 0.3, -0.15, -0.7, 0);
    var rory_tangan_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(radius, 247, 217, 18, 0.3, 1, 0.3, 0.15, -0.7, 0);
    var rory_tangan_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    //kaki
    radius = 0.35;
    object = generateTabung(radius, -2.2, -0.1, radius, -1.6, -0.1, 0.2, 0, 0.2, 0.2, 0, 0.2, 247, 217, 18)
    var rory_kaki_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-radius, -2.2, -0.1, -radius, -1.6, -0.1, 0.2, 0, 0.2, 0.2, 0, 0.2, 247, 217, 18)
    var rory_kaki_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    //ekor
    radius = 0.5
    object = generateSphere(radius, 247, 217, 18, 0.5, 0.5, 0.5, 0, -1.2, -0.9)
    var ekor_1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
    object = generateSphere(0.6, 247, 217, 18, 1, 1.5, 0.5, 0, 0.05, -1.4)
    var ekor_2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
    object = generateSphere(0.6, 247, 217, 18, 0.75, 1, 0.5, 0, 1.3, -1.3)
    var ekor_3 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    var z = 0.42;
    for (let i = 0; i <= 100; i++) {
        object = generateCurve([748, 484 + 200, 739 - 0, 486 + 200, 736 - 0, 503 + 200, 745 - 0, 512 + 200, 760 - 0, 515 + 200, 772 - 0, 508 + 200, 773 - 0, 494 + 200, 765 - 0, 486 + 200, 754 - 0, 483 + 200, 748 - 0, 484 + 200], z);
        var curveObject1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
        rory_curveObjects.push(curveObject1);

        object = generateCurve([739, 489 + 200, 734, 472 + 200, 745, 459 + 200, 767, 467 + 200, 767, 476 + 200, 762, 488 + 200], z);
        var curveObject2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
        rory_curveObjects.push(curveObject2);

        object = generateCurve([764, 486 + 200, 777, 483 + 200, 796, 482 + 200, 802, 493 + 200, 800, 509 + 200, 782, 513 + 200, 767, 507 + 200], z);
        var curveObject3 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
        rory_curveObjects.push(curveObject3);

        object = generateCurve([736, 488 + 200, 727, 485 + 200, 707, 492 + 200, 705, 508 + 200, 713, 520 + 200, 731, 517 + 200, 740, 509 + 200], z);
        var curveObject4 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
        rory_curveObjects.push(curveObject4);

        object = generateCurve([740, 509 + 200, 733, 520 + 200, 724, 534 + 200, 736, 542 + 200, 749, 543 + 200, 755, 529 + 200, 756, 513 + 200], z);
        var curveObject5 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
        rory_curveObjects.push(curveObject5);

        object = generateCurve([755, 513 + 200, 757, 523 + 200, 763, 538 + 200, 776, 540 + 200, 780, 532 + 200, 786, 526 + 200, 780, 518 + 200, 769, 509 + 200], z);
        var curveObject6 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
        rory_curveObjects.push(curveObject6);
        z -= 0.001;
    }

    rory_curveObjects.forEach(obj => {
        rory_badan.addChild(obj);
    });

    rory_badan.addChild(rory_tangan_kanan);
    rory_badan.addChild(rory_tangan_kiri);
    rory_badan.addChild(rory_kaki_kanan);
    rory_badan.addChild(rory_kaki_kiri);
    rory_badan.addChild(baju_1);
    rory_badan.addChild(baju_2_1);
    rory_badan.addChild(baju_2_2);
    rory_badan.addChild(baju_3_1);
    rory_badan.addChild(baju_3_2);
    rory_badan.addChild(ekor_1);
    rory_badan.addChild(ekor_2);
    rory_badan.addChild(ekor_3);

    rory.addChild(rory_kepala);
    rory.addChild(rory_badan);
    // ============================================================================================================================================

    // ================================================================ World =====================================================================
    var world = new MyObject([], [], shader_vertex_source, shader_fragment_source);

    var pohon = new MyObject([], [], shader_vertex_source, shader_fragment_source);

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
    var pohon2 = new MyObject([], [], shader_vertex_source, shader_fragment_source);

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
        -3.5, -1, -2.5, 92 / 255, 59 / 255, 36 / 255,
        3.5, -1, -2.5, 92 / 255, 59 / 255, 36 / 255,
        3.5, -0.8, -2.5, 92 / 255, 59 / 255, 36 / 255,
        -3.5, -0.8, -2.5, 92 / 255, 59 / 255, 36 / 255,

        // blue
        -3.5, -1, 2.5, 92 / 255, 59 / 255, 36 / 255,
        3.5, -1, 2.5, 92 / 255, 59 / 255, 36 / 255,
        3.5, -0.8, 2.5, 92 / 255, 59 / 255, 36 / 255,
        -3.5, -0.8, 2.5, 92 / 255, 59 / 255, 36 / 255,

        // cyan
        -3.5, -1, -2.5, 92 / 255, 59 / 255, 36 / 255,
        -3.5, -0.8, -2.5, 92 / 255, 59 / 255, 36 / 255,
        -3.5, -0.8, 2.5, 92 / 255, 59 / 255, 36 / 255,
        -3.5, -1, 2.5, 92 / 255, 59 / 255, 36 / 255,

        // red
        3.5, -1, -2.5, 92 / 255, 59 / 255, 36 / 255,
        3.5, -0.8, -2.5, 92 / 255, 59 / 255, 36 / 255,
        3.5, -0.8, 2.5, 92 / 255, 59 / 255, 36 / 255,
        3.5, -1, 2.5, 92 / 255, 59 / 255, 36 / 255,

        // pink
        -3.5, -1, -2.5, 92 / 255, 59 / 255, 36 / 255,
        -3.5, -1, 2.5, 92 / 255, 59 / 255, 36 / 255,
        3.5, -1, 2.5, 92 / 255, 59 / 255, 36 / 255,
        3.5, -1, -2.5, 92 / 255, 59 / 255, 36 / 255,

        // green
        -3.5, -0.8, -2.5, 25 / 255, 97 / 255, 29 / 255,
        -3.5, -0.8, 2.5, 25 / 255, 97 / 255, 29 / 255,
        3.5, -0.8, 2.5, 25 / 255, 97 / 255, 29 / 255,
        3.5, -0.8, -2.5, 25 / 255, 97 / 255, 29 / 255,
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

      var fence = new MyObject([], [], shader_vertex_source, shader_fragment_source);

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

    fence.addChild(fence1);
    fence.addChild(fence2);
    fence.addChild(fence3);
    fence.addChild(fence4);
    fence.addChild(fence5);
    fence.addChild(fence6);
    fence.addChild(fence7);
    fence.addChild(fence8);
    fence.addChild(fence11);
    fence.addChild(fence12);
    fence.addChild(fence13);
    fence.addChild(fence14);
    fence.addChild(fence15);
    fence.addChild(fence16);
    fence.addChild(fence_h1);
    fence.addChild(fence_h2);
    fence.addChild(fence_h3);
    fence.addChild(fence_h4);

    // kursi
    var papan_vertex = [
        -1, -0.45, -2, 66 / 255, 56 / 255, 43 / 255,
        1, -0.45, -2, 66 / 255, 56 / 255, 43 / 255,
        1, -0.35, -2, 66 / 255, 56 / 255, 43 / 255,
        -1, -0.35, -2, 66 / 255, 56 / 255, 43 / 255,

        -1, -0.45, -1.5, 66 / 255, 56 / 255, 43 / 255,
        1, -0.45, -1.5, 66 / 255, 56 / 255, 43 / 255,
        1, -0.35, -1.5, 66 / 255, 56 / 255, 43 / 255,
        -1, -0.35, -1.5, 66 / 255, 56 / 255, 43 / 255,

        -1, -0.45, -2, 66 / 255, 56 / 255, 43 / 255,
        -1, -0.35, -2, 66 / 255, 56 / 255, 43 / 255,
        -1, -0.35, -1.5, 66 / 255, 56 / 255, 43 / 255,
        -1, -0.45, -1.5, 66 / 255, 56 / 255, 43 / 255,

        1, -0.45, -2, 66 / 255, 56 / 255, 43 / 255,
        1, -0.35, -2, 66 / 255, 56 / 255, 43 / 255,
        1, -0.35, -1.5, 66 / 255, 56 / 255, 43 / 255,
        1, -0.45, -1.5, 66 / 255, 56 / 255, 43 / 255,

        -1, -0.45, -2, 66 / 255, 56 / 255, 43 / 255,
        -1, -0.45, -1.5, 66 / 255, 56 / 255, 43 / 255,
        1, -0.45, -1.5, 66 / 255, 56 / 255, 43 / 255,
        1, -0.45, -2, 66 / 255, 56 / 255, 43 / 255,

        -1, -0.35, -2, 92 / 255, 59 / 255, 36 / 255,
        -1, -0.35, -1.5, 92 / 255, 59 / 255, 36 / 255,
        1, -0.35, -1.5, 92 / 255, 59 / 255, 36 / 255,
        1, -0.35, -2, 92 / 255, 59 / 255, 36 / 255,
    ];

    var tiang1_vertex = [
        -1, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
        -1, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,

        -1, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        -1, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,

        -1, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        -1, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
        -1, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        -1, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,

        -0.9, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,

        -1, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        -1, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,

        -1, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
        -1, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        -0.9, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
    ];

    var tiang2_vertex = [
        1, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
        1, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,

        1, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        1, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,

        1, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        1, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
        1, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        1, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,

        0.9, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,

        1, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,
        1, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.8, -1.5, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.8, -2, 133 / 255, 133 / 255, 133 / 255,

        1, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
        1, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.45, -1.5, 133 / 255, 133 / 255, 133 / 255,
        0.9, -0.45, -2, 133 / 255, 133 / 255, 133 / 255,
    ];

    var kursi = new MyObject(papan_vertex, balok_faces, shader_vertex_source, shader_fragment_source);
    var tiang1 = new MyObject(tiang1_vertex, balok_faces, shader_vertex_source, shader_fragment_source);
    var tiang2 = new MyObject(tiang2_vertex, balok_faces, shader_vertex_source, shader_fragment_source);

    kursi.addChild(tiang1);
    kursi.addChild(tiang2);

    var cone = new MyObject([], [], shader_vertex_source, shader_fragment_source);

    object = generateCone(-2, 2, -0.1, -2, 2, -0.8, 0.2, 0.2, 240, 91, 5);
    var cone_atas = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-2, -0.8, -2, -2, -0.8, -2, 0.25, 0, 0.25, 0.25, 0.07, 0.25, 125, 52, 10)
    var cone_bawah = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    cone.addChild(cone_atas);
    cone.addChild(cone_bawah);

    var lampu = new MyObject([], [], shader_vertex_source, shader_fragment_source);

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

    var lampu2 = new MyObject([], [], shader_vertex_source, shader_fragment_source);

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
    world.addChild(kursi);
    world.addChild(cone);
    world.addChild(lampu);
    world.addChild(lampu2);
    world.addChild(bush);
    world.addChild(fence);
    world.addChild(path);
    world.addChild(awan);
    world.addChild(awan2);
    // ============================================================================================================================================

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
            // Set identity and setrotate
            badtzMaru.setIdentityMove();
            badtzMaru.setRotateMove(PHI, THETA, 0);
            chocoCat.setIdentityMove();
            chocoCat.setRotateMove(PHI, THETA, 0);
            rory.setIdentityMove();
            rory.setRotateMove(PHI, THETA, 0);
            world.setIdentityMove();
            world.setRotateMove(PHI, THETA, 0);


            // ============================ ANIMATION ==============================================

            // ================== Kepala toleh kanan kiri ==========================================
            // // Kepala
            // // kepala toleh kanan kiri
            // if (time <= 500)
            //     badtz_kepala.setRotateMove(PHI, LIBS.degToRad(time * 0.05), 0)
            // else if (time > 500 && time < 1500)
            //     badtz_kepala.setRotateMove(PHI, LIBS.degToRad(25), 0);
            // else if (time >= 1500 && time <= 2500)
            //     badtz_kepala.setRotateMove(PHI, LIBS.degToRad((-time + 2000) * 0.05), 0);
            // else if (time > 2500 && time < 3500)
            //     badtz_kepala.setRotateMove(PHI, LIBS.degToRad(-25), 0);
            // else if (time >= 3500 && time <= 4000)
            //     badtz_kepala.setRotateMove(PHI, LIBS.degToRad((time - 4000) * 0.05), 0);
            // else
            //     badtz_kepala.setRotateMove(PHI, THETA, 0);

            // isi kepala
            // for (let i = 0; i < badtz_kepala.child.length; i++) {
            //     // isi kepala toleh kanan kiri
            //     if (time <= 500)
            //         badtz_kepala.child[i].setRotateMove(PHI, LIBS.degToRad(time * 0.05), 0);
            //     else if (time > 500 && time < 1500)
            //         badtz_kepala.child[i].setRotateMove(PHI, LIBS.degToRad(25), 0);
            //     else if (time >= 1500 && time <= 2500)
            //         // hasil perhitungan kalo dri awal 1000 ms, trs mw muter kanan kiri, brarti dri kanan ke tengah hrs dri 1000 detik ke 0, caranya
            //         // -time + (1000 + time)
            //         badtz_kepala.child[i].setRotateMove(PHI, LIBS.degToRad((-time + 2000) * 0.05), 0);
            //     else if (time > 2500 && time < 3500)
            //         badtz_kepala.child[i].setRotateMove(PHI, LIBS.degToRad(-25), 0);
            //     else if (time >= 3500 && time <= 4000)
            //         badtz_kepala.child[i].setRotateMove(PHI, LIBS.degToRad((time - 4000) * 0.05), 0);
            //     else
            //         badtz_kepala.child[i].setRotateMove(PHI, THETA, 0);
            // }            

            if (time >= 300 && time <= 600) {
                rory_pupil_kanan.setScale((600 - time) / 300);
                rory_pupil_kiri.setScale((600 - time) / 300)
            }
            if (time >= 600 && time <= 900) {
                rory_pupil_kanan.setScale(time / 900);
                rory_pupil_kiri.setScale(time / 900);
            }
            if (time >= 2000 && time <= 2300) {
                rory_pupil_kanan.setScale((2300 - time) / 300);
                rory_pupil_kiri.setScale((2300 - time) / 300)
            }
            if (time >= 2300 && time <= 2600) {
                rory_pupil_kanan.setScale(time / 2600);
                rory_pupil_kiri.setScale(time / 2600);
            }
            if (time >= 5300 && time <= 5600) {
                rory_pupil_kanan.setScale((5600 - time) / 300);
                rory_pupil_kiri.setScale((5600 - time) / 300)
            }
            if (time >= 5600 && time <= 5900) {
                rory_pupil_kanan.setScale(time / 5900);
                rory_pupil_kiri.setScale(time / 5900);
            }
            if (time >= 7300 && time <= 7600) {
                rory_pupil_kanan.setScale((7600 - time) / 300);
                rory_pupil_kiri.setScale((7600 - time) / 300)
            }
            if (time >= 7600 && time <= 7900) {
                rory_pupil_kanan.setScale(time / 7900);
                rory_pupil_kiri.setScale(time / 7900);
            }

            // kedip
            if (time >= 500 && time <= 800) {
                badtz_mata_kanan.setScale((800 - time) / 300);
                badtz_mata_kiri.setScale((800 - time) / 300)
            }
            if (time >= 800 && time <= 1000) {
                badtz_mata_kanan.setScale(time / 1000);
                badtz_mata_kiri.setScale(time / 1000);
            }
            if (time >= 2500 && time <= 2800) {
                badtz_mata_kanan.setScale((2800 - time) / 300);
                badtz_mata_kiri.setScale((2800 - time) / 300)
            }
            if (time >= 2800 && time <= 3000) {
                badtz_mata_kanan.setScale(time / 3000);
                badtz_mata_kiri.setScale(time / 3000);
            }
            if (time >= 5500 && time <= 5800) {
                badtz_mata_kanan.setScale((5800 - time) / 300);
                badtz_mata_kiri.setScale((5800 - time) / 300)
            }
            if (time >= 5800 && time <= 6000) {
                badtz_mata_kanan.setScale(time / 6000);
                badtz_mata_kiri.setScale(time / 6000);
            }
            if (time >= 8500 && time <= 8800) {
                badtz_mata_kanan.setScale((8500 - time) / 300);
                badtz_mata_kiri.setScale((8500 - time) / 300)
            }
            if (time >= 8800 && time <= 9000) {
                badtz_mata_kanan.setScale(time / 9000);
                badtz_mata_kiri.setScale(time / 9000);
            }
            if (time >= 10500 && time <= 10800) {
                badtz_mata_kanan.setScale((10500 - time) / 300);
                badtz_mata_kiri.setScale((10500 - time) / 300)
            }
            if (time >= 10800 && time <= 11000) {
                badtz_mata_kanan.setScale(time / 12000);
                badtz_mata_kiri.setScale(time / 12000);
            }
            if (time >= 13500 && time <= 13800) {
                badtz_mata_kanan.setScale((13500 - time) / 300);
                badtz_mata_kiri.setScale((13500 - time) / 300)
            }
            if (time >= 13800 && time <= 14000) {
                badtz_mata_kanan.setScale(time / 15000);
                badtz_mata_kiri.setScale(time / 15000);
            }
            if (time >= 17500 && time <= 17800) {
                badtz_mata_kanan.setScale((17500 - time) / 300);
                badtz_mata_kiri.setScale((17500 - time) / 300)
            }
            if (time >= 17800 && time <= 18000) {
                badtz_mata_kanan.setScale(time / 19000);
                badtz_mata_kiri.setScale(time / 19000);
            }
            if (time >= 20500 && time <= 20800) {
                badtz_mata_kanan.setScale((20500 - time) / 300);
                badtz_mata_kiri.setScale((20500 - time) / 300)
            }
            if (time >= 20800 && time <= 21000) {
                badtz_mata_kanan.setScale(time / 21000);
                badtz_mata_kiri.setScale(time / 21000);
            }
            if (time >= 22500 && time <= 22800) {
                badtz_mata_kanan.setScale((22500 - time) / 300);
                badtz_mata_kiri.setScale((22500 - time) / 300)
            }
            if (time >= 22800 && time <= 23000) {
                badtz_mata_kanan.setScale(time / 24000);
                badtz_mata_kiri.setScale(time / 24000);
            }

            
            if (time >= 2000 && time <= 2200) {
                cat_mata_kanan_hitam.setScale((2000 - time) / 1500);
                cat_mata_kiri_hitam.setScale((2000 - time) / 1500);
                cat_mata_kanan_putih.setScale((2000 - time) / 1500);
                cat_mata_kiri_putih.setScale((2000 - time) / 1500);
            }
            if (time >= 2200 && time <= 2400) {
                cat_mata_kanan_hitam.setScale(time / 2400);
                cat_mata_kiri_hitam.setScale(time / 2400);
                cat_mata_kanan_putih.setScale(time / 2400);
                cat_mata_kiri_putih.setScale(time / 2400);
            }
            if (time >= 5000 && time <= 5200) {
                cat_mata_kanan_hitam.setScale((5000 - time) / 1500);
                cat_mata_kiri_hitam.setScale((5000 - time) / 1500);
                cat_mata_kanan_putih.setScale((5000 - time) / 1500);
                cat_mata_kiri_putih.setScale((5000 - time) / 1500);
            }
            if (time >= 5200 && time <= 5400) {
                cat_mata_kanan_hitam.setScale(time / 5400);
                cat_mata_kiri_hitam.setScale(time / 5400);
                cat_mata_kanan_putih.setScale(time / 5400);
                cat_mata_kiri_putih.setScale(time / 5400);
            }

            // pindah posisi karakter
            rory.setPosition(1.5, -0.7, 2);
            badtzMaru.setPosition(-6, -0.5, 2);  
            chocoCat.setPosition(5, -0.7, 2);

            // glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
            // rory_tangan_kanan.setTranslateMove(-0.2, -0.8, 0);

            // glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((80)));
            // cat_tangan_kanan.setTranslateMove(-0.2, -1.2, 0);

            // ===================================================== Lompat ===============================================================
            if (time >= 3000 && time <= 3500) {
                // badtz maru
                badtz_kepala.setTranslateMove(0, (time - 3000) / 1000, 0);
                badtz_badan.setTranslateMove(0, (time - 3000) / 1000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(0, (time - 3000) / 1000, 0);
                }
                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(0, (time - 3000) / 1000, 0);
                }


                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 3000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 3000) / 1000, 0);
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 3000) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, -(time - 3000) / 1000, 0);

                // chococat
                cat_kepala.setTranslateMove(0, (time - 3000) / 1000, 0);
                cat_badan.setTranslateMove(0, (time - 3000) / 1000, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(0, (time - 3000) / 1000, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(0, (time - 3000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 3000) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 3000) / 1500, -(time - 3000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 3000) * 0.07));
                cat_tangan_kiri.setTranslateMove((time - 3000) / 1500, -(time - 3000) / 1000, 0);

                // rory
                rory_kepala.setTranslateMove(0, (time - 3000) / 1000, 0);
                rory_badan.setTranslateMove(0, (time - 3000) / 1000, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(0, (time - 3000) / 1000, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(0, (time - 3000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 3000) * 0.07));
                rory_tangan_kanan.setTranslateMove(0, -(time - 3000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 3000) * 0.07));
                rory_tangan_kiri.setTranslateMove(0, -(time - 3000) / 1000, 0);

            } else if (time >= 3500 && time <= 4000) {
                // badtz maru
                badtz_kepala.setTranslateMove(0, (-time + 4000) / 1000, 0);
                badtz_badan.setTranslateMove(0, (-time + 4000) / 1000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(0, (-time + 4000) / 1000, 0);
                }
                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(0, (-time + 4000) / 1000, 0);
                }


                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 4000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 4000) / 1000, 0);
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 4000) * -0.07));
                badtz_tangan_kiri.setTranslateMove(0, (time - 4000) / 1000, 0);

                // chococat
                cat_kepala.setTranslateMove(0, (-time + 4000) / 1000, 0);
                cat_badan.setTranslateMove(0, (-time + 4000) / 1000, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(0, (-time + 4000) / 1000, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(0, (-time + 4000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 4000) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 4000) / 1500, (time - 4000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 4000) * -0.07));
                cat_tangan_kiri.setTranslateMove(-(time - 4000) / 1500, (time - 4000) / 1000, 0);

                // rory
                rory_kepala.setTranslateMove(0, (-time + 4000) / 1000, 0);
                rory_badan.setTranslateMove(0, (-time + 4000) / 1000, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(0, (-time + 4000) / 1000, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(0, (-time + 4000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 4000) * 0.07));
                rory_tangan_kanan.setTranslateMove(0, (time - 4000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 4000) * -0.07));
                rory_tangan_kiri.setTranslateMove(0, (time - 4000) / 1000, 0);

            } else if (time >= 4000 && time <= 4500) {
                // badtz maru
                badtz_kepala.setTranslateMove(0, (time - 4000) / 1000, 0);
                badtz_badan.setTranslateMove(0, (time - 4000) / 1000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(0, (time - 4000) / 1000, 0);
                }
                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(0, (time - 4000) / 1000, 0);
                }


                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 4000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 4000) / 1000, 0);
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 4000) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, -(time - 4000) / 1000, 0);

                // chococat
                cat_kepala.setTranslateMove(0, (time - 4000) / 1000, 0);
                cat_badan.setTranslateMove(0, (time - 4000) / 1000, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(0, (time - 4000) / 1000, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(0, (time - 4000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 4000) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 4000) / 1500, -(time - 4000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 4000) * 0.07));
                cat_tangan_kiri.setTranslateMove((time - 4000) / 1500, -(time - 4000) / 1000, 0);

                // rory
                rory_kepala.setTranslateMove(0, (time - 4000) / 1000, 0);
                rory_badan.setTranslateMove(0, (time - 4000) / 1000, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(0, (time - 4000) / 1000, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(0, (time - 4000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 4000) * 0.07));
                rory_tangan_kanan.setTranslateMove(0, -(time - 4000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 4000) * 0.07));
                rory_tangan_kiri.setTranslateMove(0, -(time - 4000) / 1000, 0);

            } else if (time >= 4500 && time <= 5000) {
                // badtz maru
                badtz_kepala.setTranslateMove(0, (-time + 5000) / 1000, 0);
                badtz_badan.setTranslateMove(0, (-time + 5000) / 1000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(0, (-time + 5000) / 1000, 0);
                }
                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(0, (-time + 5000) / 1000, 0);
                }


                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 5000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 5000) / 1000, 0);
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 5000) * -0.07));
                badtz_tangan_kiri.setTranslateMove(0, (time - 5000) / 1000, 0);

                // chococat
                cat_kepala.setTranslateMove(0, (-time + 5000) / 1000, 0);
                cat_badan.setTranslateMove(0, (-time + 5000) / 1000, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(0, (-time + 5000) / 1000, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(0, (-time + 5000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 5000) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 5000) / 1500, (time - 5000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 5000) * -0.07));
                cat_tangan_kiri.setTranslateMove(-(time - 5000) / 1500, (time - 5000) / 1000, 0);

                // rory
                rory_kepala.setTranslateMove(0, (-time + 5000) / 1000, 0);
                rory_badan.setTranslateMove(0, (-time + 5000) / 1000, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(0, (-time + 5000) / 1000, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(0, (-time + 5000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 5000) * 0.07));
                rory_tangan_kanan.setTranslateMove(0, (time - 5000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 5000) * -0.07));
                rory_tangan_kiri.setTranslateMove(0, (time - 5000) / 1000, 0);
            }

            // ========================================== Waving =================================================================
            // nambah sudut dari 0 - 70 derajat, trs ditranslate turun dari 0 - (-1) biar lokasi e ga ngawur
            // bawah" ngulangi sama kek ini cuma ganti detikan
            if (time >= 7500 && time <= 8300) {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 7500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 7500) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 7500) * 0.07));
                rory_tangan_kanan.setTranslateMove(-(time - 7500) / 3000, -(time - 7500) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 7500) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 7500) / 2200, -(time - 7500) / 1000, 0);
                // ngurangi sudut dari 70 - 0 derajat, trs ditranslate balik dari -1 - 0
                // bawah" ngulangi sama kek ini cuma ganti detikan
            } else if (time >= 8300 && time <= 9000) {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 9000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 9000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 9000) * 0.07));
                rory_tangan_kanan.setTranslateMove((time - 9000) / 3000, (time - 9000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 9000) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 9000) / 2200, (time - 9000) / 1000, 0);
            } else if (time >= 9000 && time <= 9500) {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 9000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 9000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 9000) * 0.07));
                rory_tangan_kanan.setTranslateMove(-(time - 9000) / 3000, -(time - 9000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 9000) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 9000) / 2200, -(time - 9000) / 1000, 0);
            } else if (time >= 9500 && time <= 10000) {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 10000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 10000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 10000) * 0.07));
                rory_tangan_kanan.setTranslateMove((time - 10000) / 3000, (time - 10000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 10000) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 10000) / 2200, (time - 10000) / 1000, 0);
            } else {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                badtz_tangan_kanan.setTranslateMove(0, 0, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                rory_tangan_kanan.setTranslateMove(0, 0, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                cat_tangan_kanan.setTranslateMove(0, 0, 0);
            }

            // =================================== Kepala noleh ===========================================
            if (time >= 12000 && time <= 12800)
                badtz_kepala.setRotateMove(PHI, LIBS.degToRad((time - 12000) * 0.05), 0)
            else if (time > 12800)
                badtz_kepala.setRotateMove(PHI, LIBS.degToRad(40), 0);

            // =================================== Badan noleh ============================================
            if (time >= 13500 && time <= 14300) {
                badtz_badan.setRotateMove(PHI, LIBS.degToRad((time - 13500) * 0.05), 0)
            } else if (time > 14300) {
                badtz_badan.setRotateMove(PHI, LIBS.degToRad(40), 0);
            }

            // ========================================== Waving =================================================================
            if (time >= 15000 && time <= 15800) {
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 15000) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, -(time - 15000) / 1000, 0);
            } else if (time >= 15800 && time <= 16500) {
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 16500) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, (time - 16500) / 1000, 0);
            } else if (time >= 16500 && time <= 17000) {
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 16500) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, -(time - 16500) / 1000, 0);
            } else if (time >= 17000 && time <= 17500) {
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 17500) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, (time - 17500) / 1000, 0);
            } else {
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(0));
                badtz_tangan_kiri.setTranslateMove(0, 0, 0);
            }

            // ====================================================================================================================

            // =================================== Kepala noleh ===========================================
            if (time >= 15000 && time <= 15800)
                cat_kepala.setRotateMove(PHI, LIBS.degToRad(-(time - 15000) * 0.05), 0)
            else if (time > 15800)
                cat_kepala.setRotateMove(PHI, LIBS.degToRad(-40), 0);

            // =================================== Badan noleh ============================================
            if (time >= 16000 && time <= 16800) {
                cat_badan.setRotateMove(PHI, LIBS.degToRad(-(time - 16000) * 0.05), 0)
            } else if (time > 16800) {
                cat_badan.setRotateMove(PHI, LIBS.degToRad(-40), 0);
            }

            // =================================== Kepala noleh ===========================================
            if (time >= 15000 && time <= 15800)
                rory_kepala.setRotateMove(PHI, LIBS.degToRad(-(time - 15000) * 0.05), 0)
            else if (time > 15800)
                rory_kepala.setRotateMove(PHI, LIBS.degToRad(-40), 0);

            // =================================== Badan noleh ============================================
            if (time >= 16000 && time <= 16800) {
                rory_badan.setRotateMove(PHI, LIBS.degToRad(-(time - 16000) * 0.05), 0)
            } else if (time > 16800) {
                rory_badan.setRotateMove(PHI, LIBS.degToRad(-40), 0);
            }

            // ========================================== Waving =================================================================
            if (time >= 18000 && time <= 18800) {
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 18000) * 0.15));
                rory_tangan_kanan.setTranslateMove(-(time - 18000) / 3000, -(time - 18000) / 800, 0);
            } else if (time >= 18800 && time <= 19500) {
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 19500) * 0.15));
                rory_tangan_kanan.setTranslateMove((time - 19500) / 3000, (time - 19500) / 800, 0);
            } else if (time >= 19500 && time <= 20000) {
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 19500) * 0.15));
                rory_tangan_kanan.setTranslateMove(-(time - 19500) / 3000, -(time - 19500) / 800, 0);
            } else if (time >= 20000 && time <= 20500) {
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 20500) * 0.15));
                rory_tangan_kanan.setTranslateMove((time - 20500) / 3000, (time - 20500) / 800, 0);
            } else {
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                rory_tangan_kanan.setTranslateMove(0, 0, 0);
            }

            // ====================================================================================================================

            // ========================================== Waving =================================================================
            if (time >= 18000 && time <= 18800) {
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 18000) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 18000) / 2200, -(time - 18000) / 1000, 0);
            } else if (time >= 18800 && time <= 19500) {
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 19500) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 19500) / 2200, (time - 19500) / 1000, 0);
            } else if (time >= 19500 && time <= 20000) {
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 19500) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 19500) / 2200, -(time - 19500) / 1000, 0);
            } else if (time >= 20000 && time <= 20500) {
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 20500) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 20500) / 2200, (time - 20500) / 1000, 0);
            } else {
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                cat_tangan_kanan.setTranslateMove(0, 0, 0);
            }

            // ====================================================================================================================

            // ============================= jalan ================================================

            // translate objek biar keliatan jalan
            if (time >= 22000 && time <= 30000) {
                badtz_kepala.setTranslateMove((time - 22000) / 6000, 0, 0);
                badtz_badan.setTranslateMove((time - 22000) / 6000, 0, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove((time - 22000) / 6000, 0, 0);
                }
                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove((time - 22000) / 6000, 0, 0);
                }
            } else if (time >= 30000) {
                badtz_kepala.setTranslateMove(8000 / 6000, 0, 0);
                badtz_badan.setTranslateMove(8000 / 6000, 0, 0);

                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(8000 / 6000, 0, 0);
                }

                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(8000 / 6000, 0, 0);
                }
            }

            // animasi pergerakan tangan dan kaki untuk jalan
            if (time >= 22000 && time <= 23000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 22000) * 0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 22000) * -0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 22000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 22000) * 0.005));
            } else if (time >= 23000 && time <= 24000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 24000) * 0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 24000) * -0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 24000) * 0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 24000) * -0.005));
            } else if (time >= 24000 && time <= 25000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 24000) * -0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 24000) * 0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 24000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 24000) * 0.005));
            } else if (time >= 25000 && time <= 26000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 26000) * -0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 26000) * 0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 26000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 26000) * 0.005));
            } else if (time >= 26000 && time <= 27000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 26000) * 0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 26000) * -0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 26000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 26000) * 0.005));
            } else if (time >= 27000 && time <= 28000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 28000) * 0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 28000) * -0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 28000) * 0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 28000) * -0.005));
            } else if (time >= 28000 && time <= 29000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 28000) * -0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 28000) * 0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 28000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 28000) * 0.005));
            } else if (time >= 29000 && time <= 30000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 30000) * -0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 30000) * 0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 30000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 30000) * 0.005));
            } else {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad(0));
            }

            // =================================================== Jalan ======================================================================
            if (time >= 22000 && time <= 30000) {
                // chococat
                cat_kepala.setTranslateMove(-(time - 22000) / 6000, 0, 0);
                cat_badan.setTranslateMove(-(time - 22000) / 6000, 0, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(-(time - 22000) / 6000, 0, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(-(time - 22000) / 6000, 0, 0);
                }

                rory_kepala.setTranslateMove(-(time - 22000) / 6000, 0, 0);
                rory_badan.setTranslateMove(-(time - 22000) / 6000, 0, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(-(time - 22000) / 6000, 0, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(-(time - 22000) / 6000, 0, 0);
                }
            }

            if (time > 30000) {
                // chococat
                cat_kepala.setTranslateMove(-8000 / 6000, 0, 0);
                cat_badan.setTranslateMove(-8000 / 6000, 0, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(-8000 / 6000, 0, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(-8000 / 6000, 0, 0);
                }

                // rory
                rory_kepala.setTranslateMove(-8000 / 6000, 0, 0);
                rory_badan.setTranslateMove(-8000 / 6000, 0, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(-8000 / 6000, 0, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(-8000 / 6000, 0, 0);
                }
            }

            if (time >= 22000 && time <= 23000) {
                // chococat
                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 22000) * 0.015));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 22000) * -0.015));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 22000) * -0.015));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 22000) * 0.015));

                // chococat
                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 22000) * 0.015));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 22000) * -0.015));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 22000) * -0.010));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 22000) * 0.010));
            } else if (time >= 23000 && time <= 24000) {
                // Chococat
                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 24000) * 0.015));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 24000) * -0.015));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 24000) * 0.012));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 24000) * -0.012));

                // Rory
                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 24000) * 0.015));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 24000) * -0.015));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 24000) * 0.008));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 24000) * -0.008));
            } else if (time >= 24000 && time <= 25000) {
                // Chococat
                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 24000) * -0.015));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 24000) * 0.015));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 24000) * -0.012));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 24000) * 0.012));

                // Rory
                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 24000) * -0.015));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 24000) * 0.015));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 24000) * -0.010));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 24000) * 0.010));
            } else if (time >= 25000 && time <= 26000) {
                // Chococat
                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 26000) * -0.015));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 26000) * 0.015));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 26000) * -0.012));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 26000) * 0.012));

                // Rory
                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 26000) * -0.015));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 26000) * 0.015));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 26000) * -0.010));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 26000) * 0.010));
            } else if (time >= 26000 && time <= 27000) {
                // Chococat
                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 26000) * 0.015));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 26000) * -0.015));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 26000) * -0.015));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 26000) * 0.015));

                // Rory
                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 26000) * 0.015));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 26000) * -0.015));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 26000) * -0.010));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 26000) * 0.010));
            } else if (time >= 27000 && time <= 28000) {
                // Chococat
                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 28000) * 0.015));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 28000) * -0.015));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 28000) * 0.012));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 28000) * -0.012));

                // Rory
                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 28000) * 0.015));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 28000) * -0.015));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 28000) * 0.008));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 28000) * -0.008));
            } else if (time >= 28000 && time <= 29000) {
                // Chococat
                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 28000) * -0.015));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 28000) * 0.015));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 28000) * -0.012));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 28000) * 0.012));

                // Rory
                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 28000) * -0.015));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 28000) * 0.015));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 28000) * -0.008));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(time - 28000) * 0.008));
            } else if (time >= 29000 && time <= 30000) {
                // Chococat
                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 30000) * -0.015));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 30000) * 0.015));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 30000) * -0.012));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 30000) * 0.012));

                // Rory
                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 30000) * -0.015));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 30000) * 0.015));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad(-(-time + 30000) * -0.008));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad(-(-time + 30000) * 0.008));
            } else {
                // Chococat
                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad(0));

                // Rory
                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad(0));
            }

            // ========================================== Waving =================================================================
            if (time >= 30000 && time <= 30800) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 30000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 30000) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 30000) * 0.07));
                rory_tangan_kanan.setTranslateMove(-(time - 30000) / 3000, -(time - 30000) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 30000) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 30000) / 2200, -(time - 30000) / 1000, 0);
            } else if (time >= 30800 && time <= 31500) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 31500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 31500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 31500) * 0.07));
                rory_tangan_kanan.setTranslateMove((time - 31500) / 3000, (time - 31500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 31500) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 31500) / 2200, (time - 31500) / 1000, 0);
            } else if (time >= 31500 && time <= 32000) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 31500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 31500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 31500) * 0.07));
                rory_tangan_kanan.setTranslateMove(-(time - 31500) / 3000, -(time - 31500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 31500) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 31500) / 2200, -(time - 31500) / 1000, 0);
            } else if (time >= 32000 && time <= 32500) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 32500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 32500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 32500) * 0.07));
                rory_tangan_kanan.setTranslateMove((time - 32500) / 3000, (time - 32500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 32500) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 32500) / 2200, (time - 32500) / 1000, 0);
            } else {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                badtz_tangan_kanan.setTranslateMove(0, 0, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                rory_tangan_kanan.setTranslateMove(0, 0, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                cat_tangan_kanan.setTranslateMove(0, 0, 0);
            }

            // ===================================================== Lompat ===============================================================
            if (time >= 32000 && time <= 32500) {
                // badtz maru
                badtz_kepala.setTranslateMove(0, (time - 32000) / 1000, 0);
                badtz_badan.setTranslateMove(0, (time - 32000) / 1000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(0, (time - 32000) / 1000, 0);
                }
                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(0, (time - 32000) / 1000, 0);
                }


                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 32000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 32000) / 1000, 0);
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 32000) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, -(time - 32000) / 1000, 0);

                // chococat
                cat_kepala.setTranslateMove(0, (time - 32000) / 1000, 0);
                cat_badan.setTranslateMove(0, (time - 32000) / 1000, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(0, (time - 32000) / 1000, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(0, (time - 32000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 32000) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 32000) / 1500, -(time - 32000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 32000) * 0.07));
                cat_tangan_kiri.setTranslateMove((time - 32000) / 1500, -(time - 32000) / 1000, 0);

                // rory
                rory_kepala.setTranslateMove(0, (time - 32000) / 1000, 0);
                rory_badan.setTranslateMove(0, (time - 32000) / 1000, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(0, (time - 32000) / 1000, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(0, (time - 32000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 32000) * 0.07));
                rory_tangan_kanan.setTranslateMove(0, -(time - 32000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 32000) * 0.07));
                rory_tangan_kiri.setTranslateMove(0, -(time - 32000) / 1000, 0);

            } else if (time >= 32500 && time <= 33000) {
                // badtz maru
                badtz_kepala.setTranslateMove(0, (-time + 33000) / 1000, 0);
                badtz_badan.setTranslateMove(0, (-time + 33000) / 1000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(0, (-time + 33000) / 1000, 0);
                }
                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(0, (-time + 33000) / 1000, 0);
                }


                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 33000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 33000) / 1000, 0);
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 33000) * -0.07));
                badtz_tangan_kiri.setTranslateMove(0, (time - 33000) / 1000, 0);

                // chococat
                cat_kepala.setTranslateMove(0, (-time + 33000) / 1000, 0);
                cat_badan.setTranslateMove(0, (-time + 33000) / 1000, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(0, (-time + 33000) / 1000, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(0, (-time + 33000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 33000) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 33000) / 1500, (time - 33000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 33000) * -0.07));
                cat_tangan_kiri.setTranslateMove(-(time - 33000) / 1500, (time - 33000) / 1000, 0);

                // rory
                rory_kepala.setTranslateMove(0, (-time + 33000) / 1000, 0);
                rory_badan.setTranslateMove(0, (-time + 33000) / 1000, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(0, (-time + 33000) / 1000, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(0, (-time + 33000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 33000) * 0.07));
                rory_tangan_kanan.setTranslateMove(0, (time - 33000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 33000) * -0.07));
                rory_tangan_kiri.setTranslateMove(0, (time - 33000) / 1000, 0);

            } else if (time >= 33000 && time <= 33500) {
                // badtz maru
                badtz_kepala.setTranslateMove(0, (time - 33000) / 1000, 0);
                badtz_badan.setTranslateMove(0, (time - 33000) / 1000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(0, (time - 33000) / 1000, 0);
                }
                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(0, (time - 33000) / 1000, 0);
                }


                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 33000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 33000) / 1000, 0);
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 33000) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, -(time - 33000) / 1000, 0);

                // chococat
                cat_kepala.setTranslateMove(0, (time - 33000) / 1000, 0);
                cat_badan.setTranslateMove(0, (time - 33000) / 1000, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(0, (time - 33000) / 1000, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(0, (time - 33000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 33000) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 33000) / 1500, -(time - 33000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 33000) * 0.07));
                cat_tangan_kiri.setTranslateMove((time - 33000) / 1500, -(time - 33000) / 1000, 0);

                // rory
                rory_kepala.setTranslateMove(0, (time - 33000) / 1000, 0);
                rory_badan.setTranslateMove(0, (time - 33000) / 1000, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(0, (time - 33000) / 1000, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(0, (time - 33000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 33000) * 0.07));
                rory_tangan_kanan.setTranslateMove(0, -(time - 33000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 33000) * 0.07));
                rory_tangan_kiri.setTranslateMove(0, -(time - 33000) / 1000, 0);

            } else if (time >= 33500 && time <= 34000) {
                // badtz maru
                badtz_kepala.setTranslateMove(0, (-time + 34000) / 1000, 0);
                badtz_badan.setTranslateMove(0, (-time + 34000) / 1000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(0, (-time + 34000) / 1000, 0);
                }
                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(0, (-time + 34000) / 1000, 0);
                }


                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 34000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 34000) / 1000, 0);
                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 34000) * -0.07));
                badtz_tangan_kiri.setTranslateMove(0, (time - 34000) / 1000, 0);

                // chococat
                cat_kepala.setTranslateMove(0, (-time + 34000) / 1000, 0);
                cat_badan.setTranslateMove(0, (-time + 34000) / 1000, 0);
                for (let i = 0; i < cat_kepala.child.length; i++) {
                    cat_kepala.child[i].setTranslateMove(0, (-time + 34000) / 1000, 0);
                }
                for (let i = 0; i < cat_badan.child.length; i++) {
                    cat_badan.child[i].setTranslateMove(0, (-time + 34000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 34000) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 34000) / 1500, (time - 34000) / 1000, 0);
                glMatrix.mat4.rotateZ(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 34000) * -0.07));
                cat_tangan_kiri.setTranslateMove(-(time - 34000) / 1500, (time - 34000) / 1000, 0);

                // rory
                rory_kepala.setTranslateMove(0, (-time + 34000) / 1000, 0);
                rory_badan.setTranslateMove(0, (-time + 34000) / 1000, 0);
                for (let i = 0; i < rory_kepala.child.length; i++) {
                    rory_kepala.child[i].setTranslateMove(0, (-time + 34000) / 1000, 0);
                }
                for (let i = 0; i < rory_badan.child.length; i++) {
                    rory_badan.child[i].setTranslateMove(0, (-time + 34000) / 1000, 0);
                }

                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 34000) * 0.07));
                rory_tangan_kanan.setTranslateMove(0, (time - 34000) / 1000, 0);
                glMatrix.mat4.rotateZ(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 34000) * -0.07));
                rory_tangan_kiri.setTranslateMove(0, (time - 34000) / 1000, 0);
            }

            // =================================== Kabeh noleh ============================================
            if (time >= 34500 && time <= 35300) {
                badtzMaru.setRotateMove(PHI, LIBS.degToRad((-time + 34500) * 0.05), 0);
                chocoCat.setRotateMove(PHI, LIBS.degToRad(-(-time + 34500) * 0.05), 0);
                rory.setRotateMove(PHI, LIBS.degToRad(-(-time + 34500) * 0.05), 0);
            } else if (time > 35300) {
                badtzMaru.setRotateMove(PHI, LIBS.degToRad(-40), 0);
                chocoCat.setRotateMove(PHI, LIBS.degToRad(40), 0);
                rory.setRotateMove(PHI, LIBS.degToRad(40), 0);
            }

            // ==================================================== Menari ====================================================================
            if (time >= 36000 && time <= 36500) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 36000) * 0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 36000) * -0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 36000) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 36000) * 0.01));

                // badtz_kepala.setTranslateMove((time - 36000) / 3000, 0, 0);
                // for (let i = 0; i < badtz_kepala.child.length; i++) {
                //     badtz_kepala.child[i].setTranslateMove((time - 36000) / 3000, 0, 0);
                // }

                // badtz_badan.setTranslateMove((time - 36000) / 3000, 0, 0);
                // for (let i = 0; i < badtz_badan.child.length; i++) {
                //     badtz_badan.child[i].setTranslateMove((time - 36000) / 3000, 0, 0);
                // }

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 36000) * 0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 36000) * -0.08));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 36000) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 36000) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 36000) * 0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 36000) * -0.08));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 36000) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 36000) * 0.01));
            } else if (time >= 36500 && time <= 37000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 37000) * 0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 37000) * -0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 37000) * 0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 37000) * -0.01));

                // badtz_kepala.setTranslateMove((-time + 36500) / 3000, 0, 0);
                // for (let i = 0; i < badtz_kepala.child.length; i++) {
                //     badtz_kepala.child[i].setTranslateMove((-time + 36500) / 3000, 0, 0);
                // }

                // badtz_badan.setTranslateMove((-time + 36500) / 3000, 0, 0);
                // for (let i = 0; i < badtz_badan.child.length; i++) {
                //     badtz_badan.child[i].setTranslateMove((-time + 36500) / 3000, 0, 0);
                // }

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 37000) * 0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 37000) * -0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 37000) * 0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 37000) * -0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 37000) * 0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 37000) * -0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 37000) * 0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 37000) * -0.01));
            } else if (time >= 37000 && time <= 37800) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 37000) * -0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 37000) * 0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 37000) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 37000) * 0.01));

                // badtz_kepala.setTranslateMove((time - 37000) / 3000, 0, 0);
                // for (let i = 0; i < badtz_kepala.child.length; i++) {
                //     badtz_kepala.child[i].setTranslateMove((time - 37000) / 3000, 0, 0);
                // }

                // badtz_badan.setTranslateMove((time - 37000) / 3000, 0, 0);
                // for (let i = 0; i < badtz_badan.child.length; i++) {
                //     badtz_badan.child[i].setTranslateMove((time - 37000) / 3000, 0, 0);
                // }

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 37000) * -0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 37000) * 0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 37000) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 37000) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 37000) * -0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 37000) * 0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 37000) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 37000) * 0.01));
            } else if (time >= 37800 && time <= 38500) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 38500) * -0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 38500) * 0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 38500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 38500) * 0.01));

                // badtz_kepala.setTranslateMove((-time + 37800) / 3000, 0, 0);
                // for (let i = 0; i < badtz_kepala.child.length; i++) {
                //     badtz_kepala.child[i].setTranslateMove((-time + 37800) / 3000, 0, 0);
                // }

                // badtz_badan.setTranslateMove((-time + 37800) / 3000, 0, 0);
                // for (let i = 0; i < badtz_badan.child.length; i++) {
                //     badtz_badan.child[i].setTranslateMove((-time + 37800) / 3000, 0, 0);
                // }

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 38500) * -0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 38500) * 0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 38500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 38500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 38500) * -0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 38500) * 0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 38500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 38500) * 0.01));
            } else if (time >= 38500 && time <= 39000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 38500) * 0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 38500) * -0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 38500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 38500) * 0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 38500) * 0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 38500) * -0.08));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 38500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 38500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 38500) * 0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 38500) * -0.08));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 38500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 38500) * 0.01));
            } else if (time >= 39000 && time <= 39500) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 39500) * 0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 39500) * -0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 39500) * 0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 39500) * -0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 39500) * 0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 39500) * -0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 39500) * 0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 39500) * -0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 39500) * 0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 39500) * -0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 39500) * 0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 39500) * -0.01));
            } else if (time >= 39500 && time <= 40000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 39500) * -0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 39500) * 0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 39500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 39500) * 0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 39500) * -0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 39500) * 0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 39500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 39500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 39500) * -0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 39500) * 0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 39500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 39500) * 0.01));
            } else if (time >= 40000 && time <= 40500) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 40500) * -0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 40500) * 0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 40500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 40500) * 0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 40500) * -0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 40500) * 0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 40500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 40500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 40500) * -0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 40500) * 0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 40500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 40500) * 0.01));
            } else if (time >= 40500 && time <= 41000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 40500) * 0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 40500) * -0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 40500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 40500) * 0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 40500) * 0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 40500) * -0.08));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 40500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 40500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 40500) * 0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 40500) * -0.08));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 40500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 40500) * 0.01));
            } else if (time >= 41000 && time <= 41500) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 41500) * 0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 41500) * -0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 41500) * 0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 41500) * -0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 41500) * 0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 41500) * -0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 41500) * 0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 41500) * -0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 41500) * 0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 41500) * -0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 41500) * 0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 41500) * -0.01));
            } else if (time >= 41500 && time <= 42000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 41500) * -0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 41500) * 0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 41500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 41500) * 0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 41500) * -0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 41500) * 0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 41500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 41500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 41500) * -0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 41500) * 0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 41500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 41500) * 0.01));
            } else if (time >= 42000 && time <= 42500) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 42500) * -0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 42500) * 0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 42500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 42500) * 0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 42500) * -0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 42500) * 0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 42500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 42500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 42500) * -0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 42500) * 0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 42500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 42500) * 0.01));
            } else if (time >= 42500 && time <= 43000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 42500) * 0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 42500) * -0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 42500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 42500) * 0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 42500) * 0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 42500) * -0.08));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 42500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 42500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 42500) * 0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 42500) * -0.08));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 42500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 42500) * 0.01));
            } else if (time >= 43000 && time <= 43500) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 43500) * 0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 43500) * -0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 43500) * 0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 43500) * -0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 43500) * 0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 43500) * -0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 43500) * 0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 43500) * -0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 43500) * 0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 43500) * -0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 43500) * 0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 43500) * -0.01));
            } else if (time >= 43500 && time <= 44000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 43500) * -0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 43500) * 0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 43500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 43500) * 0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 43500) * -0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 43500) * 0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 43500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 43500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 43500) * -0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 43500) * 0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 43500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 43500) * 0.01));
            } else if (time >= 44000 && time <= 44500) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 44500) * -0.08));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 44500) * 0.08));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 44500) * -0.01));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 44500) * 0.01));

                glMatrix.mat4.rotateX(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 44500) * -0.08));
                glMatrix.mat4.rotateX(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 44500) * 0.08));
                glMatrix.mat4.rotateX(cat_kaki_kiri.MOVEMATRIX, cat_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 44500) * -0.01));
                glMatrix.mat4.rotateX(cat_kaki_kanan.MOVEMATRIX, cat_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 44500) * 0.01));

                glMatrix.mat4.rotateX(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 44500) * -0.08));
                glMatrix.mat4.rotateX(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 44500) * 0.08));
                glMatrix.mat4.rotateX(rory_kaki_kiri.MOVEMATRIX, rory_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 44500) * -0.01));
                glMatrix.mat4.rotateX(rory_kaki_kanan.MOVEMATRIX, rory_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 44500) * 0.01));
            }

            // ============================================= BYEEEEEEEEEEEEEEEEEEEEE ============================================================
            // ========================================== Waving =================================================================
            if (time >= 45000 && time <= 45800) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 45000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 45000) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 45000) * 0.07));
                rory_tangan_kanan.setTranslateMove(-(time - 45000) / 3000, -(time - 45000) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 45000) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 45000) / 2200, -(time - 45000) / 1000, 0);
            } else if (time >= 45800 && time <= 46500) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 46500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 46500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 46500) * 0.07));
                rory_tangan_kanan.setTranslateMove((time - 46500) / 3000, (time - 46500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 46500) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 46500) / 2200, (time - 46500) / 1000, 0);
            } else if (time >= 46500 && time <= 47000) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 46500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 46500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 46500) * 0.07));
                rory_tangan_kanan.setTranslateMove(-(time - 46500) / 3000, -(time - 46500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 46500) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 46500) / 2200, -(time - 46500) / 1000, 0);
            } else if (time >= 47000 && time <= 47500) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 47500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 47500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 47500) * 0.07));
                rory_tangan_kanan.setTranslateMove((time - 47500) / 3000, (time - 47500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 47500) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 47500) / 2200, (time - 47500) / 1000, 0);
            } if (time >= 47500 && time <= 48000) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 47500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 47500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 47500) * 0.07));
                rory_tangan_kanan.setTranslateMove(-(time - 47500) / 3000, -(time - 47500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 47500) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 47500) / 2200, -(time - 47500) / 1000, 0);
            } else if (time >= 48000 && time <= 48500) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 48500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 48500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 48500) * 0.07));
                rory_tangan_kanan.setTranslateMove((time - 48500) / 3000, (time - 48500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 48500) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 48500) / 2200, (time - 48500) / 1000, 0);
            } else if (time >= 48500 && time <= 49000) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 48500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 48500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 48500) * 0.07));
                rory_tangan_kanan.setTranslateMove(-(time - 48500) / 3000, -(time - 48500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 48500) * 0.07));
                cat_tangan_kanan.setTranslateMove(-(time - 48500) / 2200, -(time - 48500) / 1000, 0);
            } else if (time >= 49000 && time <= 49500) {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 49500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 49500) / 1000, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 49500) * 0.07));
                rory_tangan_kanan.setTranslateMove((time - 49500) / 3000, (time - 49500) / 1000, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 49500) * 0.07));
                cat_tangan_kanan.setTranslateMove((time - 49500) / 2200, (time - 49500) / 1000, 0);
            } else {
                // Badtzmaru
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                badtz_tangan_kanan.setTranslateMove(0, 0, 0);

                // Rory
                glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                rory_tangan_kanan.setTranslateMove(0, 0, 0);

                // Chococat
                glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                cat_tangan_kanan.setTranslateMove(0, 0, 0);
            }
            // ==================================================================================================================================

            // ======================================================= Apel Jatuh ================================================================
            if (time >= 4000 && time <= 6000) {
                apel3.setTranslateMove(0, -(time - 4000) / 770, 0);
            } else if (time >= 10000 && time <= 12000) {
                apel2.setTranslateMove(0, -(time - 10000) / 680, 0);
            } else if (time >= 16000 && time <= 18000) {
                apel1.setTranslateMove(0, -(time - 16000) / 770, 0);
            } 
            
            if (time > 6000) {
                apel3.setTranslateMove(0, -2000 / 770, 0);
            }

            if (time > 12000) {
                apel2.setTranslateMove(0, -2000 / 680, 0);
            }

            if (time > 18000) {
                apel1.setTranslateMove(0, -2000 / 770, 0);
            }
            

            // ===================================================================================================================================

            // ========================================================= Curve berputar ==========================================================            
            if (time >= 35000 && time <= 55000) {
                curveObjects.forEach(obj => {
                    glMatrix.mat4.translate(obj.MOVEMATRIX, obj.MOVEMATRIX, [0, 0.0, 0.0]);
                    glMatrix.mat4.rotateY(obj.MOVEMATRIX, obj.MOVEMATRIX, time / 1000);
                    glMatrix.mat4.translate(obj.MOVEMATRIX, obj.MOVEMATRIX, [2, 0.0, 0.0]);
                });

                cat_curve.forEach(obj => {
                    glMatrix.mat4.translate(obj.MOVEMATRIX, obj.MOVEMATRIX, [0, 0.0, 0.0]);
                    glMatrix.mat4.rotateY(obj.MOVEMATRIX, obj.MOVEMATRIX, time / 1000);
                    glMatrix.mat4.translate(obj.MOVEMATRIX, obj.MOVEMATRIX, [2, 0.0, 0.0]);
                });

                rory_curveObjects.forEach(obj => {
                    glMatrix.mat4.translate(obj.MOVEMATRIX, obj.MOVEMATRIX, [0, 0.0, 0.0]);
                    glMatrix.mat4.rotateY(obj.MOVEMATRIX, obj.MOVEMATRIX, time / 1000);
                    glMatrix.mat4.translate(obj.MOVEMATRIX, obj.MOVEMATRIX, [2, 0.0, 0.0]);
                });
            }

            // ============================================ Badtz Maru ====================================================================            

            badtz_kepala.setScale(0.3)
            for (let i = 0; i < badtz_kepala.child.length; i++) {
                badtz_kepala.child[i].setScale(0.3)
            }

            badtz_badan.setScale(0.3)
            for (let i = 0; i < badtz_badan.child.length; i++) {
                badtz_badan.child[i].setScale(0.3)
            }

            // derajat putarnya melawan arah jarum jam (kalo + melawan arah, kalo - searah) 
            // PS. Jangan lupa kalau mau rotasi berdasarkan time yg dibawah juga phiny diganti LIBS.degToRad(time * 0.05) :)
            // tanduk_1.setRotateMove(PHI, THETA, LIBS.degToRad(40));
            glMatrix.mat4.rotateZ(tanduk_1.MOVEMATRIX, tanduk_1.MOVEMATRIX, LIBS.degToRad(40));
            glMatrix.mat4.rotateZ(tanduk_2.MOVEMATRIX, tanduk_2.MOVEMATRIX, LIBS.degToRad(10));
            glMatrix.mat4.rotateZ(tanduk_3.MOVEMATRIX, tanduk_3.MOVEMATRIX, LIBS.degToRad(-10));
            glMatrix.mat4.rotateZ(tanduk_4.MOVEMATRIX, tanduk_4.MOVEMATRIX, LIBS.degToRad(-40));
            glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad(60));
            glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-60));

            // ganti kemiringan badtz maru
            badtzMaru.setRotateMove(PHI, LIBS.degToRad(13), 0);
            // ===========================================================================================================================

            // ================================================ ChocoCat =================================================================                    

            // ganti kemiringan
            chocoCat.setRotateMove(PHI, LIBS.degToRad(-13), 0)

            cat_kepala.setScale(0.3)
            for (let i = 0; i < cat_kepala.child.length; i++) {
                cat_kepala.child[i].setScale(0.3)
            }

            cat_badan.setScale(0.3)
            for (let i = 0; i < cat_badan.child.length; i++) {
                cat_badan.child[i].setScale(0.3)
            }

            glMatrix.mat4.rotateX(cat_telinga_kiri.MOVEMATRIX, cat_telinga_kiri.MOVEMATRIX, LIBS.degToRad(10));
            glMatrix.mat4.rotateZ(cat_telinga_kiri.MOVEMATRIX, cat_telinga_kiri.MOVEMATRIX, LIBS.degToRad(32));

            glMatrix.mat4.rotateX(cat_telinga_kanan.MOVEMATRIX, cat_telinga_kanan.MOVEMATRIX, LIBS.degToRad(10));
            glMatrix.mat4.rotateZ(cat_telinga_kanan.MOVEMATRIX, cat_telinga_kanan.MOVEMATRIX, LIBS.degToRad(-32));

            glMatrix.mat4.rotateX(cat_telinga_kanan_dalam.MOVEMATRIX, cat_telinga_kanan_dalam.MOVEMATRIX, LIBS.degToRad(10));
            glMatrix.mat4.rotateZ(cat_telinga_kanan_dalam.MOVEMATRIX, cat_telinga_kanan_dalam.MOVEMATRIX, LIBS.degToRad(-32));

            glMatrix.mat4.rotateX(cat_telinga_kiri_dalam.MOVEMATRIX, cat_telinga_kiri_dalam.MOVEMATRIX, LIBS.degToRad(10));
            glMatrix.mat4.rotateZ(cat_telinga_kiri_dalam.MOVEMATRIX, cat_telinga_kiri_dalam.MOVEMATRIX, LIBS.degToRad(32));

            glMatrix.mat4.rotateZ(cat_tangan_kanan.MOVEMATRIX, cat_tangan_kanan.MOVEMATRIX, LIBS.degToRad(25));
            glMatrix.mat4.rotateZ(cat_tangan_kiri.MOVEMATRIX, cat_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-25));

            glMatrix.mat4.rotateZ(cat_kumis_kanan1.MOVEMATRIX, cat_kumis_kanan1.MOVEMATRIX, LIBS.degToRad(-80));
            glMatrix.mat4.rotateZ(cat_kumis_kanan2.MOVEMATRIX, cat_kumis_kanan2.MOVEMATRIX, LIBS.degToRad(-105));

            glMatrix.mat4.rotateZ(cat_kumis_kiri1.MOVEMATRIX, cat_kumis_kiri1.MOVEMATRIX, LIBS.degToRad(80));
            glMatrix.mat4.rotateZ(cat_kumis_kiri2.MOVEMATRIX, cat_kumis_kiri2.MOVEMATRIX, LIBS.degToRad(105));

            glMatrix.mat4.rotateX(cat_topi.MOVEMATRIX, cat_topi.MOVEMATRIX, LIBS.degToRad(-90));
            // ==================================================================================================================================

            // ===================================================== Rory =======================================================================  

            // ganti kemiringan
            rory.setRotateMove(PHI, LIBS.degToRad(-5), 0)

            rory_kepala.setScale(0.3)
            for (let i = 0; i < rory_kepala.child.length; i++) {
                rory_kepala.child[i].setScale(0.3)
            }

            rory_badan.setScale(0.3)
            for (let i = 0; i < rory_badan.child.length; i++) {
                rory_badan.child[i].setScale(0.3)
            }
            glMatrix.mat4.rotateX(rory_telinga_kiri.MOVEMATRIX, rory_telinga_kiri.MOVEMATRIX, LIBS.degToRad(100));
            glMatrix.mat4.rotateY(rory_telinga_kiri.MOVEMATRIX, rory_telinga_kiri.MOVEMATRIX, LIBS.degToRad(-5));
            glMatrix.mat4.rotateX(rory_telinga_kanan.MOVEMATRIX, rory_telinga_kanan.MOVEMATRIX, LIBS.degToRad(100));
            glMatrix.mat4.rotateY(rory_telinga_kanan.MOVEMATRIX, rory_telinga_kanan.MOVEMATRIX, LIBS.degToRad(5));

            glMatrix.mat4.rotateX(ekor_2.MOVEMATRIX, ekor_2.MOVEMATRIX, LIBS.degToRad(-20));
            glMatrix.mat4.rotateZ(ekor_2.MOVEMATRIX, ekor_2.MOVEMATRIX, LIBS.degToRad(180));
            glMatrix.mat4.rotateX(ekor_3.MOVEMATRIX, ekor_2.MOVEMATRIX, LIBS.degToRad(-60));
            glMatrix.mat4.rotateZ(rory_tangan_kanan.MOVEMATRIX, rory_tangan_kanan.MOVEMATRIX, LIBS.degToRad(50));
            glMatrix.mat4.rotateZ(rory_tangan_kiri.MOVEMATRIX, rory_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-50));
            // ==================================================================================================================================

            // ========================================================= World ==================================================================            
            pohon.setScale(0.5);
            pohon2.setScale(0.7);
            for (let i = 0; i < pohon.child.length; i++) {
                pohon.child[i].setScale(0.5);
            }
            for (let i = 0; i < pohon2.child.length; i++) {
                pohon2.child[i].setScale(0.7);
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
            
            if (time >= 10000 && time <= 20000) {
                awan11.setTranslateMove((time - 10000) / 3500, 0, 0);
                awan12.setTranslateMove((time - 10000) / 3500, 0, 0);
                awan13.setTranslateMove((time - 10000) / 3500, 0, 0);
                awan21.setTranslateMove(-(time - 10000) / 3500, 0, 0);
                awan22.setTranslateMove(-(time - 10000) / 3500, 0, 0);
                awan23.setTranslateMove(-(time - 10000) / 3500, 0, 0);
            }

            if (time > 20000) {
                awan11.setTranslateMove((20000 - 10000) / 3500, 0, 0);
                awan12.setTranslateMove((20000 - 10000) / 3500, 0, 0);
                awan13.setTranslateMove((20000 - 10000) / 3500, 0, 0);
                awan21.setTranslateMove(-(20000 - 10000) / 3500, 0, 0);
                awan22.setTranslateMove(-(20000 - 10000) / 3500, 0, 0);
                awan23.setTranslateMove(-(20000 - 10000) / 3500, 0, 0);
            }

            if (time >= 20000 && time <= 30000) {
                awan11.setTranslateMove(-(time - 20000) / 3500, 0, 0);
                awan12.setTranslateMove(-(time - 20000) / 3500, 0, 0);
                awan13.setTranslateMove(-(time - 20000) / 3500, 0, 0);
                awan21.setTranslateMove((time - 20000) / 3500, 0, 0);
                awan22.setTranslateMove((time - 20000) / 3500, 0, 0);
                awan23.setTranslateMove((time - 20000) / 3500, 0, 0);
            }

            if (time > 30000) {
                awan11.setTranslateMove(-(30000 - 20000) / 3500, 0, 0);
                awan12.setTranslateMove(-(30000 - 20000) / 3500, 0, 0);
                awan13.setTranslateMove(-(30000 - 20000) / 3500, 0, 0);
                awan21.setTranslateMove((30000 - 20000) / 3500, 0, 0);
                awan22.setTranslateMove((30000 - 20000) / 3500, 0, 0);
                awan23.setTranslateMove((30000 - 20000) / 3500, 0, 0);
            }

            if (time >= 30000 && time <= 40000) {
                awan11.setTranslateMove((time - 30000) / 3500, 0, 0);
                awan12.setTranslateMove((time - 30000) / 3500, 0, 0);
                awan13.setTranslateMove((time - 30000) / 3500, 0, 0);
                awan21.setTranslateMove(-(time - 30000) / 3500, 0, 0);
                awan22.setTranslateMove(-(time - 30000) / 3500, 0, 0);
                awan23.setTranslateMove(-(time - 30000) / 3500, 0, 0);
            }

            if (time > 40000) {
                awan11.setTranslateMove((40000 - 30000) / 3500, 0, 0);
                awan12.setTranslateMove((40000 - 30000) / 3500, 0, 0);
                awan13.setTranslateMove((40000 - 30000) / 3500, 0, 0);
                awan21.setTranslateMove(-(40000 - 30000) / 3500, 0, 0);
                awan22.setTranslateMove(-(40000 - 30000) / 3500, 0, 0);
                awan23.setTranslateMove(-(40000 - 30000) / 3500, 0, 0);
            }

            if (time >= 40000 && time <= 50000) {
                awan11.setTranslateMove(-(time - 40000) / 3500, 0, 0);
                awan12.setTranslateMove(-(time - 40000) / 3500, 0, 0);
                awan13.setTranslateMove(-(time - 40000) / 3500, 0, 0);
                awan21.setTranslateMove((time - 40000) / 3500, 0, 0);
                awan22.setTranslateMove((time - 40000) / 3500, 0, 0);
                awan23.setTranslateMove((time - 40000) / 3500, 0, 0);
            }

            if (time > 50000) {
                awan11.setTranslateMove(-(50000 - 40000) / 3500, 0, 0);
                awan12.setTranslateMove(-(50000 - 40000) / 3500, 0, 0);
                awan13.setTranslateMove(-(50000 - 40000) / 3500, 0, 0);
                awan21.setTranslateMove((50000 - 40000) / 3500, 0, 0);
                awan22.setTranslateMove((50000 - 40000) / 3500, 0, 0);
                awan23.setTranslateMove((50000 - 40000) / 3500, 0, 0);
            }


            glMatrix.mat4.rotateX(tanah.MOVEMATRIX, tanah.MOVEMATRIX, LIBS.degToRad(15));
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
            glMatrix.mat4.rotateX(path.MOVEMATRIX, path.MOVEMATRIX, LIBS.degToRad(15));
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
            // ==================================================================================================================================

            time_prev = time;
        }
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);

        badtzMaru.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        chocoCat.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        rory.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        world.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);

        badtzMaru.draw();
        chocoCat.draw();
        rory.draw();
        world.draw();
        for (let i = 0; i < curveObjects.length; i++) {
            curveObjects[i].drawLine();
        }

        for (let i = 0; i < cat_curve.length; i++) {
            cat_curve[i].drawLine();
        }

        for (let i = 0; i < cat_ekor_curve.length; i++) {
            cat_ekor_curve[i].drawLine();
        }

        for (let i = 0; i < rory_curveObjects.length; i++) {
            rory_curveObjects[i].drawLine();
        }

        // tangan_kiri.draw();
        // tangan_kanan.draw();
        // penutup_mata_kanan.draw();

        GL.flush();
        window.requestAnimationFrame(animate);
    }

    // Menjalankan function animate untuk looping draw
    animate();
}

window.addEventListener('load', main);