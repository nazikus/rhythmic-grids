require('./RhythmicGridGenerator.js');
var rgg = RhythmicGridGenerator;

/**
var gc  = rgg.generateRhythmicGrid(1200, '3x2', 8, 12, 3);
console.log(gc); console.log('\n');
console.log(JSON.stringify(gc, null, '\t') );  /**/

/***** GENERATE GRID CONFIGURATIONS FIRST *****/

// picks random element from array
var randElement = function(arr) { return arr[Math.round(Math.random()*(arr.length-1))]; }

// All possible ranges of configurations
var width_arr    = [960, 1280, 1440];
var ratio_arr    = ['16x9', '3x2', '1x1'];
var baseline_arr = [3,4,5,6,7,8,9,10,11,12];
var columns_arr  = [5, 6, 9, 12];
var gutter2baselineRatio_arr = [0, 1, 2, 3];

var totalCombinations = width_arr.length * ratio_arr.length * baseline_arr.length * columns_arr.length * gutter2baselineRatio_arr.length

// define grid validator first
rgg.isValidGrid = function(grid){ return grid && grid.blocks.length > 1; }

// all valid rhythmic grids (if isValidGrid is not difined - all grids are returned)
var all_gc = rgg.generateAllRhytmicGrids(
    width_arr, ratio_arr, baseline_arr, columns_arr, gutter2baselineRatio_arr);

console.log('Grid configurations available:')
console.log(' - total possible: %d', totalCombinations);
console.log(' - valid: %d (%d%%) ', all_gc.length, Math.floor(all_gc.length/totalCombinations*100));



/***** USECASE SCENARIO *****/

/*****************************************************************************/
/** ACTION 1 - user chooses max canvas width (px) **/

console.log('\nACTION 1');
console.log('Max widths available: ', width_arr)

var maxW_choice = randElement(width_arr);
console.log('User choice: %d', maxW_choice);

var action1_gc = all_gc;
// filter available rhythmic grids limiting by chosen canvas width
var action2_gc = action1_gc.filter( function(g){return g.maxCanvasWidth==maxW_choice;} );
console.log('grids left: ' + action2_gc.length);


/*****************************************************************************/
/** ACTION 2 - user chooses ratio **/
console.log('\nACTION 2');

// extract available ratios
var ratios_avail = action2_gc.map( function(g){return g.ratio.str;} ).unique();
console.log('ratios available: ' + ratios_avail);

var ratio_choice = randElement(ratios_avail);
console.log('User choice: ' + ratio_choice);

// filter rhythmic grids limiting further by chosen ratio
var action3_gc = action2_gc.filter( function(g){return g.ratio.str==ratio_choice;} );
console.log('grids left: ' + action3_gc.length);

/*****************************************************************************/
/** ACTION 3 - user chooses baseline (px) **/
console.log('\nACTION 3');

// extract available baselines
var baselines_avail = action3_gc.map( function(g){return g.baseline;}).unique();
console.log('baselines available: ' + baselines_avail);

var baseline_choice = randElement(baselines_avail);
console.log('User choice: ' + baseline_choice);

// filter rhythmic grids limiting further by chosen baseline
var action4_gc = action3_gc.filter( function(g){return g.baseline==baseline_choice;} );
console.log('grids left: ' + action4_gc.length);


/*****************************************************************************/
/** ACTION 4 - user chooses columns number **/
console.log('\nACTION 4');

// extract available column quantities
var columns_avail = action4_gc.map( function(g){return g.columnsNum;} ).unique();
console.log('columns available: ' + columns_avail);

var columns_choice = randElement(columns_avail);
console.log('User choice: ' + columns_choice);

// filter rhythmic grids limiting further by chosen columns
var action5_gc = action4_gc.filter( function(g){return g.columnsNum==columns_choice;} );
console.log('grids left: ' + action5_gc.length);


/*****************************************************************************/
/** ACTION 5 - user chooses gutter width (px) **/
console.log('\nACTION 5');

// extract available gutter widths
var gutters_avail = action5_gc.map( function(g){return g.gutter.W;} ).unique();
console.log('gutters available: ' + gutters_avail);

var gutter_choice = randElement(gutters_avail);
console.log('User choice: ' + gutter_choice);


// console.log(JSON.stringify(left_gc, null, '\t') );
