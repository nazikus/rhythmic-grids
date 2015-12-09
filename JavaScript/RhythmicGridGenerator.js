/**
 * Rhythmic Grid Generator
 *
 * Algorithm generating all the necessary values, sizes & dimensions for
 * rhythmic grids, intended for drawing corresponding guides and blocks.
 * 
 * @version 1.1
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
 *  - Sketch (CocoaScript, ES5 or whatever WebKit version is running locally)
 *
 * Project specific notation used in code and comments:
 *  > uBlock  - micro-block, the smallest integer block with height multiple of baseline.
 *  > H, W, R - Height, Width and Ratio (W/H) respectively.
 *  > rhytm   - micro-block factor (multiple) in consideration of gutter width.
 *  > "fit the rhythm" - denotes if grid-width is divisible by block-width taking
 *                       into consideration the gutter width (!).
 *
 * TODO wiki, formula documentation
 *
*******************************************************************************/

/** 
 *  @class Grid configuration. Contains all the necessary info for drawing grids.
 *  @typedef GridConfObj
 *  @type {object}
 *  @prop {number} maxCanvasWidth  - max canvas width, px (user input)
 *  @prop {{RatioObj}} ratio       - aspect ratio (user input)
 *  @prop {number} baseline        - baseline height, px (user input)
 *  @prop {number} columnsNum      - number (quantity) of columns (user input)
 *  @prop {{W: number, H: number}} gutter - gutter width and height (user input)
 *  @prop {GridObj} rhythmicGrid   - generated rhythmic grid
 */

/** 
 *  @class Grid object containing more detailed information of grid blocks.
 *         Usually is a part of grid configuration object.
 *  @typedef GridObj
 *  @type {object}
 *  @prop {{W: number, H: number}} uBlock -  micro-block size 
 *  @prop {number} W  - grid width needed to fit micro-blocks evenly
 *  @prop {number} H  - grid height needed if all block sizes to be displayed
 *  @prop {number} margin - margin between canvas and grid
 *  @prop {{W: number, H: number}} - canvas dimensions for drawing
 *  @prop {number[][]} - 2D array of all rhythmic block sizes. Each sub-array
 *                      contains an array of size 4 with the following values:
 *                      [0] - block width;
 *                      [1] - block height;
 *                      [2] - number of blocks to fit the grid horizontally.
 *                      [3] - block rhythm (think of it as micro-block multiple 
 *                            considerring gutter width)
 *  @see https://github.com/nazikus/rhythmic-grids/wiki
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
     * @param {number} canvasW  - number of columns
     * @param {number} gutterR  - gutter-to-baseline ratio
     * @return {GridConfObj}    - grid configuration object
     */
    this.generateRhythmicGrid = 
    function (canvasW, ratioStr, baseline, columnsNum, gutterR) {
        var gutterW = baseline*gutterR;
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
        // The rest uBlocks are generated as fractions of the largest 
        // micro-block and provide the same ratio for the rest of rhythmic 
        // blocks (but smaller), hence are redundant.
        
        // Idiom below simulates range generator, e.g.:
        // [uBlockW, uBlock*2, ..., uBlockW*n] until <= max_uBlockW
        var uRangeLen = Math.floor(max_uBlockW / min_uBlockW);
        var blockWs = Array.apply(null, Array(uRangeLen)).map( 
            function(e,i){ return (i+1) * min_uBlockW; }
        ).reverse(); // so the largest comes first

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

            /* Additional info: all rhythmic blocks including non-optimal (less then largest) */
            // grid.allBlocks = {};
            // grid.allBlocks.H = gridH_All;
            // grid.allBlocks.blocks   = blocksAll;
            // grid.allBlocks.uFactors = uFactorsAll;
            
            // grid.maxColumnsNum = maxColumnsNum; // unusued

            gc.grids.push(grid);
        } // loop over blockWs[i]

        gc.rhythmicGrid = gc.grids[0];

        /* no real  need in all the grids in output, so deleting it. Might need 
        it in other appliances in future */
        delete gc.grids;

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
        var gc_arr = [];
        var gc = null;
        
        for (var w = 0; w < canvasW_arr.length   ; w++)
        for (var r = 0; r < ratio_arr.length     ; r++)
        for (var b = 0; b < baseline_arr.length  ; b++)
        for (var c = 0; c < columnsNum_arr.length; c++)
        for (var g = 0; g < gutterR_arr.length   ; g++)
        {
            gc = this.generateRhythmicGrid(canvasW_arr[w], ratio_arr[r], 
                        baseline_arr[b], columnsNum_arr[c], gutterR_arr[g]);
            if (this.isValidGrid(gc.rhythmicGrid)){
                gc_arr.push(gc);                
            }
        }
        return gc_arr;
    };
    
    /**
     * Validates grid according to specified criteria.
     * @public
     * @method isValidGrid
     * @param {GridObj} grid - grid to validate
     * @return {boolean}     - valid/invalid boolean
     */
    this.isValidGrid = function(grid){
        // by default it is the always-true-valitdator, so user is required to
        // epxlicitly define his own validator. True-validator will return all 
        // possible rhythmic grids (valid and invalid, whatever that means).
        return true;

        // possible validator: rhytmic grid that has at least two blocks (rows).
        // return grid && grid.blocks.length > 1;
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
     * Helper method for converting ratio string to corresponding ratio object.
     * @private
     * @method ratioStr2Obj
     * @param {String} ratioStr - string representing aspect ratio (eg, '16x9')
     * @return {RatioObj} A Ratio object
     * @throws an exception if invalid string is provided.
     *
     * @typedef RatioObj
     * @type {object}
     * @prop {number} W  - ratio width, int
     * @prop {number} H  - ratio height, int
     * @prop {number} R  - ratio value (W/H), real
     * @prop {string} Str- string representation of ratio, e.g. '3x2'
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
            str: ratioStr.toLowerCase(),
            toString: function() { return this.str; }
        };
    };

    return this;

}).call(this);





/*********************************************************************
 * ES3 COMPATIBILITY ISSUES
 *
 * Encountered ECMA-compatability issues (s.t., cannot use in Photoshop ES3):
 *   Array.prototype.filter()   ECMA-262 5.1
 *   Array.prototype.map()      ECMA-262 5.1 
 *   Array.prototype.reduce()   ECMA-262 5.1
 *   Array.prototype.indexOf()  ECMA-262 5.1
 *   Array.prototype.forEach()  ECMA-262 5.1
 *   String.prototype.trim()    ECMA-262 5.1
 *   JSON.stringify()           ECMA-262 5.1
 *
 * Below are Array.prototype helper methods for ES3 compatability
 *
/*********************************************************************/


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


// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter#Polyfill
if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisArg*/ ) {
        'use strict';

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];

                if (fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
            }
        }

        return res;
    };
}


// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map#Polyfill
if (!Array.prototype.map)
{
    Array.prototype.map = function (callback, thisArg)
    {
        var T, A, k;
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }

        var O = Object(this);
        var len = O.length >>> 0;

        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        if (arguments.length > 1) {
            T = thisArg;
        }
        A = new Array(len);
        k = 0;
        while (k < len)
        {
            var kValue,
            mappedValue;
            if (k in O)
            {
                kValue = O[k];
                mappedValue = callback.call(T, kValue, k, O);
                A[k] = mappedValue;
            }
            k++;
        }

        return A;
    };
}


// Production steps of ECMA-262, Edition 5, 15.4.4.21
// Reference: http://es5.github.io/#x15.4.4.21
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#Polyfill
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(callback /*, initialValue*/ ) {
        'use strict';
        if (this == null) {
            throw new TypeError('Array.prototype.reduce called on null or undefined');
        }
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        var t = Object(this),
            len = t.length >>> 0,
            k = 0,
            value;

        if (arguments.length == 2) {
            value = arguments[1];
        } else {
            while (k < len && !(k in t)) {
                k++;
            }
            if (k >= len) {
                throw new TypeError('Reduce of empty array with no initial value');
            }
            value = t[k++];
        }
        for (; k < len; k++) {
            if (k in t) {
                value = callback(value, t[k], k, t);
            }
        }
        return value;
    };
}


// Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
// Source: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#Polyfill
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {

        var k;
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        var O = Object(this);
        var len = O.length >>> 0;
        if (len === 0) {
            return -1;
        }

        var n = +fromIndex || 0;
        if (Math.abs(n) === Infinity) {
            n = 0;
        }
        if (n >= len) {
            return -1;
        }

        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            if (k in O && O[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}