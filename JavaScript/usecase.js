require('./RhythmicGridGenerator.js');
var rgg = RhythmicGridGenerator;

/**
var gc  = rgg.generateRhythmicGrid(1200, '3x2', 8, 12, 24);
console.log(gc); console.log('\n');
console.log(JSON.stringify(gc, null, '\t') );  /**/

/***** GENERATE GRID CONFIGURATIONS FIRST *****/

// All possible ranges of configurations
var width_arr    = [960, 1280, 1440];
var ratio_arr    = ['16x9', '3x2', '1x1'];
var baseline_arr = [3,4,5,6,7,8,9,10,11,12];
var columns_arr  = [5, 6, 9, 12];
var gutter2baselineRatio_arr = [0, 1, 2, 3];

// all possible rhythmic grids (even with 1-rhythm block)
var all_gc = rgg.generateAllRhytmicGrids(
    width_arr, ratio_arr, baseline_arr, columns_arr, gutter2baselineRatio_arr);

// filter only those rhythmic grids that have more than 1 blocks
var valid_gc = all_gc.filter(
    function(g,i){ return g.rhythmicGrid && g.rhythmicGrid.blocks.length > 1; }
);

console.log('Grid configurations available:')
console.log(' - total: ' + all_gc.length);
console.log(' - valid (>1 blocks): ' + valid_gc.reduce( 
    function(pv, cv){ return pv + (cv.rhythmicGrid ?1:0); },  0)
);

/***** USECASE SCENARIO *****/

/*****************************************************************************/
/** ACTION 1 - user enters max canvas width (px) **/
var maxW_choice = 1280;
console.log('\nUser max width choice: ' + maxW_choice);

// filter available rhythmic grids limiting by chosen canvas width
var left_gc = valid_gc.filter( 
    function(g, i) { return g.maxCanvasWidth == maxW_choice; }
);

// extract available ratios
var ratios_avail = left_gc.map(
    function(g, i) { return g.ratio.str;  }
).unique();

console.log('grids left: ' + left_gc.length);
console.log('ratios available: ' + ratios_avail);


/*****************************************************************************/
/** ACTION 2 - user enters ratio **/
var ratio_choice = '3x2';
console.log('\nUser ratio choice: ' + ratio_choice);

// filter rhythmic grids limiting further by chosen ratio
left_gc = left_gc.filter( 
    function(g, i) { return g.ratio.str == ratio_choice; }
);

// extract available baselines
var baselines_avail = left_gc.map(
    function(g, i) { return g.baseline;  }
).unique();

console.log('grids left: ' + left_gc.length);
console.log('baselines available: ' + baselines_avail);

/*****************************************************************************/
/** ACTION 3 - user enters baseline (px) **/
var baseline_choice = 8;
console.log('\nUser baseline choice: ' + baseline_choice);

// filter rhythmic grids limiting further by chosen baseline
left_gc = left_gc.filter( 
    function(g, i) { return g.baseline == baseline_choice; }
);

// extract available column quantities
var columns_avail = left_gc.map(
    function(g, i) { return g.columnsNum;  }
).unique();

console.log('grids left: ' + left_gc.length);
console.log('columns available: ' + columns_avail);


/*****************************************************************************/
/** ACTION 4 - user enters columns quantity (px) **/
var columns_choice = 9;
console.log('\nUser columns choice: ' + columns_choice);

// filter rhythmic grids limiting further by chosen columns
left_gc = left_gc.filter( 
    function(g, i) { return g.columnsNum == columns_choice; }
);

// extract available column quantities
var gutters_avail = left_gc.map(
    function(g, i) { return g.gutter.W;  }
).unique();

console.log('grids left: ' + left_gc.length);
console.log('gutters available: ' + gutters_avail);



// console.log(JSON.stringify(left_gc, null, '\t') );
