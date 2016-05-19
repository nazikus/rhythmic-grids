var metricsContext = (function(){

  var int = function(str){ return parseInt(str,10); }

  var _canvas  = $('#metrics-canvas')[0],
      _canvasT = $('#text-canvas')[0];

  // set canvas width attribute same as css width style
  _canvas.width   = int( $(_canvas).css('width') );
  _canvas.height  = int( $(_canvas).css('height') );
  _canvasT.width  = int( $(_canvasT).css('width') );
  _canvasT.height = int( $(_canvasT).css('height') );

  // console.log('Metrics canvas %sx%s\nText canvasT %sx%s',
  //  canvas.width,  canvas.height, canvasT.width, canvasT.height);

  return {
    canvas  : _canvas,
    canvasT : _canvasT,
    context : _canvas.getContext('2d'),
    contextT: _canvasT.getContext('2d'),
    
    // reference alphabet is used for determining metrics for current font
    reference_alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    metrics_fontsize: 140,
    metrics_fallback: '30px sans', // in case font detector give false positive
    
    // global vars (accessed by event handlers)
    curr_typeface: null,
    curr_mtext: null,
    curr_mtext_width: 0,
    
    // drawing layout & styles
    label_font: '12px Helvetica',
    'label_font_upm': '10px Helvetica',
    baseline_y: Math.round( _canvas.height*.70 ),
    xOffL: int( $(_canvasT).css('margin-left') ),  // left offset (margin)
    xOffR: int( $(_canvasT).css('margin-right') ), // right offset (margin)
    
    // vars used for mouse panning
    dragging: false,
    lastX: 0,
    translated: 0
  };
})();
///////////////////////////////////////////////////////////////////////////////

function drawText()
{
  var startTime = performance.now(), 
    mCtx = metricsContext, 
    canvasT = mCtx.canvasT,
    ctxT = mCtx.contextT;

  // Initialize text font and extract its metrics
  ctxT.clearRect(0, 0, canvasT.width, canvasT.height);
  ctxT.font = mCtx.metrics_fallback;  // fallback font in case non-valid typeface is passed
  ctxT.font = mCtx.metrics_fontsize + "px " + mCtx.curr_typeface;
  canvasT.style.font = ctxT.font;

  if (ctxT.font == mCtx.metrics_fallback)
    return;

  // NOTE. canvasT must have higher css z-index for proper overlay rendering
  ctxT.fillText(mCtx.curr_mtext,   // string
                mCtx.translated,   // x
                mCtx.baseline_y);  // y

  var timing = performance.now() - startTime;
  // console.log('------------- text rendering finished (%.1fms).', timing);
}


///////////////////////////////////////////////////////////////////////////////


// text rendering with font metrics visualized
function drawMetrics() {
  var startTime = performance.now(),
      error_font = false;

  var canvas = metricsContext.canvas,
      ctx = metricsContext.context,
      metrics_fontsize = metricsContext.metrics_fontsize,
      baseline_y = metricsContext.baseline_y,
      xOffL = metricsContext.xOffL;


  // Initialize text font and extract its metrics
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = metricsContext.metrics_fallback;
  ctx.font = metrics_fontsize + "px " + metricsContext.curr_typeface;
  canvas.style.font = ctx.font;

  if (ctx.font == metricsContext.metrics_fallback)
      error_font = true;
  
  metricsContext.curr_mtext_width = 
      Math.round( ctx.measureText(metricsContext.curr_mtext).width );

  var metrics   = ctx.measureText(metricsContext.reference_alphabet),  // fontmetrics.js
      ascent    = metrics.ascent,
      descent   = metrics.descent,
      x_height  = ctx.measureText('x').ascent,
      cap_height= ctx.measureText('H').ascent,
      safebox_h = Math.round(metrics_fontsize / 2), // safe-box height ??
      xh_offset = x_height / safebox_h - 1,  // x-height offset (deviation) from safe-box height
      xh_offset_label = (xh_offset>=0?'+ ':'– ') + Math.abs(Math.round(xh_offset*500)) + ' UPM',
      isValid_xh_offset = Math.abs(Math.round(xh_offset*500)) <= 50;
      line_length = canvas.width - metricsContext.xOffR, //metrics.width+b*2-xoff;
      labelRectW = 58, // static label width
      labelRectH = 15; // // static label height

  // set x-height offset text below this canvas
  $('#x-height-offset-text').text(xh_offset_label).removeClass('invalid-offset');
  if (!isValid_xh_offset) 
      $('#x-height-offset-text').addClass('invalid-offset');

  // console.log('Baseline Y: %sx', baseline_y);
  // console.log('Safe-box height: %s', safebox_h);
  // console.log(metrics);
  // console.log('x-height deviation: %.1f%%', xh_offset*100)

  // font init for metrics labels
  ctx.font = metricsContext.label_font;
  canvas.style.font = ctx.font;

  // // EM BOX lines
  // var em_gap = Math.round((metrics_fontsize - (ascent+descent)) / 2);
  // ctx.beginPath();
  // ctx.strokeStyle = 'rgba(255, 0, 0, .7)';
  // ctx.lineWidth = 1;
  // ctx.strokeRect(1, baseline_y-ascent-em_gap, 
  //                line_length+xOffR-1, metrics_fontsize);
  // // console.log('Baseline = %s; Ascent = %s; Descent = %s; Em gap = %s', baseline_y, ascent, descent, em_gap);
  
  // // EM BOX label
  // ctx.fillStyle = 'rgba(255, 0, 0, .8)';
  // ctx.textBaseline = 'bottom';
  // if (true) {  // rotate flag
  //   ctx.save();
  //   ctx.textAlign = 'right';
  //   ctx.rotate(Math.PI/2); // rotate coordinates by 90° clockwise
  //   ctx.fillText('em box', baseline_y+descent+em_gap-5, -2); // for vertical label
  //   ctx.restore();
  // } else {
  //   ctx.textAlign = 'left';
  //   ctx.fillText('em box', 2, baseline_y-ascent-em_gap); // for horizontal label 
  // }

  // SAFEBOX rectangle
  ctx.beginPath();
  ctx.fillStyle= 'rgba(230, 230, 230, 0.5)';
  ctx.lineWidth = 0;
  ctx.clearRect(0, baseline_y-safebox_h, line_length, safebox_h);
  var img = document.getElementById('fontmetrics-pattern');
  var pat=ctx.createPattern(img, "repeat");
  ctx.rect(0, baseline_y-safebox_h, line_length, safebox_h);
  ctx.fillStyle=pat;
  ctx.fill();

  // SAFEBOX 50% line
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(230, 230, 230, 0.5)';
  ctx.lineWidth = 1;
  // ctx.setLineDash([5,2]);
  ctx.moveTo(0, baseline_y-safebox_h-1);
  ctx.lineTo(line_length, baseline_y-safebox_h-1);
  ctx.stroke();

  // ASCENT & DESCENT lines
  ctx.beginPath();
  ctx.strokeStyle = '#C5C5C5';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 1;
  ctx.setLineDash([5,2]);
  ctx.moveTo(0, baseline_y-ascent);
  ctx.lineTo(line_length, baseline_y-ascent);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, baseline_y+descent);
  ctx.lineTo(line_length, baseline_y+descent);
  ctx.stroke();
  
  // labels rect for ASCEND
  ctx.beginPath();
  ctx.setLineDash([0, 0]);
  ctx.fillStyle = '#C5C5C5';
  ctx.lineWidth = 2;
  ctx.fillRect(0, baseline_y-ascent-1, labelRectW, labelRectH);

  // labels rect for DESCEND
  ctx.beginPath();
  ctx.fillStyle = '#C5C5C5';
  ctx.lineWidth = 2;
  ctx.fillRect(0, baseline_y+descent-labelRectH+1, labelRectW, labelRectH);

  // labels rect for CAP HEIGHT
  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.fillStyle = '#D0021B';
  ctx.lineWidth = 0;
  ctx.fillRect(canvas.width - labelRectW, baseline_y-cap_height-labelRectH, labelRectW, labelRectH);

  // labels rect for BASELINE
  ctx.beginPath();
  ctx.fillStyle = '#D0021B';
  ctx.lineWidth = 0;
  ctx.fillRect(canvas.width - labelRectW, baseline_y, labelRectW, labelRectH);

  // SAFEBOX label
  // ctx.fillStyle = 'rgba(0, 107, 255, .8)';
  // ctx.textBaseline = 'hanging';
  // ctx.textAlign = 'left';
  // ctx.fillText('500UPM', line_length+5, baseline_y-safebox_h);

  // BASELINE line
  ctx.beginPath();
  ctx.strokeStyle = '#D0021B';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 1;
  ctx.moveTo(xOffL, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.lineTo(line_length, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.stroke();

  // BASELINE label
  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';
  ctx.fillText('baseline', line_length-5, baseline_y);


  if (error_font){
      $('.example-text').css('color', 'white');
      return;
  } else {
      $('.example-text').css('color', '');
  }

  // X-HEIGHT line
  ctx.beginPath();
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#D0021B';
  ctx.lineWidth = 0;
  ctx.moveTo(xOffL, baseline_y - x_height);
  ctx.lineTo(line_length, baseline_y - x_height);
  ctx.stroke();

  // TODO color heat interpolation (for UPM label and for safebox or partial safebox)
  // http://stackoverflow.com/questions/340209/generate-colors-between-red-and-green-for-a-power-meter/340214#340214
  
  // X-HEIGHT offset (deviation) from "safe zone" (500UPMs)
  ctx.beginPath();
  ctx.fillStyle =  isValid_xh_offset ? '#14CF74' : 'orange';
  ctx.fillRect(xOffL, baseline_y-x_height, line_length, x_height-safebox_h);

  ctx.textBaseline = xh_offset > 0 ? 'bottom' : 'top';
  ctx.textAlign = 'right';
  ctx.font = metricsContext.label_font_upm;
  ctx.fillStyle = 'black';
  if (/*xh_offset != 0*/1) { // omit zero UPM or not
    if (false){
      // vertical label, in UPMs
      ctx.save();
      ctx.rotate(Math.PI/2); // retote coordinates by 90° clockwise
      ctx.fillText(xh_offset_label, baseline_y-x_height-3, -line_length); // UPM, vertical label
      ctx.restore();
    } else {
      // horizontal label in % or UPMs
      // ctx.fillText((xh_offset>=0?'+':'-') + Math.round(xh_offset*1000)/10 + '%', line_length, baseline_y-x_height+1);
      ctx.fillText(xh_offset_label, line_length, baseline_y-x_height);
    }
  }
  ctx.font = metricsContext.label_font;

  // ASCENT & DESCENT labels
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('ascend', 9, baseline_y-ascent-1);

  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('descend', 6, baseline_y+descent-labelRectH+1);

  // labels rect for 50%
  ctx.beginPath();
  ctx.setLineDash([0, 0]);
  ctx.fillStyle = '#C5C5C5';
  ctx.lineWidth = 2;
  ctx.fillRect(0, baseline_y-safebox_h-2, labelRectW, labelRectH);

  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('500UPM', 5, baseline_y-safebox_h-1);

  // CAP HEIGHT line
  ctx.beginPath();
  ctx.strokeStyle = '#D0021B';
  ctx.fillStyle = 'white';
  ctx.setLineDash([0, 0]);
  ctx.lineWidth = 1;
  ctx.moveTo(xOffL, baseline_y - cap_height);
  ctx.lineTo(line_length, baseline_y - cap_height);
  ctx.stroke();

  // CAP HEIGHT text
  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';
  ctx.fillText('cap height', line_length-1, baseline_y-cap_height-labelRectH);

  var timing = performance.now() - startTime;
  console.log('... metrics rendering finished (%.1dms).  [%s>%s]', timing, arguments.callee.caller.name, arguments.callee.name);
};

