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
    label_font: '16px serif',
    'label_font_upm': '11px sans',
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

// TODO center text
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
      xdev = x_height / safebox_h - 1,  // x-height deviation from safe-box height
      line_length = canvas.width - metricsContext.xOffR; //metrics.width+b*2-xoff;

  // console.log('Baseline Y: %sx', baseline_y);
  // console.log('Safe-box height: %s', safebox_h);
  // console.log(metrics);
  // console.log('x-height deviation: %.1f%%', xdev*100)

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

  if (error_font)
      return ;

  // SAFEBOX rectangle
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 107, 255, .3)';
  ctx.lineWidth = 2;
  ctx.fillRect(xOffL, baseline_y-safebox_h, line_length-xOffL, safebox_h);

  // SAFEBOX label
  // ctx.fillStyle = 'rgba(0, 107, 255, .8)';
  // ctx.textBaseline = 'hanging';
  // ctx.textAlign = 'left';
  // ctx.fillText('500UPM', line_length+5, baseline_y-safebox_h);

  // BASELINE line
  ctx.beginPath();
  ctx.strokeStyle = 'lightseagreen';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 3;
  ctx.moveTo(xOffL, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.lineTo(line_length, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.stroke();

  // BASELINE label
  ctx.textBaseline = 'hanging';
  ctx.textAlign = 'right';
  ctx.fillText('baseline', line_length, baseline_y+2);

  // X-HEIGHT line
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1;
  ctx.moveTo(xOffL, baseline_y - x_height);
  ctx.lineTo(line_length, baseline_y - x_height);
  ctx.stroke();

  // X-HEIGHT label
  ctx.textBaseline = 'hanging';
  ctx.textAlign = 'right';
  ctx.fillText('x-height', line_length, baseline_y-x_height+1);

  // TODO color coded interpolation
  // X-HEIGHT deviation from "safe zone" (500UPMs)
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  ctx.font = metricsContext.label_font_upm;
  ctx.fillStyle = 'rgba(0, 107, 255, .9)';
  if (/*xdev != 0*/1) { // omit zero UPM or not
    if (false){
      // vertical label, in UPMs
      ctx.save();
      ctx.rotate(Math.PI/2); // retote coordinates by 90° clockwise
      ctx.fillText((xdev>=0?'+ ':'– ') + Math.abs(Math.round(xdev*500)) + ' UPM', 
                   baseline_y-x_height-3, -line_length); // UPM, vertical label
      ctx.restore();
    } else {
      // horizontal label in % or UPMs
      // ctx.fillText((xdev>=0?'+':'-') + Math.round(xdev*1000)/10 + '%', line_length, baseline_y-x_height+1);
      ctx.fillText( (xdev>0?'+':'') + Math.round(xdev*500) + ' UPM',
           line_length+3, baseline_y-x_height+5); 
    }
  }
  ctx.font = metricsContext.label_font;

  // ASCENT & DESCENT lines
  ctx.beginPath();
  ctx.strokeStyle = 'lightgray';
  ctx.fillStyle = 'gray';
  ctx.lineWidth = 2;
  ctx.moveTo(xOffL, baseline_y-ascent);
  ctx.lineTo(line_length, baseline_y-ascent);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xOffL, baseline_y+descent);
  ctx.lineTo(line_length, baseline_y+descent);
  ctx.stroke();

  // ASCENT & DESCENT labels
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  ctx.fillText('ascent', xOffL, baseline_y-ascent-2);

  ctx.textBaseline = 'hanging';
  ctx.textAlign = 'left';
  ctx.fillText('descent', xOffL, baseline_y+descent);

  // CAP HEIGHT line
  ctx.beginPath();
  ctx.strokeStyle = 'chocolate';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1;
  ctx.moveTo(xOffL, baseline_y - cap_height);
  ctx.lineTo(line_length, baseline_y - cap_height);
  ctx.stroke();

  // CAP HEIGHT line
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'right';
  ctx.fillText('cap height', line_length, baseline_y-cap_height+1);

  var timing = performance.now() - startTime;
  console.log('... metrics rendering finished (%.1dms).', timing);
};

