/**
 * Rhythmic Grid Generator
 *
 * Algorithm generating all the necessary values, sizes & dimensions for
 * rhythmic grids and for drawing corresponding guides and blocks.
 * 
 * @version 1.0
 * @date 2015-11-12
 * @author Nazariy Hrabovskyy nazariy.hrabovskyy@gmail.com
 *
 * Repository:
 * https://github.com/nazikus/rhythmic-grids/
 * 
 */

/*******************************************************************************
 * README
 * 
 * Current JavaScript code is expected to run under different environments
 * with varying ECMAScript compatability:
 *  - Browsers (V8, SpiderMonkey, JavaScriptCore, Trident, mostly ES5.1)
 *  - Photoshop (ExtendedScript, ES3)
 *  - Sketch (CocoaScript, ES?)
 *
 * Encountered ECMA-compatability issues (s.t., cannot use in Photoshop):
 *   Array.prototype.map()      ECMA-262 5.1 
 *   Array.prototype.reguce()   ECMA-262 5.1
 *   Array.prototype.filter()   ECMA-262 5.1
 *   Array.prototype.forEach()  ECMA-262 5.1
 *   Array.prototype.indexOf()  ECMA-262 5.1
 *   String.prototype.trim()    ECMA-262 5.1
 *   JSON.stringify()           ECMA-262 5.1
 *
 * Project specific notation used in code and comments:
 *  > uBlock  - micro-block, the smallest integer block with height multiple of baseline.
 *  > H, W, R - Height, Width and Ratio (W/H) respectively.
 *  > rhytm   - micro-block factor (multiple) in consideration with gutter width.
 *  > "fit the rhythm" - denotes if grid-width devides by block-width taking
 *                       into consideration gutter width (!).
 *
 * TODO refactor for ES3 compatability.
 * TODO check ES3 compatability: Math.js, clojure namespaces
 * TODO wiki, formula documentation
 * TODO namespace collisions(?)
 *
*******************************************************************************/

/** 
 *  @class Grid configuration. Contains all the necessary info for drawing grids.
 *  @typedef GridConfObj
 *  @type {object}
 *  @prop {number} maxCanvasWidth  - max canvas width, px (user input)
 *  @prop {{RatioObj}} ratio  - aspect ratio (user input)
 *  @prop {number} baseline   - baseline height, px (user input)
 *  @prop {number} columnsNum - number (quantity) of columns (user input)
 *  @prop {{W: number, H: number}} gutter - gutter width and height (user input)
 *  @prop {GridObj} rhythmicGrid  - generated rhythmic grid
 */

/** 
 *  @class Grid object containing more detailed information for grid blocks.
 *  @typedef GridObj
 *  @type {object}
 *  @prop {{W: number, H: number}} uBlock -  micro-block size 
 *  @prop {number} W  - grid width needed to fit micro-blocks evenly
 *  @prop {number} H  - grid height needed if all block sizes to be displayed
 *  @prop {number} margin - margin between canvas and grid
 *  @prop {{W: number, H: number}} - canvas dimensions for drawing
 *  @prop {number[]} - 0-element block width, 1-el. block height,
 *      2-el. block rhythm (micro-block multiplier considering gutter width)
 *  @see https://github.com/nazikus/rhythmic-grids/wiki
 */

/** 
 *  @typedef RatioObj
 *  @type {object}
 *  @prop {number} W  - ratio width  in px
 *  @prop {number} H  - ratio height in px
 *  @prop {number} R  - ratio value (W/H)
 *  @prop {string} Str- string representation of ratio
 */

/**
 * @class
 * Rhythmic grid generator class. Nothing special, just two public methods to
 * generate rhythmic grids.
 */
RhythmicGridGenerator = (function () {

    /**
     * Generates rhytmic grid(s) based on a provided configuration.
     * @public
     * @method generateRhythmicGrid
     * @param {number} canvasW  - max canvas width value
     * @param {string} ratio    - string representation of aspect ratio ('3x2')
     * @param {number} baseline - baseline value
     * @param {number} columnsNum-column number value
     * @param {number} gutterR  - gutter-to-baseline ratio value
     * @return {GridConfObj}  - grid configuration object
     */
    this.generateRhythmicGrid = 
    function (canvasW, ratioStr, baseline, columnsNum, gutterW) {

        var ratio = ratioStr2Obj(ratioStr);

        // min possible uBlock size (for current baseline and ratio)
        var min_uBlockH = lcm(baseline, ratio.H);  // least common multiple
        var min_uBlockW = min_uBlockH * ratio.R;

        // max possible uBlcok size
        var max_uBlockW = Math.floor((canvasW+gutterW)/columnsNum - gutterW);
        var max_uBlockH = max_uBlockW / ratio.R;

        // gutter height between rows. Usually you want to keep them equal.
        var gutterH = gutterW;

        // initialize Grid Configuration object
        gc = {};

        gc.maxCanvasWidth = canvasW;
        gc.ratio        = ratio;
        gc.baseline     = baseline;
        gc.columnsNum   = columnsNum;
        gc.gutter       = {W: gutterW, H: gutterH};
        // gc.gutterBaselineRatio = gutterW / baseline;
        
        gc.rhythmicGrid = null;
        gc.grids = [];
        
        /* Unused: min and max POSSIBLE block sizes (not necessarily rhythmic) */
        // gc.uBlock = { minW: min_uBlockW, minH: min_uBlockH, 
        //               maxW: max_uBlockW, maxH: max_uBlockH };

        // First element of 'blockWs' is the largest uBlock fitting the rhythm. 
        // The rest uBlocks are fractions of the largest one and provide the same
        // ratio for the rest of rhythmic blocks (but smaller), hence are redundant.
        
        // Idiom below simulates range generator, e.g.:
        // [uBlockW, uBlock*2, ..., uBlockW*n] until <= max_uBlockW
        var uRangeLen = Math.floor(max_uBlockW / min_uBlockW);
        var blockWs = Array.apply(null, Array(uRangeLen)).map( 
            function(e,i){ return (i+1) * min_uBlockW; }
        ).reverse(); // the largest comes first

        if (blockWs.length == 0)
            return gc;
        
        // iterate through all possible uBlocks within given columns number
        // NB! The first one is probabely what you want - the largest uBlock
        // size and the smallest side-margins (between canvas and grid)
        for (var i = 0; i < blockWs.length; i++)
        {
            var uBlockW = blockWs[i];
            var uBlockH = uBlockW / ratio.R;
            // number of max possible columns for current uBlock (unused).
            // For small  uBlocks MaxColumnsNum is greater then columnsNum.
            var maxColumnsNum = Math.floor( (canvasW+gutterW) / (uBlockW+gutterW) );

            // actual grid width (<= canvasW) for current uBlockW
            var gridW = (uBlockW + gutterW) * columnsNum - gutterW;

            // horizontal (left and right) margins between canvas and grid
            var gridMargin = Math.floor( (canvasW-gridW)/2 );
            
            // number of all possible uBlock factors generating larger blocks 
            // that fit into grid width (considering gutters in between)
            var uFactorsAllNum = Math.floor( (gridW+gutterW) / (uBlockW+gutterW) );

            // uBlock factors (multipliers) for generating largers blocks:
            // [1:uFactorsNum/2, uFactrosNum]   // all, not only rhythmic
            // first half only, no need to traverse blocks wider then gridW/2
            var uFactorsAll = Array.apply(null, Array(uFactorsAllNum)).map( 
                function(e,i){ return i+1; }
            ).slice(0, Math.ceil(uFactorsAllNum/2)).concat(uFactorsAllNum);

            // The most important step!
            // filtering uBlock factors that generate only blocks fitting the rhythm.
            // TODO optimize model without iteration and filtering
            var uFactorsFit = uFactorsAll.filter(function(factor){
                var blockW = (uBlockW+gutterW)*factor - gutterW;
                var blockH = blockW / ratio.R;

                // 1st condition: if blockW is a multiple of gridW (+gutter)
                // 2nd condition: if blockH is a multiple of basline
                return (gridW+gutterW) % (blockW+gutterW) == 0
                             && blockH % baseline == 0;
            });

            // generate block sizes (2xN matrix) that fit the rhythm
            var blocksFit = uFactorsFit.map(function(fr, i){
                var W = (uBlockW+gutterW)*fr - gutterW;
                return [W, W/ratio.R, fr];
            });

            // grid height needed to plot/draw all the RHYTMIC blocks (+gutter)
            var gridH_Fit = blocksFit
                .map(function(block, i){ return block[1] + !!i*gutterH; })
                .reduce(function(pv, cv){ return pv + cv; }, 0);

            // generate all block sizes (2xN matrix) (regrdless fit the rhythm)
            var blocksAll = uFactorsAll.map(function(fr, i){
                var W = (uBlockW+gutterW)*fr - gutterW;
                return [W, W/ratio.R];
            });

            // grid height needed to plot/draw all POSSIBLE blocks (+gutter)
            var gridH_All = blocksAll
                .map(function(block, i){ return block[1] + !!i*gutterH; })
                .reduce(function(pv, cv){ return pv + cv; });

            // initialize grid structure (for gc.grids array)
            var grid = {};
            grid.uBlock = {};
            grid.uBlock.W = uBlockW;
            grid.uBlock.H = uBlockH;
            grid.W = gridW;
            grid.H = gridH_Fit;
            grid.margin = gridMargin;
            grid.canvas = {H: gridH_Fit + 0/*margin*/, W: canvasW};
            grid.blocks   = blocksFit;
            // grid.uFactors = uFactorsFit;

            /* Additional info: all rhythmic blocks including non-optimal (<largest) */
            // grid.allBlocks = {};
            // grid.allBlocks.H = gridH_All;
            // grid.allBlocks.blocks   = blocksAll;
            // grid.allBlocks.uFactors = uFactorsAll;
            
            // grid.maxColumnsNum = maxColumnsNum; // unusued

            gc.grids.push(grid);
        } // loop over blockWs[i]

        gc.rhythmicGrid = gc.grids[0];
        delete gc.grids;
        /* not really need all the grids in output, so deleting it. Might need 
        it in other appliances */

        return gc;
    };

    /** 
     * Generate all possible rhythmic grids based on provided ranges of configurations.
     * @public
     * @method generateAllRhytmicGrids
     * @param {number[]} canvasW_arr  - array of max canvas width values
     * @param {string[]} ratio_arr    - array of strings representation aspect ratio
     * @param {number[]} baseline_arr - array of baseline value
     * @param {number[]} columnsNum_arr-array of column number values
     * @param {number[]} gutterR_arr  - array of gutter-to-baseline ratio values
     * @return {GridConfObj[]} - array of grid configuration objects.
     */
    this.generateAllRhytmicGrids = 
    function (canvasW_arr, ratio_arr, baseline_arr, columnsNum_arr, gutterR_arr){
        var rg = [];
        
        for (var w = 0; w < canvasW_arr.length   ; w++)
        for (var r = 0; r < ratio_arr.length  ; r++)
        for (var b = 0; b < baseline_arr.length  ; b++)
        for (var c = 0; c < columnsNum_arr.length; c++)
        for (var g = 0; g < gutterR_arr.length   ; g++)
            rg.push(this.generateRhythmicGrid(
                canvasW_arr[w],   ratio_arr[r], baseline_arr[b],
                columnsNum_arr[c], gutterR_arr[g]* baseline_arr[b]
            ));

        return rg;
    };
    
    /**
     * Least Common Multiple of two integers
     * @private
     */
    var lcm = function(a,b) {
        return a / gcd(a,b) * b;
    };

    /**
     * Greatest Common Divisor of two integers 
     * @private
     */
    var gcd = function(a,b) {
        if (!b) {
            return a;
        }
        return gcd(b, a % b);
    };

    /**
     * Helper method for converting ratio string to corresponding object.
     * @private
     * @method ratioStr2Obj
     * @param {String} ratioStr - string representing aspect ration (eg, '16x9')
     * @return {RatioObj} A Ratio object
     * @throws an exception if invalid string is provided.
     */
    var ratioStr2Obj = function(ratioStr) {
        // validate ratio string pattern: numXnum ('3x2', '16x9', etc)
        if (!/^\d+x\d+$/i.test(ratioStr)) 
            throw 'Exception: invalid ratio string "' + ratioStr + '".';
        
        var split = ratioStr.toLowerCase().split('x');
        return {
            W: Number(split[0]),
            H: Number(split[1]),
            R: Number(split[0]) / Number(split[1]),
            str: ratioStr.toLowerCase()
        };
    };

    return this;

}).call(this);


// Some helper methods for Array prototype

/**
 * Derives an array with non-repeated values
 */
if (!Array.prototype.unique) {
    Array.prototype.unique = function() {
        return this.reduce(function(p, c) {
            if (p.indexOf(c) < 0) p.push(c);
            return p;
        }, []);
    };
}
