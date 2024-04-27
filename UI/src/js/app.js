//////////////////////////////////////////////////////////
/////////////////////// TESSERACT ////////////////////////
//////////////////////////////////////////////////////////

// window.addEventListener('load', drawTesseract, false);


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
        ratioArr    = ['1x1', '4x3', '3x2', '16x9'],
        baselineArr = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        columnsArr  = [5, 6, 9, 12],
        gutter2baselineFactorArr = [0, 1, 2, 3, 4];

    // you can specify a predicate validator which defines a valid grid and filters
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

        fontSizeLimit  : {min: 15, max: 21},    // px
        lineHeightLimit: {min: 1.2, max: 1.6},  // em (of font size)

        rangeArrs    : [widthArr, ratioArr, baselineArr, columnsArr, gutter2baselineFactorArr],
        inputNames   : ['canvasWidth', 'gridRatio', 'gridBaseline', 'gridColumns', 'gridGutter'],
        defaultInputValues : [1, 0, 1, 2, 3],

        gridContainer: $('.grid-container'),
        radioForms   : $('.grid-section > .container > .flex-row >'+
                         ' .flex-child:lt(5) > .form-group'), // all config radio elements

        isSafari     : navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1,

        imageMocks   : 9, // from 1.jpg to 9.jpg
        textMocks    : Array.apply(null, {length: 5}) // array of 5 lorem texts of different length
                            .map(function(_,i) {
                                return Lorem.prototype.createText(
                                    // 10*(i+1),
                                    // Math.pow(20, (i+1)*0.9),
                                    30*Math.exp(i*1.5),
                                    Lorem.TYPE.WORD)
                                // Uppercase the first letter
                                .replace(/^(\w)/, function(v) { return v.toUpperCase(); });
                            })
    }
})());

//////////////////////////////////////////////////////////
/////////////////// TABS FOR FONTS ///////////////////////
//////////////////////////////////////////////////////////
$('.tabs-toggle-wrapper a').click(function (event) {
    toggleTab.call(this, event, '.tab-content');
});

function toggleTab(e, content) {
    e.preventDefault();
    var tab = $(this).attr('href');
    $(this).addClass('current');
    $(this).siblings().removeClass('current');
    $(content).not(tab).css('display', 'none');
    $(tab).fadeIn('fast');
}


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
// TODO refactor this lainokod, remove global vars

// LineHeight/FontSize Ratio, value for line-height percent label
var _LHFS_R = parseInt($('#input-lineheight').val()) /
              parseInt($('#input-fontsize').val());

// LineHeight/BaseLine Factor, value for grid baseline
var _LHBL_F = (function(){
    var lh = parseInt($('#input-lineheight').val());
    return !(lh%3) ? 3 : !(lh%2) ? 2  : 1;
})();

// trigger initial text metrics rendering
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

// 'hide grid' button
$('#grid-toggle').on('click', function(e){
    e.preventDefault();
    gridToggleBtn = $(e.target);

    if (gridToggleBtn.data('grid-toggle') === 'on') {
        if (_LHBL_F !== 1) {
        $('.rulers-wrapper-horizontal').addClass('hidden'); }
        $('.rulers-wrapper-vertical').addClass('hidden');
        gridToggleBtn.text('Show rulers');
        gridToggleBtn.data('grid-toggle', 'off');
    } else {
        if (_LHBL_F !== 1) {
        $('.rulers-wrapper-horizontal').removeClass('hidden'); }
        $('.rulers-wrapper-vertical').removeClass('hidden');
        gridToggleBtn.text('Hide rulers');
        gridToggleBtn.data('grid-toggle', 'on');
    }

    localStorage.setItem('gridToggle', gridToggleBtn.data('grid-toggle'));

});

// initialize state of 'Hide grid' button
$('#grid-toggle')
    .data('grid-toggle', localStorage.getItem('gridToggle')==='off' ? 'on' : 'off')
    .trigger('click');

// up/down arrows to selct font-size/line-height
$('.controls .up').each(function () {
    $(this).on('click', function (e) {
        e.preventDefault();
        setFontControls(38, this);
    });
});

$('.controls .down').each(function () {
    $(this).on('click', function (e) {
        e.preventDefault();
        setFontControls(40, this);
    });
});

function setFontControls (key, self) {
    var input = $(self).closest('.font-control-wrapper').find('input');
    var press = jQuery.Event("keydown");
    press.which = key;
    $(input).trigger(press);
}


$(window).on('load', drawMetrics);

// }); // <-- $(document).ready()
