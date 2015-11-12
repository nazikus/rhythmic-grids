var rgg = RhythmicGridGenerator;

QUnit.test("Reference grid test", function (assert) {
    var gc = rgg.generateRhythmicGrid(1200, '3x2', 8, 12, 24);

    assert.strictEqual(gc.rhythmicGrid.W, 1128, 'Grid width '+1128+'px');
    assert.strictEqual(gc.rhythmicGrid.margin, 36, 'Canvas margins 2x'+36+'px');
    assert.deepEqual(gc.rhythmicGrid.blocks[0], [72,48,1], 'Micro-block size [' + [72,48].join('x')+']');
    assert.deepEqual(gc.rhythmicGrid.blocks[1], [168,112,2], '2nd block size [' + [168,112].join('x')+']');
    assert.deepEqual(gc.rhythmicGrid.blocks[2], [264,176,3], '3rd block size [' + [264,176].join('x')+']');
    assert.deepEqual(gc.rhythmicGrid.blocks[3], [360,240,4], '4th block size [' + [360,240].join('x')+']');
});


/**************************************************/
/* GENERATING RANGE OF GRID CONFIGURATION OBJECTS */
/**************************************************/
var width_arr    = [960, 1280, 1440];
var ratio_arr    = ['16x9', '3x2', '1x1'];
var baseline_arr = [3,4,5,6,7,8,9,10,11,12];
var columns_arr  = [5, 6, 9, 12];
var gutter2baselineRatio_arr = [0, 1, 2];

// all possible rhythmic grids (even with 1-rhythm block)
var all_gc = rgg.generateAllRhytmicGrids(
    width_arr, ratio_arr, baseline_arr, columns_arr, gutter2baselineRatio_arr);

// filter only those rhythmic grids that have more than 1 blocks
var valid_gc = all_gc.filter(
    function(g,i){ return g.rhythmicGrid && g.rhythmicGrid.blocks.length > 1; }
);


QUnit.test("Total configuration combinations", function (assert) {
    var totalC = width_arr.length*ratio_arr.length*baseline_arr.length*columns_arr.length*gutter2baselineRatio_arr.length;
    var validC = valid_gc.length;
    var invalidC = all_gc.length-valid_gc.length;

    assert.strictEqual(all_gc.length, totalC, 'Total configuration combinations (possible grids): ' + totalC);
    assert.ok(valid_gc.length, 'Valid configurations: ' + validC + ' ('+Math.round(validC/totalC*100)+'%)');
    assert.ok(valid_gc.length, 'Invalid configurations: ' + invalidC + ' ('+Math.round(invalidC/totalC*100)+'%)');
});


QUnit.test("Integer test", function (assert) {
    var rg = null; // rhythmic grid
    for (var g = 0; g < valid_gc.length; g++)
    {
        rg = valid_gc[g].rhythmicGrid;
        assert.ok(true, '>>>>> Max canvas width ' + valid_gc[g].maxCanvasWidth + 'px, ' +
                        'ratio ' + valid_gc[g].ratio.str + ', ' +
                        'baseline ' + valid_gc[g].baseline + 'px, ' +
                        'columns ' + valid_gc[g].columnsNum + ', ' +
                        'gutter ' + valid_gc[g].gutter.W+ 'px <<<<<');
        assert.ok(rg.W % 1 == 0 && rg.H % 1 == 0, 'Grid dimensions are integer: ' + [rg.W,rg.H].join('x'));

        for (var b = 0; b < rg.blocks.length; b++){
            assert.ok(rg.blocks[b][1] % 1 == 0 && rg.blocks[b][2] % 1 ==0,
                'Block #' + rg.blocks[b][2] + ' dimensions are integer: ' + rg.blocks[b].slice(0,2).join('x'));
        }
    }
});


QUnit.test("Grid width test", function (assert) {
    for (var g = 0; g < valid_gc.length; g++)
    {
        assert.ok(true, '>>>>> Grid width ' + valid_gc[g].rhythmicGrid.W + 'px, ' +
                        'max canvas width ' + valid_gc[g].maxCanvasWidth + 'px, ' +
                        'ratio ' + valid_gc[g].ratio.str + ', ' +
                        'baseline ' + valid_gc[g].baseline + 'px, ' +
                        'columns ' + valid_gc[g].columnsNum + ', ' +
                        'gutter ' + valid_gc[g].gutter.W+ 'px <<<<<');
        assert.ok(valid_gc[g].rhythmicGrid.W <= valid_gc[g].maxCanvasWidth, 'Grid width is less then canvas width');
    }
});


QUnit.test("Columns test", function (assert) {
    var gw = 0, cols = 0;
    for (var g = 0; g < valid_gc.length; g++)
    {
        assert.ok(true, '>>>>> max canvas width ' + valid_gc[g].maxCanvasWidth + 'px, ' +
                        'ratio ' + valid_gc[g].ratio.str + ', ' +
                        'baseline ' + valid_gc[g].baseline + 'px, ' +
                        'columns ' + valid_gc[g].columnsNum + ', ' +
                        'gutter ' + valid_gc[g].gutter.W+ 'px <<<<<');
        gw = valid_gc[g].gutter.W;
        cols = (valid_gc[g].rhythmicGrid.W+gw) / (valid_gc[g].rhythmicGrid.uBlock.W+gw);
        assert.strictEqual(cols, valid_gc[g].columnsNum, 'Actual column quanitity equals to input: ' + cols);
    }
});


QUnit.test("Baseline factor test", function (assert) {
    var rg = null; // rhythmic grid
    for (var g = 0; g < valid_gc.length; g++)
    {
        assert.ok(true, '>>>>> Max canvas width ' + valid_gc[g].maxCanvasWidth + 'px, ' +
                        'ratio ' + valid_gc[g].ratio.str + ', ' +
                        'baseline ' + valid_gc[g].baseline + 'px, ' +
                        'columns ' + valid_gc[g].columnsNum + ', ' +
                        'gutter ' + valid_gc[g].gutter.W+ 'px <<<<<');

        rg = valid_gc[g].rhythmicGrid;
        for (var b = 0; b < rg.blocks.length; b++){
            assert.ok(rg.blocks[b][1] % valid_gc[g].baseline == 0,
                'Block #' + rg.blocks[b][2] + ' [' + rg.blocks[b].slice(0,2).join('x') + '] is a factor of baseline ' + valid_gc[g].baseline + 'px');
        }
    }
});
