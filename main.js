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

function generateBSpline2(controlPoint, m, degree, xUp, yUp, zUp, r, g, b){
    var curves = [];
    var knotVector = []
   
    var n = controlPoint.length/2;
   
    // Calculate the knot values based on the degree and number of control points
    for (var i = 0; i < n + degree+1; i++) {
      if (i < degree + 1) {
        knotVector.push(0);
      } else if (i >= n) {
        knotVector.push(n - degree);
      } else {
        knotVector.push(i - degree);
      }
    }

    var basisFunc = function(i,j,t){
        if (j == 0){
          if(knotVector[i] <= t && t<(knotVector[(i+1)])){ 
            return 1;
          }else{
            return 0;
          }
        }
   
        var den1 = knotVector[i + j] - knotVector[i];
        var den2 = knotVector[i + j + 1] - knotVector[i + 1];
   
        var term1 = 0;
        var term2 = 0;
   
   
        if (den1 != 0 && !isNaN(den1)) {
          term1 = ((t - knotVector[i]) / den1) * basisFunc(i,j-1,t);
        }
   
        if (den2 != 0 && !isNaN(den2)) {
          term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i+1,j-1,t);
        }
   
        return term1 + term2;
    }
   
   
    for(var t=0;t<m;t++){
      var x=0;
      var y=0;
   
      var u = (t/m * (knotVector[controlPoint.length/2] - knotVector[degree]) ) + knotVector[degree] ;
   
      //C(t)
      for(var key =0;key<n;key++){
   
        var C = basisFunc(key,degree,u);
        x+=(controlPoint[key*2] * C);
        y+=(controlPoint[key*2+1] * C);
      }
      curves.push(x+xUp);
      curves.push(y+yUp);
      curves.push(zUp);
      curves.push(r/255, g/255, b/255);
   
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

    var curve = [0.075, -0.4, 0.19, 0.51, 0.42, -0.59, -0.15, 0.05, 0.65, 0.05, 0.035, -0.44];
    var y = -0.85;
    for (let index = 0; index < curve.length; index++) {
      var vertex = generateBSpline2(curve, 100, 2, -0.2, y, 0.53, 227, 143, 227);
      var faces = [];
      for (let index = 0; index < vertex.length/6; index++) {
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
      var vertex = generateBSpline2(curve,100, 2, -1.8, y, -0.1, 38, 36, 36);
      var faces = [];
      for (let index = 0; index < vertex.length/6; index++) {
        faces.push(index);
      }
      var ekor = new MyObject(vertex, faces, shader_vertex_source, shader_fragment_source);
      y += 0.006;
      cat_curve.push(ekor);
    }

    cat_curve.forEach(obj => {
        cat_badan.addChild(obj);
    });
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
            badtzMaru.setIdentityMove();
            badtzMaru.setRotateMove(PHI, THETA, 0);
            chocoCat.setIdentityMove();
            chocoCat.setRotateMove(PHI, THETA, 0);


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

            // pindah posisi badtz maru ke kiri
            badtzMaru.setPosition(-5, -1, 2);
            chocoCat.setPosition(5, -1.2, 2);

            // ===================================================== Lompat ===============================================================
            if (time <= 500) {
                badtz_kepala.setTranslateMove(0, time / 5000, 0);
                badtz_badan.setTranslateMove(0, time / 5000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_kepala.child[i].MOVEMATRIX, badtz_kepala.child[i].MOVEMATRIX, LIBS.degToRad(50));
                    badtz_kepala.child[i].setTranslateMove(0, time / 5000, 0);
                }

                for (let i = 0; i < badtz_badan.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_badan.child[i].MOVEMATRIX, badtz_badan.child[i].MOVEMATRIX, LIBS.degToRad(50));
                    badtz_badan.child[i].setTranslateMove(0, time / 5000, 0);
                }

                for (let i = 0; i < curveObjects.length; i++) {
                    // glMatrix.mat4.rotateY(curveObjects[i].MOVEMATRIX, curveObjects[i].MOVEMATRIX, LIBS.degToRad(50));
                    curveObjects[i].setTranslateMove(0, time / 50000, 0);
                }

                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time) / 1000, 0);

                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, -(time) / 1000, 0);

            } else if (time >= 500 && time <= 1000) {
                badtz_kepala.setTranslateMove(0, (-time + 1000) / 5000, 0);
                badtz_badan.setTranslateMove(0, (-time + 1000) / 5000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_kepala.child[i].MOVEMATRIX, badtz_kepala.child[i].MOVEMATRIX, LIBS.degToRad(50));
                    badtz_kepala.child[i].setTranslateMove(0, (-time + 1000) / 5000, 0);
                }

                for (let i = 0; i < badtz_badan.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_badan.child[i].MOVEMATRIX, badtz_badan.child[i].MOVEMATRIX, LIBS.degToRad(50));
                    badtz_badan.child[i].setTranslateMove(0, (-time + 1000) / 5000, 0);
                }

                for (let i = 0; i < curveObjects.length; i++) {
                    // glMatrix.mat4.rotateY(curveObjects[i].MOVEMATRIX, curveObjects[i].MOVEMATRIX, LIBS.degToRad(50));
                    curveObjects[i].setTranslateMove(0, (-time + 1000) / 50000, 0);
                }

                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 1000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 1000) / 1000, 0);

                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 1000) * -0.07));
                badtz_tangan_kiri.setTranslateMove(0, (time - 1000) / 1000, 0);
            } else if (time >= 1000 && time <= 1500) {
                badtz_kepala.setTranslateMove(0, (time-1000) / 5000, 0);
                badtz_badan.setTranslateMove(0, (time-1000) / 5000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_kepala.child[i].MOVEMATRIX, badtz_kepala.child[i].MOVEMATRIX, LIBS.degToRad(50));
                    badtz_kepala.child[i].setTranslateMove(0, (time-1000) / 5000, 0);
                }

                for (let i = 0; i < badtz_badan.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_badan.child[i].MOVEMATRIX, badtz_badan.child[i].MOVEMATRIX, LIBS.degToRad(50));
                    badtz_badan.child[i].setTranslateMove(0, (time-1000) / 5000, 0);
                }

                for (let i = 0; i < curveObjects.length; i++) {
                    // glMatrix.mat4.rotateY(curveObjects[i].MOVEMATRIX, curveObjects[i].MOVEMATRIX, LIBS.degToRad(50));
                    curveObjects[i].setTranslateMove(0, (time-1000) / 50000, 0);
                }

                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 1000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 1000) / 1000, 0);

                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(-(time - 1000) * 0.07));
                badtz_tangan_kiri.setTranslateMove(0, -(time - 1000) / 1000, 0);

            } else if (time >= 1500 && time <= 2000) {
                badtz_kepala.setTranslateMove(0, (-time + 2000) / 5000, 0);
                badtz_badan.setTranslateMove(0, (-time + 2000) / 5000, 0);
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_kepala.child[i].MOVEMATRIX, badtz_kepala.child[i].MOVEMATRIX, LIBS.degToRad(50));
                    badtz_kepala.child[i].setTranslateMove(0, (-time + 2000) / 5000, 0);
                }

                for (let i = 0; i < badtz_badan.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_badan.child[i].MOVEMATRIX, badtz_badan.child[i].MOVEMATRIX, LIBS.degToRad(50));
                    badtz_badan.child[i].setTranslateMove(0, (-time + 2000) / 5000, 0);
                }

                for (let i = 0; i < curveObjects.length; i++) {
                    // glMatrix.mat4.rotateY(curveObjects[i].MOVEMATRIX, curveObjects[i].MOVEMATRIX, LIBS.degToRad(50));
                    curveObjects[i].setTranslateMove(0, (-time + 2000) / 50000, 0);
                }

                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 2000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 2000) / 1000, 0);

                glMatrix.mat4.rotateZ(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 2000) * -0.07));
                badtz_tangan_kiri.setTranslateMove(0, (time - 2000) / 1000, 0);

            }

            // ========================================== Waving =================================================================
            // nambah sudut dari 0 - 70 derajat, trs ditranslate turun dari 0 - (-1) biar lokasi e ga ngawur
            // bawah" ngulangi sama kek ini cuma ganti detikan
            if (time >= 3500 && time <= 4300) {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 3500) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 3500) / 1000, 0);
            // dari detik 9 - 10
            // ngurangi sudut dari 70 - 0 derajat, trs ditranslate balik dari -1 - 0
            // bawah" ngulangi sama kek ini cuma ganti detikan
            } else if (time >= 4300 && time <= 5000) {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 5000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 5000) / 1000, 0);
            } else if (time >= 5000 && time <= 5500) {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 5000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, -(time - 5000) / 1000, 0);
            } else if (time >= 5500 && time <= 6000) {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 6000) * 0.07));
                badtz_tangan_kanan.setTranslateMove(0, (time - 6000) / 1000, 0);
            } else {
                glMatrix.mat4.rotateZ(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                badtz_tangan_kanan.setTranslateMove(0, 0, 0);
            }

            // ====================================================================================================================

            // =================================== Kepala noleh ===========================================
            if (time >= 8000 && time <= 8800)
                badtz_kepala.setRotateMove(PHI, LIBS.degToRad((time - 8000) * 0.05), 0)
            else if (time > 8800)
                badtz_kepala.setRotateMove(PHI, LIBS.degToRad(40), 0);

            // =================================== Badan noleh ============================================
            if (time >= 9500 && time <= 10300) {
                badtz_badan.setRotateMove(PHI, LIBS.degToRad((time - 9500) * 0.05), 0)
            } else if (time > 10300) {
                badtz_badan.setRotateMove(PHI, LIBS.degToRad(40), 0);
            }

            // ============================= jalan ================================================

            // translate objek biar keliatan jalan
            if (time >= 11000 && time <= 19000) {
                // glMatrix.mat4.rotateY(badtz_kepala.MOVEMATRIX, badtz_kepala.MOVEMATRIX, LIBS.degToRad(40));
                badtz_kepala.setTranslateMove(time / 10000, 0, 0);

                // glMatrix.mat4.rotateY(badtz_badan.MOVEMATRIX, badtz_badan.MOVEMATRIX, LIBS.degToRad(40));
                badtz_badan.setTranslateMove(time / 10000, 0, 0);  
                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_kepala.child[i].MOVEMATRIX, badtz_kepala.child[i].MOVEMATRIX, LIBS.degToRad(40));
                    badtz_kepala.child[i].setTranslateMove(time / 10000, 0, 0);
                }

                for (let i = 0; i < badtz_badan.child.length; i++) {
                    // glMatrix.mat4.rotateY(badtz_badan.child[i].MOVEMATRIX, badtz_badan.child[i].MOVEMATRIX, LIBS.degToRad(40));
                    badtz_badan.child[i].setTranslateMove(time / 10000, 0, 0);                    
                }

                for (let i = 0; i < curveObjects.length; i++) {
                    // glMatrix.mat4.rotateY(curveObjects[i].MOVEMATRIX, curveObjects[i].MOVEMATRIX, LIBS.degToRad(40));
                    curveObjects[i].setTranslateMove(time / 100000, 0, 0);
                }           
            } else if (time >= 19000) {
                badtz_kepala.setTranslateMove(1.9, 0, 0);
                badtz_badan.setTranslateMove(1.9, 0, 0);

                for (let i = 0; i < badtz_kepala.child.length; i++) {
                    badtz_kepala.child[i].setTranslateMove(1.9, 0, 0);
                }

                for (let i = 0; i < badtz_badan.child.length; i++) {
                    badtz_badan.child[i].setTranslateMove(1.9, 0, 0);
                }

                for (let i = 0; i < curveObjects.length; i++) {
                    curveObjects[i].setTranslateMove(0.19, 0, 0);
                }
            }         

            // animasi pergerakan tangan dan kaki untuk jalan
            if (time >= 11000 && time <= 12000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 11000) * 0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 11000) * -0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 11000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 11000) * 0.005));
            } else if (time >= 12000 && time <= 13000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 13000) * 0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 13000) * -0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 13000) * 0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 13000) * -0.005));
            } else if (time >= 13000 && time <= 14000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 13000) * -0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 13000) * 0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 13000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 13000) * 0.005));
            } else if (time >= 14000 && time <= 15000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 15000) * -0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 15000) * 0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 15000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 15000) * 0.005));
            } else if (time >= 15000 && time <= 16000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 15000) * 0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 15000) * -0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 15000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 15000) * 0.005));
            } else if (time >= 16000 && time <= 17000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 17000) * 0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 17000) * -0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 17000) * 0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 17000) * -0.005));
            } else if (time >= 17000 && time <= 18000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((time - 17000) * -0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((time - 17000) * 0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((time - 17000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((time - 17000) * 0.005));
            } else if (time >= 18000 && time <= 19000) {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad((-time + 19000) * -0.025));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad((-time + 19000) * 0.025));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad((-time + 19000) * -0.005));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad((-time + 19000) * 0.005));
            } else {
                glMatrix.mat4.rotateX(badtz_tangan_kanan.MOVEMATRIX, badtz_tangan_kanan.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(badtz_tangan_kiri.MOVEMATRIX, badtz_tangan_kiri.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(badtz_kaki_kiri.MOVEMATRIX, badtz_kaki_kiri.MOVEMATRIX, LIBS.degToRad(0));
                glMatrix.mat4.rotateX(badtz_kaki_kanan.MOVEMATRIX, badtz_kaki_kanan.MOVEMATRIX, LIBS.degToRad(0));
            }

            // Badtz Maru
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
            chocoCat.setRotateMove(PHI, LIBS.degToRad(-13), 0)

            badtz_kepala.setScale(0.5)
            for (let i = 0; i < badtz_kepala.child.length; i++) {
                badtz_kepala.child[i].setScale(0.5)
            }

            badtz_badan.setScale(0.5)
            for (let i = 0; i < badtz_badan.child.length; i++) {
                badtz_badan.child[i].setScale(0.5)
            }

            cat_kepala.setScale(0.5)
            for (let i = 0; i < cat_kepala.child.length; i++) {
                cat_kepala.child[i].setScale(0.5)
            }

            cat_badan.setScale(0.5)
            for (let i = 0; i < cat_badan.child.length; i++) {
                cat_badan.child[i].setScale(0.5)
            }

            // ChocoCat
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
            time_prev = time;
        }
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);

        badtzMaru.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);
        chocoCat.setUniformMatrix4(PROJMATRIX, VIEWMATRIX);

        badtzMaru.draw();
        chocoCat.draw();
        for (let i = 0; i < curveObjects.length; i++) {
            curveObjects[i].drawLine();
        }

        for (let i = 0; i < cat_curve.length; i++) {
            cat_curve[i].drawLine();
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