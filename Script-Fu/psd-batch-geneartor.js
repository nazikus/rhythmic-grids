// js code generates all the parameters of possible rhythmic grids, and calls
// script-fu to generate .psd with corresponding vertical guides.

var util = require('util');
var fs = require('fs');
var child_process = require('child_process');

// All meaningful ranges of configurations
var width_arr    = [960, 1280, 1440];
var ratio_arr    = ['16x9', '3x2', '1x1'];
var baseline_arr = [7,8,9,10,11,12,13,14,15,16,17,18,19,20];
var columns_arr  = [6, 9, 12];
var gutter2baselineRatio_arr = [0, 1, 2, 3, 4];

// generate all configs based on ranges of configurations
// var rgg = require('../JavaScript/RhythmicGridGenerator.js'), RhythmicGridGenerator;
// var allGConfigs = rgg.generateAllRhytmicGrids(
//     width_arr, ratio_arr, baseline_arr, columns_arr, gutter2baselineRatio_arr);

var psd_dir = "/vagrant_data/";
var cmd_template = 
    "gimp-console-2.8 " +
    "--no-interface " +
    "--no-data " +
    "--no-fonts " +
    "--batch=\"(psd-rhythmic-guides %d '(%d %d) %d %d %d nil \\\"%s\\\" \\\"%s\\\")\" " +
    "--batch=\"(gimp-quit 0)\"";

var total = 0;
for (var wi=0; wi<width_arr.length; wi++) {
for (var ri=0; ri<ratio_arr.length; ri++) {
for (var bi=0; bi<baseline_arr.length; bi++) {
for (var ci=0; ci<columns_arr.length; ci++) {
for (var gi=0; gi<gutter2baselineRatio_arr.length; gi++) {
    var w = width_arr[wi],
        r = ratio_arr[ri],
        b = baseline_arr[bi],
        c = columns_arr[ci],
        g = gutter2baselineRatio_arr[gi];

    var psd_filename = util.format("W%d_R%s_B%d_C%d_G%d.psd", w, r, b, c, g*b);
    var cmd = util.format(cmd_template, w, r.split('x')[0], r.split('x')[1], b, c, g, psd_dir, psd_filename);
    if (fs.existsSync(psd_dir + psd_filename + '.psd')) {  
        console.log("Skip #%d: %s", ++total, cmd);
        continue; 
    }
    console.log("#%d: %s", ++total, cmd);
    child_process.execSync(cmd);
}}}}}

var totalCombinations = width_arr.length * ratio_arr.length * baseline_arr.length * columns_arr.length * gutter2baselineRatio_arr.length;
console.log("Totals double-check: %d", totalCombinations);

