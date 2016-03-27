/////////////////////// TESSERACT //////////////////////

// window.addEventListener('load', drawTesseract, false);


////////////////////// FONT METRICS ////////////////////



////////////////////// GRID CONFIG /////////////////////

var allConfigs = (function(){
    var rgg = RhythmicGridGenerator;

    // grid config range
    var widthArr    = [960, 1280, 1440];
    var ratioArr    = ['16x9', '3x2', '1x1'];
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
    // (e.g. no grid exists with column=5 for current range)
    baselineArr = allValidGrids.map(function(g){ return g.baseline }).unique().sort(srt);
    columnsArr  = allValidGrids.map(function(g){ return g.columnsNum }).unique().sort(srt);
    gutter2baselineFactorArr  = allValidGrids.map(function(g){ return g.gutterBaselineFactor }).unique().sort(srt);

    return {
        widthArr: widthArr,
        ratioArr: ratioArr,
        baselineArr: baselineArr,
        columnsArr: columnsArr,
        rangeArrs: [widthArr, ratioArr, baselineArr, columnsArr, gutter2baselineFactorArr],
        inputNames: ['gridUpTo', 'gridRatio', 'gridBaseline', 'gridColumns', 'gridGutter'],
        gutter2baselineFactorArr: gutter2baselineFactorArr,
        allValidGrids: allValidGrids
    }
})();

// create radio items based on the grid config above
initializeRadioItems(allConfigs);


///////////////// DRAW GRID LAYOUT /////////////////////
// clear default grid layout
// $('.grid-container').remove();


