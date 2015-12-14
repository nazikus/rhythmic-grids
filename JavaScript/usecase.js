require('./RhythmicGridGenerator.js');
var rgg = RhythmicGridGenerator;

/**
var gc  = rgg.generateRhythmicGrid(1200, '3x2', 8, 12, 3);
console.log(gc); console.log('\n');
console.log(JSON.stringify(gc, null, '\t') );  /**/

/***** GENERATE GRID CONFIGURATIONS FIRST *****/

// picks a random element from array
var randElement = function(arr) { return arr[Math.round( Math.random()*(arr.length-1) )]; }

// All possible ranges of configurations
var width_arr    = [960, 1280, 1440];
var ratio_arr    = ['16x9', '3x2', '1x1'];
var baseline_arr = [3,4,5,6,7,8,9,10,11,12];
var columns_arr  = [5, 6, 9, 12];
var gutter2baselineRatio_arr = [0, 1, 2, 3];

var totalCombinations = width_arr.length * ratio_arr.length * baseline_arr.length * columns_arr.length * gutter2baselineRatio_arr.length

// Note: you can define your own grid validator here
// rgg.isValidGrid = function(grid){ return <boolean condition> }

var allGConfigs = rgg.generateAllRhytmicGrids(
    width_arr, ratio_arr, baseline_arr, columns_arr, gutter2baselineRatio_arr);

console.log('Grid configurations available:')
console.log(' - total possible: %d', totalCombinations);
console.log(' - valid: %d (%d%%) ', allGConfigs.length, Math.floor(allGConfigs.length/totalCombinations*100));
console.log();

// simulate user's random selection
var selected_width    = randElement(width_arr);
var selected_ratio    = randElement(ratio_arr);
var selected_baseline = randElement(baseline_arr);
var selected_columns  = randElement(columns_arr);

// var f1 = {}; f1[rgg.WIDTH_PROP]    = selected_width;
// var f2 = {}; f2[rgg.RATIO_PROP]    = selected_ratio;
// var f3 = {}; f3[rgg.BASELINE_PROP] = selected_baseline;
// var f4 = {}; f4[rgg.COLUMNS_PROP]  = selected_columns;
// var selection_arr = [f1, f2, f3, f4];

// NOTE ES5.1 (JS 1.8) does not support computed property names yet
// E.g., var obj = { myFunc(): 'myVal'} - won't work :(
//  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names

// ORDER MATTERS!
var selection_arr = [
        {'maxCanvasWidth': selected_width},
        {'ratio':          selected_ratio},
        {'baseline':       selected_baseline},
        {'columnsNum':     selected_columns},
];

console.log(selection_arr); console.log();

// opts = rgg.getValidConfigValues (all_gc, selection_arr);
// console.log(opts)

var g = rgg.selectGrid(allGConfigs, 1280, '3x2', 8, 12, 3)
console.log(g)