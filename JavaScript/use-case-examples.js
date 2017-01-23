var exec = require('child_process').exec;

require('../JavaScript/RhythmicGridGenerator.js');
var rgg = RhythmicGridGenerator;


/***** GENERATE SINGLE GRID *****/
var gc  = rgg.generateRhythmicGrid(1200, '3x2', 8, 12, 3);
// console.log(gc); console.log('\n');
// console.log(JSON.stringify(gc, null, '\t') );

/***** GENERATE MULTIPLE GRIDS *****/

// Note: you can define your own grid validator here.
// rgg.isValidGrid = function(grid){ return <boolean condition> }
console.log('Current validator:\n' + rgg.isValidGrid.toString().replace(/$\s*\/\/.*/gm, '') + '\n\n');

// All meaningful ranges of configurations
var width_arr    = [960, 1280, 1440];
var ratio_arr    = ['16x9', '3x2', '1x1'];
var baseline_arr = [3,4,5,6,7,8,9,10,11,12];
var columns_arr  = [5, 6, 9, 12];
var gutter2baselineRatio_arr = [0, 1, 2, 3];

// generate all configs based on ranges of configurations
var allGConfigs = rgg.generateAllRhytmicGrids(
    width_arr, ratio_arr, baseline_arr, columns_arr, gutter2baselineRatio_arr);

var totalCombinations = width_arr.length * ratio_arr.length * baseline_arr.length * columns_arr.length * gutter2baselineRatio_arr.length;
console.log('Grid configurations available:')
console.log(' - total possible: %d', totalCombinations);
console.log(' - valid: %d (%d%%) ', allGConfigs.length, Math.floor(allGConfigs.length/totalCombinations*100));
// console.log(allGConfigs)
console.log();

// simulate user's random selection

// picks a random element from array
var randElement = function(arr) { return arr[Math.round( Math.random()*(arr.length-1) )]; }
var selected_width    = randElement(width_arr);
var selected_ratio    = randElement(ratio_arr);
var selected_baseline = randElement(baseline_arr);
var selected_columns  = randElement(columns_arr);
var selected_gutter   = randElement(gutter2baselineRatio_arr);


// ORDER MATTERS!
var selection_arr = [selected_width, selected_ratio, selected_baseline, 
                     selected_columns, selected_gutter];

console.log('Selection: [%s]\n', selection_arr);

// Filter out all the grids according to user choice
opts = rgg.getValidConfigValues (allGConfigs, selection_arr);
console.log(opts); console.log();

// select single grid out of filtered (if any), to avoid re-computation
var g = rgg.selectGrid(allGConfigs, [1280, '3x2', 8, 12, 3]);
console.log(g.rhythmicGrid)