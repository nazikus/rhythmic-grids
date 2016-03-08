// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

window.addEventListener('load', function() {
  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  var shape = Pre3d.ShapeUtils.makeTesseract(2);
  
  // Different shape for expriments
  /*
  makeSphericalShape(function(theta, phi) {
        return {
          x: r * Math.sin(theta) * Math.sin(phi),
          y: r * Math.cos(theta),
          z: r * Math.sin(theta) * Math.cos(phi)
        };
    }, 20, 20);
  */
  //makeSphere(1, 10, 10);
  //makeOctahedron();
  //makeBoxWithHole(1, 1, 1, 0.5, 0.5)
  /*
  makePlane(
    {x:1,y:0,z:0},
    {x:0,y:0,z:1},
    {x:0,y:1,z:1},
    {x:0,y:1,z:0}
  );
  */
  
  /*
  Pre3d.ShapeUtils.linearSubdivideTri(shape);
  
  Pre3d.ShapeUtils.forEachVertex(shape, function(v, i, s) {
    s.vertices[i] = Pre3d.Math.unitVector3d(v);  // TODO(deanm): inplace.
  });
  */
  // We need to rebuild the normals after extruding the vertices.
  // Pre3d.ShapeUtils.rebuildMeta(shape);
  renderer.draw_overdraw = false;
  renderer.fill_rgba = new Pre3d.RGBA(0x09/255, 0x07/255, 0x86/255, 0.1);
  renderer.ctx.lineWidth = 2;
  renderer.stroke_rgba = new Pre3d.RGBA(0x09/255, 0x07/255, 0x86/255, 1);

  function setTransform(x, y) {
    var ct = renderer.camera.transform;
    ct.reset();
    ct.rotateZ(0.0);
    ct.rotateY(-2.06 * x - 0.5);
    ct.rotateX(2.2 * y + 1.5);
    ct.translate(0, 0, -12);
  }

  renderer.camera.focal_length = 6;
  setTransform(0, 0);

  function draw() {
    renderer.clearBackground();
    renderer.bufferShape(shape);
    renderer.drawBuffer();
    renderer.emptyBuffer();
  }
  
  // Listen mousemove for rotation
  
  document.addEventListener('mousemove', function(e) {
    setTransform(e.clientX / 400, e.clientY / 400);
    draw();
  }, false);
  
  
  // Set interval for rotation of a 3D body
  /*
  var trans_x = 0;
  var trans_y = 0;
  var delta_x = 0.01;
  var delta_y = 0.01;
  intervalId = setInterval(function(){
    trans_x += delta_x;
    trans_y += delta_y;
    setTransform(trans_x, trans_y);
    draw();
  },40);
  */
  
  // Set interval for rotation of a Tesseract
  
  var phase = 0;
  // the denominator determins number of moves in a period
  var deltaPhase = 2*Math.PI/200 ; 
  intervalId = setInterval(function(){
    phase += deltaPhase;
    shape = Pre3d.ShapeUtils.rotateTesseract(shape, phase);
    draw();
  },40);
  
  draw();
}, false);