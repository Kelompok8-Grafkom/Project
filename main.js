function main() {
  var CANVAS = document.getElementById("mycanvas");

  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;

  var drag = false;
  var x_prev, y_prev;
  var dX = 0,
    dY = 0;
  var THETA = 0,
    PHI = 0;
  var AMORTIZATION = 0.95; //gaya gesek
  var mouseDown = function (e) {
    drag = true;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault(); //mencegah fungsi awal dri tombol yg di klik, misal klik kanan biasa keluarin inspect dkk tpi itu bisa dibatesi
    return false;
  };

  var mouseUp = function (e) {
    drag = false;
  };

  var mouseMove = function (e) {
    if (!drag) return false;
    dX = ((e.pageX - x_prev + 0.5) * 2 * Math.PI) / CANVAS.width;
    dY = ((e.pageY - y_prev) * 2 * Math.PI) / CANVAS.height;
    THETA += dX;
    PHI += dY;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault();
  };

  CANVAS.addEventListener("mousedown", mouseDown, false); //selama mouse ditekan
  CANVAS.addEventListener("mouseup", mouseUp, false); //selama mouse dilepas
  CANVAS.addEventListener("mouseout", mouseUp, false); //selama mouse keluar dari canvas
  CANVAS.addEventListener("mousemove", mouseMove, false); //selama mouse gerak2

  var GL;
  try {
    GL = CANVAS.getContext("webgl", { antialias: false });
  } catch (error) {
    alert("WebGL context cannot be initialized");
    return false;
  }

  //shaders
  var shader_vertex_source = `
      attribute vec3 position;
      attribute vec3 color;
  
      uniform mat4 Pmatrix;
      uniform mat4 Vmatrix;
      uniform mat4 Mmatrix;
  
      varying vec3 vColor;
      void main(void){
          gl_Position = Pmatrix * Vmatrix *Mmatrix * vec4(position, 1.0);
          vColor = color;
      } 
      `;

  var shader_fragment_source = `
      precision mediump float;
      varying vec3 vColor;
      void main(void){
          gl_FragColor = vec4(vColor,1.0);
      }
      `;

  var compile_shader = function (source, type, typeString) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert(
        "ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader)
      );
      return false;
    }
    return shader;
  };

  var shader_vertex = compile_shader(
    shader_vertex_source,
    GL.VERTEX_SHADER,
    "VERTEX"
  );

  var shader_fragment = compile_shader(
    shader_fragment_source,
    GL.FRAGMENT_SHADER,
    "FRAGMENT"
  );

  var SHADER_PROGRAM = GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);

  GL.linkProgram(SHADER_PROGRAM);

  var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

  var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");

  GL.enableVertexAttribArray(_color);
  GL.enableVertexAttribArray(_position);

  GL.useProgram(SHADER_PROGRAM);

  // MUKA
  var radius1 = 1.0;
  var sectorCount1 = 72;
  var stackCount1 = 24;

  var vertices1 = [];
  var normals1 = [];
  var texCoords1 = [];

  var x, y, z, xy;
  var nx,
    ny,
    nz,
    lengthInv1 = 1.0 / radius1;
  var s, t;

  var sectorStep1 = (2 * Math.PI) / sectorCount1;
  var stackStep1 = Math.PI / stackCount1;
  var sectorAngle1, stackAngle1;

  for (let i = 0; i <= stackCount1; i++) {
    stackAngle1 = Math.PI / 2 - i * stackStep1;
    xy = radius1 * Math.cos(stackAngle1);
    z = radius1 * Math.sin(stackAngle1);

    for (let j = 0; j <= sectorCount1; j++) {
      sectorAngle1 = j * sectorStep1;

      x = 1.3 * xy * Math.cos(sectorAngle1);
      y = 1.1 * xy * Math.sin(sectorAngle1);
      vertices1.push(x);
      vertices1.push(y + 0.3);
      vertices1.push(z);
      vertices1.push(0, 0, 0);

      nx = x * lengthInv1;
      ny = y * lengthInv1;
      nz = z * lengthInv1;
      // normals1.push(nx);
      // normals1.push(ny);
      // normals1.push(nz);

      s = j / sectorCount1;
      t = i / stackCount1;
      texCoords1.push(s);
      texCoords1.push(t);
    }
  }

  var indices1 = [];
  var lineIndices1 = [];
  var k11, k12;
  for (let i = 0; i < stackCount1; i++) {
    k11 = i * (sectorCount1 + 1);
    k12 = k11 + sectorCount1 + 1;

    for (let j = 0; j < sectorCount1; j++) {
      if (i != 0) {
        indices1.push(k11);
        indices1.push(k12);
        indices1.push(k11 + 1);
      }

      if (i != stackCount1 - 1) {
        indices1.push(k11 + 1);
        indices1.push(k12);
        indices1.push(k12 + 1);
      }

      lineIndices1.push(k11);
      lineIndices1.push(k12);
      // if (i != 0) {
      //   lineIndices1.push(k11);
      //   lineIndices1.push(k11 + 1);
      // }

      k11++;
      k12++;
    }
  }

  // buffer itu buat ngehandle ke layar
  var VERTEX1 = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX1);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices1), GL.STATIC_DRAW);

  //FACES
  var FACES1 = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES1);
  GL.bufferData(
    GL.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices1),
    GL.STATIC_DRAW
  );

  // MATA KIRI
  var radius2 = 0.5;
  var sectorCount2 = 72;
  var stackCount2 = 24;

  var vertices2 = [];
  var normals2 = [];
  var texCoords2 = [];

  var x2, y2, z2, xy2;
  var nx2,
    ny2,
    nz2,
    lengthInv2 = 1.0 / radius2;
  var s2, t2;

  var sectorStep2 = (2 * Math.PI) / sectorCount2;
  var stackStep2 = Math.PI / stackCount2;
  var sectorAngle2, stackAngle2;

  for (let i = 0; i <= stackCount2; i++) {
    stackAngle2 = Math.PI / 2 - i * stackStep2;
    xy2 = radius2 * Math.cos(stackAngle2);
    z2 = radius2 * Math.sin(stackAngle2);

    for (let j = 0; j <= sectorCount2; j++) {
      sectorAngle2 = j * sectorStep2;

      x2 = 1 * xy2 * Math.cos(sectorAngle2);
      y2 = 0.9 * xy2 * Math.sin(sectorAngle2);
      vertices2.push(x2 - 0.3);
      vertices2.push(y2 + 0.4);
      vertices2.push(z2 + 0.55);
      vertices2.push(1, 1, 1);

      nx2 = x2 * lengthInv2;
      ny2 = y2 * lengthInv2;
      nz2 = z2 * lengthInv2;
      normals2.push(nx2);
      normals2.push(ny2);
      normals2.push(nz2);

      s2 = j / sectorCount2;
      t2 = i / stackCount2;
      texCoords2.push(s2);
      texCoords2.push(t2);
    }
  }

  var indices2 = [];
  var lineIndices2 = [];
  var k21, k22;
  for (let i = 0; i < stackCount2; i++) {
    k21 = i * (sectorCount2 + 1);
    k22 = k21 + sectorCount2 + 1;

    for (let j = 0; j < sectorCount2; j++) {
      if (i != 0) {
        indices2.push(k21);
        indices2.push(k22);
        indices2.push(k21 + 1);
      }

      if (i != stackCount2 - 1) {
        indices2.push(k21 + 1);
        indices2.push(k22);
        indices2.push(k22 + 1);
      }

      lineIndices2.push(k21);
      lineIndices2.push(k22);
      if (i != 0) {
        lineIndices2.push(k21);
        lineIndices2.push(k21 + 1);
      }

      k21++;
      k22++;
    }
  }


  // buffer itu buat ngehandle ke layar
  var VERTEX2 = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX2);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices2), GL.STATIC_DRAW);

  //FACES
  var FACES2 = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES2);
  GL.bufferData(
    GL.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices2),
    GL.STATIC_DRAW
  );

  // PENUTUP MATA KIRI
  var radius_penutup_1 = 0.5;
  var sectorCount2 = 72;
  var stackCount2 = 24;

  var vertices_penutup_1 = [];
  var normals2 = [];
  var texCoords2 = [];

  var x2, y2, z2, xy2;
  var nx2,
    ny2,
    nz2,
    lengthInv2 = 1.0 / radius_penutup_1;
  var s2, t2;

  var sectorStep2 = (2 * Math.PI) / sectorCount2;
  var stackStep2 = Math.PI / stackCount2;
  var sectorAngle2, stackAngle2;

  for (let i = 0; i <= stackCount2; i++) {
    stackAngle2 = Math.PI / 2 - i * stackStep2;
    xy2 = radius_penutup_1 * Math.cos(stackAngle2);
    z2 = radius_penutup_1 * Math.sin(stackAngle2);

    for (let j = 0; j <= sectorCount2; j++) {
      sectorAngle2 = j * sectorStep2;

      x2 = 1 * xy2 * Math.cos(sectorAngle2);
      y2 = 0.9 * xy2 * Math.sin(sectorAngle2);
      vertices_penutup_1.push(x2 - 0.3);
      vertices_penutup_1.push(y2 + 0.5);
      vertices_penutup_1.push(z2 + 0.55);
      vertices_penutup_1.push(0, 0, 0);

      nx2 = x2 * lengthInv2;
      ny2 = y2 * lengthInv2;
      nz2 = z2 * lengthInv2;
      normals2.push(nx2);
      normals2.push(ny2);
      normals2.push(nz2);

      s2 = j / sectorCount2;
      t2 = i / stackCount2;
      texCoords2.push(s2);
      texCoords2.push(t2);
    }
  }

  var indices_penutup1 = [];
  var lineIndices_penutup1 = [];
  var k_penutup_1, k_penutup_2;
  for (let i = 0; i < stackCount2; i++) {
    k_penutup_1 = i * (sectorCount2 + 1);
    k_penutup_2 = k_penutup_1 + sectorCount2 + 1;

    for (let j = 0; j < sectorCount2; j++) {
      if (i != 0) {
        indices_penutup1.push(k_penutup_1);
        indices_penutup1.push(k_penutup_2);
        indices_penutup1.push(k_penutup_1 + 1);
      }

      if (i != stackCount2 - 1) {
        indices_penutup1.push(k_penutup_1 + 1);
        indices_penutup1.push(k_penutup_2);
        indices_penutup1.push(k_penutup_2 + 1);
      }

      lineIndices_penutup1.push(k_penutup_1);
      lineIndices_penutup1.push(k_penutup_2);
      if (i != 0) {
        lineIndices_penutup1.push(k_penutup_1);
        lineIndices_penutup1.push(k_penutup_1 + 1);
      }

      k_penutup_1++;
      k_penutup_2++;
    }
  }

  // buffer itu buat ngehandle ke layar
  var VERTEXPENUTUP1 = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, VERTEXPENUTUP1);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices_penutup_1), GL.STATIC_DRAW);

  //FACES
  var FACESPENUTUP1 = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACESPENUTUP1);
  GL.bufferData(
    GL.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices_penutup1),
    GL.STATIC_DRAW
  );

  // MATA KANAN
  var radius3 = 0.5;
  var sectorCount3 = 72;
  var stackCount3 = 24;

  var vertices3 = [];
  var normals3 = [];
  var texCoords3 = [];

  var x3, y3, z3, xy3;
  var nx3,
    ny3,
    nz3,
    lengthInv3 = 1.0 / radius3;
  var s3, t3;

  var sectorStep3 = (2 * Math.PI) / sectorCount3;
  var stackStep3 = Math.PI / stackCount3;
  var sectorAngle3, stackAngle3;

  for (let i = 0; i <= stackCount3; i++) {
    stackAngle3 = Math.PI / 2 - i * stackStep3;
    xy3 = radius3 * Math.cos(stackAngle3);
    z3 = radius3 * Math.sin(stackAngle3);

    for (let j = 0; j <= sectorCount3; j++) {
      sectorAngle3 = j * sectorStep3;

      x3 = 1 * xy3 * Math.cos(sectorAngle3);
      y3 = 0.9 * xy3 * Math.sin(sectorAngle3);
      vertices3.push(x3 + 0.3);
      vertices3.push(y3 + 0.4);
      vertices3.push(z3 + 0.55);
      vertices3.push(1, 1, 1);

      nx3 = x3 * lengthInv3;
      ny3 = y3 * lengthInv3;
      nz3 = z3 * lengthInv3;
      // normals3.push(nx3);
      // normals3.push(ny3);
      // normals3.push(nz3);

      s3 = j / sectorCount3;
      t3 = i / stackCount3;
      // texCoords3.push(s3);
      // texCoords3.push(t3);
    }
  }

  var indices3 = [];
  var lineIndices3 = [];
  var k31, k32;
  for (let i = 0; i < stackCount3; i++) {
    k31 = i * (sectorCount3 + 1);
    k32 = k31 + sectorCount3 + 1;

    for (let j = 0; j < sectorCount3; j++) {
      if (i != 0) {
        indices3.push(k31);
        indices3.push(k32);
        indices3.push(k31 + 1);
      }

      if (i != stackCount3 - 1) {
        indices3.push(k31 + 1);
        indices3.push(k32);
        indices3.push(k32 + 1);
      }

      lineIndices3.push(k31);
      lineIndices3.push(k32);
      if (i != 0) {
        lineIndices3.push(k31);
        lineIndices3.push(k31 + 1);
      }

      k31++;
      k32++;
    }
  }

  var VERTEX3 = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX3);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices3), GL.STATIC_DRAW);

  //FACES
  var FACES3 = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES3);
  GL.bufferData(
    GL.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices3),
    GL.STATIC_DRAW
  );

  // PENUTUP MATA KANAN
  var radius_penutup_2 = 0.5;
  var sectorCount3 = 72;
  var stackCount3 = 24;

  var vertices_penutup_2 = [];
  var normals3 = [];
  var texCoords3 = [];

  var x3, y3, z3, xy3;
  var nx3,
    ny3,
    nz3,
    lengthInv3 = 1.0 / radius_penutup_2;
  var s3, t3;

  var sectorStep3 = (2 * Math.PI) / sectorCount3;
  var stackStep3 = Math.PI / stackCount3;
  var sectorAngle3, stackAngle3;

  for (let i = 0; i <= stackCount3; i++) {
    stackAngle3 = Math.PI / 2 - i * stackStep3;
    xy3 = radius_penutup_2 * Math.cos(stackAngle3);
    z3 = radius_penutup_2 * Math.sin(stackAngle3);

    for (let j = 0; j <= sectorCount3; j++) {
      sectorAngle3 = j * sectorStep3;

      x3 = 1 * xy3 * Math.cos(sectorAngle3);
      y3 = 0.9 * xy3 * Math.sin(sectorAngle3);
      vertices_penutup_2.push(x3 + 0.3);
      vertices_penutup_2.push(y3 + 0.5);
      vertices_penutup_2.push(z3 + 0.55);
      vertices_penutup_2.push(0, 0, 0);

      nx3 = x3 * lengthInv3;
      ny3 = y3 * lengthInv3;
      nz3 = z3 * lengthInv3;
      // normals3.push(nx3);
      // normals3.push(ny3);
      // normals3.push(nz3);

      s3 = j / sectorCount3;
      t3 = i / stackCount3;
      // texCoords3.push(s3);
      // texCoords3.push(t3);
    }
  }

  var indices_penutup_2 = [];
  var lineIndices_penutup_2 = [];
  var k31, k32;
  for (let i = 0; i < stackCount3; i++) {
    k31 = i * (sectorCount3 + 1);
    k32 = k31 + sectorCount3 + 1;

    for (let j = 0; j < sectorCount3; j++) {
      if (i != 0) {
        indices_penutup_2.push(k31);
        indices_penutup_2.push(k32);
        indices_penutup_2.push(k31 + 1);
      }

      if (i != stackCount3 - 1) {
        indices_penutup_2.push(k31 + 1);
        indices_penutup_2.push(k32);
        indices_penutup_2.push(k32 + 1);
      }

      lineIndices_penutup_2.push(k31);
      lineIndices_penutup_2.push(k32);
      if (i != 0) {
        lineIndices_penutup_2.push(k31);
        lineIndices_penutup_2.push(k31 + 1);
      }

      k31++;
      k32++;
    }
  }

  var VERTEXPENUTUP2 = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, VERTEXPENUTUP2);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices_penutup_2), GL.STATIC_DRAW);

  //FACES
  var FACESPENUTUP2 = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACESPENUTUP2);
  GL.bufferData(
    GL.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices_penutup_2),
    GL.STATIC_DRAW
  );

  // Mulut
  var mulut_vertex = [
    -0.4, -0.2, 1,
    1, 1, 0,
    0, 0.15, 1,
    1, 1, 0,
    0.4, -0.2, 1,
    1, 1, 0,
    0, 0, 0,
    1, 1, 0,
    0, -0.1, 1,
    1, 1, 0
  ];
  var MULUT_VERTEX = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, MULUT_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(mulut_vertex), GL.STATIC_DRAW);

  var mulut_faces = [
    0, 1, 4,
    0, 1, 3,
    1, 2, 3,
    1, 2, 4,
    0, 3, 4,
    2, 3, 4
  ];

  var MULUT_FACES = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, MULUT_FACES);
  // Data yang diberikan pasti integer
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(mulut_faces), GL.STATIC_DRAW);

  // ----- MATA 1 ----- //
  var circle1_vertex = [];

  circle1_vertex.push(0.3, 0.45, 1.05);
  circle1_vertex.push(0, 0, 0);

  for (let i = 0; i <= 360; i++) {
    circle1_vertex.push(0.3 + 0.09 * Math.cos(i / Math.PI));
    circle1_vertex.push(0.45 + 0.09 * Math.sin(i / Math.PI));
    circle1_vertex.push(1.05);
    circle1_vertex.push(0);
    circle1_vertex.push(0);
    circle1_vertex.push(0);
  }

  // buffer itu buat ngehandle ke layar
  var CIRCLE1_VERTEX = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, CIRCLE1_VERTEX);
  GL.bufferData(
    GL.ARRAY_BUFFER,
    new Float32Array(circle1_vertex),
    GL.STATIC_DRAW
  );

  //FACES
  var circle1_faces = [];
  for (let i = 0; i < 360; i++) {
    circle1_faces.push(0, i, i + 1);
  }
  var CIRCLE1_FACES = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CIRCLE1_FACES);
  GL.bufferData(
    GL.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(circle1_faces),
    GL.STATIC_DRAW
  );

  // ----- MATA 2 ----- //
  var circle2_vertex = [];

  circle2_vertex.push(-0.3, 0.45, 1.05);
  circle2_vertex.push(0, 0, 0);

  for (let i = 0; i <= 360; i++) {
    circle2_vertex.push(-0.3 + 0.09 * Math.cos(i / Math.PI));
    circle2_vertex.push(0.45 + 0.09 * Math.sin(i / Math.PI));
    circle2_vertex.push(1.05);
    circle2_vertex.push(0);
    circle2_vertex.push(0);
    circle2_vertex.push(0);
  }

  // buffer itu buat ngehandle ke layar
  var CIRCLE2_VERTEX = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, CIRCLE2_VERTEX);
  GL.bufferData(
    GL.ARRAY_BUFFER,
    new Float32Array(circle2_vertex),
    GL.STATIC_DRAW
  );

  //FACES
  var circle2_faces = [];
  for (let i = 0; i < 360; i++) {
    circle2_faces.push(0, i, i + 1);
  }
  var CIRCLE2_FACES = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CIRCLE2_FACES);
  GL.bufferData(
    GL.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(circle2_faces),
    GL.STATIC_DRAW
  );

  // coba tanduk
  var cubic_vertex = [];
  var a = 0.1;
  var b = 0.4;
  for (let u = -Math.PI; u <= Math.PI; u += Math.PI / 960) {
    for (let v = 0; v < 1.2; v += Math.PI / 30) {
      cubic_vertex.push(b * v * Math.sin(u) - 0.5);
      cubic_vertex.push(a * v * Math.cos(u) + 1.5);
      cubic_vertex.push(v * v);
      cubic_vertex.push(0, 0, 0);
    }
  }

  var CUBIC_VERTEX = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, CUBIC_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cubic_vertex), GL.STATIC_DRAW);

  //FACES 
  var cubic_faces = [];
  for (let index = 0; index < cubic_vertex.length / 6; index++) {
    cubic_faces.push(index);
  }

  var CUBIC_FACES = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBIC_FACES);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubic_faces), GL.STATIC_DRAW);

  //MATRIX//
  var PROJMATRIX = LIBS.get_projection(
    40,
    CANVAS.width / CANVAS.height,
    1,
    100
  );
  var MOVEMATRIX = LIBS.get_I4();
  var VIEWMATRIX = LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -5);
  LIBS.translateY(VIEWMATRIX, -0.5)

  GL.clearColor(0.0, 0.0, 0.0, 0.0);

  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);

  GL.clearDepth(1.0);
  var time_prev = 0;
  var animate = function (time) {
    if (time > 0) {
      var dt = time - time_prev;
      console.log(dt);
      if (!drag) {
        dX *= AMORTIZATION;
        dY *= AMORTIZATION;
        THETA += dX;
        PHI += dY;
      }
      LIBS.set_I4(MOVEMATRIX);
      LIBS.rotateX(MOVEMATRIX, PHI);
      LIBS.rotateY(MOVEMATRIX, THETA);
      time_prev = time;
    }

    // LIBS.rotateX(FACES2, LIBS.degToRad(90));

    GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT);

    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

    //DRAWINGS
    //kepala
    GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX1);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES1);
    GL.drawElements(GL.TRIANGLES, indices1.length, GL.UNSIGNED_SHORT, 0);
    //mata kiri putih
    GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX2);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES2);
    GL.drawElements(GL.TRIANGLES, indices2.length, GL.UNSIGNED_SHORT, 0);
    //mata kiri penutup
    GL.bindBuffer(GL.ARRAY_BUFFER, VERTEXPENUTUP1);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACESPENUTUP1);
    GL.drawElements(GL.TRIANGLES, indices_penutup1.length, GL.UNSIGNED_SHORT, 0);
    // mata kanan putih
    GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX3);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES3);
    GL.drawElements(GL.TRIANGLES, indices3.length, GL.UNSIGNED_SHORT, 0);
    // mata kanan penutup
    GL.bindBuffer(GL.ARRAY_BUFFER, VERTEXPENUTUP2);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACESPENUTUP2);
    GL.drawElements(GL.TRIANGLES, indices3.length, GL.UNSIGNED_SHORT, 0);
    // mulut
    GL.bindBuffer(GL.ARRAY_BUFFER, MULUT_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, MULUT_FACES);
    GL.drawElements(GL.TRIANGLES, mulut_faces.length, GL.UNSIGNED_SHORT, 0);

    //bola mata kanan
    GL.bindBuffer(GL.ARRAY_BUFFER, CIRCLE1_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CIRCLE1_FACES);
    GL.drawElements(GL.TRIANGLES, 360, GL.UNSIGNED_SHORT, 0);
    //bola mata kiri
    GL.bindBuffer(GL.ARRAY_BUFFER, CIRCLE2_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CIRCLE2_FACES);
    GL.drawElements(GL.TRIANGLES, 360, GL.UNSIGNED_SHORT, 0);

    GL.bindBuffer(GL.ARRAY_BUFFER, CUBIC_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBIC_FACES);
    GL.drawElements(GL.LINE_STRIP, cubic_faces.length, GL.UNSIGNED_SHORT, 0);

    GL.flush();
    window.requestAnimationFrame(animate);
  };

  animate();
}
window.addEventListener("load", main);