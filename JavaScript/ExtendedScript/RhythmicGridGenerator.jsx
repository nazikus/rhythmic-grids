/**
 * Rhythmic Grid Generator
 *  
 * Algorithm generating guides for rhythmic grids based on user input.
 * 
 * @version 1.1
 * @date 2015-11-12
 * @author Nazariy Hrabovskyy nazariy.hrabovskyy@gmail.com
 *
 * Repository & manuals:
 * https://github.com/nazikus/rhythmic-grids/
 * 
 */

// Current .jsx source and RhythmicGridGenerator.js must both be placed in following directory:
// <app dir>\Adobe\Adobe Photoshop <version>\Presets\Scripts\
#include "RhythmicGridGenerator.js"
// #include "json3.js"

//~ #target photoshop
#target estoolkit
var win, windowResource;
 
windowResource = "palette {  \
    orientation: 'column', \
    alignChildren: ['fill', 'top'],  \
    preferredSize:[300, 130], \
    text: 'Rhythmic grid generator',  \
    margins:15, \
    \
    sliderPanel: Panel { \
        orientation: 'row', \
        alignChildren: 'right', \
        margins:15, \
        text: ' Grid configuration ', \
        st: StaticText { text: 'Value:' }, \
        sl: Slider { minvalue: 1, maxvalue: 100, value: 30, size:[220,20] }, \
        te: EditText { text: '30', characters: 5, justify: 'left'}, \
        ratioGroup: Group{ \
        }\
    } \
    \
    bottomGroup: Group{ \
        cancelButton: Button { text: 'Cancel', properties:{name:'cancel'}, size: [120,24], alignment:['right', 'center'] }, \
        applyButton: Button { text: 'Generate', properties:{name:'ok'}, size: [120,24], alignment:['right', 'center'] }, \
    }\
}"
 
win = new Window(windowResource);

win.bottomGroup.cancelButton.onClick = function() {
  return win.close();
};
win.bottomGroup.applyButton.onClick = function() {
  return win.close();
};
 
win.show();

var rgg = RhythmicGridGenerator;
var gc  = rgg.generateRhythmicGrid(1200, '3x2', 8, 12, 24);
//~ $.writeln(JSON.stringify(gc, null, '\t') );

var tic = new Date().getTime();
var toc = 0;
var width_arr = [1440];

var ratio_arr = ['16x9', '3x2', '1x1'];
var baseline_arr = [3,4,5,6,7,8,9,10,11,12];
var columns_arr = [5, 6, 9, 12];
var gutter2baselineRatio_arr = [1, 2];

// all possible rhythmic grids (even with 1-rhythm block)
//~ var all_gc = rgg.generateAllRhytmicGrids(
//~     width_arr, ratio_arr, baseline_arr, columns_arr, gutter2baselineRatio_arr);

//~ toc = (new Date().getTime()) - tic;
//~ $.writeln('All grids: ' + Math.round(toc/1000) + 's');
//~ tic = new Date().getTime();

// filter only those rhythmic grids that have more than 1 blocks
//~ var valid_gc = all_gc.filter(
//~     function(g,i){ return g.rhythmicGrid && g.rhythmicGrid.blocks.length > 1; }
//~ );

//~ $.writeln('Grid configurations available:')
//~ $.writeln(' - total: ' + all_gc.length);
//~ $.writeln(' - valid (>1 blocks): ' + valid_gc.reduce( 
//~     function(pv, cv){ return pv + (cv.rhythmicGrid ?1:0); },  0)
//~ );


//~ if ( app.documents.length) 
//~ { 
//~     //var originalUnits = preferences.rulerUnits;
//~     //preferences.rulerUnits  = Units.PIXELS;
//~     
//~     var aDoc = app.activeDocument;
//~     var inputNum = prompt("Enter a grid size NxN: ", 3, "Grid size");

//~     var Vsp = aDoc.width/inputNum;
//~     var Hsp = aDoc.height/inputNum;

//~     for (var i = 1; i <= inputNum-1; i++){ 
//~         aDoc.guides.add( Direction.VERTICAL , Vsp*i );
//~         aDoc.guides.add( Direction.HORIZONTAL , Hsp*i );
//~     }
//~     //preferences.rulerUnits  = originalUnits;
//~     //alert("You have entered "+inputNum + ".\nW = "+aDoc.width+";\nH = " + aDoc.height + ";", "Alert dialog");
//~  
//~ } else { 
//~     alert ("No opened documents to create guides.", "No open documents", true);
//~ }

