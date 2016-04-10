//////////////////////////////////////////////////////////
/////////////////////// TESSERACT ////////////////////////
//////////////////////////////////////////////////////////

window.addEventListener('load', drawTesseract, false);


//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
var allConfigs;

// clear selections from previous sesssions
// localStorage.clear()

// TOFIX for some reason, key event handling for font size input stops working with $(document).ready(...)
// $(document).ready(function(){

//////////////////////////////////////////////////////////
///////////////// FONT CONFIGURATION /////////////////////
//////////////////////////////////////////////////////////
['#fontSelect', '#input-fontsize', '#input-lineheight']
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

// initialize line height percent label
var _lhfs_r = parseInt($('#input-lineheight').val(),10) / 
              parseInt($('#input-fontsize').val(),10);

$('#lineheight-percent-label').text( Math.round(_lhfs_r*100) + '%')

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

allConfigs = (function(){
    var rgg = RhythmicGridGenerator;

    // grid config range
    var widthArr    = [960, 1280, 1440];
    var ratioArr    = ['1x1', '3x2', '16x9'];
    var baselineArr = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    var columnsArr  = [5, 6, 9, 12];
    var gutter2baselineFactorArr = [0, 1, 2, 3];

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

    return {
        widthArr     : widthArr,
        ratioArr     : ratioArr,
        baselineArr  : baselineArr,
        columnsArr   : columnsArr,
        gutter2baselineFactorArr: gutter2baselineFactorArr,
        allValidGrids: allValidGrids,
        
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
                                    17*Math.exp(i*1.3), 
                                    // Math.pow(20, (i+1)*0.9), 
                                    Lorem.TYPE.WORD)
                            })
    }
})();

// create radio items based on the grid config above
setupRadioItems(allConfigs);

// initialize 'hide grid' button
$('#grid-toggle').on('click', function(e){
    e.preventDefault();
    gridToggleBtn = $(e.target);
    
    if (gridToggleBtn.data('grid-toggle') === 'on') {
        $('.rulers-wrapper-vertical').addClass('hidden');
        $('.rulers-wrapper-horizontal').addClass('hidden');
        gridToggleBtn.text('Show grid');
        gridToggleBtn.data('grid-toggle', 'off');
    } else {
        $('.rulers-wrapper-vertical').removeClass('hidden');
        $('.rulers-wrapper-horizontal').removeClass('hidden');
        gridToggleBtn.text('Hide grid');
        gridToggleBtn.data('grid-toggle', 'on');
    }

    localStorage.setItem('gridToggle', gridToggleBtn.data('grid-toggle'));

});

$('#grid-toggle')
    .data('grid-toggle', localStorage.getItem('gridToggle')==='off' ? 'on' : 'off')
    .trigger('click');

// }); // <-- $(document).ready()