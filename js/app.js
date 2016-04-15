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

(function($) {
	$(document).ready(function(){
		var creditsToggleBtn = $('#credits-toggle'),
		creditsSection = $('#credits-section'),
		initialSection = $('#initial-section');

		creditsToggleBtn.on('click', function(e) {
			e.preventDefault();
			var isCreditsActive = $(this).data('credits-visible');
			toggleCredits(creditsToggleBtn, creditsSection, initialSection, isCreditsActive);
		});

		function toggleCredits(showTrigger, creditsSection, initialSection, isCreditsActive) {
			if (isCreditsActive) {
				showTrigger.removeClass('hidden');
				showTrigger.data('credits-visible', false);
				creditsSection.addClass("hidden");
				window.setTimeout(function () {
					initialSection.removeClass("hidden");
				}, 300);
			} else {
				showTrigger.addClass('hidden');
				showTrigger.data('credits-visible', true);
				initialSection.addClass("hidden");
				creditsSection.removeClass("hidden");
			}

		}
	});
})(jQuery);
var _int = function(pStr) { return parseInt(pStr, 10); }

function getAvailableSystemFonts() {
  detective = new FontDetector();  // (c) Lalit Patel [see /js/font-detector.js]
  // alternative (wierd) detection via ComicSans (?) [see /js/font-detector-temp.js]
  // font.setup();

  var fontList = getFontList(),
      availableFonts = [];

  fontList.forEach(function(fontName){
    // console.log("%s: %s", fontName, detective.detect(fontName) );
    if (detective.detect(fontName)){
      availableFonts.push(fontName);
    }
  });

  console.log('Available system fonts %s/%s  [%s>%s^]', 
    availableFonts.length, fontList.length, "main", arguments.callee.name);
  return availableFonts;
};


/////////////////////////////////////////////////////////////////////////////

// font selection event handler
// TOFIX called too many times
function onFontChange(e) {
  var id = $(this).attr('id'),  // curr element id (typeface OR font size OR line height)
      lhEl = $('#input-lineheight'),
      fsEl = $('#input-fontsize');
  // console.log("onChange: %s %s", id, this.value );

  // remember selections between sessions
  localStorage.setItem(id, this.value);

  // update text sample according to the selected item
  switch(id){
  case 'select-font':
    $('.example-text').css('font-family', this.value+",monospace"); //fallback: Helvetica,Arial,monospace
    $('.text').css('font-family', this.value+",monospace");
    metricsContext.curr_typeface = this.value; // global var for metrics drawing

    // re-draw font metrics
    drawMetrics();
    drawText();
    break;

  case 'input-fontsize':
      lhEl.val( Math.round(_LHFS_R*_int(this.value)) + 'px');
      $('.example-text').css('font-size', _int(this.value)+'px');
      $('.example-text').css('line-height', _int(lhEl.val())+'px');
      $('.text').css('font-size', parseInt(this.value)+'px');
      break;

  case 'input-lineheight':
      _LHFS_R = _int(this.value) / _int( fsEl.val() ); // _LineHeight-FontSize ratio
      $('.example-text').css('line-height', _int(this.value)+'px');
      break;
  }

  
  ////////////////// CHECK LINE HEIGHT DIVISIBILITY ///////////////
  
  var lh = _int(lhEl.val());
  // if line height is divisible by 2 or by 3
  if (lh%2==0 || lh%3==0) {
    _LHBL_F = lh%2 ? 3 : 2;

    // ENABLE all radios and restore previous value, if switched from bad line height
    // if (lhEl.css('background-color') {
      lhEl.css('background-color', '');
      if (allConfigs){
        el = allConfigs.radioForms[2]; // baseline form
        $('input', el).each(function(){  $(this).prop('disabled', false); });
        var prevSelection = localStorage.getItem($(el).attr('id')),
            selector = prevSelection ? 'input[value="'+prevSelection+'"]' : 'input:first';
        $(selector, el).prop('checked', true);

        // select baseline corresponding to line height (div2/3)
        $('#gridBaseline > input[value='+lh/_LHBL_F+']').prop('checked', true);
        $('.rulers-wrapper-horizontal').removeClass('hidden');
        // $('.rulers-wrapper-vertical').removeClass('hidden');
        // $('.text').removeClass('hidden');
        allConfigs.radioForms.eq(0).trigger('change');
      } // <-- if (allConfigs)


      resetBaselineSelections();

    // }  // <-- if .css('background-color')

  } else {
    _LHBL_F = lh/lh; //implicit 1
    lhEl.css('background-color', 'lightpink');
    
    // DISABLE baseline form
    if (allConfigs){
      el = allConfigs.radioForms[2];

      if ($('input:checked', $(el)).val())
        localStorage.setItem($(el).attr('id'), $('input:checked', $(el)).val());
      
      $('input', el).each(function(){  $(this).prop('disabled', true).val([]); });
      $('.text').css('line-height', lh+'px');
      $('.rulers-wrapper-horizontal').addClass('hidden');
      // $('.rulers-wrapper-vertical').addClass('hidden');
      // $('.text').addClass('hidden');
    }
  }
  // console.log("line height: %d; baseline: %d  [%s$]", lh, lh/_LHBL_F, arguments.callee.name);


  $('#lineheight-percent-label').text( 
    Math.round( _int(lhEl.val())/_int(fsEl.val() ) *100) + '%'
  );

};

/////////////////////////////////////////////////////////////////////////////

// set baseline selection valid only for meaningful lineheight values
// callen by onLineHeightChange
function resetBaselineSelections(){
    var blEl = $('#gridBaseline'), // baseline form
        fsVal = _int($('#input-fontsize').val()), // font size
        lhVal = _int($('#input-lineheight').val()),
        lhMin = Math.round(fsVal * allConfigs.lineHeightLimit.min), // line height
        lhMax = Math.round(fsVal * allConfigs.lineHeightLimit.max), // line height
        blRange = [], // baseline
        labelStr = 'gridBaseline'; 

    for (var lh = lhMin; lh<=lhMax; lh++){
        if (lh % _LHBL_F == 0){
            blRange.push(lh/_LHBL_F);
        }
    }
    // console.log('factor: %s, baselines: %s  [%s>%s^] ', _LHBL_F, blRange.join(', '), arguments.callee.caller.name, arguments.callee.name);

    blEl.empty();
    blRange.forEach(function(value,i){
        var input = $('<input>').prop({
                type: "radio",
                id: labelStr+String(value),
                name: labelStr,
                value: value
            });
        
        // select recommended baseline (divisible by factor 2 or 3)
        if (value*_LHBL_F == lhVal) 
          input.prop('checked', true); 

        var label = $('<label>').prop('for', labelStr+value).text(value);

        blEl.append(input).append(label);
    });

    return ;
}

////////////////////////////////////////////////////////////////////////////////



function onKeyDown(e) {
    var input = $(e.target),
        val = _int(input.val()),
        code = (e.which || e.keyCode),
        limit = null;

    if (input.attr('id') === 'input-fontsize')
        limit = allConfigs.fontSizeLimit;

    if (input.attr('id') === 'input-lineheight'){
        var fsVal = _int($('#input-fontsize').val());
        limit = { min: Math.round(fsVal*allConfigs.lineHeightLimit.min),
                  max: Math.round(fsVal*allConfigs.lineHeightLimit.max) };
    }

    // [uparrow,downarrow,enter] keys
    if ([38,40,13].indexOf(code) > -1){
      if (code === 40) val = val > limit.min ? val - 1 : val;
      if (code === 38) val = val < limit.max ? val + 1 : val;
      if (code === 13) val = val < limit.min ? limit.min : val > limit.max ? limit.max : val;
      input.val((isNaN(val) ? limit.min : val) +'px');
      e.preventDefault();
      input.trigger('change');
    }

}

/////////////////////////////////////////////////////////////////////////////

function onMetricsTextChange(e) {
  var mCtx = metricsContext;
  var code = (e.keyCode || e.which);
  // console.log('metrics key: %s', code);

  // do nothing if pressed key is an arrow key
  // [left, up, right, down, shift, ctrl, alt]
  if( [37, 38, 39, 40, 16, 17, 18].indexOf(code) > -1 ) {
      return;
  }

  mCtx.curr_mtext = this.value;
  mCtx.curr_mtext_width = mCtx.curr_mtext ? 
      Math.round(mCtx.contextT.measureText(mCtx.curr_mtext).width) : 0;
  
  drawText();

  // TODO trigger wheel events, in order to auto-scroll when text is deleted 
  // $(canvasT).trigger( jQuery.Event('DOMMouseScroll') );
  // $(canvasT).trigger( jQuery.Event('mousewheel') );
}

/////////////////////////////////////////////////////////////////////////////

function getFontList() {
  return [
    "Helvetica", "Georgia", "Baskerville", "Charter", "Avenir", "PT Serif", "PT Sans"
  ];
}
function setupRadioItems(allConfigs){
    allConfigs.radioForms.each( function(idx, el){
        $(el).empty(); // clear default (index.html) radio options
        // append <input> and <label> for each config value
        $(el).append( createRadioInputs(allConfigs.inputNames[idx], 
                                        allConfigs.rangeArrs[idx]) );

        // restore selection from previous session (if any)
        var prevSelection = localStorage.getItem($(el).attr('id'));
        if (prevSelection)
            $('input[value="'+prevSelection+'"]', el).prop('checked', true);

        // set default ratio selected in ratio section as well
        if ($(el).attr('id') === 'gridRatio'){
            var ratioStr = $('#gridRatio > input:checked').val();
            $('.ratio-selector input[name=ratioSelector][id=ratio'+ratioStr+']')
                .prop('checked', true);
        }

        $(el).on('change', onGridChange);
    });

    // append extra baseline radio selection for degenerated baseline
    // (when line height is not divisible by 2 nor by 3)
    // var gBLin = allConfigs.inputNames[2]; // 'gridBaseline' input name
    // $('#'+gBLin)
    //     .append( $('<input>').attr({'type':'radio', 'id':gBLin+'X', 'name':gBLin}).val(0))
    //     .append( $('<label>').attr('for', gBLin+'X').text(0) );

    // refresh radio inputs by triggering fontSize -> lineHeight -> grid onChange
    $('#input-fontsize').trigger('change');
}

////////////////////////////////////////////////////////////////////////////////

// called several times during setupRadioItems()
function createRadioInputs(inputName, valueRange){
	var elements = [];
	valueRange.forEach(function(value,i){
		var input = $('<input>').prop({
				type: "radio",
				id: inputName+String(value),
				name: inputName,
				value: value
			});
		
		// the first radio is selected by default
		if (!i) input.prop('checked', true); 

		// special cases for Ratio and Gutter labels
		switch(allConfigs.inputNames.indexOf(inputName)) {
			case 1:  labelText = value.replace('x',':'); break;
			case 4:  labelText = allConfigs.baselineArr[0]*value; break; 
			default: labelText = String(value);
		}
		var label = $('<label>')
			.prop('for', inputName+String(value))
			.text( labelText );
		
		elements.push(input, label);
	});

	return elements;
}

////////////////////////////////////////////////////////////////////////////////

function onGridChange(e){
    var getAllSelections = function(){
        return $('input:checked', allConfigs.radioForms)
                .map(function() {
                    var val = $(this).val(); 
                    return isNaN(val) ? val : ~~val;
                 }).toArray();
    }

    var el = $(e.target).parent();  // .form-group element
    var allGridSelections = getAllSelections();

    // console.log("id: %s; grid config: %s  [%s^]", el.attr('id'), allGridSelections.join(', '), arguments.callee.name);

    // process ALL radio selections on every single change in grid config
    refreshRadioInputs(allConfigs.radioForms, allGridSelections); // NB! this might modify the selection
    allGridSelections = getAllSelections(); // update if selection modified

    var selected = $('input:checked', el);

    // if ratio form: change-back the grphic ratio selector (from previous section)
    if (el.attr('id') === 'gridRatio'){
        var ratioStr = selected.val();
        $('.ratio-selector input[name=ratioSelector][id=ratio'+ratioStr+']')
            .prop('checked', true);
    }

    // if baseline form: change line height in font selector, and in text samples
    if (el.attr('id') === 'gridBaseline'){
        var newLH = selected.val()*_LHBL_F;
        $('#input-lineheight').val( newLH );
        $('.example-text').css('line-height', newLH+'px');

        // update percent label
        _LHFS_R = newLH / parseInt( $('#input-fontsize').val() );
        $('#lineheight-percent-label').text( 
            Math.round( newLH / parseInt($('#input-fontsize').val()) * 100)+'%'
        );
    }

    // save current selection for the future sessions
    localStorage.setItem(el.attr('id'), selected.val());

    // re-draw the grid
    var gridConfig = RhythmicGridGenerator.selectGrid(
                allConfigs.allValidGrids, allGridSelections );

    if (gridConfig)
        drawRhythmicGrid(gridConfig);
    else
        allConfigs.gridContainer.empty();
}   

////////////////////////////////////////////////////////////////////////////////

// disables radio buttons for impossible grids, called on each user selection
function refreshRadioInputs(radioForms, selectedInputs){
	var validInputs = 
		RhythmicGridGenerator.getValidConfigValues(
			allConfigs.allValidGrids, selectedInputs);
	// console.log(selectedInputs);
	// console.log(validInputs);

	var ids = allConfigs.inputNames;
	if (ids.length !== validInputs.length) 
		throw 'ERROR: wrong length of IDs in '+arguments.callee.name+'()';

	validInputs.forEach( function(v, i) {

		// enable/disable each radio input
		$('input', radioForms[i]).each(function(k, opt){
			$(this).prop('disabled', !v[k][1] || null );
			
			// update gutter value according to baseline value
			if (ids[i] === ids[ids.length-1]){ // if the last id (gutter)
				$(this).next().text( v[k][0]*selectedInputs[2] );  // gutter*baseline
			}
		}); // <--- $(<input>).each()

		// change selected element if currently selected option became disabled
		var selectedOp = $('input:checked', radioForms[i]);
		if ( selectedOp.prop('disabled') ) {
			var enabled = $('input:enabled:last', radioForms[i]);
			if (enabled.length){
				enabled.prop('checked', true);
			}
		}

	});  // <--  validInputs.forEach()
}


////////////////////////////////////////////////////////////////////////////////

function drawRhythmicGrid(gridConfig){
    var startTime = performance.now();
    // console.log('Rhythmic config: '); console.log(gridConfig);
    console.log('blocks: %s  [%s>%s^]', 
        gridConfig
            .rhythmicGrid
            .blocks
            .map(function(v){ return v[0]+"x"+v[1] })
            .join(', '),
        arguments.callee.caller.name,
        arguments.callee.name
    );

    
    ///////////////////////////////////////
    /////// GENERATE BLOCK DIVS ///////////
    ///////////////////////////////////////
    var container = allConfigs.gridContainer,
        c = 0;

    container.empty();
    gridConfig.rhythmicGrid.blocks.forEach( function(val, idx, arr){
        var row = $('<div>').addClass('row');

        //val[2] - number of blocks in current row
        // see @class Grid (RhythmicGridGenerator.js)
        var blockWidth  = val[0],
            blockHeight = val[1],
            blocksInRow = val[2];

        if (blocksInRow > 9) // no need to show very small micro-blocks
            return;

        for (var i=1; i<=blocksInRow; i++){
            if (idx===arr.length-1 && blockWidth>=1000)
                continue; // skip if the last row and block is wider than 1000

            var inner = $('<div>').addClass('inner').addClass('inner'+i);
            
            c++;
            // pairwise image & text blocks (if c odd - image, if c even - text)
            
            if (i===1 && !(c%2) ) c++; // first column in row always start with an image, not text
            
            if (c%2 || idx+1===arr.length){ // the last biggest block bett with an image, then text
                var imgId = Math.floor(c/2) % allConfigs.imageMocks + 1;
                inner.attr('style', 'background-image: url(img/mocks/' + imgId +'.jpg)');
                // console.log(inner.attr('style'));
            } else {
                var txtmck = 'Hdxp ' + allConfigs.textMocks[idx] + '.';
                inner.append( $('<div>').addClass('text').text(txtmck)
                    .width(blockWidth).height(blockHeight) );
            }

            var column = $('<div>').addClass('column').append(inner);
            row.append(column);
        }

        container.append(row);
    });


    ////////////////////////////////////////////
    ////////////  SET BLOCKS STYLE  ////////////
    ////////////////////////////////////////////
    var g = gridConfig.gutter.W;

    $('.grid-outer-wrapper').css({
        'max-width': gridConfig.maxCanvasWidth+'px'
    });

    $('.grid-container').css({
        'max-width': gridConfig.rhythmicGrid.W+'px'
    });

    $('.row').css({
        'margin-left': -(g/2),
        'margin-right': -(g/2)
    });

    $('.column').css({
        'padding-left': g/2,
        'padding-right': g/2,
        'margin-bottom': g
    });

    // TOFIX a problem with relative flex values and floats, eg 66.666667%
    $('.column .inner').css('padding-bottom', 100/gridConfig.ratio.R+'%')

    // text formatting AND aligning with horizontal ruler
    var lh = parseInt($('#input-lineheight').val()),
        fs = parseInt($('#input-fontsize').val());
    $('.column .inner .text').css({
        'font-family': $('#select-font').val()+",monospace",
        'font-size': parseInt($('#input-fontsize').val())+'px',
        'line-height': parseInt($('#input-lineheight').val())+'px',
        'padding': + Math.ceil((lh-fs)/2+3)+'px 0',
        'overflow': 'hidden',
        // 'text-decoration': 'underline',
        // 'vertical-align': 'text-top',
        // 'white-space': 'nowrap',
        // 'text-overflow': 'ellipsis' // not working
    }).dotdotdot({ellipsis: '...', tolerance : 15});


    /////////////////////////////////////////
    /////// GENERATE RULER GUIDES ///////////
    /////////////////////////////////////////
    var rulersWrapperVertical = $('<div>').addClass('rulers-wrapper-vertical'),
        rulersWrapperHorizontal = $('<div>').addClass('rulers-wrapper-horizontal'),
        currentGridHeight = allConfigs.gridContainer.height();

    for (var i = 0; i < Math.ceil(currentGridHeight / gridConfig.baseline)+1; i++) {
        rulersWrapperHorizontal.append('<div class="ruler-horizontal"></div>');
    }

    for (var i = 0; i < gridConfig.columnsNum; i++) {
        rulersWrapperVertical.append('<div class="ruler-vertical-outer"><div class="ruler-vertical"></div></div>');
    }

    container.append(rulersWrapperVertical);
    container.append(rulersWrapperHorizontal);

    $('.rulers-wrapper-vertical').css({
        'margin-left': -(g/2),
        'margin-right': -(g/2)
    });

    $('.ruler-vertical-outer').css({
        'padding-left': g/2,
        'padding-right': g/2
    });

    $('.ruler-horizontal').css({
        'margin-bottom': gridConfig.baseline - 1 // border takes 1px
    });

    // hide/show ruler guides
    if ($('#grid-toggle').data('grid-toggle') === 'on'){
        $('.rulers-wrapper-vertical').removeClass('hidden');
        $('.rulers-wrapper-horizontal').removeClass('hidden');
    } else {
        $('.rulers-wrapper-vertical').addClass('hidden');
        $('.rulers-wrapper-horizontal').addClass('hidden');
    }
    

    ////////////////////////////////////////////////////////////////////
    var timing = performance.now() - startTime;
    // console.log('... grid rendering finished (%.1dms).', timing);
    return ;
}
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


  if (error_font){
      $('.example-text').css('color', 'white')
      return ;
  } else      
      $('.example-text').css('color', '')


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

  // TODO color heat interpolation (for UPM label and for safebox or partial safebox)
  // http://stackoverflow.com/questions/340209/generate-colors-between-red-and-green-for-a-power-meter/340214#340214
  
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
  console.log('... metrics rendering finished (%.1dms).  [%s>%s]', timing, arguments.callee.caller.name, arguments.callee.name);
};



///////////////////////////////////////////////////////////////////////////////
///////////////////////////// CANVAS PANNING //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//// NB! REQUIRES metricsContext object, initialized in metrics-drawings.js ///
///////////////////////////////////////////////////////////////////////////////

// stops scrolling if text is about to go outside the canvas
function restrictRange(transdelta){
  var mCtx = metricsContext,
      mtextW = mCtx.curr_mtext_width,
      width  = mCtx.canvasT.width;
  // console.log('Scrolling lastX: %s; delta: %s; translated: %s; width: %s', 
     // mCtx.lastX, transdelta-mCtx.translated, mCtx.translated, mtextW);
  
  var pm = 0; // 0.15; // panning margin factor, normalized
  // if text fits within canvas width completely
  if (mtextW < width)
    return transdelta > width-mtextW*(1-pm) ? width-mtextW*(1-pm) :
           transdelta < -mtextW*pm ? -mtextW*pm : transdelta;
  // if text is wider then the canvas width
  else {
    return transdelta > width*(pm) ? width*(pm)  :
           transdelta < -mtextW+width*(1-pm) ? -mtextW+width*(1-pm) : 
           transdelta;
  }
}

window.onmousemove = function(e){
  var evt = e || window.event;
  var mCtx = metricsContext;
  if (mCtx.dragging){
    pauseEvent(evt);
    var delta = evt.clientX - mCtx.lastX;
    mCtx.translated = restrictRange(mCtx.translated+delta);
    mCtx.lastX = evt.clientX;
    drawText();
  }

}

metricsContext.canvasT.onmousedown = function(e){
  var evt = e || event;
  metricsContext.dragging = true;
  metricsContext.lastX = evt.clientX;
}

window.onmouseup = function(){
  metricsContext.dragging = false;
  // localStorage.setItem('drag-translation', metricsContext.translated);
}


// SCROLL PANNING
// stop scrolling propagation for FF
// TODO horizontal scroll-panning (currently only in FF)
// TODO kinectic scrolling: http://ariya.ofilabs.com/2013/11/javascript-kinetic-scrolling-part-2.html

metricsContext.canvasT.addEventListener('DOMMouseScroll', mouseWheelEvent);
metricsContext.canvasT.addEventListener('mousewheel', mouseWheelEvent, false);

function mouseWheelEvent(e){
    var mCtx = metricsContext;
    var delta = 0;

    // console.log(e);
    switch (e.type){
      case 'DOMMouseScroll': // FireFox
        delta = Math.round(e.wheelDelta || e.detail*10);
        break;

      case 'mousewheel': // Chrome (e.deltaY),  IE & Opera (e.wheelDelta)
        delta = Math.round(e.deltaX || e.deltaY || e.wheelDelta);
        break; 
      
      default:
        console.log('Currently "%s" type is not supported.', e.type);
        return false;
    }
    mCtx.translated = restrictRange(mCtx.translated+delta);
    // translated += delta;

    drawText();
    e.preventDefault();
    e.stopPropagation();

    // mouseController.wheel(e);
    return false; 
};

// disable wheel events in main window, but still accessible in canvas
// TOFIX works in chrome but not in FF
// window.onwheel = function() { return false; }

// in order to prevent unwanted selection while dragging
function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}
// GOOGLE ANALYTICS GENERATED CODE
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-76281500-1', 'auto');
		ga('send', 'pageview');

// END GOOGLE ANALYTICS GENERATED CODE

var gaConfig = {
	eventDetails: null,
	setValues: function (config) {
		var arr = [];
		var configObj = {
			width: 'w' + config.rhythmicGrid.W,
			ratio: 'r' + config.ratio.str,
			baseline: 'b' + config.baseline,
			gutter: 'g' + config.gutter.W
		}
		for (key in configObj) {
			arr.push(configObj[key]);
		}
		this.eventDetails = arr.join();
	}
}


//////////////////////////////////////////////////////////
/////////////////////// TESSERACT ////////////////////////
//////////////////////////////////////////////////////////

window.addEventListener('load', drawTesseract, false);


//////////////////////////////////////////////////////////
////////////////  GENERAL CONFIGS ////////////////////////
//////////////////////////////////////////////////////////

// clear selections from previous sesssions
localStorage.clear();

// TOFIX for some reason, key event handling for font size input stops working with $(document).ready(...)
// $(document).ready(function(){

var allConfigs = Object.freeze((function(){
    var startTime = performance.now();

    // grid config
    var rgg = RhythmicGridGenerator,
        widthArr    = [960, 1280, 1440],
        ratioArr    = ['1x1', '4x3', '3x2', '5x3', '16x9'],
        baselineArr = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        columnsArr  = [5, 6, 9, 12],
        gutter2baselineFactorArr = [0, 1, 2, 3, 4];


    // you can specify a predicate validator which difines a valid grid and filters
    // invalid ones during generation. The default validator:
    // console.log('Current grid validator:\n' + 
    //               rgg.isValidGrid.toString().replace(/$\s*\/\/.*/gm, '') + '\n');

    // generate all possible grids from given configuration range
    var allValidGrids = rgg.generateAllRhytmicGrids(
        widthArr, ratioArr, baselineArr, columnsArr, gutter2baselineFactorArr);

    // comparator for sort function
    var srt = function(a,b){ return parseInt(a) > parseInt(b) ? 1 : -1; };

    // re-evaluate config range to remove invalid configs
    // (e.g. no grid exists with 5 columns for current range)
    baselineArr = allValidGrids.map(function(g){ return g.baseline }).unique().sort(srt);
    columnsArr  = allValidGrids.map(function(g){ return g.columnsNum }).unique().sort(srt);
    gutter2baselineFactorArr  = allValidGrids.map(function(g){ return g.gutterBaselineFactor }).unique().sort(srt);

    var timing = performance.now() - startTime;
    console.log('... pre-computed %d grids (%ss).  [%s]', allValidGrids.length, (timing/1000).toFixed(2), 'main:app.js');
    return {
        widthArr     : widthArr,
        ratioArr     : ratioArr,
        baselineArr  : baselineArr,
        columnsArr   : columnsArr,
        gutter2baselineFactorArr: gutter2baselineFactorArr,
        allValidGrids: allValidGrids,
        
        fontSizeLimit  : {min: 14, max: 21},   // px
        lineHeightLimit: {min: 1.0, max: 1.5}, // percent of font size
        
        rangeArrs    : [widthArr, ratioArr, baselineArr, columnsArr, gutter2baselineFactorArr],
        inputNames   : ['gridUpTo', 'gridRatio', 'gridBaseline', 'gridColumns', 'gridGutter'],

        gridContainer: $('.grid-container'),   
        radioForms   : $('.grid-section > .container > .flex-row >'+
                         ' .flex-child:lt(5) > .form-group'), // all config radio elements

        imageMocks   : 9, // from 1.jpg to 9.jpg
        textMocks    : Array.apply(null, {length: 5}) // array of 5 lorem texts of different length
                            .map(function(_,i) {
                                return Lorem.prototype.createText(
                                    // 10*(i+1),
                                    27*Math.exp(i*1.3), 
                                    // Math.pow(20, (i+1)*0.9), 
                                    Lorem.TYPE.WORD)
                            })
    }
})());


//////////////////////////////////////////////////////////
///////////////// FONT CONFIGURATION /////////////////////
//////////////////////////////////////////////////////////
['#select-font', '#input-fontsize', '#input-lineheight']
.forEach(function(selector, idx){
      switch(idx){
        // font dropdown
        case 0:
            var fontList = getAvailableSystemFonts();
            var select = $(selector);
            select.empty();
  
            fontList.forEach(function(val, idx) {
              var option = $('<option>').prop('value', val).text(val);
              if (!idx) option.prop('selected', true);  // make 1st option a default selection
              select.append(option);
            });

            // initialize dropdown values from previous session (if any)
            var prevFont = localStorage.getItem(select.attr('id'))
            if (prevFont)
                select.find('option[value="'+prevFont+'"]')
                      .attr('selected','selected');

            $('.example-text').css('font-family', select.val()+",monospace");

            select.on('change', onFontChange).trigger('change');
            
            // in Firefox only (Safari?)
            // if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
                // select.on('keyup', function(){ $(this).trigger('change'); })
            break;
        
        // font size & line height edit boxes
        case 1:
        case 2:
            var input = $(selector);

            // initialize edit box from previous session (if any)
            var prevSize = localStorage.getItem(input.parent().attr('class'));
            if (prevSize)  input.val(prevSize);            
        
            if (idx==1)
                $('.example-text').css('font-size', parseInt(input.val())+'px');
            else 
                $('.example-text').css('line-height', parseInt(input.val())+'px');

            input.on('change', onFontChange);
            input.on('keydown', onKeyDown);
            break;
        default:
            console.warn('update your font selector initialization')
      }
  });

////////////////////////////////////////////////////////////
////////////////// SHARED GLOBAL VARS //////////////////////
////////////////////////////////////////////////////////////
// LineHeight/FontSize Ratio, value for line-height percent label
var _LHFS_R = parseInt($('#input-lineheight').val(),10) / 
              parseInt($('#input-fontsize').val(),10);

// LineHeight/BaseLine Factor, value for grid baseline
var _LHBL_F = (function(){
    var lh = parseInt($('#input-lineheight').val(),10);
    return !(lh%3) ? 3 : !(lh%2) ? 2  : 1;
})();

// trigger for initial text metrics rendering
$('#fontmetrics-input-wrapper').on('keyup', onMetricsTextChange).trigger('keyup');

//////////////////////////////////////////////////////////
///////////////// RATIO SELECTION ////////////////////////
//////////////////////////////////////////////////////////

// radio input handler
$('.ratio-selector .flex-row').on('change', function(){
    var radioObj = $('.ratio-selector input[name=ratioSelector]:checked');
    var ratioStr = /\d+x\d+$/.exec( radioObj.attr('id') )[0];

    var gridRatioObj = $('.grid-section .flex-child input[name="gridRatio"][value="' + ratioStr + '"]');
    gridRatioObj.prop('checked', true).trigger('change');
});

//////////////////////////////////////////////////////////
///////////////// GRID CONFIGURATION /////////////////////
//////////////////////////////////////////////////////////

// create radio items based on the grid config above
setupRadioItems(allConfigs);

// initialize 'hide grid' button
$('#grid-toggle').on('click', function(e){
    e.preventDefault();
    gridToggleBtn = $(e.target);
    
    if (gridToggleBtn.data('grid-toggle') === 'on') {
        $('.rulers-wrapper-vertical').addClass('hidden');
        $('.rulers-wrapper-horizontal').addClass('hidden');
        gridToggleBtn.text('Show rulers');
        gridToggleBtn.data('grid-toggle', 'off');
    } else {
        $('.rulers-wrapper-vertical').removeClass('hidden');
        $('.rulers-wrapper-horizontal').removeClass('hidden');
        gridToggleBtn.text('Hide rulers');
        gridToggleBtn.data('grid-toggle', 'on');
    }

    localStorage.setItem('gridToggle', gridToggleBtn.data('grid-toggle'));

});

$('#grid-toggle')
    .data('grid-toggle', localStorage.getItem('gridToggle')==='off' ? 'on' : 'off')
    .trigger('click');

// }); // <-- $(document).ready()
