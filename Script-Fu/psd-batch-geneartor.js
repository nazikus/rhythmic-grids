// js code generates all the parameters of possible rhythmic grids, and calls
// script-fu to generate .psd with corresponding vertical guides (psd-vguides.scm)

var util = require('util');
var fs = require('fs');
var child_process = require('child_process');

// All meaningful ranges of configurations
var width_arr    = [960, 1280, 1440];
var ratio_arr    = ['1x1', '4x3', '3x2', '16x9'];
var baseline_arr = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
var columns_arr  = [5, 6, 9, 12];
var gutter2baselineRatio_arr = [0, 1, 2, 3, 4];

var f = function getCurrentDirectoryName() { var fullPath = __dirname; var path = fullPath.split('/'); var cwd = path[path.length-1]; return cwd; };
console.log(f());

// generate all configs based on ranges of configurations
var rgg = require('./RhythmicGridGenerator.js'), RhythmicGridGenerator;
var allGConfigs = rgg.generateAllRhytmicGrids(
    width_arr, ratio_arr, baseline_arr, columns_arr, gutter2baselineRatio_arr);

var psd_dir = "/vagrant/data/";
var cmd_template = 
    "gimp-console-2.8 " +
    "--no-interface " +
    "--no-data " +
    // "--no-fonts " +
    "--batch=\"(psd-columns-w-baseline %d %d %d '(%s) \\\"%s\\\" \\\"%s\\\")\" " +
    "--batch=\"(gimp-quit 0)\"";

// console.log(allGConfigs);
// console.log(allGConfigs[0].rhythmicGrid);

var total = 0;
for (var i=0; i<allGConfigs.length; i++) {

    var w = allGConfigs[i].maxCanvasWidth,          // max width
        r = allGConfigs[i].ratio,                   // ratio (eg, '3x2')
        b = allGConfigs[i].baseline,                // basline
        c = allGConfigs[i].columnsNum,              // columns num
        g = allGConfigs[i].gutter.W,                // column gutter
        cw = allGConfigs[i].rhythmicGrid.uBlock.W,  // column width
        m  = allGConfigs[i].rhythmicGrid.margin;    // grid left margin

    var colOrdinals = Array.apply(null, new Array(c+1)).map(Number.call, Number),
        xCoordsR = colOrdinals.map(function(ord) { return m + ord*cw + g*ord; }),
        xCoordsL = xCoordsR.slice(1).map(function(x) { return x-g; }),
        xCoords  = xCoordsR.slice(0,-1).concat(xCoordsL).sort(function(a,b){return a-b;}).unique();

    // console.log("max %d, m-%d, W-%d, B-%d, G-%d, N-%d: (%s)", w, m, cw, b, g, c, xCoords);
    var psd_filename = util.format("concordia_W%d_R%s_B%d_C%d_G%d.psd", w, r, b, c, g);

    var cmd = util.format(cmd_template, w, 1000, b, xCoords.join(' '), psd_dir, psd_filename);
    if (fs.existsSync(psd_dir + psd_filename)) {  
        console.log("Skip #%d: %s", ++total, cmd);
        continue; 
    }
    console.log("#%d: %s", ++total, cmd);
    child_process.execSync(cmd);
}

var totalCombinations = width_arr.length * ratio_arr.length * baseline_arr.length * columns_arr.length * gutter2baselineRatio_arr.length;
console.log("Totals double-check: %d", totalCombinations);

