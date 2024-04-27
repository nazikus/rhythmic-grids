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
    $('#grid-lh-label').text(lhEl.val());
    break;
  }

  
  ////////////////// CHECK LINE HEIGHT DIVISIBILITY ///////////////
  // TODO refactor lainokod, do baseline-info-* properly

  var lh = _int(lhEl.val()),
      baselineInfo  = $(".baseline-info"),
      gridLineHeightInfo = $('#grid-lh-label');
  var blEl = allConfigs ? allConfigs.radioForms[2] : null; // baseline radio

  // if line height is divisible by 2 (X)OR by 3
  if (lh%2===0 || lh%3===0) {

    // SPECIAL CASE if line height is divisible by 2 AND 3
    if (lh%2===0 && lh%3===0) {
      _LHBL_F = 3;

      baselineInfo.html(
        'Your baseline values are either ' +
        '<a href="#">' + lh/3 + ' px</a> ' +
        'or <a href="#">' + lh/2 + ' px</a>. ' +
        'Please choose the preferable option.'
      );

      // init active baseline selection
      $('a', baselineInfo).removeClass('active');
      var which = _LHBL_F === 3 ? 'first' : 'last';
      $('a:'+which, baselineInfo).addClass('active');

      // onClick for each baseline selection
      $('a:first', baselineInfo).on('click', function(e){
        $(this).addClass('active');
        $('a:last', baselineInfo).removeClass('active');
        _LHBL_F = 3;
        resetBaselineSelections();
        onGridChange({target: "#gridBaseline > input:checked"})
        e.preventDefault();
      });

      $('a:last', baselineInfo).on('click', function(e){
        $('a:first', baselineInfo).removeClass('active');
        $(this).addClass('active');
        _LHBL_F = 2;
        resetBaselineSelections();
        onGridChange({target: "#gridBaseline > input:checked"})
        e.preventDefault();
      });


    } else {
      _LHBL_F = lh%2 ? 3 : 2;  // preference for div 3
      // _LHBL_F = lh%3 ? 2 : 3;  // preference for div 2   

      baselineInfo.html(
        'Your baseline is ' +
        '<span id="baseline-info-text">' + lh/_LHBL_F + ' px</span>.'
      );
    }

    var baselineInfoText = $("#baseline-info-text");
    [lhEl, baselineInfoText, gridLineHeightInfo].forEach(function(el){ 
      el.removeClass('invalid-baseline'); 
    });

    // ENABLE all radios and restore previous value, if switched from bad line height
    if (/*lhEl.hasClass('invalid-baseline') &&*/ allConfigs) {

      $('input', blEl).prop('disabled', false); // enable baseline radio
      allConfigs.radioForms.css('pointer-events', 'unset'); // enable all other radios via css

      // retrieve baseline radio selection from cache
      var prevSelection = localStorage.getItem($(blEl).attr('id')),
          selector = prevSelection ? 'input[value="'+prevSelection+'"]' : 'input:first';
      $(selector, blEl).prop('checked', true);

      // select baseline corresponding to line height (div2/3)
      $('#gridBaseline > input[value='+lh/_LHBL_F+']').prop('checked', true);
      $('.rulers-wrapper-horizontal').removeClass('hidden');
      // $('.text').removeClass('hidden');
      
      // allConfigs.radioForms.eq(0).trigger('change'); // hacked below
      resetBaselineSelections();
    }  // <-- if .css('background-color')

  // if line height is NOT divisible by 2 nor by 3
  } else {
    _LHBL_F = lh/lh; //implicit 1
    // console.log('test');
    baselineInfo.html(
      'Your baseline is ' +
      '<span id="baseline-info-text">not valid</span>. ' +
      '<span id="baseline-invalid-text">Line height must be divisible by 2 or 3.</span>'
    );

    var baselineInfoText = $("#baseline-info-text");
    [lhEl, baselineInfoText, gridLineHeightInfo].forEach(function(el){ el.addClass('invalid-baseline'); });

    // DISABLE baseline form
    if (allConfigs){
      // cache baseline radio
      if ($('input:checked', $(blEl)).val())
        localStorage.setItem($(blEl).attr('id'), $('input:checked', $(blEl)).val());
      
      $('input', blEl).prop('disabled', true).val([]); // disable baseline radio
      allConfigs.radioForms.css('pointer-events', 'none'); // disable all other radios via css

      $('.text').css('line-height', lh+'px');
      $('.rulers-wrapper-horizontal').addClass('hidden');
      // $('.text').addClass('hidden');
    }
  }
  // console.log("line height: %d; baseline: %d  [%s$]", lh, lh/_LHBL_F, arguments.callee.name);


  $('#lineheight-percent-label').text( 
    Math.round( _int(lhEl.val())/_int(fsEl.val() ) *100) + '%'
  );
  
  // hack
  if (id === 'input-lineheight' || id === 'input-fontsize') {
    onGridChange({target: "#gridBaseline > input:checked"})
  }  
  gridTextEllipsis(lh/_LHBL_F);

};

/////////////////////////////////////////////////////////////////////////////

// set baseline selection valid only for meaningful lineheight values
// called by onLineHeightChange
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


// up/down keyboard events
function onKeyDown(e) {
    var input = $(e.target),
        val = _int(input.val()),
        code = (e.which || e.keyCode),
        limit = null;

    if (input.attr('id') === 'input-fontsize')
        limit = allConfigs.fontSizeLimit;

    if (input.attr('id') === 'input-lineheight'){
        var fsVal = _int($('#input-fontsize').val());
        limit = { min: Math.ceil(fsVal*allConfigs.lineHeightLimit.min),
                  max: Math.ceil(fsVal*allConfigs.lineHeightLimit.max) };
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
    'Georgia', 'Baskerville', 'Baskerville Old Face', 'Century', 'Lucida Bright',
    'Times', 'Helvetica', 'Helvetica Neue', 'Arial', 'Verdana', 'Century Gothic', 
    'Calibri', 'Charter', 'Avenir'
  ];
}
