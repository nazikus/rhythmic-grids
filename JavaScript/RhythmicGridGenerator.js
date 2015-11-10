/*******************************************************************************
 * README
 *
 * Current JavaScript module is expected to run under different environments
 * with varying ECMAScript compatability:
 *  - Browsers (V8, SpiderMonkey, JavaScriptCore, Trident, mostly ES5.1)
 *  - Photoshop (ExtendedScript, ES3)
 *  - Sketch (CocoaScript, ES?)
 *
 * Encountered ECMA-compatability issues (e.g., cannot use in Photoshop):
 *   Array.prototype.map()      ECMA-262 5.1 
 *   Array.prototype.filter()   ECMA-262 5.1
 *   Array.prototype.forEAch()  ECMA-262 5.1
 *   Array.prototype.indexOf()  ECMA-262 5.1
 *   String.prototype.trim()    ECMA-262 5.1
 *   JSON.stringify()           ECMA-262 5.1
 *
 * Project specific notation used in code and comments:
 *  > uBlock  - micro-block, the smallest integer block multiple of baseline.
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
 * Rhythmic grid generator class. Nothing special, just two public methods:
 *    gerateRhytmicGrid(...)     - generates rhytmic grid(s) based on a 
 *                                 provided configuration.
 *    gerateAllRhytmicGrids(...) - generates all possible rhytmic grids based 
 *                                 on privded ranges of configurations.
 */
RhythmicGridGenerator = (function () {

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
        
        /* Optional: min and max POSSIBLE block sizes (not necessarily rhythmic) *
        gc.uBlock = {};
        gc.uBlock.min_W = min_uBlockW;
        gc.uBlock.min_H = min_uBlockH;
        gc.uBlock.max_W = max_uBlockW;
        gc.uBlock.max_H = max_uBlockH;
        /**/

        // First element of 'blockWs' is the largest uBlock fitting the rhythm. 
        // The rest uBlocks are fractions of largest one and provide the same
        // ratio for the rest of the blocks, hence are redundant.
        // Idiom below simulates range generator, e.g.:
        // [uBlockW, uBlock*2, ..., uBlockW*n] until <= max_uBlockW
        var uRangeLen = Math.floor(max_uBlockW / min_uBlockW);
        var blockWs = Array.apply(null, Array(uRangeLen)).map( 
            function(e,i){ return (i+1) * min_uBlockW; }
        ).reverse(); // largest first

        if (blockWs.Length == 0)
            return gf;

        // iterate through all possible uBlocks withing given columns number
        // NB! The first one is probabely what you want - the largest uBlock
        // size and the smallest side-margins (between canvas and grid)
        // blockWs.forEach( function(bw){
        for (var i = 0; i < blockWs.length; i++)
        {
            var uBlockW = blockWs[i];
            var uBlockH = uBlockW / ratio.R;
            // number of max possible columns for current uBlock (unused).
            // For small  uBlocks MaxColumnsNum is greater then columnsNum.
            var maxColumnsNum = Math.floor( (canvasW+gutterW) / (uBlockW+gutterW) );
            
            // number of all possible uBlock factors generating larger blocks 
            // that fit into canvas width (considering gutters in between)
            var uFactorsAllNum = Math.floor( (canvasW+gutterW) / (uBlockW+gutterW) );

            // uBlock factors (multipliers) for generating largers blocks:
            // [1:uFactorsNum/2, uFactrosNum]   // all, not only rhythmic
            // first half only, no need to traverse blocks wider then canvasW/2
            var uFactorsAll = Array.apply(null, Array(uFactorsAllNum)).map( 
                function(e,i){ return i+1; }
            ).slice(0, Math.ceil(uFactorsAllNum/2)).concat(uFactorsAllNum-1);

            // actual grid width (<= canvasW) for current uBlockW
            var gridW = (uBlockW + gutterW) * columnsNum - gutterW;

            // horizontal (left and right) margins between canvas and grid
            var gridMargin = Math.floor( (canvasW-gridW)/2 );

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
        /* not really need all grids in output, so nulling it */
        delete gc.grids;

        return gc;
    };

    
    /**
     * Least Common Multiple
     */
    var lcm = function(a,b) {
        return a / gcd(a,b) * b;
    };

    /**
     * Greatest Common Divisor
     */
    var gcd = function(a,b) {
        if (!b) {
            return a;
        }
        return gcd(b, a % b);
    };

    /**
     * Helper method for converting ratio string to corresponding object.
     * (eg, '3x2' => {W: 3, H: 2, R: 1.5} )
     */
    var ratioStr2Obj = function(ratioStr) {
        // validate ratio string pattern: numXnum ('3x2', '16x9', etc)
        if (!/^\d+x\d+$/i.test(ratioStr)) 
            throw 'Exception: invalid ratio string "' + ratioStr + '".';
        
        var split = ratioStr.toLowerCase().split('x');
        return {
            W: Number(split[0]),
            H: Number(split[1]),
            R: Number(split[0]) / Number(split[1])
        };
    };

    return this;

}).call(this);

