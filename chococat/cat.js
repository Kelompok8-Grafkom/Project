// Fungsi untuk melakukan generate garis lengkung
function normalizeScreen(x, y, width, height) {
    var nx = 2 * x / width - 1
    var ny = -2 * y / height + 1

    return [nx, ny]
}

function generateBSpline(controlPoint, m, degree) {
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
            console.log(C);
            x += (controlPoint[key * 2] * C);
            y += (controlPoint[key * 2 + 1] * C);
            console.log(t + " " + degree + " " + x + " " + y + " " + C);
        }
        curves.push(x);
        curves.push(y);

    }
    console.log(curves)
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
    scaling(m4){
        this.MOVEMATRIX = LIBS.mul(this.MOVEMATRIX, m4);
        this.child.scaling(m4);
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
    var AMORTIZATION = 0.95;

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

    var object;

    // SPHERE: radius, r, g, b, mulX, mulY, mulZ, pX, pY, pZ
    // CIRCLE: mX, mY, mZ, pX, pY, pZ, r, g, b
    // HALF SPHERE: radius, r, g, b, mulXy, pX, pY, pZ

    var chococat = new MyObject([],[], shader_vertex_source, shader_fragment_source);

    object = generateSphere(1.0, 20, 17, 17, 1.3, 1.1, 1, 0, 0.5, 0);
    var kepala = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.4, 257, 257, 257, 1, 0.9, 1, -0.4, 0.4, 0.6);
    var mata_kiri_putih = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.4, 257, 257, 257, 1, 0.9, 1, 0.4, 0.4, 0.6);
    var mata_kanan_putih = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateCircle(-0.4, 0.38, 1, 0.09, 0.09, 0, 0, 0, 0);
    var mata_kiri_hitam = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateCircle(0.4, 0.38, 1, 0.09, 0.09, 0, 0, 0, 0);
    var mata_kanan_hitam = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.35, 184, 131, 108, 0.5, 0.4, 1, 0, 0.15, 0.65);
    var mulut = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.75, 20, 17, 17, 1.0, 1.2, 0.7, 0, -0.8, 0);
    var badan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(1.0, 94, 146, 209, 0.75, 0.12, 0.52, 0, -0.48, 0);
    var kalung = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.32, 20, 17, 17, 1.4, 4, 0.7, 0.25, 0.8, 0);
    var telinga_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);
    
    object = generateSphere(0.32, 20, 17, 17, 1.4, 4, 0.7, -0.25, 0.8, 0);
    var telinga_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.22, 247, 226, 168, 1.3, 4, 0.7, 0.25, 1.05, 0.1);
    var telinga_kanan_dalam = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.22, 247, 226, 168, 1.3, 4, 0.7, -0.25, 1.05, 0.1);
    var telinga_kiri_dalam = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.42, 20, 20, 17, 0.48, 1.1, 0.4, 0.32, -1.2, 0);
    var tangan_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.42, 20, 20, 17, 0.48, 1.1, 0.4, -0.32, -1.2, 0);
    var tangan_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    // TABUNG mX1, mY1, mZ1, mX2, mY2, mZ2, rX1, rY1, rZ1, rX2, rY2, rZ2, r, g, b
    object = generateTabung(0.35, -2, 0, -0.1, 0, 0, 0.28, 0, 0.3, 0.2, 1.2, 0.1, 20, 20, 17)
    var kaki_kanan = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-0.35, -2, 0, 0.1, 0, 0, 0.28, 0, 0.3, 0.2, 1.2, 0.1, 20, 20, 17)
    var kaki_kiri = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(0, 1, 0.45, 0, 1.3, 0.45, 0.025, 0, 0.025, 0.025, 0.2, 0.025, 20, 20, 17)
    var kumis_kanan1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(-0.25, 0.7, 0.45, -0.2, 1.2, 0.45, 0.025, 0, 0.025, 0.025, 0.2, 0.025, 20, 20, 17)
    var kumis_kanan2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(0, 1, 0.45, 0, 1.3, 0.45, 0.025, 0, 0.025, 0.025, 0.2, 0.025, 20, 20, 17)
    var kumis_kiri1 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateTabung(0.25, 0.7, 0.45, 0.2, 1.2, 0.45, 0.025, 0, 0.025, 0.025, 0.2, 0.025, 20, 20, 17)
    var kumis_kiri2 = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateCone(-0.5, -0.8, 1.85, -0.25, -0.2, 0.9, 0.5, 0.5, 94, 146, 209);
    var topi = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);

    object = generateSphere(0.07, 227, 195, 107, 1, 1, 1, -0.5, 1.87, 0.82);
    var bola_topi = new MyObject(object[0], object[1], shader_vertex_source, shader_fragment_source);


    chococat.addChild(kepala);
    chococat.addChild(badan);
    kepala.addChild(mata_kiri_putih);
    kepala.addChild(mata_kanan_putih);
    kepala.addChild(mata_kiri_hitam);
    kepala.addChild(mata_kanan_hitam);
    kepala.addChild(mulut);
    kepala.addChild(telinga_kiri);
    kepala.addChild(telinga_kanan);
    kepala.addChild(telinga_kanan_dalam);
    kepala.addChild(telinga_kiri_dalam);
    kepala.addChild(kumis_kanan1);
    kepala.addChild(kumis_kanan2);
    kepala.addChild(kumis_kiri1);
    kepala.addChild(kumis_kiri2);
    kepala.addChild(topi);
    kepala.addChild(bola_topi);
    badan.addChild(kalung);
    badan.addChild(kaki_kanan);
    badan.addChild(kaki_kiri);
    badan.addChild(tangan_kanan);
    badan.addChild(tangan_kiri);
    
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
            chococat.setIdentityMove();        
            chococat.setRotateMove(PHI, THETA, 0);   
            chococat.setTranslateMove(0, -0.3, 0);

            for (let i = 0; i < chococat.child.length; i++) {
                chococat.child[i].setIdentityMove();
                chococat.child[i].setRotateMove(PHI, THETA, 0);
                chococat.child[i].setTranslateMove(0, -0.3, 0);   
            }

            // kepala toleh kanan kiri
            if (time <= 1000)
                kepala.setRotateMove(PHI, LIBS.degToRad(time * 0.02), 0)
            else if (time > 1000 && time < 3000)
                kepala.setRotateMove(PHI, LIBS.degToRad(20), 0);
            else if (time >= 3000 && time <= 5000)
                kepala.setRotateMove(PHI, LIBS.degToRad((-time + 4000) * 0.02), 0);
            else if (time > 5000 && time < 7000)
                kepala.setRotateMove(PHI, LIBS.degToRad(-20), 0);
            else if (time >= 7000 && time <= 8000)
                kepala.setRotateMove(PHI, LIBS.degToRad((time - 8000) * 0.02), 0);

            for (let i = 0; i < kepala.child.length; i++) {
                kepala.child[i].setIdentityMove();
                kepala.child[i].setRotateMove(PHI, THETA, 0);
                kepala.child[i].setTranslateMove(0, -0.3, 0);   

                // kepala toleh kanan kiri
                if (time <= 1000)
                    kepala.child[i].setRotateMove(PHI, LIBS.degToRad(time * 0.02), 0)
                else if (time > 1000 && time < 3000)
                    kepala.child[i].setRotateMove(PHI, LIBS.degToRad(20), 0);
                else if (time >= 3000 && time <= 5000)
                    kepala.child[i].setRotateMove(PHI, LIBS.degToRad((-time + 4000) * 0.02), 0);
                else if (time > 5000 && time < 7000)
                    kepala.child[i].setRotateMove(PHI, LIBS.degToRad(-20), 0);
                else if (time >= 7000 && time <= 8000)
                    kepala.child[i].setRotateMove(PHI, LIBS.degToRad((time - 8000) * 0.02), 0);
            }

            for (let i = 0; i < badan.child.length; i++) {
                badan.child[i].setIdentityMove();
                badan.child[i].setRotateMove(PHI, THETA, 0);
                badan.child[i].setTranslateMove(0, -0.3, 0);   
            }

            glMatrix.mat4.rotateX(telinga_kiri.MOVEMATRIX, telinga_kiri.MOVEMATRIX, LIBS.degToRad(10));
            glMatrix.mat4.rotateZ(telinga_kiri.MOVEMATRIX, telinga_kiri.MOVEMATRIX, LIBS.degToRad(32));

            glMatrix.mat4.rotateX(telinga_kanan.MOVEMATRIX, telinga_kanan.MOVEMATRIX, LIBS.degToRad(10));
            glMatrix.mat4.rotateZ(telinga_kanan.MOVEMATRIX, telinga_kanan.MOVEMATRIX, LIBS.degToRad(-32));

            glMatrix.mat4.rotateX(telinga_kanan_dalam.MOVEMATRIX, telinga_kanan_dalam.MOVEMATRIX, LIBS.degToRad(10));
            glMatrix.mat4.rotateZ(telinga_kanan_dalam.MOVEMATRIX, telinga_kanan_dalam.MOVEMATRIX, LIBS.degToRad(-32));

            glMatrix.mat4.rotateX(telinga_kiri_dalam.MOVEMATRIX, telinga_kiri_dalam.MOVEMATRIX, LIBS.degToRad(10));
            glMatrix.mat4.rotateZ(telinga_kiri_dalam.MOVEMATRIX, telinga_kiri_dalam.MOVEMATRIX, LIBS.degToRad(32));

            glMatrix.mat4.rotateZ(tangan_kanan.MOVEMATRIX, tangan_kanan.MOVEMATRIX, LIBS.degToRad(25));
            glMatrix.mat4.rotateZ(tangan_kiri.MOVEMATRIX, tangan_kiri.MOVEMATRIX, LIBS.degToRad(-25));

            glMatrix.mat4.rotateZ(kumis_kanan1.MOVEMATRIX, kumis_kanan1.MOVEMATRIX, LIBS.degToRad(-80));
            glMatrix.mat4.rotateZ(kumis_kanan2.MOVEMATRIX, kumis_kanan2.MOVEMATRIX, LIBS.degToRad(-105));

            glMatrix.mat4.rotateZ(kumis_kiri1.MOVEMATRIX, kumis_kiri1.MOVEMATRIX, LIBS.degToRad(80));
            glMatrix.mat4.rotateZ(kumis_kiri2.MOVEMATRIX, kumis_kiri2.MOVEMATRIX, LIBS.degToRad(105));

            glMatrix.mat4.rotateX(topi.MOVEMATRIX, topi.MOVEMATRIX, LIBS.degToRad(-90));

            time_prev = time;
        }
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);

        chococat.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        kepala.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        badan.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);

        for (let i = 0; i < chococat.child.length; i++) {
            chococat.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        for (let i = 0; i < kepala.child.length; i++) {
            kepala.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }

        for (let i = 0; i < badan.child.length; i++) {
            badan.child[i].setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        }


        chococat.draw();
        GL.flush();
        window.requestAnimationFrame(animate);
    }

    // Menjalankan function animate untuk looping draw
    animate();
}

window.addEventListener('load', main);