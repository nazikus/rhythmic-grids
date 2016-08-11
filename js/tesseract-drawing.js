function drawTesseract(){

  var screen_canvas = document.getElementById('tesseract');
  var renderer = new Pre3d.Renderer(screen_canvas);

  var shape = Pre3d.ShapeUtils.makeTesseract(2);

  renderer.draw_overdraw = false;
  renderer.fill_rgba = new Pre3d.RGBA(0xff/255, 0xff/255, 0xff/255, 0);
  renderer.ctx.lineWidth = 2;
  renderer.stroke_rgba = new Pre3d.RGBA(0xdd/255, 0xdd/255, 0xdd/255, 0.33);

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
    setTransform(e.clientX / 1600, e.clientY / 1600);
    draw();
  }, false);
  
  // Set interval for rotation of a Tesseract
  
  var phase = 0;
  // the denominator determins number of moves in a period
  var deltaPhase = 2*Math.PI/1600 ; 
  intervalId = setInterval(function(){
    phase += deltaPhase;
    shape = Pre3d.ShapeUtils.rotateTesseract(shape, phase);
    draw();
  },40);
  
  draw();
}
