



RhythmicGridGenerator = (function () {

    this.generateRhythmicGrid = 
    function (canvasW, ratioStr, baseline, columnsNum, gutterR) {
        if (typeof canvasW  !== 'number') throw 'Wrong 1st argument (width), must be a number';
        if (typeof ratioStr !== 'string') throw 'Wrong 2nd argument (ratio), must be a string';
        if (typeof baseline !== 'number') throw 'Wrong 3rd argument (baseline), must be a number';
        if (typeof columnsNum !== 'number') throw 'Wrong 4th argument (columns), must be a number';
        if (typeof gutterR  !== 'number') throw 'Wrong 5th argument (gutter), must be a number';

        var gutterW = baseline*gutterR;
        var ratio = ratioStr2Obj(ratioStr);

        var min_uBlockH = lcm(baseline, ratio.H);  
        var min_uBlockW = min_uBlockH * ratio.R;

        var max_uBlockW = Math.floor((canvasW+gutterW)/columnsNum - gutterW);
        var max_uBlockH = max_uBlockW / ratio.R;

        var gutterH = gutterW;

        gc = {};

        gc.maxCanvasWidth = canvasW;
        gc.ratio = ratio; 
        gc.baseline = baseline;
        gc.columnsNum = columnsNum;
        gc.gutter = {W: gutterW, H: gutterH};
        gc.gutterBaselineFactor = gutterW / baseline;

                gc.rhythmicGrid = null;
        gc.grids = [];



        var uRangeLen = Math.floor(max_uBlockW / min_uBlockW);
        var blockWs = Array.apply(null, Array(uRangeLen)).map( 
            function(e,i){ return (i+1) * min_uBlockW; }
        ).reverse(); 

        if (blockWs.length == 0)
            return gc;

        for (var i = 0; i < blockWs.length; i++)
        {
            var uBlockW = blockWs[i];
            var uBlockH = uBlockW / ratio.R;
            var maxColumnsNum = Math.floor( (canvasW+gutterW) / (uBlockW+gutterW) );

            var gridW = (uBlockW + gutterW) * columnsNum - gutterW;

            var gridMargin = Math.floor( (canvasW-gridW)/2 );

            var uFactorsAllNum = Math.floor( (gridW+gutterW) / (uBlockW+gutterW) );

            var uFactorsAll = Array.apply(null, Array(uFactorsAllNum)).map( 
                function(e,i){ return i+1; }
            ).slice(0, Math.ceil(uFactorsAllNum/2)).concat(uFactorsAllNum);

            var uFactorsFit = uFactorsAll.filter(function(factor){
                var blockW = (uBlockW+gutterW)*factor - gutterW;
                var blockH = blockW / ratio.R;

                return (gridW+gutterW) % (blockW+gutterW) == 0
                             && blockH % baseline == 0;
            });

            var blocksFit = uFactorsFit.map(function(fr, i){
                var W = (uBlockW+gutterW)*fr - gutterW;
                return [W, W/ratio.R, (gridW+gutterW)/(W+gutterW), fr];
            });

            var gridH_Fit = blocksFit
                .map(function(block, i){ return block[1] + !!i*gutterH; })
                .reduce(function(pv, cv){ return pv + cv; }, 0);

            var blocksAll = uFactorsAll.map(function(fr, i){
                var W = (uBlockW+gutterW)*fr - gutterW;
                return [W, W/ratio.R];
            });

            var gridH_All = blocksAll
                .map(function(block, i){ return block[1] + !!i*gutterH; })
                .reduce(function(pv, cv){ return pv + cv; });

            var grid = {};
            grid.uBlock = {};
            grid.uBlock.W = uBlockW;
            grid.uBlock.H = uBlockH;
            grid.W = gridW;
            grid.H = gridH_Fit;
            grid.margin = gridMargin;
            grid.canvas = {H: gridH_Fit + 0, W: canvasW};
            grid.blocks = blocksFit;



            gc.grids.push(grid);
        } 

        gc.rhythmicGrid = gc.grids[0];

        delete gc.grids;

        return gc;
    };

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


    this.selectGrid = 
    function(gridConfigsArr, gridInputArr){
        if (gridInputArr.length !== 5) throw ('Wrong number of gridInputArr args: ' + gridInputArr.length);
        if (typeof gridInputArr[0] !== 'number') throw ('Wrong value for width: ' + gridInputArr[0]);
        if (typeof gridInputArr[1] !== 'string') throw ('Wrong value for ratio: ' + gridInputArr[1]);
        if (typeof gridInputArr[2] !== 'number') throw ('Wrong value for baseline: '+ gridInputArr[2]);
        if (typeof gridInputArr[3] !== 'number') throw ('Wrong value for columns: ' + gridInputArr[3]);
        if (typeof gridInputArr[4] !== 'number') throw ('Wrong value for gutter: '  + gridInputArr[4]);

        return gridConfigsArr.filter( function(g){
            return g.maxCanvasWidth === gridInputArr[0] &&
                   g.ratio.str  === gridInputArr[1] &&
                   g.baseline   === gridInputArr[2] &&
                   g.columnsNum === gridInputArr[3] &&
                   g.gutter.W   === gridInputArr[4]*g.baseline;
        })[0];
    }

    this.getValidConfigValues = function(gridConfigsArr, filterArr){
        var filteredGC = gridConfigsArr;
        var props = ['maxCanvasWidth', 'ratio', 'baseline', 'columnsNum', 'gutter'];

        if (props.length !== filterArr.length) 
            throw 'Exception: something wrong with filterArr ['+filterArr.join(', ')+']';

        var opts = [];
        for (var i=0; i<props.length-1; i++) { 
            var key = props[i];
            var val = filterArr[i];
            var validValues = null, allValues;

            filteredGC = filteredGC.filter( 
                function(g){ return g[key] == val; 
            });

            nextKey = props[i+1];

            validValues = filteredGC.map( function(g) { 
                return nextKey === 'ratio'  ? g.ratio.toString() : 
                       nextKey === 'gutter' ? g.gutter.W/g.baseline : 
                       g[nextKey] ;
            }).unique();

            allValues = gridConfigsArr.map( function(g) { 
                return nextKey === 'ratio'  ? g.ratio.toString() : 
                       nextKey === 'gutter' ? g.gutter.W/g.baseline : 
                       g[nextKey] ;
            }).unique()
              .sort(function(a,b){ return parseInt(a) > parseInt(b) ? 1 : -1; });


            opts.push( allValues.map( function(value) {
                return [value, validValues.indexOf(value) >= 0];
            }));
        }

        var allWidths = gridConfigsArr
                        .map( function(g){ return g['maxCanvasWidth']; })
                        .unique()
                        .map( function(w){ return [w, true] });
        opts = [allWidths].concat(opts);

        return opts;
    }

    this.isValidGrid = function(grid){


        return grid &&  
               grid.blocks.length > 2 && 
               grid.blocks[1][0] < grid.W; 
    };



    var lcm = function(a,b) {
        return a / gcd(a,b) * b;
    };

    var gcd = function(a,b) {
        if (!b) {
            return a;
        }
        return gcd(b, a % b);
    };


    var ratioStr2Obj = function(ratioStr) {
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







if (!Array.prototype.unique) {
    Array.prototype.unique = function() {
        return this.reduce(function(p, c) {
            if (p.indexOf(c) < 0) p.push(c);
            return p;
        }, []);
    };
}


if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun  ) {
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


if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(callback  ) {
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

!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=a.document,e=c.slice,f=c.concat,g=c.push,h=c.indexOf,i={},j=i.toString,k=i.hasOwnProperty,l={},m="2.2.2",n=function(a,b){return new n.fn.init(a,b)},o=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};n.fn=n.prototype={jquery:m,constructor:n,selector:"",length:0,toArray:function(){return e.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:e.call(this)},pushStack:function(a){var b=n.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a){return n.each(this,a)},map:function(a){return this.pushStack(n.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(e.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor()},push:g,sort:c.sort,splice:c.splice},n.extend=n.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||n.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(n.isPlainObject(d)||(e=n.isArray(d)))?(e?(e=!1,f=c&&n.isArray(c)?c:[]):f=c&&n.isPlainObject(c)?c:{},g[b]=n.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},n.extend({expando:"jQuery"+(m+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===n.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){var b=a&&a.toString();return!n.isArray(a)&&b-parseFloat(b)+1>=0},isPlainObject:function(a){var b;if("object"!==n.type(a)||a.nodeType||n.isWindow(a))return!1;if(a.constructor&&!k.call(a,"constructor")&&!k.call(a.constructor.prototype||{},"isPrototypeOf"))return!1;for(b in a);return void 0===b||k.call(a,b)},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?i[j.call(a)]||"object":typeof a},globalEval:function(a){var b,c=eval;a=n.trim(a),a&&(1===a.indexOf("use strict")?(b=d.createElement("script"),b.text=a,d.head.appendChild(b).parentNode.removeChild(b)):c(a))},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b){var c,d=0;if(s(a)){for(c=a.length;c>d;d++)if(b.call(a[d],d,a[d])===!1)break}else for(d in a)if(b.call(a[d],d,a[d])===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(o,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?n.merge(c,"string"==typeof a?[a]:a):g.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:h.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;c>d;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,e,g=0,h=[];if(s(a))for(d=a.length;d>g;g++)e=b(a[g],g,c),null!=e&&h.push(e);else for(g in a)e=b(a[g],g,c),null!=e&&h.push(e);return f.apply([],h)},guid:1,proxy:function(a,b){var c,d,f;return"string"==typeof b&&(c=a[b],b=a,a=c),n.isFunction(a)?(d=e.call(arguments,2),f=function(){return a.apply(b||this,d.concat(e.call(arguments)))},f.guid=a.guid=a.guid||n.guid++,f):void 0},now:Date.now,support:l}),"function"==typeof Symbol&&(n.fn[Symbol.iterator]=c[Symbol.iterator]),n.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(a,b){i["[object "+b+"]"]=b.toLowerCase()});function s(a){var b=!!a&&"length"in a&&a.length,c=n.type(a);return"function"===c||n.isWindow(a)?!1:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ga(),z=ga(),A=ga(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+M+"))|)"+L+"*\\]",O=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+N+")*)|.*)\\)|)",P=new RegExp(L+"+","g"),Q=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),R=new RegExp("^"+L+"*,"+L+"*"),S=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),T=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),U=new RegExp(O),V=new RegExp("^"+M+"$"),W={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M+"|[*])"),ATTR:new RegExp("^"+N),PSEUDO:new RegExp("^"+O),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},X=/^(?:input|select|textarea|button)$/i,Y=/^h\d$/i,Z=/^[^{]+\{\s*\[native \w/,$=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,_=/[+~]/,aa=/'|\\/g,ba=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),ca=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},da=function(){m()};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType}catch(ea){H={apply:E.length?function(a,b){G.apply(a,I.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function fa(a,b,d,e){var f,h,j,k,l,o,r,s,w=b&&b.ownerDocument,x=b?b.nodeType:9;if(d=d||[],"string"!=typeof a||!a||1!==x&&9!==x&&11!==x)return d;if(!e&&((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,p)){if(11!==x&&(o=$.exec(a)))if(f=o[1]){if(9===x){if(!(j=b.getElementById(f)))return d;if(j.id===f)return d.push(j),d}else if(w&&(j=w.getElementById(f))&&t(b,j)&&j.id===f)return d.push(j),d}else{if(o[2])return H.apply(d,b.getElementsByTagName(a)),d;if((f=o[3])&&c.getElementsByClassName&&b.getElementsByClassName)return H.apply(d,b.getElementsByClassName(f)),d}if(c.qsa&&!A[a+" "]&&(!q||!q.test(a))){if(1!==x)w=b,s=a;else if("object"!==b.nodeName.toLowerCase()){(k=b.getAttribute("id"))?k=k.replace(aa,"\\$&"):b.setAttribute("id",k=u),r=g(a),h=r.length,l=V.test(k)?"#"+k:"[id='"+k+"']";while(h--)r[h]=l+" "+qa(r[h]);s=r.join(","),w=_.test(a)&&oa(b.parentNode)||b}if(s)try{return H.apply(d,w.querySelectorAll(s)),d}catch(y){}finally{k===u&&b.removeAttribute("id")}}}return i(a.replace(Q,"$1"),b,d,e)}function ga(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ha(a){return a[u]=!0,a}function ia(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ja(a,b){var c=a.split("|"),e=c.length;while(e--)d.attrHandle[c[e]]=b}function ka(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function la(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function na(a){return ha(function(b){return b=+b,ha(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function oa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=fa.support={},f=fa.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=fa.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=n.documentElement,p=!f(n),(e=n.defaultView)&&e.top!==e&&(e.addEventListener?e.addEventListener("unload",da,!1):e.attachEvent&&e.attachEvent("onunload",da)),c.attributes=ia(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ia(function(a){return a.appendChild(n.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Z.test(n.getElementsByClassName),c.getById=ia(function(a){return o.appendChild(a).id=u,!n.getElementsByName||!n.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return"undefined"!=typeof b.getElementsByClassName&&p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=Z.test(n.querySelectorAll))&&(ia(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\r\\' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ia(function(a){var b=n.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=Z.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ia(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",O)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=Z.test(o.compareDocumentPosition),t=b||Z.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===n||a.ownerDocument===v&&t(v,a)?-1:b===n||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,g=[a],h=[b];if(!e||!f)return a===n?-1:b===n?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return ka(a,b);c=a;while(c=c.parentNode)g.unshift(c);c=b;while(c=c.parentNode)h.unshift(c);while(g[d]===h[d])d++;return d?ka(g[d],h[d]):g[d]===v?-1:h[d]===v?1:0},n):n},fa.matches=function(a,b){return fa(a,null,null,b)},fa.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(T,"='$1']"),c.matchesSelector&&p&&!A[b+" "]&&(!r||!r.test(b))&&(!q||!q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return fa(b,n,null,[a]).length>0},fa.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},fa.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},fa.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},fa.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=fa.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=fa.selectors={cacheLength:50,createPseudo:ha,match:W,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ba,ca),a[3]=(a[3]||a[4]||a[5]||"").replace(ba,ca),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||fa.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&fa.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return W.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&U.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ba,ca).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=fa.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(P," ")+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h,t=!1;if(q){if(f){while(p){m=b;while(m=m[p])if(h?m.nodeName.toLowerCase()===r:1===m.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){m=q,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n&&j[2],m=n&&q.childNodes[n];while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if(1===m.nodeType&&++t&&m===b){k[a]=[w,n,t];break}}else if(s&&(m=b,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n),t===!1)while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if((h?m.nodeName.toLowerCase()===r:1===m.nodeType)&&++t&&(s&&(l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),k[a]=[w,t]),m===b))break;return t-=e,t===d||t%d===0&&t/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||fa.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ha(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ha(function(a){var b=[],c=[],d=h(a.replace(Q,"$1"));return d[u]?ha(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ha(function(a){return function(b){return fa(a,b).length>0}}),contains:ha(function(a){return a=a.replace(ba,ca),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ha(function(a){return V.test(a||"")||fa.error("unsupported lang: "+a),a=a.replace(ba,ca).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Y.test(a.nodeName)},input:function(a){return X.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:na(function(){return[0]}),last:na(function(a,b){return[b-1]}),eq:na(function(a,b,c){return[0>c?c+b:c]}),even:na(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:na(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:na(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:na(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=la(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=ma(b);function pa(){}pa.prototype=d.filters=d.pseudos,d.setFilters=new pa,g=fa.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){c&&!(e=R.exec(h))||(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=S.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(Q," ")}),h=h.slice(c.length));for(g in d.filter)!(e=W[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?fa.error(a):z(a,i).slice(0)};function qa(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function ra(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j,k=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(j=b[u]||(b[u]={}),i=j[b.uniqueID]||(j[b.uniqueID]={}),(h=i[d])&&h[0]===w&&h[1]===f)return k[2]=h[2];if(i[d]=k,k[2]=a(b,c,g))return!0}}}function sa(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function ta(a,b,c){for(var d=0,e=b.length;e>d;d++)fa(a,b[d],c);return c}function ua(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(c&&!c(f,d,e)||(g.push(f),j&&b.push(h)));return g}function va(a,b,c,d,e,f){return d&&!d[u]&&(d=va(d)),e&&!e[u]&&(e=va(e,f)),ha(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ta(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:ua(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=ua(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=ua(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r)})}function wa(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=ra(function(a){return a===b},h,!0),l=ra(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];f>i;i++)if(c=d.relative[a[i].type])m=[ra(sa(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return va(i>1&&sa(m),i>1&&qa(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(Q,"$1"),c,e>i&&wa(a.slice(i,e)),f>e&&wa(a=a.slice(e)),f>e&&qa(a))}m.push(c)}return sa(m)}function xa(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,o,q,r=0,s="0",t=f&&[],u=[],v=j,x=f||e&&d.find.TAG("*",k),y=w+=null==v?1:Math.random()||.1,z=x.length;for(k&&(j=g===n||g||k);s!==z&&null!=(l=x[s]);s++){if(e&&l){o=0,g||l.ownerDocument===n||(m(l),h=!p);while(q=a[o++])if(q(l,g||n,h)){i.push(l);break}k&&(w=y)}c&&((l=!q&&l)&&r--,f&&t.push(l))}if(r+=s,c&&s!==r){o=0;while(q=b[o++])q(t,u,g,h);if(f){if(r>0)while(s--)t[s]||u[s]||(u[s]=F.call(i));u=ua(u)}H.apply(i,u),k&&!f&&u.length>0&&r+b.length>1&&fa.uniqueSort(i)}return k&&(w=y,j=v),t};return c?ha(f):f}return h=fa.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=wa(b[c]),f[u]?d.push(f):e.push(f);f=A(a,xa(e,d)),f.selector=a}return f},i=fa.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(ba,ca),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=W.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(ba,ca),_.test(j[0].type)&&oa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&qa(j),!a)return H.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,!b||_.test(a)&&oa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ia(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ia(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ja("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ia(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ja("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ia(function(a){return null==a.getAttribute("disabled")})||ja(K,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),fa}(a);n.find=t,n.expr=t.selectors,n.expr[":"]=n.expr.pseudos,n.uniqueSort=n.unique=t.uniqueSort,n.text=t.getText,n.isXMLDoc=t.isXML,n.contains=t.contains;var u=function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&n(a).is(c))break;d.push(a)}return d},v=function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c},w=n.expr.match.needsContext,x=/^<([\w-]+)\s*\/?>(?:<\/\1>|)$/,y=/^.[^:#\[\.,]*$/;function z(a,b,c){if(n.isFunction(b))return n.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return n.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(y.test(b))return n.filter(b,a,c);b=n.filter(b,a)}return n.grep(a,function(a){return h.call(b,a)>-1!==c})}n.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?n.find.matchesSelector(d,a)?[d]:[]:n.find.matches(a,n.grep(b,function(a){return 1===a.nodeType}))},n.fn.extend({find:function(a){var b,c=this.length,d=[],e=this;if("string"!=typeof a)return this.pushStack(n(a).filter(function(){for(b=0;c>b;b++)if(n.contains(e[b],this))return!0}));for(b=0;c>b;b++)n.find(a,e[b],d);return d=this.pushStack(c>1?n.unique(d):d),d.selector=this.selector?this.selector+" "+a:a,d},filter:function(a){return this.pushStack(z(this,a||[],!1))},not:function(a){return this.pushStack(z(this,a||[],!0))},is:function(a){return!!z(this,"string"==typeof a&&w.test(a)?n(a):a||[],!1).length}});var A,B=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=n.fn.init=function(a,b,c){var e,f;if(!a)return this;if(c=c||A,"string"==typeof a){if(e="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:B.exec(a),!e||!e[1]&&b)return!b||b.jquery?(b||c).find(a):this.constructor(b).find(a);if(e[1]){if(b=b instanceof n?b[0]:b,n.merge(this,n.parseHTML(e[1],b&&b.nodeType?b.ownerDocument||b:d,!0)),x.test(e[1])&&n.isPlainObject(b))for(e in b)n.isFunction(this[e])?this[e](b[e]):this.attr(e,b[e]);return this}return f=d.getElementById(e[2]),f&&f.parentNode&&(this.length=1,this[0]=f),this.context=d,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):n.isFunction(a)?void 0!==c.ready?c.ready(a):a(n):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),n.makeArray(a,this))};C.prototype=n.fn,A=n(d);var D=/^(?:parents|prev(?:Until|All))/,E={children:!0,contents:!0,next:!0,prev:!0};n.fn.extend({has:function(a){var b=n(a,this),c=b.length;return this.filter(function(){for(var a=0;c>a;a++)if(n.contains(this,b[a]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=w.test(a)||"string"!=typeof a?n(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&n.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?n.uniqueSort(f):f)},index:function(a){return a?"string"==typeof a?h.call(n(a),this[0]):h.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(n.uniqueSort(n.merge(this.get(),n(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function F(a,b){while((a=a[b])&&1!==a.nodeType);return a}n.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return u(a,"parentNode")},parentsUntil:function(a,b,c){return u(a,"parentNode",c)},next:function(a){return F(a,"nextSibling")},prev:function(a){return F(a,"previousSibling")},nextAll:function(a){return u(a,"nextSibling")},prevAll:function(a){return u(a,"previousSibling")},nextUntil:function(a,b,c){return u(a,"nextSibling",c)},prevUntil:function(a,b,c){return u(a,"previousSibling",c)},siblings:function(a){return v((a.parentNode||{}).firstChild,a)},children:function(a){return v(a.firstChild)},contents:function(a){return a.contentDocument||n.merge([],a.childNodes)}},function(a,b){n.fn[a]=function(c,d){var e=n.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=n.filter(d,e)),this.length>1&&(E[a]||n.uniqueSort(e),D.test(a)&&e.reverse()),this.pushStack(e)}});var G=/\S+/g;function H(a){var b={};return n.each(a.match(G)||[],function(a,c){b[c]=!0}),b}n.Callbacks=function(a){a="string"==typeof a?H(a):n.extend({},a);var b,c,d,e,f=[],g=[],h=-1,i=function(){for(e=a.once,d=b=!0;g.length;h=-1){c=g.shift();while(++h<f.length)f[h].apply(c[0],c[1])===!1&&a.stopOnFalse&&(h=f.length,c=!1)}a.memory||(c=!1),b=!1,e&&(f=c?[]:"")},j={add:function(){return f&&(c&&!b&&(h=f.length-1,g.push(c)),function d(b){n.each(b,function(b,c){n.isFunction(c)?a.unique&&j.has(c)||f.push(c):c&&c.length&&"string"!==n.type(c)&&d(c)})}(arguments),c&&!b&&i()),this},remove:function(){return n.each(arguments,function(a,b){var c;while((c=n.inArray(b,f,c))>-1)f.splice(c,1),h>=c&&h--}),this},has:function(a){return a?n.inArray(a,f)>-1:f.length>0},empty:function(){return f&&(f=[]),this},disable:function(){return e=g=[],f=c="",this},disabled:function(){return!f},lock:function(){return e=g=[],c||(f=c=""),this},locked:function(){return!!e},fireWith:function(a,c){return e||(c=c||[],c=[a,c.slice?c.slice():c],g.push(c),b||i()),this},fire:function(){return j.fireWith(this,arguments),this},fired:function(){return!!d}};return j},n.extend({Deferred:function(a){var b=[["resolve","done",n.Callbacks("once memory"),"resolved"],["reject","fail",n.Callbacks("once memory"),"rejected"],["notify","progress",n.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return n.Deferred(function(c){n.each(b,function(b,f){var g=n.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&n.isFunction(a.promise)?a.promise().progress(c.notify).done(c.resolve).fail(c.reject):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?n.extend(a,d):d}},e={};return d.pipe=d.then,n.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=e.call(arguments),d=c.length,f=1!==d||a&&n.isFunction(a.promise)?d:0,g=1===f?a:n.Deferred(),h=function(a,b,c){return function(d){b[a]=this,c[a]=arguments.length>1?e.call(arguments):d,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(d>1)for(i=new Array(d),j=new Array(d),k=new Array(d);d>b;b++)c[b]&&n.isFunction(c[b].promise)?c[b].promise().progress(h(b,j,i)).done(h(b,k,c)).fail(g.reject):--f;return f||g.resolveWith(k,c),g.promise()}});var I;n.fn.ready=function(a){return n.ready.promise().done(a),this},n.extend({isReady:!1,readyWait:1,holdReady:function(a){a?n.readyWait++:n.ready(!0)},ready:function(a){(a===!0?--n.readyWait:n.isReady)||(n.isReady=!0,a!==!0&&--n.readyWait>0||(I.resolveWith(d,[n]),n.fn.triggerHandler&&(n(d).triggerHandler("ready"),n(d).off("ready"))))}});function J(){d.removeEventListener("DOMContentLoaded",J),a.removeEventListener("load",J),n.ready()}n.ready.promise=function(b){return I||(I=n.Deferred(),"complete"===d.readyState||"loading"!==d.readyState&&!d.documentElement.doScroll?a.setTimeout(n.ready):(d.addEventListener("DOMContentLoaded",J),a.addEventListener("load",J))),I.promise(b)},n.ready.promise();var K=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===n.type(c)){e=!0;for(h in c)K(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,n.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(n(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},L=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function M(){this.expando=n.expando+M.uid++}M.uid=1,M.prototype={register:function(a,b){var c=b||{};return a.nodeType?a[this.expando]=c:Object.defineProperty(a,this.expando,{value:c,writable:!0,configurable:!0}),a[this.expando]},cache:function(a){if(!L(a))return{};var b=a[this.expando];return b||(b={},L(a)&&(a.nodeType?a[this.expando]=b:Object.defineProperty(a,this.expando,{value:b,configurable:!0}))),b},set:function(a,b,c){var d,e=this.cache(a);if("string"==typeof b)e[b]=c;else for(d in b)e[d]=b[d];return e},get:function(a,b){return void 0===b?this.cache(a):a[this.expando]&&a[this.expando][b]},access:function(a,b,c){var d;return void 0===b||b&&"string"==typeof b&&void 0===c?(d=this.get(a,b),void 0!==d?d:this.get(a,n.camelCase(b))):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d,e,f=a[this.expando];if(void 0!==f){if(void 0===b)this.register(a);else{n.isArray(b)?d=b.concat(b.map(n.camelCase)):(e=n.camelCase(b),b in f?d=[b,e]:(d=e,d=d in f?[d]:d.match(G)||[])),c=d.length;while(c--)delete f[d[c]]}(void 0===b||n.isEmptyObject(f))&&(a.nodeType?a[this.expando]=void 0:delete a[this.expando])}},hasData:function(a){var b=a[this.expando];return void 0!==b&&!n.isEmptyObject(b)}};var N=new M,O=new M,P=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,Q=/[A-Z]/g;function R(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(Q,"-$&").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:P.test(c)?n.parseJSON(c):c;
}catch(e){}O.set(a,b,c)}else c=void 0;return c}n.extend({hasData:function(a){return O.hasData(a)||N.hasData(a)},data:function(a,b,c){return O.access(a,b,c)},removeData:function(a,b){O.remove(a,b)},_data:function(a,b,c){return N.access(a,b,c)},_removeData:function(a,b){N.remove(a,b)}}),n.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=O.get(f),1===f.nodeType&&!N.get(f,"hasDataAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=n.camelCase(d.slice(5)),R(f,d,e[d])));N.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){O.set(this,a)}):K(this,function(b){var c,d;if(f&&void 0===b){if(c=O.get(f,a)||O.get(f,a.replace(Q,"-$&").toLowerCase()),void 0!==c)return c;if(d=n.camelCase(a),c=O.get(f,d),void 0!==c)return c;if(c=R(f,d,void 0),void 0!==c)return c}else d=n.camelCase(a),this.each(function(){var c=O.get(this,d);O.set(this,d,b),a.indexOf("-")>-1&&void 0!==c&&O.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){O.remove(this,a)})}}),n.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=N.get(a,b),c&&(!d||n.isArray(c)?d=N.access(a,b,n.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=n.queue(a,b),d=c.length,e=c.shift(),f=n._queueHooks(a,b),g=function(){n.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return N.get(a,c)||N.access(a,c,{empty:n.Callbacks("once memory").add(function(){N.remove(a,[b+"queue",c])})})}}),n.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?n.queue(this[0],a):void 0===b?this:this.each(function(){var c=n.queue(this,a,b);n._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&n.dequeue(this,a)})},dequeue:function(a){return this.each(function(){n.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=n.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=N.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var S=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=new RegExp("^(?:([+-])=|)("+S+")([a-z%]*)$","i"),U=["Top","Right","Bottom","Left"],V=function(a,b){return a=b||a,"none"===n.css(a,"display")||!n.contains(a.ownerDocument,a)};function W(a,b,c,d){var e,f=1,g=20,h=d?function(){return d.cur()}:function(){return n.css(a,b,"")},i=h(),j=c&&c[3]||(n.cssNumber[b]?"":"px"),k=(n.cssNumber[b]||"px"!==j&&+i)&&T.exec(n.css(a,b));if(k&&k[3]!==j){j=j||k[3],c=c||[],k=+i||1;do f=f||".5",k/=f,n.style(a,b,k+j);while(f!==(f=h()/i)&&1!==f&&--g)}return c&&(k=+k||+i||0,e=c[1]?k+(c[1]+1)*c[2]:+c[2],d&&(d.unit=j,d.start=k,d.end=e)),e}var X=/^(?:checkbox|radio)$/i,Y=/<([\w:-]+)/,Z=/^$|\/(?:java|ecma)script/i,$={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};$.optgroup=$.option,$.tbody=$.tfoot=$.colgroup=$.caption=$.thead,$.th=$.td;function _(a,b){var c="undefined"!=typeof a.getElementsByTagName?a.getElementsByTagName(b||"*"):"undefined"!=typeof a.querySelectorAll?a.querySelectorAll(b||"*"):[];return void 0===b||b&&n.nodeName(a,b)?n.merge([a],c):c}function aa(a,b){for(var c=0,d=a.length;d>c;c++)N.set(a[c],"globalEval",!b||N.get(b[c],"globalEval"))}var ba=/<|&#?\w+;/;function ca(a,b,c,d,e){for(var f,g,h,i,j,k,l=b.createDocumentFragment(),m=[],o=0,p=a.length;p>o;o++)if(f=a[o],f||0===f)if("object"===n.type(f))n.merge(m,f.nodeType?[f]:f);else if(ba.test(f)){g=g||l.appendChild(b.createElement("div")),h=(Y.exec(f)||["",""])[1].toLowerCase(),i=$[h]||$._default,g.innerHTML=i[1]+n.htmlPrefilter(f)+i[2],k=i[0];while(k--)g=g.lastChild;n.merge(m,g.childNodes),g=l.firstChild,g.textContent=""}else m.push(b.createTextNode(f));l.textContent="",o=0;while(f=m[o++])if(d&&n.inArray(f,d)>-1)e&&e.push(f);else if(j=n.contains(f.ownerDocument,f),g=_(l.appendChild(f),"script"),j&&aa(g),c){k=0;while(f=g[k++])Z.test(f.type||"")&&c.push(f)}return l}!function(){var a=d.createDocumentFragment(),b=a.appendChild(d.createElement("div")),c=d.createElement("input");c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),b.appendChild(c),l.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",l.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var da=/^key/,ea=/^(?:mouse|pointer|contextmenu|drag|drop)|click/,fa=/^([^.]*)(?:\.(.+)|)/;function ga(){return!0}function ha(){return!1}function ia(){try{return d.activeElement}catch(a){}}function ja(a,b,c,d,e,f){var g,h;if("object"==typeof b){"string"!=typeof c&&(d=d||c,c=void 0);for(h in b)ja(a,h,c,d,b[h],f);return a}if(null==d&&null==e?(e=c,d=c=void 0):null==e&&("string"==typeof c?(e=d,d=void 0):(e=d,d=c,c=void 0)),e===!1)e=ha;else if(!e)return a;return 1===f&&(g=e,e=function(a){return n().off(a),g.apply(this,arguments)},e.guid=g.guid||(g.guid=n.guid++)),a.each(function(){n.event.add(this,b,e,d,c)})}n.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=N.get(a);if(r){c.handler&&(f=c,c=f.handler,e=f.selector),c.guid||(c.guid=n.guid++),(i=r.events)||(i=r.events={}),(g=r.handle)||(g=r.handle=function(b){return"undefined"!=typeof n&&n.event.triggered!==b.type?n.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(G)||[""],j=b.length;while(j--)h=fa.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o&&(l=n.event.special[o]||{},o=(e?l.delegateType:l.bindType)||o,l=n.event.special[o]||{},k=n.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&n.expr.match.needsContext.test(e),namespace:p.join(".")},f),(m=i[o])||(m=i[o]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,p,g)!==!1||a.addEventListener&&a.addEventListener(o,g)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),n.event.global[o]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=N.hasData(a)&&N.get(a);if(r&&(i=r.events)){b=(b||"").match(G)||[""],j=b.length;while(j--)if(h=fa.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=n.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,m=i[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&q!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||n.removeEvent(a,o,r.handle),delete i[o])}else for(o in i)n.event.remove(a,o+b[j],c,d,!0);n.isEmptyObject(i)&&N.remove(a,"handle events")}},dispatch:function(a){a=n.event.fix(a);var b,c,d,f,g,h=[],i=e.call(arguments),j=(N.get(this,"events")||{})[a.type]||[],k=n.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=n.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,c=0;while((g=f.handlers[c++])&&!a.isImmediatePropagationStopped())a.rnamespace&&!a.rnamespace.test(g.namespace)||(a.handleObj=g,a.data=g.data,d=((n.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==d&&(a.result=d)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&("click"!==a.type||isNaN(a.button)||a.button<1))for(;i!==this;i=i.parentNode||this)if(1===i.nodeType&&(i.disabled!==!0||"click"!==a.type)){for(d=[],c=0;h>c;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?n(e,this).index(i)>-1:n.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},props:"altKey bubbles cancelable ctrlKey currentTarget detail eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,e,f,g=b.button;return null==a.pageX&&null!=b.clientX&&(c=a.target.ownerDocument||d,e=c.documentElement,f=c.body,a.pageX=b.clientX+(e&&e.scrollLeft||f&&f.scrollLeft||0)-(e&&e.clientLeft||f&&f.clientLeft||0),a.pageY=b.clientY+(e&&e.scrollTop||f&&f.scrollTop||0)-(e&&e.clientTop||f&&f.clientTop||0)),a.which||void 0===g||(a.which=1&g?1:2&g?3:4&g?2:0),a}},fix:function(a){if(a[n.expando])return a;var b,c,e,f=a.type,g=a,h=this.fixHooks[f];h||(this.fixHooks[f]=h=ea.test(f)?this.mouseHooks:da.test(f)?this.keyHooks:{}),e=h.props?this.props.concat(h.props):this.props,a=new n.Event(g),b=e.length;while(b--)c=e[b],a[c]=g[c];return a.target||(a.target=d),3===a.target.nodeType&&(a.target=a.target.parentNode),h.filter?h.filter(a,g):a},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==ia()&&this.focus?(this.focus(),!1):void 0},delegateType:"focusin"},blur:{trigger:function(){return this===ia()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&n.nodeName(this,"input")?(this.click(),!1):void 0},_default:function(a){return n.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}}},n.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c)},n.Event=function(a,b){return this instanceof n.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?ga:ha):this.type=a,b&&n.extend(this,b),this.timeStamp=a&&a.timeStamp||n.now(),void(this[n.expando]=!0)):new n.Event(a,b)},n.Event.prototype={constructor:n.Event,isDefaultPrevented:ha,isPropagationStopped:ha,isImmediatePropagationStopped:ha,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=ga,a&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=ga,a&&a.stopPropagation()},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=ga,a&&a.stopImmediatePropagation(),this.stopPropagation()}},n.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){n.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return e&&(e===d||n.contains(d,e))||(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),n.fn.extend({on:function(a,b,c,d){return ja(this,a,b,c,d)},one:function(a,b,c,d){return ja(this,a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,n(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return b!==!1&&"function"!=typeof b||(c=b,b=void 0),c===!1&&(c=ha),this.each(function(){n.event.remove(this,a,c,b)})}});var ka=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,la=/<script|<style|<link/i,ma=/checked\s*(?:[^=]|=\s*.checked.)/i,na=/^true\/(.*)/,oa=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;function pa(a,b){return n.nodeName(a,"table")&&n.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function qa(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function ra(a){var b=na.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function sa(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(N.hasData(a)&&(f=N.access(a),g=N.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;d>c;c++)n.event.add(b,e,j[e][c])}O.hasData(a)&&(h=O.access(a),i=n.extend({},h),O.set(b,i))}}function ta(a,b){var c=b.nodeName.toLowerCase();"input"===c&&X.test(a.type)?b.checked=a.checked:"input"!==c&&"textarea"!==c||(b.defaultValue=a.defaultValue)}function ua(a,b,c,d){b=f.apply([],b);var e,g,h,i,j,k,m=0,o=a.length,p=o-1,q=b[0],r=n.isFunction(q);if(r||o>1&&"string"==typeof q&&!l.checkClone&&ma.test(q))return a.each(function(e){var f=a.eq(e);r&&(b[0]=q.call(this,e,f.html())),ua(f,b,c,d)});if(o&&(e=ca(b,a[0].ownerDocument,!1,a,d),g=e.firstChild,1===e.childNodes.length&&(e=g),g||d)){for(h=n.map(_(e,"script"),qa),i=h.length;o>m;m++)j=e,m!==p&&(j=n.clone(j,!0,!0),i&&n.merge(h,_(j,"script"))),c.call(a[m],j,m);if(i)for(k=h[h.length-1].ownerDocument,n.map(h,ra),m=0;i>m;m++)j=h[m],Z.test(j.type||"")&&!N.access(j,"globalEval")&&n.contains(k,j)&&(j.src?n._evalUrl&&n._evalUrl(j.src):n.globalEval(j.textContent.replace(oa,"")))}return a}function va(a,b,c){for(var d,e=b?n.filter(b,a):a,f=0;null!=(d=e[f]);f++)c||1!==d.nodeType||n.cleanData(_(d)),d.parentNode&&(c&&n.contains(d.ownerDocument,d)&&aa(_(d,"script")),d.parentNode.removeChild(d));return a}n.extend({htmlPrefilter:function(a){return a.replace(ka,"<$1></$2>")},clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=n.contains(a.ownerDocument,a);if(!(l.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||n.isXMLDoc(a)))for(g=_(h),f=_(a),d=0,e=f.length;e>d;d++)ta(f[d],g[d]);if(b)if(c)for(f=f||_(a),g=g||_(h),d=0,e=f.length;e>d;d++)sa(f[d],g[d]);else sa(a,h);return g=_(h,"script"),g.length>0&&aa(g,!i&&_(a,"script")),h},cleanData:function(a){for(var b,c,d,e=n.event.special,f=0;void 0!==(c=a[f]);f++)if(L(c)){if(b=c[N.expando]){if(b.events)for(d in b.events)e[d]?n.event.remove(c,d):n.removeEvent(c,d,b.handle);c[N.expando]=void 0}c[O.expando]&&(c[O.expando]=void 0)}}}),n.fn.extend({domManip:ua,detach:function(a){return va(this,a,!0)},remove:function(a){return va(this,a)},text:function(a){return K(this,function(a){return void 0===a?n.text(this):this.empty().each(function(){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||(this.textContent=a)})},null,a,arguments.length)},append:function(){return ua(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=pa(this,a);b.appendChild(a)}})},prepend:function(){return ua(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=pa(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return ua(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return ua(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(n.cleanData(_(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return n.clone(this,a,b)})},html:function(a){return K(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!la.test(a)&&!$[(Y.exec(a)||["",""])[1].toLowerCase()]){a=n.htmlPrefilter(a);try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(n.cleanData(_(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=[];return ua(this,arguments,function(b){var c=this.parentNode;n.inArray(this,a)<0&&(n.cleanData(_(this)),c&&c.replaceChild(b,this))},a)}}),n.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){n.fn[a]=function(a){for(var c,d=[],e=n(a),f=e.length-1,h=0;f>=h;h++)c=h===f?this:this.clone(!0),n(e[h])[b](c),g.apply(d,c.get());return this.pushStack(d)}});var wa,xa={HTML:"block",BODY:"block"};function ya(a,b){var c=n(b.createElement(a)).appendTo(b.body),d=n.css(c[0],"display");return c.detach(),d}function za(a){var b=d,c=xa[a];return c||(c=ya(a,b),"none"!==c&&c||(wa=(wa||n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=wa[0].contentDocument,b.write(),b.close(),c=ya(a,b),wa.detach()),xa[a]=c),c}var Aa=/^margin/,Ba=new RegExp("^("+S+")(?!px)[a-z%]+$","i"),Ca=function(b){var c=b.ownerDocument.defaultView;return c&&c.opener||(c=a),c.getComputedStyle(b)},Da=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e},Ea=d.documentElement;!function(){var b,c,e,f,g=d.createElement("div"),h=d.createElement("div");if(h.style){h.style.backgroundClip="content-box",h.cloneNode(!0).style.backgroundClip="",l.clearCloneStyle="content-box"===h.style.backgroundClip,g.style.cssText="border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute",g.appendChild(h);function i(){h.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%",h.innerHTML="",Ea.appendChild(g);var d=a.getComputedStyle(h);b="1%"!==d.top,f="2px"===d.marginLeft,c="4px"===d.width,h.style.marginRight="50%",e="4px"===d.marginRight,Ea.removeChild(g)}n.extend(l,{pixelPosition:function(){return i(),b},boxSizingReliable:function(){return null==c&&i(),c},pixelMarginRight:function(){return null==c&&i(),e},reliableMarginLeft:function(){return null==c&&i(),f},reliableMarginRight:function(){var b,c=h.appendChild(d.createElement("div"));return c.style.cssText=h.style.cssText="-webkit-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",c.style.marginRight=c.style.width="0",h.style.width="1px",Ea.appendChild(g),b=!parseFloat(a.getComputedStyle(c).marginRight),Ea.removeChild(g),h.removeChild(c),b}})}}();function Fa(a,b,c){var d,e,f,g,h=a.style;return c=c||Ca(a),g=c?c.getPropertyValue(b)||c[b]:void 0,""!==g&&void 0!==g||n.contains(a.ownerDocument,a)||(g=n.style(a,b)),c&&!l.pixelMarginRight()&&Ba.test(g)&&Aa.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f),void 0!==g?g+"":g}function Ga(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}var Ha=/^(none|table(?!-c[ea]).+)/,Ia={position:"absolute",visibility:"hidden",display:"block"},Ja={letterSpacing:"0",fontWeight:"400"},Ka=["Webkit","O","Moz","ms"],La=d.createElement("div").style;function Ma(a){if(a in La)return a;var b=a[0].toUpperCase()+a.slice(1),c=Ka.length;while(c--)if(a=Ka[c]+b,a in La)return a}function Na(a,b,c){var d=T.exec(b);return d?Math.max(0,d[2]-(c||0))+(d[3]||"px"):b}function Oa(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=n.css(a,c+U[f],!0,e)),d?("content"===c&&(g-=n.css(a,"padding"+U[f],!0,e)),"margin"!==c&&(g-=n.css(a,"border"+U[f]+"Width",!0,e))):(g+=n.css(a,"padding"+U[f],!0,e),"padding"!==c&&(g+=n.css(a,"border"+U[f]+"Width",!0,e)));return g}function Pa(b,c,e){var f=!0,g="width"===c?b.offsetWidth:b.offsetHeight,h=Ca(b),i="border-box"===n.css(b,"boxSizing",!1,h);if(d.msFullscreenElement&&a.top!==a&&b.getClientRects().length&&(g=Math.round(100*b.getBoundingClientRect()[c])),0>=g||null==g){if(g=Fa(b,c,h),(0>g||null==g)&&(g=b.style[c]),Ba.test(g))return g;f=i&&(l.boxSizingReliable()||g===b.style[c]),g=parseFloat(g)||0}return g+Oa(b,c,e||(i?"border":"content"),f,h)+"px"}function Qa(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=N.get(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&V(d)&&(f[g]=N.access(d,"olddisplay",za(d.nodeName)))):(e=V(d),"none"===c&&e||N.set(d,"olddisplay",e?c:n.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}n.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Fa(a,"opacity");return""===c?"1":c}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=n.camelCase(b),i=a.style;return b=n.cssProps[h]||(n.cssProps[h]=Ma(h)||h),g=n.cssHooks[b]||n.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=T.exec(c))&&e[1]&&(c=W(a,b,e),f="number"),null!=c&&c===c&&("number"===f&&(c+=e&&e[3]||(n.cssNumber[h]?"":"px")),l.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=n.camelCase(b);return b=n.cssProps[h]||(n.cssProps[h]=Ma(h)||h),g=n.cssHooks[b]||n.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=Fa(a,b,d)),"normal"===e&&b in Ja&&(e=Ja[b]),""===c||c?(f=parseFloat(e),c===!0||isFinite(f)?f||0:e):e}}),n.each(["height","width"],function(a,b){n.cssHooks[b]={get:function(a,c,d){return c?Ha.test(n.css(a,"display"))&&0===a.offsetWidth?Da(a,Ia,function(){return Pa(a,b,d)}):Pa(a,b,d):void 0},set:function(a,c,d){var e,f=d&&Ca(a),g=d&&Oa(a,b,d,"border-box"===n.css(a,"boxSizing",!1,f),f);return g&&(e=T.exec(c))&&"px"!==(e[3]||"px")&&(a.style[b]=c,c=n.css(a,b)),Na(a,c,g)}}}),n.cssHooks.marginLeft=Ga(l.reliableMarginLeft,function(a,b){return b?(parseFloat(Fa(a,"marginLeft"))||a.getBoundingClientRect().left-Da(a,{marginLeft:0},function(){return a.getBoundingClientRect().left}))+"px":void 0}),n.cssHooks.marginRight=Ga(l.reliableMarginRight,function(a,b){return b?Da(a,{display:"inline-block"},Fa,[a,"marginRight"]):void 0}),n.each({margin:"",padding:"",border:"Width"},function(a,b){n.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+U[d]+b]=f[d]||f[d-2]||f[0];return e}},Aa.test(a)||(n.cssHooks[a+b].set=Na)}),n.fn.extend({css:function(a,b){return K(this,function(a,b,c){var d,e,f={},g=0;if(n.isArray(b)){for(d=Ca(a),e=b.length;e>g;g++)f[b[g]]=n.css(a,b[g],!1,d);return f}return void 0!==c?n.style(a,b,c):n.css(a,b)},a,b,arguments.length>1)},show:function(){return Qa(this,!0)},hide:function(){return Qa(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){V(this)?n(this).show():n(this).hide()})}});function Ra(a,b,c,d,e){return new Ra.prototype.init(a,b,c,d,e)}n.Tween=Ra,Ra.prototype={constructor:Ra,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||n.easing._default,this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(n.cssNumber[c]?"":"px")},cur:function(){var a=Ra.propHooks[this.prop];return a&&a.get?a.get(this):Ra.propHooks._default.get(this)},run:function(a){var b,c=Ra.propHooks[this.prop];return this.options.duration?this.pos=b=n.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Ra.propHooks._default.set(this),this}},Ra.prototype.init.prototype=Ra.prototype,Ra.propHooks={_default:{get:function(a){var b;return 1!==a.elem.nodeType||null!=a.elem[a.prop]&&null==a.elem.style[a.prop]?a.elem[a.prop]:(b=n.css(a.elem,a.prop,""),b&&"auto"!==b?b:0)},set:function(a){n.fx.step[a.prop]?n.fx.step[a.prop](a):1!==a.elem.nodeType||null==a.elem.style[n.cssProps[a.prop]]&&!n.cssHooks[a.prop]?a.elem[a.prop]=a.now:n.style(a.elem,a.prop,a.now+a.unit)}}},Ra.propHooks.scrollTop=Ra.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},n.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2},_default:"swing"},n.fx=Ra.prototype.init,n.fx.step={};var Sa,Ta,Ua=/^(?:toggle|show|hide)$/,Va=/queueHooks$/;function Wa(){return a.setTimeout(function(){Sa=void 0}),Sa=n.now()}function Xa(a,b){var c,d=0,e={height:a};for(b=b?1:0;4>d;d+=2-b)c=U[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function Ya(a,b,c){for(var d,e=(_a.tweeners[b]||[]).concat(_a.tweeners["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function Za(a,b,c){var d,e,f,g,h,i,j,k,l=this,m={},o=a.style,p=a.nodeType&&V(a),q=N.get(a,"fxshow");c.queue||(h=n._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,l.always(function(){l.always(function(){h.unqueued--,n.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[o.overflow,o.overflowX,o.overflowY],j=n.css(a,"display"),k="none"===j?N.get(a,"olddisplay")||za(a.nodeName):j,"inline"===k&&"none"===n.css(a,"float")&&(o.display="inline-block")),c.overflow&&(o.overflow="hidden",l.always(function(){o.overflow=c.overflow[0],o.overflowX=c.overflow[1],o.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],Ua.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(p?"hide":"show")){if("show"!==e||!q||void 0===q[d])continue;p=!0}m[d]=q&&q[d]||n.style(a,d)}else j=void 0;if(n.isEmptyObject(m))"inline"===("none"===j?za(a.nodeName):j)&&(o.display=j);else{q?"hidden"in q&&(p=q.hidden):q=N.access(a,"fxshow",{}),f&&(q.hidden=!p),p?n(a).show():l.done(function(){n(a).hide()}),l.done(function(){var b;N.remove(a,"fxshow");for(b in m)n.style(a,b,m[b])});for(d in m)g=Ya(p?q[d]:0,d,l),d in q||(q[d]=g.start,p&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function $a(a,b){var c,d,e,f,g;for(c in a)if(d=n.camelCase(c),e=b[d],f=a[c],n.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=n.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function _a(a,b,c){var d,e,f=0,g=_a.prefilters.length,h=n.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=Sa||Wa(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:n.extend({},b),opts:n.extend(!0,{specialEasing:{},easing:n.easing._default},c),originalProperties:b,originalOptions:c,startTime:Sa||Wa(),duration:c.duration,tweens:[],createTween:function(b,c){var d=n.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?(h.notifyWith(a,[j,1,0]),h.resolveWith(a,[j,b])):h.rejectWith(a,[j,b]),this}}),k=j.props;for($a(k,j.opts.specialEasing);g>f;f++)if(d=_a.prefilters[f].call(j,a,k,j.opts))return n.isFunction(d.stop)&&(n._queueHooks(j.elem,j.opts.queue).stop=n.proxy(d.stop,d)),d;return n.map(k,Ya,j),n.isFunction(j.opts.start)&&j.opts.start.call(a,j),n.fx.timer(n.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}n.Animation=n.extend(_a,{tweeners:{"*":[function(a,b){var c=this.createTween(a,b);return W(c.elem,a,T.exec(b),c),c}]},tweener:function(a,b){n.isFunction(a)?(b=a,a=["*"]):a=a.match(G);for(var c,d=0,e=a.length;e>d;d++)c=a[d],_a.tweeners[c]=_a.tweeners[c]||[],_a.tweeners[c].unshift(b)},prefilters:[Za],prefilter:function(a,b){b?_a.prefilters.unshift(a):_a.prefilters.push(a)}}),n.speed=function(a,b,c){var d=a&&"object"==typeof a?n.extend({},a):{complete:c||!c&&b||n.isFunction(a)&&a,duration:a,easing:c&&b||b&&!n.isFunction(b)&&b};return d.duration=n.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in n.fx.speeds?n.fx.speeds[d.duration]:n.fx.speeds._default,null!=d.queue&&d.queue!==!0||(d.queue="fx"),d.old=d.complete,d.complete=function(){n.isFunction(d.old)&&d.old.call(this),d.queue&&n.dequeue(this,d.queue)},d},n.fn.extend({fadeTo:function(a,b,c,d){return this.filter(V).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=n.isEmptyObject(a),f=n.speed(b,c,d),g=function(){var b=_a(this,n.extend({},a),f);(e||N.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=n.timers,g=N.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&Va.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));!b&&c||n.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=N.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=n.timers,g=d?d.length:0;for(c.finish=!0,n.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),n.each(["toggle","show","hide"],function(a,b){var c=n.fn[b];n.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(Xa(b,!0),a,d,e)}}),n.each({slideDown:Xa("show"),slideUp:Xa("hide"),slideToggle:Xa("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){n.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),n.timers=[],n.fx.tick=function(){var a,b=0,c=n.timers;for(Sa=n.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||n.fx.stop(),Sa=void 0},n.fx.timer=function(a){n.timers.push(a),a()?n.fx.start():n.timers.pop()},n.fx.interval=13,n.fx.start=function(){Ta||(Ta=a.setInterval(n.fx.tick,n.fx.interval))},n.fx.stop=function(){a.clearInterval(Ta),Ta=null},n.fx.speeds={slow:600,fast:200,_default:400},n.fn.delay=function(b,c){return b=n.fx?n.fx.speeds[b]||b:b,c=c||"fx",this.queue(c,function(c,d){var e=a.setTimeout(c,b);d.stop=function(){a.clearTimeout(e)}})},function(){var a=d.createElement("input"),b=d.createElement("select"),c=b.appendChild(d.createElement("option"));a.type="checkbox",l.checkOn=""!==a.value,l.optSelected=c.selected,b.disabled=!0,l.optDisabled=!c.disabled,a=d.createElement("input"),a.value="t",a.type="radio",l.radioValue="t"===a.value}();var ab,bb=n.expr.attrHandle;n.fn.extend({attr:function(a,b){return K(this,n.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){n.removeAttr(this,a)})}}),n.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return"undefined"==typeof a.getAttribute?n.prop(a,b,c):(1===f&&n.isXMLDoc(a)||(b=b.toLowerCase(),e=n.attrHooks[b]||(n.expr.match.bool.test(b)?ab:void 0)),void 0!==c?null===c?void n.removeAttr(a,b):e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:(a.setAttribute(b,c+""),c):e&&"get"in e&&null!==(d=e.get(a,b))?d:(d=n.find.attr(a,b),null==d?void 0:d))},attrHooks:{type:{set:function(a,b){if(!l.radioValue&&"radio"===b&&n.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(G);if(f&&1===a.nodeType)while(c=f[e++])d=n.propFix[c]||c,n.expr.match.bool.test(c)&&(a[d]=!1),a.removeAttribute(c)}}),ab={set:function(a,b,c){return b===!1?n.removeAttr(a,c):a.setAttribute(c,c),c}},n.each(n.expr.match.bool.source.match(/\w+/g),function(a,b){var c=bb[b]||n.find.attr;bb[b]=function(a,b,d){var e,f;return d||(f=bb[b],bb[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,bb[b]=f),e}});var cb=/^(?:input|select|textarea|button)$/i,db=/^(?:a|area)$/i;n.fn.extend({prop:function(a,b){return K(this,n.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[n.propFix[a]||a]})}}),n.extend({prop:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return 1===f&&n.isXMLDoc(a)||(b=n.propFix[b]||b,
e=n.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=n.find.attr(a,"tabindex");return b?parseInt(b,10):cb.test(a.nodeName)||db.test(a.nodeName)&&a.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),l.optSelected||(n.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null},set:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex)}}),n.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){n.propFix[this.toLowerCase()]=this});var eb=/[\t\r\n\f]/g;function fb(a){return a.getAttribute&&a.getAttribute("class")||""}n.fn.extend({addClass:function(a){var b,c,d,e,f,g,h,i=0;if(n.isFunction(a))return this.each(function(b){n(this).addClass(a.call(this,b,fb(this)))});if("string"==typeof a&&a){b=a.match(G)||[];while(c=this[i++])if(e=fb(c),d=1===c.nodeType&&(" "+e+" ").replace(eb," ")){g=0;while(f=b[g++])d.indexOf(" "+f+" ")<0&&(d+=f+" ");h=n.trim(d),e!==h&&c.setAttribute("class",h)}}return this},removeClass:function(a){var b,c,d,e,f,g,h,i=0;if(n.isFunction(a))return this.each(function(b){n(this).removeClass(a.call(this,b,fb(this)))});if(!arguments.length)return this.attr("class","");if("string"==typeof a&&a){b=a.match(G)||[];while(c=this[i++])if(e=fb(c),d=1===c.nodeType&&(" "+e+" ").replace(eb," ")){g=0;while(f=b[g++])while(d.indexOf(" "+f+" ")>-1)d=d.replace(" "+f+" "," ");h=n.trim(d),e!==h&&c.setAttribute("class",h)}}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):n.isFunction(a)?this.each(function(c){n(this).toggleClass(a.call(this,c,fb(this),b),b)}):this.each(function(){var b,d,e,f;if("string"===c){d=0,e=n(this),f=a.match(G)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else void 0!==a&&"boolean"!==c||(b=fb(this),b&&N.set(this,"__className__",b),this.setAttribute&&this.setAttribute("class",b||a===!1?"":N.get(this,"__className__")||""))})},hasClass:function(a){var b,c,d=0;b=" "+a+" ";while(c=this[d++])if(1===c.nodeType&&(" "+fb(c)+" ").replace(eb," ").indexOf(b)>-1)return!0;return!1}});var gb=/\r/g,hb=/[\x20\t\r\n\f]+/g;n.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=n.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,n(this).val()):a,null==e?e="":"number"==typeof e?e+="":n.isArray(e)&&(e=n.map(e,function(a){return null==a?"":a+""})),b=n.valHooks[this.type]||n.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=n.valHooks[e.type]||n.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(gb,""):null==c?"":c)}}}),n.extend({valHooks:{option:{get:function(a){var b=n.find.attr(a,"value");return null!=b?b:n.trim(n.text(a)).replace(hb," ")}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],(c.selected||i===e)&&(l.optDisabled?!c.disabled:null===c.getAttribute("disabled"))&&(!c.parentNode.disabled||!n.nodeName(c.parentNode,"optgroup"))){if(b=n(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=n.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=n.inArray(n.valHooks.option.get(d),f)>-1)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),n.each(["radio","checkbox"],function(){n.valHooks[this]={set:function(a,b){return n.isArray(b)?a.checked=n.inArray(n(a).val(),b)>-1:void 0}},l.checkOn||(n.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var ib=/^(?:focusinfocus|focusoutblur)$/;n.extend(n.event,{trigger:function(b,c,e,f){var g,h,i,j,l,m,o,p=[e||d],q=k.call(b,"type")?b.type:b,r=k.call(b,"namespace")?b.namespace.split("."):[];if(h=i=e=e||d,3!==e.nodeType&&8!==e.nodeType&&!ib.test(q+n.event.triggered)&&(q.indexOf(".")>-1&&(r=q.split("."),q=r.shift(),r.sort()),l=q.indexOf(":")<0&&"on"+q,b=b[n.expando]?b:new n.Event(q,"object"==typeof b&&b),b.isTrigger=f?2:3,b.namespace=r.join("."),b.rnamespace=b.namespace?new RegExp("(^|\\.)"+r.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=e),c=null==c?[b]:n.makeArray(c,[b]),o=n.event.special[q]||{},f||!o.trigger||o.trigger.apply(e,c)!==!1)){if(!f&&!o.noBubble&&!n.isWindow(e)){for(j=o.delegateType||q,ib.test(j+q)||(h=h.parentNode);h;h=h.parentNode)p.push(h),i=h;i===(e.ownerDocument||d)&&p.push(i.defaultView||i.parentWindow||a)}g=0;while((h=p[g++])&&!b.isPropagationStopped())b.type=g>1?j:o.bindType||q,m=(N.get(h,"events")||{})[b.type]&&N.get(h,"handle"),m&&m.apply(h,c),m=l&&h[l],m&&m.apply&&L(h)&&(b.result=m.apply(h,c),b.result===!1&&b.preventDefault());return b.type=q,f||b.isDefaultPrevented()||o._default&&o._default.apply(p.pop(),c)!==!1||!L(e)||l&&n.isFunction(e[q])&&!n.isWindow(e)&&(i=e[l],i&&(e[l]=null),n.event.triggered=q,e[q](),n.event.triggered=void 0,i&&(e[l]=i)),b.result}},simulate:function(a,b,c){var d=n.extend(new n.Event,c,{type:a,isSimulated:!0});n.event.trigger(d,null,b),d.isDefaultPrevented()&&c.preventDefault()}}),n.fn.extend({trigger:function(a,b){return this.each(function(){n.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?n.event.trigger(a,b,c,!0):void 0}}),n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){n.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),n.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),l.focusin="onfocusin"in a,l.focusin||n.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){n.event.simulate(b,a.target,n.event.fix(a))};n.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=N.access(d,b);e||d.addEventListener(a,c,!0),N.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=N.access(d,b)-1;e?N.access(d,b,e):(d.removeEventListener(a,c,!0),N.remove(d,b))}}});var jb=a.location,kb=n.now(),lb=/\?/;n.parseJSON=function(a){return JSON.parse(a+"")},n.parseXML=function(b){var c;if(!b||"string"!=typeof b)return null;try{c=(new a.DOMParser).parseFromString(b,"text/xml")}catch(d){c=void 0}return c&&!c.getElementsByTagName("parsererror").length||n.error("Invalid XML: "+b),c};var mb=/#.*$/,nb=/([?&])_=[^&]*/,ob=/^(.*?):[ \t]*([^\r\n]*)$/gm,pb=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,qb=/^(?:GET|HEAD)$/,rb=/^\/\//,sb={},tb={},ub="*/".concat("*"),vb=d.createElement("a");vb.href=jb.href;function wb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(G)||[];if(n.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function xb(a,b,c,d){var e={},f=a===tb;function g(h){var i;return e[h]=!0,n.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function yb(a,b){var c,d,e=n.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&n.extend(!0,a,d),a}function zb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function Ab(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}n.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:jb.href,type:"GET",isLocal:pb.test(jb.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":ub,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":n.parseJSON,"text xml":n.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?yb(yb(a,n.ajaxSettings),b):yb(n.ajaxSettings,a)},ajaxPrefilter:wb(sb),ajaxTransport:wb(tb),ajax:function(b,c){"object"==typeof b&&(c=b,b=void 0),c=c||{};var e,f,g,h,i,j,k,l,m=n.ajaxSetup({},c),o=m.context||m,p=m.context&&(o.nodeType||o.jquery)?n(o):n.event,q=n.Deferred(),r=n.Callbacks("once memory"),s=m.statusCode||{},t={},u={},v=0,w="canceled",x={readyState:0,getResponseHeader:function(a){var b;if(2===v){if(!h){h={};while(b=ob.exec(g))h[b[1].toLowerCase()]=b[2]}b=h[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===v?g:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return v||(a=u[c]=u[c]||a,t[a]=b),this},overrideMimeType:function(a){return v||(m.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>v)for(b in a)s[b]=[s[b],a[b]];else x.always(a[x.status]);return this},abort:function(a){var b=a||w;return e&&e.abort(b),z(0,b),this}};if(q.promise(x).complete=r.add,x.success=x.done,x.error=x.fail,m.url=((b||m.url||jb.href)+"").replace(mb,"").replace(rb,jb.protocol+"//"),m.type=c.method||c.type||m.method||m.type,m.dataTypes=n.trim(m.dataType||"*").toLowerCase().match(G)||[""],null==m.crossDomain){j=d.createElement("a");try{j.href=m.url,j.href=j.href,m.crossDomain=vb.protocol+"//"+vb.host!=j.protocol+"//"+j.host}catch(y){m.crossDomain=!0}}if(m.data&&m.processData&&"string"!=typeof m.data&&(m.data=n.param(m.data,m.traditional)),xb(sb,m,c,x),2===v)return x;k=n.event&&m.global,k&&0===n.active++&&n.event.trigger("ajaxStart"),m.type=m.type.toUpperCase(),m.hasContent=!qb.test(m.type),f=m.url,m.hasContent||(m.data&&(f=m.url+=(lb.test(f)?"&":"?")+m.data,delete m.data),m.cache===!1&&(m.url=nb.test(f)?f.replace(nb,"$1_="+kb++):f+(lb.test(f)?"&":"?")+"_="+kb++)),m.ifModified&&(n.lastModified[f]&&x.setRequestHeader("If-Modified-Since",n.lastModified[f]),n.etag[f]&&x.setRequestHeader("If-None-Match",n.etag[f])),(m.data&&m.hasContent&&m.contentType!==!1||c.contentType)&&x.setRequestHeader("Content-Type",m.contentType),x.setRequestHeader("Accept",m.dataTypes[0]&&m.accepts[m.dataTypes[0]]?m.accepts[m.dataTypes[0]]+("*"!==m.dataTypes[0]?", "+ub+"; q=0.01":""):m.accepts["*"]);for(l in m.headers)x.setRequestHeader(l,m.headers[l]);if(m.beforeSend&&(m.beforeSend.call(o,x,m)===!1||2===v))return x.abort();w="abort";for(l in{success:1,error:1,complete:1})x[l](m[l]);if(e=xb(tb,m,c,x)){if(x.readyState=1,k&&p.trigger("ajaxSend",[x,m]),2===v)return x;m.async&&m.timeout>0&&(i=a.setTimeout(function(){x.abort("timeout")},m.timeout));try{v=1,e.send(t,z)}catch(y){if(!(2>v))throw y;z(-1,y)}}else z(-1,"No Transport");function z(b,c,d,h){var j,l,t,u,w,y=c;2!==v&&(v=2,i&&a.clearTimeout(i),e=void 0,g=h||"",x.readyState=b>0?4:0,j=b>=200&&300>b||304===b,d&&(u=zb(m,x,d)),u=Ab(m,u,x,j),j?(m.ifModified&&(w=x.getResponseHeader("Last-Modified"),w&&(n.lastModified[f]=w),w=x.getResponseHeader("etag"),w&&(n.etag[f]=w)),204===b||"HEAD"===m.type?y="nocontent":304===b?y="notmodified":(y=u.state,l=u.data,t=u.error,j=!t)):(t=y,!b&&y||(y="error",0>b&&(b=0))),x.status=b,x.statusText=(c||y)+"",j?q.resolveWith(o,[l,y,x]):q.rejectWith(o,[x,y,t]),x.statusCode(s),s=void 0,k&&p.trigger(j?"ajaxSuccess":"ajaxError",[x,m,j?l:t]),r.fireWith(o,[x,y]),k&&(p.trigger("ajaxComplete",[x,m]),--n.active||n.event.trigger("ajaxStop")))}return x},getJSON:function(a,b,c){return n.get(a,b,c,"json")},getScript:function(a,b){return n.get(a,void 0,b,"script")}}),n.each(["get","post"],function(a,b){n[b]=function(a,c,d,e){return n.isFunction(c)&&(e=e||d,d=c,c=void 0),n.ajax(n.extend({url:a,type:b,dataType:e,data:c,success:d},n.isPlainObject(a)&&a))}}),n._evalUrl=function(a){return n.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},n.fn.extend({wrapAll:function(a){var b;return n.isFunction(a)?this.each(function(b){n(this).wrapAll(a.call(this,b))}):(this[0]&&(b=n(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this)},wrapInner:function(a){return n.isFunction(a)?this.each(function(b){n(this).wrapInner(a.call(this,b))}):this.each(function(){var b=n(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=n.isFunction(a);return this.each(function(c){n(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){n.nodeName(this,"body")||n(this).replaceWith(this.childNodes)}).end()}}),n.expr.filters.hidden=function(a){return!n.expr.filters.visible(a)},n.expr.filters.visible=function(a){return a.offsetWidth>0||a.offsetHeight>0||a.getClientRects().length>0};var Bb=/%20/g,Cb=/\[\]$/,Db=/\r?\n/g,Eb=/^(?:submit|button|image|reset|file)$/i,Fb=/^(?:input|select|textarea|keygen)/i;function Gb(a,b,c,d){var e;if(n.isArray(b))n.each(b,function(b,e){c||Cb.test(a)?d(a,e):Gb(a+"["+("object"==typeof e&&null!=e?b:"")+"]",e,c,d)});else if(c||"object"!==n.type(b))d(a,b);else for(e in b)Gb(a+"["+e+"]",b[e],c,d)}n.param=function(a,b){var c,d=[],e=function(a,b){b=n.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=n.ajaxSettings&&n.ajaxSettings.traditional),n.isArray(a)||a.jquery&&!n.isPlainObject(a))n.each(a,function(){e(this.name,this.value)});else for(c in a)Gb(c,a[c],b,e);return d.join("&").replace(Bb,"+")},n.fn.extend({serialize:function(){return n.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=n.prop(this,"elements");return a?n.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!n(this).is(":disabled")&&Fb.test(this.nodeName)&&!Eb.test(a)&&(this.checked||!X.test(a))}).map(function(a,b){var c=n(this).val();return null==c?null:n.isArray(c)?n.map(c,function(a){return{name:b.name,value:a.replace(Db,"\r\n")}}):{name:b.name,value:c.replace(Db,"\r\n")}}).get()}}),n.ajaxSettings.xhr=function(){try{return new a.XMLHttpRequest}catch(b){}};var Hb={0:200,1223:204},Ib=n.ajaxSettings.xhr();l.cors=!!Ib&&"withCredentials"in Ib,l.ajax=Ib=!!Ib,n.ajaxTransport(function(b){var c,d;return l.cors||Ib&&!b.crossDomain?{send:function(e,f){var g,h=b.xhr();if(h.open(b.type,b.url,b.async,b.username,b.password),b.xhrFields)for(g in b.xhrFields)h[g]=b.xhrFields[g];b.mimeType&&h.overrideMimeType&&h.overrideMimeType(b.mimeType),b.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest");for(g in e)h.setRequestHeader(g,e[g]);c=function(a){return function(){c&&(c=d=h.onload=h.onerror=h.onabort=h.onreadystatechange=null,"abort"===a?h.abort():"error"===a?"number"!=typeof h.status?f(0,"error"):f(h.status,h.statusText):f(Hb[h.status]||h.status,h.statusText,"text"!==(h.responseType||"text")||"string"!=typeof h.responseText?{binary:h.response}:{text:h.responseText},h.getAllResponseHeaders()))}},h.onload=c(),d=h.onerror=c("error"),void 0!==h.onabort?h.onabort=d:h.onreadystatechange=function(){4===h.readyState&&a.setTimeout(function(){c&&d()})},c=c("abort");try{h.send(b.hasContent&&b.data||null)}catch(i){if(c)throw i}},abort:function(){c&&c()}}:void 0}),n.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(a){return n.globalEval(a),a}}}),n.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),n.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(e,f){b=n("<script>").prop({charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&f("error"===a.type?404:200,a.type)}),d.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Jb=[],Kb=/(=)\?(?=&|$)|\?\?/;n.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Jb.pop()||n.expando+"_"+kb++;return this[a]=!0,a}}),n.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Kb.test(b.url)?"url":"string"==typeof b.data&&0===(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Kb.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=n.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Kb,"$1"+e):b.jsonp!==!1&&(b.url+=(lb.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||n.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){void 0===f?n(a).removeProp(e):a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Jb.push(e)),g&&n.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),n.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||d;var e=x.exec(a),f=!c&&[];return e?[b.createElement(e[1])]:(e=ca([a],b,f),f&&f.length&&n(f).remove(),n.merge([],e.childNodes))};var Lb=n.fn.load;n.fn.load=function(a,b,c){if("string"!=typeof a&&Lb)return Lb.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>-1&&(d=n.trim(a.slice(h)),a=a.slice(0,h)),n.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&n.ajax({url:a,type:e||"GET",dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?n("<div>").append(n.parseHTML(a)).find(d):a)}).always(c&&function(a,b){g.each(function(){c.apply(g,f||[a.responseText,b,a])})}),this},n.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){n.fn[b]=function(a){return this.on(b,a)}}),n.expr.filters.animated=function(a){return n.grep(n.timers,function(b){return a===b.elem}).length};function Mb(a){return n.isWindow(a)?a:9===a.nodeType&&a.defaultView}n.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=n.css(a,"position"),l=n(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=n.css(a,"top"),i=n.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),n.isFunction(b)&&(b=b.call(a,c,n.extend({},h))),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},n.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){n.offset.setOffset(this,a,b)});var b,c,d=this[0],e={top:0,left:0},f=d&&d.ownerDocument;if(f)return b=f.documentElement,n.contains(b,d)?(e=d.getBoundingClientRect(),c=Mb(f),{top:e.top+c.pageYOffset-b.clientTop,left:e.left+c.pageXOffset-b.clientLeft}):e},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===n.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),n.nodeName(a[0],"html")||(d=a.offset()),d.top+=n.css(a[0],"borderTopWidth",!0),d.left+=n.css(a[0],"borderLeftWidth",!0)),{top:b.top-d.top-n.css(c,"marginTop",!0),left:b.left-d.left-n.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent;while(a&&"static"===n.css(a,"position"))a=a.offsetParent;return a||Ea})}}),n.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c="pageYOffset"===b;n.fn[a]=function(d){return K(this,function(a,d,e){var f=Mb(a);return void 0===e?f?f[b]:a[d]:void(f?f.scrollTo(c?f.pageXOffset:e,c?e:f.pageYOffset):a[d]=e)},a,d,arguments.length)}}),n.each(["top","left"],function(a,b){n.cssHooks[b]=Ga(l.pixelPosition,function(a,c){return c?(c=Fa(a,b),Ba.test(c)?n(a).position()[b]+"px":c):void 0})}),n.each({Height:"height",Width:"width"},function(a,b){n.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){n.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return K(this,function(b,c,d){var e;return n.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?n.css(b,c,g):n.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),n.fn.extend({bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)},size:function(){return this.length}}),n.fn.andSelf=n.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return n});var Nb=a.jQuery,Ob=a.$;return n.noConflict=function(b){return a.$===n&&(a.$=Ob),b&&a.jQuery===n&&(a.jQuery=Nb),n},b||(a.jQuery=a.$=n),n});


(function(){
  var NAME = "FontMetrics Library"
  var VERSION = "1-2011.0927.1431";
  var debug = false;

  if(!document.defaultView.getComputedStyle) {
    throw("ERROR: 'document.defaultView.getComputedStyle' not found. This library only works in browsers that can report computed CSS values.");
  }

  CanvasRenderingContext2D.prototype.measureTextWidth = CanvasRenderingContext2D.prototype.measureText;

  var getCSSValue = function(element, property) {
    return document.defaultView.getComputedStyle(element,null).getPropertyValue(property);
  };

  var show = function(canvas, ctx, xstart, w, h, metrics)
  {
    document.body.appendChild(canvas);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';

    ctx.beginPath();
    ctx.moveTo(xstart,0);
    ctx.lineTo(xstart,h);
    ctx.closePath();
    ctx.stroke(); 

    ctx.beginPath();
    ctx.moveTo(xstart+metrics.bounds.maxx,0);
    ctx.lineTo(xstart+metrics.bounds.maxx,h);
    ctx.closePath();
    ctx.stroke(); 

    ctx.beginPath();
    ctx.moveTo(0,h/2-metrics.ascent);
    ctx.lineTo(w,h/2-metrics.ascent);
    ctx.closePath();
    ctx.stroke(); 

    ctx.beginPath();
    ctx.moveTo(0,h/2+metrics.descent);
    ctx.lineTo(w,h/2+metrics.descent);
    ctx.closePath();
    ctx.stroke();
  }

  CanvasRenderingContext2D.prototype.measureText = function(textstring) {
    var metrics = this.measureTextWidth(textstring);
        fontFamily = getCSSValue(this.canvas,"font-family"),
        fontSize = getCSSValue(this.canvas,"font-size").replace("px","");
        metrics.fontsize = fontSize;
    var canvas = document.createElement("canvas");
    var padding = 100;
    canvas.width = metrics.width + padding;
    canvas.height = 3*fontSize;
    canvas.style.opacity = 1;
    canvas.style.fontFamily = fontFamily;
    canvas.style.fontSize = fontSize;
    var ctx = canvas.getContext("2d");
    ctx.font = fontSize + "px " + fontFamily;

    var leadDiv = document.createElement("div");
    leadDiv.style.position = "absolute";
    leadDiv.style.opacity = 0;
    leadDiv.style.font = fontSize + "px " + fontFamily;
    leadDiv.innerHTML = textstring + "<br/>" + textstring;
    document.body.appendChild(leadDiv);

    var w = canvas.width,
        h = canvas.height,
        baseline = h/2;

    ctx.fillStyle = "white";
    ctx.fillRect(-1, -1, w+2, h+2);
    ctx.fillStyle = "black";
    ctx.fillText(textstring, padding/2, baseline);
    var pixelData = ctx.getImageData(0, 0, w, h).data;

    var i = 0,
        w4 = w * 4,
        len = pixelData.length;

    while (++i < len && pixelData[i] === 255) {}
    var ascent = (i/w4)|0;

    i = len - 1;
    while (--i > 0 && pixelData[i] === 255) {}
    var descent = (i/w4)|0;

    for(i = 0; i<len && pixelData[i] === 255; ) {
      i += w4;
      if(i>=len) { i = (i-len) + 4; }}
    var minx = ((i%w4)/4) | 0;

    var step = 1;
    for(i = len-3; i>=0 && pixelData[i] === 255; ) {
      i -= w4;
      if(i<0) { i = (len - 3) - (step++)*4; }}
    var maxx = ((i%w4)/4) + 1 | 0;

    metrics.ascent = (baseline - ascent);
    metrics.descent = (descent - baseline);
    metrics.bounds = { minx: minx - (padding/2),
                       maxx: maxx - (padding/2),
                       miny: 0,
                       maxy: descent-ascent };
    metrics.height = 1+(descent - ascent);

    metrics.leading = 1.2 * fontSize;

    var leadDivHeight = getCSSValue(leadDiv,"height");
    leadDivHeight = leadDivHeight.replace("px","");
    if (leadDivHeight >= fontSize * 2) { metrics.leading = (leadDivHeight/2) | 0; }
    document.body.removeChild(leadDiv); 

    if(debug){show(canvas, ctx, 50, w, h, metrics);}

    return metrics;
  };
}());


var FontDetector = function() {
    var baseFonts = ['monospace', 'sans-serif', 'serif'];

    var testString = "mmmmmmmmmmlli";

    var testSize = '72px';

    var h = document.getElementsByTagName("body")[0];

    var s = document.createElement("span");
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    var defaultWidth = {};
    var defaultHeight = {};
    for (var index in baseFonts) {
        s.style.fontFamily = baseFonts[index];
        h.appendChild(s);
        defaultWidth[baseFonts[index]] = s.offsetWidth; 
        defaultHeight[baseFonts[index]] = s.offsetHeight; 
        h.removeChild(s);
    }

    function detect(font) {
        var detected = false;
        for (var index in baseFonts) {
            s.style.fontFamily = font + ',' + baseFonts[index]; 
            h.appendChild(s);
            var matched = (s.offsetWidth != defaultWidth[baseFonts[index]] || s.offsetHeight != defaultHeight[baseFonts[index]]);
            h.removeChild(s);
            detected = detected || matched;
        }
        return detected;
    }

    this.detect = detect;
};

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-76281500-1', 'auto');
		ga('send', 'pageview');


var gaConfig = {
	eventDetails: null,
	setValues: function (config) {
		var arr = [];
		var configObj = {
			width: 'w' + config.rhythmicGrid.W,
			ratio: 'r' + config.ratio.str,
			baseline: 'b' + config.baseline,
			gutter: 'g' + config.gutter.W
		}
		for (key in configObj) {
			arr.push(configObj[key]);
		}
		this.eventDetails = arr.join();
	}
}


var Lorem;
(function() {

    Lorem = function() {
        this.type = null;
        this.query = null;
        this.data = null;
    };
    Lorem.IMAGE = 1;
    Lorem.TEXT = 2;
    Lorem.TYPE = {
        PARAGRAPH: 1,
        SENTENCE: 2,
        WORD: 3
    };
    Lorem.WORDS = [
        "lorem", "ipsum", "dolor", "sit", "amet,", "consectetur", "adipiscing", "elit", "ut", "aliquam,", "purus", "sit", "amet", "luctus", "venenatis,", "lectus", "magna", "fringilla", "urna,", "porttitor", "rhoncus", "dolor", "purus", "non", "enim", "praesent", "elementum", "facilisis", "leo,", "vel", "fringilla", "est", "ullamcorper", "eget", "nulla", "facilisi", "etiam", "dignissim", "diam", "quis", "enim", "lobortis", "scelerisque", "fermentum", "dui", "faucibus", "in", "ornare", "quam", "viverra", "orci", "sagittis", "eu", "volutpat", "odio", "facilisis", "mauris", "sit", "amet", "massa", "vitae", "tortor", "condimentum", "lacinia", "quis", "vel", "eros", "donec", "ac", "odio", "tempor", "orci", "dapibus", "ultrices", "in", "iaculis", "nunc", "sed", "augue", "lacus,", "viverra", "vitae", "congue", "eu,", "consequat", "ac", "felis", "donec", "et", "odio", "pellentesque", "diam", "volutpat", "commodo", "sed", "egestas", "egestas", "fringilla", "phasellus", "faucibus", "scelerisque", "eleifend", "donec", "pretium", "vulputate", "sapien", "nec", "sagittis", "aliquam", "malesuada", "bibendum", "arcu", "vitae", "elementum",
        "curabitur", "vitae", "nunc", "sed", "velit", "dignissim", "sodales", "ut", "eu", "sem", "integer", "vitae", "justo", "eget", "magna", "fermentum", "iaculis", "eu", "non", "diam", "phasellus", "vestibulum", "lorem", "sed", "risus", "ultricies", "tristique", "nulla", "aliquet", "enim", "tortor,", "at", "auctor", "urna", "nunc", "id", "cursus", "metus", "aliquam", "eleifend", "mi", "in", "nulla", "posuere", "sollicitudin", "aliquam", "ultrices", "sagittis", "orci,", "a", "scelerisque", "purus", "semper", "eget", "duis", "at", "tellus", "at", "urna", "condimentum", "mattis", "pellentesque", "id", "nibh", "tortor,", "id", "aliquet", "lectus", "proin", "nibh", "nisl,", "condimentum", "id", "venenatis", "a,", "condimentum", "vitae", "sapien", "pellentesque", "habitant", "morbi", "tristique", "senectus", "et", "netus", "et", "malesuada", "fames", "ac", "turpis", "egestas", "sed", "tempus,", "urna", "et", "pharetra", "pharetra,", "massa", "massa", "ultricies", "mi,", "quis", "hendrerit", "dolor", "magna", "eget", "est", "lorem", "ipsum", "dolor", "sit", "amet,", "consectetur", "adipiscing", "elit", "pellentesque", "habitant", "morbi", "tristique", "senectus", "et", "netus", "et", "malesuada", "fames", "ac", "turpis", "egestas", "integer", "eget", "aliquet", "nibh", "praesent", "tristique", "magna", "sit", "amet", "purus", "gravida", "quis", "blandit", "turpis", "cursus", "in", "hac", "habitasse", "platea", "dictumst", "quisque", "sagittis,", "purus", "sit", "amet", "volutpat", "consequat,", "mauris", "nunc", "congue", "nisi,", "vitae", "suscipit", "tellus", "mauris", "a", "diam",
        "maecenas", "sed", "enim", "ut", "sem", "viverra", "aliquet", "eget", "sit", "amet", "tellus", "cras", "adipiscing", "enim", "eu", "turpis", "egestas", "pretium", "aenean", "pharetra,", "magna", "ac", "placerat", "vestibulum,", "lectus", "mauris", "ultrices", "eros,", "in", "cursus", "turpis", "massa", "tincidunt", "dui", "ut", "ornare", "lectus", "sit", "amet", "est", "placerat", "in", "egestas", "erat", "imperdiet", "sed", "euismod", "nisi", "porta", "lorem", "mollis", "aliquam", "ut", "porttitor", "leo", "a", "diam", "sollicitudin", "tempor", "id", "eu", "nisl", "nunc", "mi", "ipsum,", "faucibus", "vitae", "aliquet", "nec,", "ullamcorper", "sit", "amet", "risus", "nullam", "eget", "felis", "eget", "nunc", "lobortis", "mattis", "aliquam", "faucibus", "purus", "in", "massa", "tempor", "nec", "feugiat", "nisl", "pretium", "fusce", "id", "velit", "ut", "tortor", "pretium", "viverra", "suspendisse", "potenti", "nullam", "ac", "tortor", "vitae", "purus", "faucibus", "ornare", "suspendisse", "sed", "nisi", "lacus,", "sed", "viverra", "tellus", "in", "hac", "habitasse", "platea", "dictumst", "vestibulum", "rhoncus", "est", "pellentesque", "elit", "ullamcorper", "dignissim", "cras", "tincidunt", "lobortis", "feugiat", "vivamus", "at", "augue", "eget", "arcu", "dictum", "varius", "duis", "at", "consectetur", "lorem",
        "donec", "massa", "sapien,", "faucibus", "et", "molestie", "ac,", "feugiat", "sed", "lectus", "vestibulum", "mattis", "ullamcorper", "velit", "sed", "ullamcorper", "morbi", "tincidunt", "ornare", "massa,", "eget", "egestas", "purus", "viverra", "accumsan", "in", "nisl", "nisi,", "scelerisque", "eu", "ultrices", "vitae,", "auctor", "eu", "augue", "ut", "lectus", "arcu,", "bibendum", "at", "varius", "vel,", "pharetra", "vel", "turpis", "nunc", "eget", "lorem", "dolor,", "sed", "viverra", "ipsum", "nunc", "aliquet", "bibendum", "enim,", "facilisis", "gravida", "neque", "convallis", "a", "cras", "semper", "auctor", "neque,", "vitae", "tempus", "quam", "pellentesque", "nec", "nam", "aliquam", "sem", "et", "tortor", "consequat", "id", "porta", "nibh", "venenatis", "cras", "sed", "felis", "eget", "velit", "aliquet", "sagittis", "id", "consectetur", "purus", "ut", "faucibus", "pulvinar", "elementum", "integer", "enim", "neque,", "volutpat", "ac", "tincidunt", "vitae,", "semper", "quis", "lectus", "nulla", "at", "volutpat", "diam", "ut", "venenatis", "tellus", "in", "metus", "vulputate", "eu", "scelerisque", "felis", "imperdiet", "proin", "fermentum", "leo", "vel", "orci", "porta", "non", "pulvinar", "neque", "laoreet", "suspendisse", "interdum", "consectetur", "libero,", "id", "faucibus", "nisl", "tincidunt", "eget", "nullam", "non", "nisi", "est,", "sit", "amet", "facilisis", "magna",
        "etiam", "tempor,", "orci", "eu", "lobortis", "elementum,", "nibh", "tellus", "molestie", "nunc,", "non", "blandit", "massa", "enim", "nec", "dui", "nunc", "mattis", "enim", "ut", "tellus", "elementum", "sagittis", "vitae", "et", "leo", "duis", "ut", "diam", "quam", "nulla", "porttitor", "massa", "id", "neque", "aliquam", "vestibulum", "morbi", "blandit", "cursus", "risus,", "at", "ultrices", "mi", "tempus", "imperdiet", "nulla", "malesuada", "pellentesque", "elit", "eget", "gravida", "cum", "sociis", "natoque", "penatibus", "et", "magnis", "dis", "parturient", "montes,", "nascetur", "ridiculus", "mus", "mauris", "vitae", "ultricies", "leo", "integer", "malesuada", "nunc", "vel", "risus", "commodo", "viverra", "maecenas", "accumsan,", "lacus", "vel", "facilisis", "volutpat,", "est", "velit", "egestas", "dui,", "id", "ornare", "arcu", "odio", "ut", "sem", "nulla", "pharetra", "diam", "sit", "amet", "nisl", "suscipit", "adipiscing", "bibendum", "est", "ultricies", "integer", "quis", "auctor", "elit",
        "sed", "vulputate", "mi", "sit", "amet", "mauris", "commodo", "quis", "imperdiet", "massa", "tincidunt", "nunc", "pulvinar", "sapien", "et", "ligula", "ullamcorper", "malesuada", "proin", "libero", "nunc,", "consequat", "interdum", "varius", "sit", "amet,", "mattis", "vulputate", "enim", "nulla", "aliquet", "porttitor", "lacus,", "luctus", "accumsan", "tortor", "posuere", "ac", "ut", "consequat", "semper", "viverra", "nam", "libero", "justo,", "laoreet", "sit", "amet", "cursus", "sit", "amet,", "dictum", "sit", "amet", "justo", "donec", "enim", "diam,", "vulputate", "ut", "pharetra", "sit", "amet,", "aliquam", "id", "diam", "maecenas", "ultricies", "mi", "eget", "mauris", "pharetra", "et", "ultrices", "neque", "ornare", "aenean", "euismod", "elementum", "nisi,", "quis", "eleifend", "quam", "adipiscing", "vitae", "proin", "sagittis,", "nisl", "rhoncus", "mattis", "rhoncus,", "urna", "neque", "viverra", "justo,", "nec", "ultrices", "dui", "sapien", "eget", "mi", "proin", "sed", "libero", "enim,", "sed", "faucibus", "turpis", "in", "eu", "mi", "bibendum", "neque", "egestas", "congue", "quisque", "egestas", "diam", "in", "arcu", "cursus", "euismod", "quis", "viverra", "nibh", "cras", "pulvinar", "mattis", "nunc,", "sed", "blandit", "libero", "volutpat", "sed", "cras", "ornare", "arcu", "dui", "vivamus", "arcu", "felis,", "bibendum", "ut", "tristique", "et,", "egestas", "quis", "ipsum", "suspendisse", "ultrices", "gravida", "dictum",
        "fusce", "ut", "placerat", "orci", "nulla", "pellentesque", "dignissim", "enim,", "sit", "amet", "venenatis", "urna", "cursus", "eget", "nunc", "scelerisque", "viverra", "mauris,", "in", "aliquam", "sem", "fringilla", "ut", "morbi", "tincidunt", "augue", "interdum", "velit", "euismod", "in", "pellentesque", "massa", "placerat", "duis", "ultricies", "lacus", "sed", "turpis", "tincidunt", "id", "aliquet", "risus", "feugiat", "in", "ante", "metus,", "dictum", "at", "tempor", "commodo,", "ullamcorper", "a", "lacus", "vestibulum", "sed", "arcu", "non", "odio", "euismod", "lacinia", "at", "quis", "risus", "sed", "vulputate", "odio", "ut", "enim", "blandit", "volutpat", "maecenas", "volutpat", "blandit", "aliquam", "etiam", "erat", "velit,", "scelerisque", "in", "dictum", "non,", "consectetur", "a", "erat", "nam", "at", "lectus", "urna", "duis", "convallis", "convallis", "tellus,", "id", "interdum", "velit", "laoreet", "id", "donec", "ultrices", "tincidunt", "arcu,", "non", "sodales", "neque", "sodales", "ut", "etiam", "sit", "amet", "nisl", "purus,", "in", "mollis", "nunc",
        "sed", "id", "semper", "risus", "in", "hendrerit", "gravida", "rutrum", "quisque", "non", "tellus", "orci,", "ac", "auctor", "augue", "mauris", "augue", "neque,", "gravida", "in", "fermentum", "et,", "sollicitudin", "ac", "orci", "phasellus", "egestas", "tellus", "rutrum", "tellus", "pellentesque", "eu", "tincidunt", "tortor", "aliquam", "nulla", "facilisi", "cras", "fermentum,", "odio", "eu", "feugiat", "pretium,", "nibh", "ipsum", "consequat", "nisl,", "vel", "pretium", "lectus", "quam", "id", "leo", "in", "vitae", "turpis", "massa", "sed", "elementum", "tempus", "egestas", "sed", "sed", "risus", "pretium", "quam", "vulputate", "dignissim", "suspendisse", "in", "est", "ante", "in", "nibh", "mauris,", "cursus", "mattis", "molestie", "a,", "iaculis", "at", "erat",
        "pellentesque", "adipiscing", "commodo", "elit,", "at", "imperdiet", "dui", "accumsan", "sit", "amet", "nulla", "facilisi", "morbi", "tempus", "iaculis", "urna,", "id", "volutpat", "lacus", "laoreet", "non", "curabitur", "gravida", "arcu", "ac", "tortor", "dignissim", "convallis", "aenean", "et", "tortor", "at", "risus", "viverra", "adipiscing", "at", "in", "tellus", "integer", "feugiat", "scelerisque", "varius", "morbi", "enim", "nunc,", "faucibus", "a", "pellentesque", "sit", "amet,", "porttitor", "eget", "dolor", "morbi", "non", "arcu", "risus,", "quis", "varius", "quam", "quisque", "id", "diam", "vel", "quam", "elementum", "pulvinar", "etiam", "non", "quam", "lacus", "suspendisse", "faucibus", "interdum", "posuere", "lorem", "ipsum", "dolor", "sit", "amet,", "consectetur", "adipiscing", "elit", "duis", "tristique", "sollicitudin", "nibh", "sit", "amet", "commodo", "nulla", "facilisi",
        "nullam", "vehicula", "ipsum", "a", "arcu", "cursus", "vitae", "congue", "mauris", "rhoncus", "aenean", "vel", "elit", "scelerisque", "mauris", "pellentesque", "pulvinar", "pellentesque", "habitant", "morbi", "tristique", "senectus", "et", "netus", "et", "malesuada", "fames", "ac", "turpis", "egestas", "maecenas", "pharetra", "convallis", "posuere", "morbi", "leo", "urna,", "molestie", "at", "elementum", "eu,", "facilisis", "sed", "odio", "morbi", "quis", "commodo", "odio", "aenean", "sed", "adipiscing", "diam", "donec", "adipiscing", "tristique", "risus", "nec", "feugiat", "in", "fermentum", "posuere", "urna", "nec", "tincidunt", "praesent", "semper", "feugiat", "nibh", "sed", "pulvinar", "proin", "gravida", "hendrerit", "lectus", "a", "molestie"
    ];
    Lorem.prototype.randomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    Lorem.prototype.createText = function(count, type) {
        switch (type) {
            case Lorem.TYPE.PARAGRAPH:
                var paragraphs = new Array;
                for (var i = 0; i < count; i++) {
                    var paragraphLength = this.randomInt(10, 20);
                    var paragraph = this.createText(paragraphLength, Lorem.TYPE.SENTENCE);
                    paragraphs.push('<p>'+paragraph+'</p>');
                }
                return paragraphs.join('\n');
                break;
            case Lorem.TYPE.SENTENCE:
                var sentences = new Array;
                for (var i = 0; i < count; i++) {
                    var sentenceLength = this.randomInt(5, 10);
                    var words = this.createText(sentenceLength, Lorem.TYPE.WORD).split(' ');
                    words[0] = words[0].substr(0, 1).toUpperCase() + words[0].substr(1);
                    var sentence = words.join(' ');

                    sentences.push(sentence);
                }
                return (sentences.join('. ') + '.').replace(/(\.\,|\,\.)/g, '.');
                break;
            case Lorem.TYPE.WORD:
                var wordIndex = this.randomInt(0, Lorem.WORDS.length - count - 1);

                return Lorem.WORDS.slice(wordIndex, wordIndex + count).join(' ').replace(/\.|\,/g, '');
                break;
        }
    };
    Lorem.prototype.createLorem = function(element) {

        var lorem = new Array;
        var count;

                if (/\d+-\d+[psw]/.test(this.query)){
            var range = this.query.replace(/[a-z]/,'').split("-");
            count = Math.floor(Math.random() * parseInt(range[1])) + parseInt(range[0]);
        }else{
            count = parseInt(this.query); 
        }

                if (/\d+p/.test(this.query)) {
            var type = Lorem.TYPE.PARAGRAPH;
        }
        else if (/\d+s/.test(this.query)) {
            var type = Lorem.TYPE.SENTENCE;
        }
        else if (/\d+w/.test(this.query)) {
            var type = Lorem.TYPE.WORD;
        }

        lorem.push(this.createText(count, type));
        lorem = lorem.join(' ');

        if (element) {
            if (this.type == Lorem.TEXT)
                element.innerHTML += lorem;
            else if (this.type == Lorem.IMAGE) {
                var path = '';
                var options = this.query.split(' ');
                if (options[0] == 'gray') {
                    path += '/g';
                    options[0] = '';
                }
                if (element.getAttribute('width'))
                    path += '/' + element.getAttribute('width');

                if (element.getAttribute('height'))
                    path += '/' + element.getAttribute('height');

                path += '/' + options.join(' ').replace(/(^\s+|\s+$)/, '');
                element.src = 'http://lorempixum.com'+path.replace(/\/\//, '/');
            }
        }

        if (element == null)
            return lorem;
    };

    if (typeof jQuery != 'undefined') {
        (function($) {
            $.fn.lorem = function() {
                $(this).each(function() {
                    var lorem = new Lorem;
                    lorem.type = $(this).is('img') ? Lorem.IMAGE : Lorem.TEXT;
                    lorem.query = $(this).data('lorem');
                    lorem.createLorem(this);
                })
            };

            $(document).ready(function() {
                $('[data-lorem]').lorem();
            });
        })(jQuery);
    }

})();


var Pre3d = (function() {


  function crossProduct(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  function dotProduct2d(a, b) {
    return a.x * b.x + a.y * b.y;
  }
  function dotProduct3d(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function subPoints2d(a, b) {
    return {x: a.x - b.x, y: a.y - b.y};
  }
  function subPoints3d(a, b) {
    return {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z};
  }

  function subPoints2dIP(c, a, b) {
    c.x = a.x - b.x;
    c.y = a.y - b.y;
    return c;
  }
  function subPoints3dIP(c, a, b) {
    c.x = a.x - b.x;
    c.y = a.y - b.y;
    c.z = a.z - b.z;
    return c;
  }

  function addPoints2d(a, b) {
    return {x: a.x + b.x, y: a.y + b.y};
  }
  function addPoints3d(a, b) {
    return {x: a.x + b.x, y: a.y + b.y, z: a.z + b.z};
  }

  function addPoints2dIP(c, a, b) {
    c.x = a.x + b.x;
    c.y = a.y + b.y;
    return c;
  }
  function addPoints3dIP(c, a, b) {
    c.x = a.x + b.x;
    c.y = a.y + b.y;
    c.z = a.z + b.z;
    return c;
  }

  function mulPoint2d(a, s) {
    return {x: a.x * s, y: a.y * s};
  }
  function mulPoint3d(a, s) {
    return {x: a.x * s, y: a.y * s, z: a.z * s};
  }

  function vecMag2d(a) {
    var ax = a.x, ay = a.y;
    return Math.sqrt(ax * ax + ay * ay);
  }
  function vecMag3d(a) {
    var ax = a.x, ay = a.y, az = a.z;
    return Math.sqrt(ax * ax + ay * ay + az * az);
  }

  function unitVector2d(a) {
    return mulPoint2d(a, 1 / vecMag2d(a));
  }
  function unitVector3d(a) {
    return mulPoint3d(a, 1 / vecMag3d(a));
  }

  function linearInterpolate(a, b, d) {
    return (b-a)*d + a;
  }

  function linearInterpolatePoints3d(a, b, d) {
    return {
      x: (b.x-a.x)*d + a.x,
      y: (b.y-a.y)*d + a.y,
      z: (b.z-a.z)*d + a.z
    }
  }

  function AffineMatrix(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11) {
    this.e0  = e0;
    this.e1  = e1;
    this.e2  = e2;
    this.e3  = e3;
    this.e4  = e4;
    this.e5  = e5;
    this.e6  = e6;
    this.e7  = e7;
    this.e8  = e8;
    this.e9  = e9;
    this.e10 = e10;
    this.e11 = e11;
  };

  function multiplyAffine(a, b) {
    var a0 = a.e0, a1 = a.e1, a2 = a.e2, a3 = a.e3, a4 = a.e4, a5 = a.e5;
    var a6 = a.e6, a7 = a.e7, a8 = a.e8, a9 = a.e9, a10 = a.e10, a11 = a.e11;
    var b0 = b.e0, b1 = b.e1, b2 = b.e2, b3 = b.e3, b4 = b.e4, b5 = b.e5;
    var b6 = b.e6, b7 = b.e7, b8 = b.e8, b9 = b.e9, b10 = b.e10, b11 = b.e11;

    return new AffineMatrix(
      a0 * b0 + a1 * b4 + a2 * b8,
      a0 * b1 + a1 * b5 + a2 * b9,
      a0 * b2 + a1 * b6 + a2 * b10,
      a0 * b3 + a1 * b7 + a2 * b11 + a3,
      a4 * b0 + a5 * b4 + a6 * b8,
      a4 * b1 + a5 * b5 + a6 * b9,
      a4 * b2 + a5 * b6 + a6 * b10,
      a4 * b3 + a5 * b7 + a6 * b11 + a7,
      a8 * b0 + a9 * b4 + a10 * b8,
      a8 * b1 + a9 * b5 + a10 * b9,
      a8 * b2 + a9 * b6 + a10 * b10,
      a8 * b3 + a9 * b7 + a10 * b11 + a11
    );
  }

  function makeIdentityAffine() {
    return new AffineMatrix(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0
    );
  }

  function makeRotateAffineX(theta) {
    var s = Math.sin(theta);
    var c = Math.cos(theta);
    return new AffineMatrix(
      1, 0,  0, 0,
      0, c, -s, 0,
      0, s,  c, 0
    );
  }

  function makeRotateAffineY(theta) {
    var s = Math.sin(theta);
    var c = Math.cos(theta);
    return new AffineMatrix(
       c, 0, s, 0,
       0, 1, 0, 0,
      -s, 0, c, 0
    );
  }

  function makeRotateAffineZ(theta) {
    var s = Math.sin(theta);
    var c = Math.cos(theta);
    return new AffineMatrix(
      c, -s, 0, 0,
      s,  c, 0, 0,
      0,  0, 1, 0
    );
  }

  function makeTranslateAffine(dx, dy, dz) {
    return new AffineMatrix(
      1, 0, 0, dx,
      0, 1, 0, dy,
      0, 0, 1, dz
    );
  }

  function makeScaleAffine(sx, sy, sz) {
    return new AffineMatrix(
      sx,  0,  0, 0,
       0, sy,  0, 0,
       0,  0, sz, 0
    );
  }

  function dupAffine(m) {
    return new AffineMatrix(
        m.e0, m.e1, m.e2, m.e3,
        m.e4, m.e5, m.e6, m.e7,
        m.e8, m.e9, m.e10, m.e11);
  }

  function transAdjoint(a) {
    var a0 = a.e0, a1 = a.e1, a2 = a.e2, a4 = a.e4, a5 = a.e5;
    var a6 = a.e6, a8 = a.e8, a9 = a.e9, a10 = a.e10;
    return new AffineMatrix(
      a10 * a5 - a6 * a9,
      a6 * a8 - a4 * a10,
      a4 * a9 - a8 * a5,
      0,
      a2 * a9 - a10 * a1,
      a10 * a0 - a2 * a8,
      a8 * a1 - a0 * a9,
      0,
      a6 * a1 - a2 * a5,
      a4 * a2 - a6 * a0,
      a0 * a5 - a4 * a1,
      0
    );
  }

  function transformPoint(t, p) {
    return {
      x: t.e0 * p.x + t.e1 * p.y + t.e2  * p.z + t.e3,
      y: t.e4 * p.x + t.e5 * p.y + t.e6  * p.z + t.e7,
      z: t.e8 * p.x + t.e9 * p.y + t.e10 * p.z + t.e11
    };
  }

  function Transform() {
    this.reset();
  }

  Transform.prototype.reset = function() {
    this.m = makeIdentityAffine();
  };

  Transform.prototype.rotateX = function(theta) {
    this.m =
        multiplyAffine(makeRotateAffineX(theta), this.m);
  };
  Transform.prototype.rotateXPre = function(theta) {
    this.m =
        multiplyAffine(this.m, makeRotateAffineX(theta));
  };

  Transform.prototype.rotateY = function(theta) {
    this.m =
        multiplyAffine(makeRotateAffineY(theta), this.m);
  };
  Transform.prototype.rotateYPre = function(theta) {
    this.m =
        multiplyAffine(this.m, makeRotateAffineY(theta));
  };

  Transform.prototype.rotateZ = function(theta) {
    this.m =
        multiplyAffine(makeRotateAffineZ(theta), this.m);
  };
  Transform.prototype.rotateZPre = function(theta) {
    this.m =
        multiplyAffine(this.m, makeRotateAffineZ(theta));
  };

  Transform.prototype.translate = function(dx, dy, dz) {
    this.m =
        multiplyAffine(makeTranslateAffine(dx, dy, dz), this.m);
  };
  Transform.prototype.translatePre = function(dx, dy, dz) {
    this.m =
        multiplyAffine(this.m, makeTranslateAffine(dx, dy, dz));
  };

  Transform.prototype.scale = function(sx, sy, sz) {
    this.m =
        multiplyAffine(makeScaleAffine(sx, sy, sz), this.m);
  };

  Transform.prototype.scalePre = function(sx, sy, sz) {
    this.m =
        multiplyAffine(this.m, makeScaleAffine(sx, sy, sz));
  };

  Transform.prototype.transformPoint = function(p) {
    return transformPoint(this.m, p);
  };

  Transform.prototype.multTransform = function(t) {
    this.m = multiplyAffine(this.m, t.m);
  };

  Transform.prototype.setDCM = function(u, v, w) {
    var m = this.m;
    m.e0 = u.x; m.e4 = u.y; m.e8 = u.z;
    m.e1 = v.x; m.e5 = v.y; m.e9 = v.z;
    m.e2 = w.x; m.e6 = w.y; m.e10 = w.z;
  };

  Transform.prototype.dup = function() {
    var tm = new Transform();
    tm.m = dupAffine(this.m);
    return tm;
  };

  function transformPoints(t, ps) {
    var il = ps.length;
    var out = Array(il);
    for (var i = 0; i < il; ++i) {
      out[i] = transformPoint(t, ps[i]);
    }
    return out;
  }

  function averagePoints(ps) {
    var avg = {x: 0, y: 0, z: 0};
    for (var i = 0, il = ps.length; i < il; ++i) {
      var p = ps[i];
      avg.x += p.x;
      avg.y += p.y;
      avg.z += p.z;
    }

    var f = 1 / il;

    avg.x *= f;
    avg.y *= f;
    avg.z *= f;

    return avg;
  }

  function pushPoints2dIP(a, b) {
    var vec = unitVector2d(subPoints2d(b, a));
    addPoints2dIP(b, b, vec);
    subPoints2dIP(a, a, vec);
  }

  function RGBA(r, g, b, a) {
    this.setRGBA(r, g, b, a);
  };

  RGBA.prototype.setRGBA = function(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  };

  RGBA.prototype.setRGB = function(r, g, b) {
    this.setRGBA(r, g, b, 1);
  };

  RGBA.prototype.invert = function() {
    this.r = 1 - this.r;
    this.g = 1 - this.g;
    this.b = 1 - this.b;
  };

  RGBA.prototype.dup = function() {
    return new RGBA(this.r, this.g, this.b, this.a);
  };

  function QuadFace(i0, i1, i2, i3) {
    this.i0 = i0;
    this.i1 = i1;
    this.i2 = i2;
    this.i3 = i3;

    this.centroid = null;
    this.normal1 = null;
    this.normal2 = null;
  }

  QuadFace.prototype.isTriangle = function() {
    return (this.i3 === null);
  };

  QuadFace.prototype.setQuad = function(i0, i1, i2, i3) {
    this.i0 = i0;
    this.i1 = i1;
    this.i2 = i2;
    this.i3 = i3;
  };

  QuadFace.prototype.setTriangle = function(i0, i1, i2) {
    this.i0 = i0;
    this.i1 = i1;
    this.i2 = i2;
    this.i3 = null;
  };

  function Shape() {
    this.vertices = [ ];
    this.quads = [ ];
  }

  function Curve(ep, c0, c1) {
    this.ep = ep;  
    this.c0 = c0;  
    this.c1 = c1;  
  }

  Curve.prototype.isQuadratic = function() {
    return (this.c1 === null);
  };

  Curve.prototype.setQuadratic = function(ep, c0) {
    this.ep = ep;
    this.c0 = c0;
    this.c1 = null;
  };

  Curve.prototype.setCubic = function(ep, c0, c1) {
    this.ep = ep;
    this.c0 = c0;
    this.c1 = c1;
  };

  function Path() {
    this.points = [ ];
    this.curves = [ ];
    this.starting_point = null;
  }

  function Camera() {
    this.transform = new Transform();
    this.focal_length = 1;
  }

  function TextureInfo() {
    this.image = null;
    this.u0 = null;
    this.v0 = null;
    this.u1 = null;
    this.v1 = null;
    this.u2 = null;
    this.v2 = null;
    this.u3 = null;
    this.v3 = null;
  };

  function Renderer(canvas_element) {
    this.perform_z_sorting = true;
    this.draw_overdraw = true;
    this.draw_backfaces = false;

    this.texture = null;
    this.fill_rgba = new RGBA(1, 0, 0, 1);

    this.stroke_rgba = null;

    this.normal1_rgba = null;
    this.normal2_rgba = null;

    this.canvas = canvas_element;
    this.ctx = canvas_element.getContext('2d');

    this.camera = new Camera();

    this.transform = new Transform();

    this.transform_stack_ = [ ];

    this.quad_callback = null;

    this.width_  = canvas_element.width;
    this.height_ = canvas_element.height;
    this.scale_ = this.height_ / 2;
    this.xoff_ = this.width_ / 2;

    this.buffered_quads_ = null;
    this.emptyBuffer();

    if (this.ctx.setStrokeColor == null) {
      this.ctx.setStrokeColor = function setStrokeColor(r, g, b, a) {
        var rgba = [
          Math.floor(r * 255),
          Math.floor(g * 255),
          Math.floor(b * 255),
          a
        ];
        this.strokeStyle = 'rgba(' + rgba.join(',') + ')';
      }
    }
    if (this.ctx.setFillColor == null) {
      this.ctx.setFillColor = function setFillColor(r, g, b, a) {
        var rgba = [
          Math.floor(r * 255),
          Math.floor(g * 255),
          Math.floor(b * 255),
          a
        ];
        this.fillStyle = 'rgba(' + rgba.join(',') + ')';
      }
    }
  }

  Renderer.prototype.pushTransform = function() {
    this.transform_stack_.push(this.transform.dup());
  };

  Renderer.prototype.popTransform = function() {
    this.transform = this.transform_stack_.pop();
  };

  Renderer.prototype.emptyBuffer = function() {
    this.buffered_quads_ = [ ];
  };


  Renderer.prototype.projectPointToCanvas = function projectPointToCanvas(p) {
    var v = this.camera.focal_length / -p.z;
    var scale = this.scale_;
    return {x: p.x * v * scale + this.xoff_,
            y: p.y * v * -scale + scale};
  };

  Renderer.prototype.projectPointsToCanvas =
      function projectPointsToCanvas(ps) {
    var il = ps.length;
    var out = Array(il);
    for (var i = 0; i < il; ++i) {
      out[i] = this.projectPointToCanvas(ps[i]);
    }
    return out;
  };

  Renderer.prototype.projectQuadFaceToCanvasIP = function(qf) {
    qf.i0 = this.projectPointToCanvas(qf.i0);
    qf.i1 = this.projectPointToCanvas(qf.i1);
    qf.i2 = this.projectPointToCanvas(qf.i2);
    if (!qf.isTriangle())
      qf.i3 = this.projectPointToCanvas(qf.i3);
    return qf;
  };

  function drawCanvasTexturedTriangle(ctx, im,
                                      x0, y0, x1, y1, x2, y2,
                                      sx0, sy0, sx1, sy1, sx2, sy2) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.clip();

    var denom =
        sx0 * (sy2 - sy1) -
        sx1 * sy2 +
        sx2 * sy1 +
        (sx1 - sx2) * sy0;

    var m11 = - (
        sy0 * (x2 - x1) -
        sy1 * x2 +
        sy2 * x1 +
        (sy1 - sy2) * x0) / denom;
    var m12 = (
        sy1 * y2 +
        sy0 * (y1 - y2) -
        sy2 * y1 +
        (sy2 - sy1) * y0) / denom;
    var m21 = (
        sx0 * (x2 - x1) -
        sx1 * x2 +
        sx2 * x1 +
        (sx1 - sx2) * x0) / denom;
    var m22 = - (
        sx1 * y2 +
        sx0 * (y1 - y2) -
        sx2 * y1 +
        (sx2 - sx1) * y0) / denom;
    var dx = (
        sx0 * (sy2 * x1 - sy1 * x2) +
        sy0 * (sx1 * x2 - sx2 * x1) +
        (sx2 * sy1 - sx1 * sy2) * x0) / denom;
    var dy = (
        sx0 * (sy2 * y1 - sy1 * y2) +
        sy0 * (sx1 * y2 - sx2 * y1) +
        (sx2 * sy1 - sx1 * sy2) * y0) / denom;

    ctx.transform(m11, m12, m21, m22, dx, dy);

    ctx.drawImage(im, 0, 0);
    ctx.restore();
  }

  var g_z_axis_vector = {x: 0, y: 0, z: 1};

  Renderer.prototype.bufferShape = function bufferShape(shape) {
    var draw_backfaces = this.draw_backfaces;
    var quad_callback = this.quad_callback;

    var t = multiplyAffine(this.camera.transform.m,
                           this.transform.m);
    var tn = transAdjoint(t);

    var world_vertices = transformPoints(t, shape.vertices);
    var quads = shape.quads;

    for (var j = 0, jl = shape.quads.length; j < jl; ++j) {
      var qf = quads[j];

      if (quad_callback !== null && quad_callback(qf, j, shape) === true)
        continue;

      var centroid = transformPoint(t, qf.centroid);

      if (centroid.z >= -1)
        continue;

      var n1 = unitVector3d(transformPoint(tn, qf.normal1));
      var n2 = transformPoint(tn, qf.normal2);

      if (draw_backfaces !== true &&
          dotProduct3d(centroid, n1) > 0 &&
          dotProduct3d(centroid, n2) > 0) {
        continue;
      }

      var intensity = dotProduct3d(g_z_axis_vector, n1);
      if (intensity < 0)
        intensity = 0;

      var world_qf;

      if (qf.isTriangle() === true) {
        world_qf = new QuadFace(
          world_vertices[qf.i0],
          world_vertices[qf.i1],
          world_vertices[qf.i2],
          null
        );
      } else {
        world_qf = new QuadFace(
          world_vertices[qf.i0],
          world_vertices[qf.i1],
          world_vertices[qf.i2],
          world_vertices[qf.i3]
        );
      }

      world_qf.centroid = centroid;
      world_qf.normal1 = n1;
      world_qf.normal2 = n2;

      var obj = {
        qf: world_qf,
        intensity: intensity,
        draw_overdraw: this.draw_overdraw,
        texture: this.texture,
        fill_rgba: this.fill_rgba,
        stroke_rgba: this.stroke_rgba,
        normal1_rgba: this.normal1_rgba,
        normal2_rgba: this.normal2_rgba
      };

      this.buffered_quads_.push(obj);
    }
  };

  function zSorter(x, y) {
    return x.qf.centroid.z - y.qf.centroid.z;
  }

  Renderer.prototype.drawBackground = function() {
    this.ctx.fillRect(0, 0, this.width_, this.height_);
  };

  Renderer.prototype.clearBackground = function() {
    this.ctx.clearRect(0, 0, this.width_, this.height_);
  };

  Renderer.prototype.drawBuffer = function drawBuffer() {
    var ctx = this.ctx;

    var all_quads = this.buffered_quads_;
    var num_quads = all_quads.length;

    if (this.perform_z_sorting === true)
      all_quads.sort(zSorter);

    for (var j = 0; j < num_quads; ++j) {
      var obj = all_quads[j];
      var qf = obj.qf;

      this.projectQuadFaceToCanvasIP(qf);

      var is_triangle = qf.isTriangle();

      if (obj.draw_overdraw === true) {

        pushPoints2dIP(qf.i0, qf.i1);
        pushPoints2dIP(qf.i1, qf.i2);
        if (is_triangle === true) {
          pushPoints2dIP(qf.i2, qf.i0);
        } else {  
          pushPoints2dIP(qf.i2, qf.i3);
          pushPoints2dIP(qf.i3, qf.i0);
        }
      }

      ctx.beginPath();
      ctx.moveTo(qf.i0.x, qf.i0.y);
      ctx.lineTo(qf.i1.x, qf.i1.y);
      ctx.lineTo(qf.i2.x, qf.i2.y);
      if (is_triangle !== true)
        ctx.lineTo(qf.i3.x, qf.i3.y);

      var frgba = obj.fill_rgba;
      if (frgba !== null) {
        var iy = obj.intensity;
        ctx.setFillColor(frgba.r * iy, frgba.g * iy, frgba.b * iy, frgba.a);
        ctx.fill();
      }

      var texture = obj.texture;
      if (texture !== null) {
        drawCanvasTexturedTriangle(ctx, texture.image,
          qf.i0.x, qf.i0.y, qf.i1.x, qf.i1.y, qf.i2.x, qf.i2.y,
          texture.u0, texture.v0, texture.u1, texture.v1,
          texture.u2, texture.v2);
        if (!is_triangle) {
          drawCanvasTexturedTriangle(ctx, texture.image,
            qf.i0.x, qf.i0.y, qf.i2.x, qf.i2.y, qf.i3.x, qf.i3.y,
            texture.u0, texture.v0, texture.u2, texture.v2,
            texture.u3, texture.v3);
        }
      }

      var srgba = obj.stroke_rgba;
      if (srgba !== null) {
        ctx.closePath();
        ctx.setStrokeColor(srgba.r, srgba.g, srgba.b, srgba.a);
        ctx.stroke();
      }

      var n1r = obj.normal1_rgba;
      var n2r = obj.normal2_rgba;
      if (n1r !== null) {
        ctx.setStrokeColor(n1r.r, n1r.g, n1r.b, n1r.a);
        var screen_centroid = this.projectPointToCanvas(qf.centroid);
        var screen_point = this.projectPointToCanvas(
            addPoints3d(qf.centroid, unitVector3d(qf.normal1)));
        ctx.beginPath();
        ctx.moveTo(screen_centroid.x, screen_centroid.y);
        ctx.lineTo(screen_point.x, screen_point.y);
        ctx.stroke();
      }
      if (n2r !== null) {
        ctx.setStrokeColor(n2r.r, n2r.g, n2r.b, n2r.a);
        var screen_centroid = this.projectPointToCanvas(qf.centroid);
        var screen_point = this.projectPointToCanvas(
            addPoints3d(qf.centroid, unitVector3d(qf.normal2)));
        ctx.beginPath();
        ctx.moveTo(screen_centroid.x, screen_centroid.y);
        ctx.lineTo(screen_point.x, screen_point.y);
        ctx.stroke();
      }
    }

    return num_quads;
  }

  Renderer.prototype.drawPath = function drawPath(path, opts) {
    var ctx = this.ctx;
    opts = opts || { };

    var t = multiplyAffine(this.camera.transform.m,
                           this.transform.m);

    var screen_points = this.projectPointsToCanvas(
        transformPoints(t, path.points));

    var start_point = (path.starting_point === null ?
        this.projectPointToCanvas(transformPoint(t, {x: 0, y: 0, z: 0})) :
        screen_points[path.starting_point]);

    ctx.beginPath();
    ctx.moveTo(start_point.x, start_point.y);

    var curves = path.curves;
    for (var j = 0, jl = curves.length; j < jl; ++j) {
      var curve = curves[j];

      if (curve.isQuadratic() === true) {
        var c0 = screen_points[curve.c0];
        var ep = screen_points[curve.ep];
        ctx.quadraticCurveTo(c0.x, c0.y, ep.x, ep.y);
      } else {
        var c0 = screen_points[curve.c0];
        var c1 = screen_points[curve.c1];
        var ep = screen_points[curve.ep];
        ctx.bezierCurveTo(c0.x, c0.y, c1.x, c1.y, ep.x, ep.y);
      }
    }

    if (opts.fill === true) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  };

  return {
    RGBA: RGBA,
    AffineMatrix: AffineMatrix,
    Transform: Transform,
    QuadFace: QuadFace,
    Shape: Shape,
    Curve: Curve,
    Path: Path,
    Camera: Camera,
    TextureInfo: TextureInfo,
    Renderer: Renderer,
    Math: {
      crossProduct: crossProduct,
      dotProduct2d: dotProduct2d,
      dotProduct3d: dotProduct3d,
      subPoints2d: subPoints2d,
      subPoints3d: subPoints3d,
      addPoints2d: addPoints2d,
      addPoints3d: addPoints3d,
      mulPoint2d: mulPoint2d,
      mulPoint3d: mulPoint3d,
      vecMag2d: vecMag2d,
      vecMag3d: vecMag3d,
      unitVector2d: unitVector2d,
      unitVector3d: unitVector3d,
      linearInterpolate: linearInterpolate,
      linearInterpolatePoints3d: linearInterpolatePoints3d,
      averagePoints: averagePoints
    }
  };
})();


Pre3d.ShapeUtils = (function() {

  var crossProduct = Pre3d.Math.crossProduct;
  var dotProduct2d = Pre3d.Math.dotProduct2d;
  var dotProduct3d = Pre3d.Math.dotProduct3d;
  var subPoints2d = Pre3d.Math.subPoints2d;
  var subPoints3d = Pre3d.Math.subPoints3d;
  var addPoints2d = Pre3d.Math.addPoints2d;
  var addPoints3d = Pre3d.Math.addPoints3d;
  var mulPoint2d = Pre3d.Math.mulPoint2d;
  var mulPoint3d = Pre3d.Math.mulPoint3d;
  var vecMag2d = Pre3d.Math.vecMag2d;
  var vecMag3d = Pre3d.Math.vecMag3d;
  var unitVector2d = Pre3d.Math.unitVector2d;
  var unitVector3d = Pre3d.Math.unitVector3d;
  var linearInterpolate = Pre3d.Math.linearInterpolate;
  var linearInterpolatePoints3d = Pre3d.Math.linearInterpolatePoints3d;
  var averagePoints = Pre3d.Math.averagePoints;

  var k2PI = Math.PI * 2;

  function averagePoints2(a, b) {
    return {
      x: (a.x + b.x) * 0.5,
      y: (a.y + b.y) * 0.5,
      z: (a.z + b.z) * 0.5
    };
  }

  function rebuildMeta(shape) {
    var quads = shape.quads;
    var num_quads = quads.length;
    var vertices = shape.vertices;


    for (var i = 0; i < num_quads; ++i) {
      var qf = quads[i];

      var centroid;
      var n1, n2;

      var vert0 = vertices[qf.i0];
      var vert1 = vertices[qf.i1];
      var vert2 = vertices[qf.i2];
      var vec01 = subPoints3d(vert1, vert0);
      var vec02 = subPoints3d(vert2, vert0);
      var n1 = crossProduct(vec01, vec02);

      if (qf.isTriangle()) {
        n2 = n1;
        centroid = averagePoints([vert0, vert1, vert2]);
      } else {
        var vert3 = vertices[qf.i3];
        var vec03 = subPoints3d(vert3, vert0);
        n2 = crossProduct(vec02, vec03);
        centroid = averagePoints([vert0, vert1, vert2, vert3]);
      }

      qf.centroid = centroid;
      qf.normal1 = n1;
      qf.normal2 = n2;
    }

    return shape;
  }

  function triangulate(shape) {
    var quads = shape.quads;
    var num_quads = quads.length;
    for (var i = 0; i < num_quads; ++i) {
      var qf = quads[i];
      if (qf.isTriangle())
        continue;

      var newtri = new Pre3d.QuadFace(qf.i0, qf.i2, qf.i3, null);
      qf.i3 = null;
      quads.push(newtri);
    }
    rebuildMeta(shape);
    return shape;
  }

  function forEachFace(shape, func) {
    var quads = shape.quads;
    for (var i = 0, il = quads.length; i < il; ++i) {
      if (func(quads[i], i, shape) === true)
        break;
    }
    return shape;
  }

  function forEachVertex(shape, func) {
    var vertices = shape.vertices;
    for (var i = 0, il = vertices.length; i < il; ++i) {
      if (func(vertices[i], i, shape) === true)
        break;
    }
    return shape;
  }

  function makePlane(p1, p2, p3, p4) {
    var s = new Pre3d.Shape();
    s.vertices = [p1, p2, p3, p4];
    s.quads = [new Pre3d.QuadFace(0, 1, 2, 3)];
    rebuildMeta(s);
    return s;
  }

  function makeBox(w, h, d) {
    var s = new Pre3d.Shape();
    s.vertices = [
      {x:  w, y:  h, z: -d},  
      {x:  w, y:  h, z:  d},  
      {x:  w, y: -h, z:  d},  
      {x:  w, y: -h, z: -d},  
      {x: -w, y:  h, z: -d},  
      {x: -w, y:  h, z:  d},  
      {x: -w, y: -h, z:  d},  
      {x: -w, y: -h, z: -d}   
    ];


    s.quads = [
      new Pre3d.QuadFace(0, 1, 2, 3),  
      new Pre3d.QuadFace(1, 5, 6, 2),  
      new Pre3d.QuadFace(5, 4, 7, 6),  
      new Pre3d.QuadFace(4, 0, 3, 7),  
      new Pre3d.QuadFace(0, 4, 5, 1),  
      new Pre3d.QuadFace(2, 6, 7, 3)   
    ];

    rebuildMeta(s);

    return s;
  }

  function makeTesseractVertices(phase){
    var whd = 1;
    var pi = Math.PI;
    var periodZ = function(phase){
        var phase = phase % (2 * pi);
        var correction = function(phase) { return - Math.sin(2 * phase - pi); }
        return phase > pi / 2 && phase < pi * 3 / 2  
                ?   Math.sin(phase) + 1/3 * correction(phase)
                :   Math.sin(phase)
    };
    var l = whd / 2;
    var h = whd;
    var a = (h - l) / 2;
    var b = (h + l) / 2;
    var periodXY = function(phase) {
            return a * Math.sin(phase + pi / 2) + b;
        }

    var FourP = [
        {'xy': periodXY(phase + 7 * pi / 4), 'z' : periodZ(phase + 7 * pi / 4)}, 
        {'xy': periodXY(phase + pi / 4), 'z' : periodZ(phase + pi / 4)}, 
        {'xy': periodXY(phase + 3 * pi / 4), 'z' : periodZ(phase + 3 * pi / 4)}, 
        {'xy': periodXY(phase + 5 * pi / 4), 'z' : periodZ(phase + 5 * pi / 4)}, 
    ];
    return [
        {'x': FourP[0].xy, 'y': FourP[0].xy, 'z': FourP[0].z}, 
        {'x': FourP[1].xy, 'y': FourP[1].xy, 'z': FourP[1].z}, 
        {'x': FourP[1].xy, 'y': - FourP[1].xy, 'z': FourP[1].z}, 
        {'x': FourP[0].xy, 'y': - FourP[0].xy, 'z': FourP[0].z}, 

                {'x': - FourP[0].xy, 'y': FourP[0].xy, 'z': FourP[0].z}, 
        {'x': - FourP[1].xy, 'y': FourP[1].xy, 'z': FourP[1].z}, 
        {'x': - FourP[1].xy, 'y': - FourP[1].xy, 'z': FourP[1].z}, 
        {'x': - FourP[0].xy, 'y': - FourP[0].xy, 'z': FourP[0].z}, 

                {'x': FourP[3].xy, 'y': FourP[3].xy, 'z': FourP[3].z}, 
        {'x': FourP[2].xy, 'y': FourP[2].xy, 'z': FourP[2].z}, 
        {'x': FourP[2].xy, 'y': - FourP[2].xy, 'z': FourP[2].z}, 
        {'x': FourP[3].xy, 'y': - FourP[3].xy, 'z': FourP[3].z}, 

                {'x': - FourP[3].xy, 'y': FourP[3].xy, 'z': FourP[3].z}, 
        {'x': - FourP[2].xy, 'y': FourP[2].xy, 'z': FourP[2].z}, 
        {'x': - FourP[2].xy, 'y': - FourP[2].xy, 'z': FourP[2].z}, 
        {'x': - FourP[3].xy, 'y': - FourP[3].xy, 'z': FourP[3].z}, 
        ];

      }

  function makeTesseract(whd, phase) {
    var s = new Pre3d.Shape();
    s.vertices = makeTesseractVertices(whd, phase);


    s.quads = [
      new Pre3d.QuadFace(0, 1, 2, 3),  
      new Pre3d.QuadFace(1, 5, 6, 2),  
      new Pre3d.QuadFace(5, 4, 7, 6),  
      new Pre3d.QuadFace(4, 0, 3, 7),  
      new Pre3d.QuadFace(0, 4, 5, 1),  
      new Pre3d.QuadFace(2, 6, 7, 3),  

            new Pre3d.QuadFace(8,  9,  10, 11),  
      new Pre3d.QuadFace(9,  13, 14, 10),  
      new Pre3d.QuadFace(13, 12, 15, 14),  
      new Pre3d.QuadFace(12, 8,  11, 15),  
      new Pre3d.QuadFace(8,  12, 13, 9),   
      new Pre3d.QuadFace(10, 14, 15, 11),  

            new Pre3d.QuadFace(0, 1, 9, 8),   
      new Pre3d.QuadFace(11, 10, 2, 3), 
      new Pre3d.QuadFace(1, 5, 13, 9),  
      new Pre3d.QuadFace(10, 14, 6, 2), 
      new Pre3d.QuadFace(5, 4, 12, 13), 
      new Pre3d.QuadFace(14, 15, 7, 6), 
      new Pre3d.QuadFace(4, 0, 8, 12 ), 
      new Pre3d.QuadFace(15, 11, 3, 7), 
      new Pre3d.QuadFace(1, 2, 10, 9 ), 
      new Pre3d.QuadFace(0, 3, 11, 8 ), 
      new Pre3d.QuadFace(5, 6, 14, 13), 
      new Pre3d.QuadFace(4, 7, 15, 12), 

         ];

        s = complement(s);

        rebuildMeta(s);

    return s;
  }

  function makeCube(whd) {
    return makeBox(whd, whd, whd);
  }

      function makeBoxWithHole(w, h, d, hw, hh) {
    var s = new Pre3d.Shape();
    s.vertices = [
      {x:  w, y:  h, z: -d},  
      {x:  w, y:  h, z:  d},  
      {x:  w, y: -h, z:  d},  
      {x:  w, y: -h, z: -d},  
      {x: -w, y:  h, z: -d},  
      {x: -w, y:  h, z:  d},  
      {x: -w, y: -h, z:  d},  
      {x: -w, y: -h, z: -d},  

      {x: hw, y:   h, z: d},  
      {x:  w, y:  hh, z: d},  
      {x: hw, y:  hh, z: d},  
      {x: hw, y:  -h, z: d},  
      {x:  w, y: -hh, z: d},  
      {x: hw, y: -hh, z: d},  

      {x: -hw, y:   h, z: d},  
      {x:  -w, y:  hh, z: d},  
      {x: -hw, y:  hh, z: d},  
      {x: -hw, y:  -h, z: d},  
      {x:  -w, y: -hh, z: d},  
      {x: -hw, y: -hh, z: d},  

      {x: hw, y:   h, z: -d},  
      {x:  w, y:  hh, z: -d},  
      {x: hw, y:  hh, z: -d},  
      {x: hw, y:  -h, z: -d},  
      {x:  w, y: -hh, z: -d},  
      {x: hw, y: -hh, z: -d},  

      {x: -hw, y:   h, z: -d},  
      {x: -w,  y:  hh, z: -d},  
      {x: -hw, y:  hh, z: -d},  
      {x: -hw, y:  -h, z: -d},  
      {x: -w,  y: -hh, z: -d},  
      {x: -hw, y: -hh, z: -d}   
    ];


    s.quads = [
      new Pre3d.QuadFace( 1,  8, 10,  9),
      new Pre3d.QuadFace( 8, 14, 16, 10),
      new Pre3d.QuadFace(14,  5, 15, 16),
      new Pre3d.QuadFace(16, 15, 18, 19),
      new Pre3d.QuadFace(19, 18,  6, 17),
      new Pre3d.QuadFace(13, 19, 17, 11),
      new Pre3d.QuadFace(12, 13, 11,  2),
      new Pre3d.QuadFace( 9, 10, 13, 12),
      new Pre3d.QuadFace( 4, 26, 28, 27),
      new Pre3d.QuadFace(26, 20, 22, 28),
      new Pre3d.QuadFace(20,  0, 21, 22),
      new Pre3d.QuadFace(22, 21, 24, 25),
      new Pre3d.QuadFace(25, 24,  3, 23),
      new Pre3d.QuadFace(31, 25, 23, 29),
      new Pre3d.QuadFace(30, 31, 29,  7),
      new Pre3d.QuadFace(27, 28, 31, 30),
      new Pre3d.QuadFace(10, 16, 28, 22),
      new Pre3d.QuadFace(19, 31, 28, 16),
      new Pre3d.QuadFace(13, 25, 31, 19),
      new Pre3d.QuadFace(10, 22, 25, 13),
      new Pre3d.QuadFace( 6,  7, 29, 17),
      new Pre3d.QuadFace(17, 29, 23, 11),
      new Pre3d.QuadFace(11, 23,  3,  2),
      new Pre3d.QuadFace( 1,  9, 21,  0),
      new Pre3d.QuadFace( 9, 12, 24, 21),
      new Pre3d.QuadFace(12,  2,  3, 24),
      new Pre3d.QuadFace( 5,  4, 27, 15),
      new Pre3d.QuadFace(15, 27, 30, 18),
      new Pre3d.QuadFace(18, 30,  7,  6),
      new Pre3d.QuadFace(14, 26,  4,  5),
      new Pre3d.QuadFace( 8, 20, 26, 14),
      new Pre3d.QuadFace( 1,  0, 20,  8)
    ];

    rebuildMeta(s);
    return s;
  }

  function makeSphericalShape(f, tess_x, tess_y) {
    var vertices = [ ];
    var quads = [ ];

    var theta_step = Math.PI / (tess_y + 1);
    var phi_step = (k2PI) / tess_x;

    for (var i = 0, theta = theta_step;
         i < tess_y;
         ++i, theta += theta_step) {  
      for (var j = 0; j < tess_x; ++j) {  
        vertices.push(f(theta, phi_step * j));
      }
    }

    for (var i = 0; i < tess_y-1; ++i) {
      var stride = i * tess_x;
      for (var j = 0; j < tess_x; ++j) {
        var n = (j + 1) % tess_x;
        quads.push(new Pre3d.QuadFace(
          stride + j,
          stride + tess_x + j,
          stride + tess_x + n,
          stride + n
        ));
      }
    }

    var last_row = vertices.length - tess_x;
    var top_p_i = vertices.length;
    var bot_p_i = top_p_i + 1;
    vertices.push(f(0, 0));
    vertices.push(f(Math.PI, 0));

    for (var i = 0; i < tess_x; ++i) {
      quads.push(new Pre3d.QuadFace(
        top_p_i,
        i,
        ((i + 1) % tess_x),
        null
      ));
      quads.push(new Pre3d.QuadFace(
        bot_p_i,
        last_row + ((i + 2) % tess_x),
        last_row + ((i + 1) % tess_x),
        null
      ));
    }

    var s = new Pre3d.Shape();
    s.vertices = vertices;
    s.quads = quads;
    rebuildMeta(s);
    return s;
  }

  function makeOctahedron() {
    var s = new Pre3d.Shape();
    s.vertices = [
     {x: -1, y:  0, z:  0},  
     {x:  0, y:  0, z:  1},  
     {x:  1, y:  0, z:  0},  
     {x:  0, y:  0, z: -1},  
     {x:  0, y:  1, z:  0},  
     {x:  0, y: -1, z:  0}   
    ];
    quads = Array(8);
    for (var i = 0; i < 4; ++i) {
      var i2 = (i + 1) & 3;
      quads[i*2] = new Pre3d.QuadFace(4, i, i2, null);
      quads[i*2+1] = new Pre3d.QuadFace(i, 5, i2, null);
    }

    s.quads = quads;
    Pre3d.ShapeUtils.rebuildMeta(s);
    return s;
  }

  function makeSphere(r, tess_x, tess_y) {
    return makeSphericalShape(function(theta, phi) {
        return {
          x: r * Math.sin(theta) * Math.sin(phi),
          y: r * Math.cos(theta),
          z: r * Math.sin(theta) * Math.cos(phi)
        };
    }, tess_x, tess_y);
  }

  function averageSmooth(shape, m) {
    if (m === void(0))
      m = 1;

    var vertices = shape.vertices;
    var psl = vertices.length;
    var new_ps = Array(psl);

    var connections = Array(psl);
    for (var i = 0; i < psl; ++i)
      connections[i] = [ ];

    for (var i = 0, il = shape.quads.length; i < il; ++i) {
      var qf = shape.quads[i];
      connections[qf.i0].push(i);
      connections[qf.i1].push(i);
      connections[qf.i2].push(i);
      if (!qf.isTriangle())
        connections[qf.i3].push(i);
    }

    for (var i = 0, il = vertices.length; i < il; ++i) {
      var cs = connections[i];
      var avg = {x: 0, y: 0, z: 0};

      for (var j = 0, jl = cs.length; j < jl; ++j) {
        var quad = shape.quads[cs[j]];
        var p1 = vertices[quad.i0];
        var p2 = vertices[quad.i1];
        var p3 = vertices[quad.i2];
        var p4 = vertices[quad.i3];
        avg.x += (p1.x + p2.x + p3.x + p4.x) / 4;
        avg.y += (p1.y + p2.y + p3.y + p4.y) / 4;
        avg.z += (p1.z + p2.z + p3.z + p4.z) / 4;
      }

      var f = 1 / jl;
      avg.x *= f;
      avg.y *= f;
      avg.z *= f;

      new_ps[i] = linearInterpolatePoints3d(vertices[i], avg, m);
    }

    shape.vertices = new_ps;

    rebuildMeta(shape);
    return shape;
  }

  function arrayMap(arr, func) {
    var out = Array(arr.length);
    for (var i = 0, il = arr.length; i < il; ++i) {
      out[i] = func(arr[i], i, arr);
    }
    return out;
  }

  function linearSubdivide(shape) {
    var num_quads = shape.quads.length;

    var share_points = { };

    for (var i = 0; i < num_quads; ++i) {
      var quad = shape.quads[i];

      var i0 = quad.i0;
      var i1 = quad.i1;
      var i2 = quad.i2;
      var i3 = quad.i3;

      var p0 = shape.vertices[i0];
      var p1 = shape.vertices[i1];
      var p2 = shape.vertices[i2];
      var p3 = shape.vertices[i3];


      var ni = [
        [i0, i1].sort(),
        [i1, i2].sort(),
        [i2, i3].sort(),
        [i3, i0].sort(),
        [i0, i1, i2, i3].sort()
      ];

      for (var j = 0, jl = ni.length; j < jl; ++j) {
        var ps = ni[j];
        var key = ps.join('-');
        var centroid_index = share_points[key];
        if (centroid_index === undefined) {  
          centroid_index = shape.vertices.length;
          var s = shape;
          shape.vertices.push(averagePoints(
              arrayMap(ps, function(x) { return s.vertices[x]; })));
          share_points[key] = centroid_index;
        }

        ni[j] = centroid_index;
      }

      var q0 = new Pre3d.QuadFace(   i0, ni[0], ni[4], ni[3]);
      var q1 = new Pre3d.QuadFace(ni[0],    i1, ni[1], ni[4]);
      var q2 = new Pre3d.QuadFace(ni[4], ni[1],    i2, ni[2]);
      var q3 = new Pre3d.QuadFace(ni[3], ni[4], ni[2],    i3);

      shape.quads[i] = q0;
      shape.quads.push(q1);
      shape.quads.push(q2);
      shape.quads.push(q3);
    }

    rebuildMeta(shape);
    return shape;
  }

  function linearSubdivideTri(shape) {
    var num_tris = shape.quads.length;
    var share_points = { };

    for (var i = 0; i < num_tris; ++i) {
      var tri = shape.quads[i];

      var i0 = tri.i0;
      var i1 = tri.i1;
      var i2 = tri.i2;

      var p0 = shape.vertices[i0];
      var p1 = shape.vertices[i1];
      var p2 = shape.vertices[i2];


      var ni = [
        [i0, i1].sort(),
        [i1, i2].sort(),
        [i2, i0].sort(),
      ];

      for (var j = 0, jl = ni.length; j < jl; ++j) {
        var ps = ni[j];
        var key = ps.join('-');
        var centroid_index = share_points[key];
        if (centroid_index === undefined) {  
          centroid_index = shape.vertices.length;
          var s = shape;
          shape.vertices.push(averagePoints(
              arrayMap(ps, function(x) { return s.vertices[x]; })));
          share_points[key] = centroid_index;
        }

        ni[j] = centroid_index;
      }

      var q0 = new Pre3d.QuadFace(   i0, ni[0], ni[2], null);
      var q1 = new Pre3d.QuadFace(ni[0],    i1, ni[1], null);
      var q2 = new Pre3d.QuadFace(ni[2], ni[1],    i2, null);
      var q3 = new Pre3d.QuadFace(ni[0], ni[1], ni[2], null);

      shape.quads[i] = q0;
      shape.quads.push(q1);
      shape.quads.push(q2);
      shape.quads.push(q3);
    }

    rebuildMeta(shape);
    return shape;
  }

  function explodeFaces(shape) {
    var quads = shape.quads;
    var num_quads = quads.length;
    var verts = shape.vertices;
    var new_verts = [ ];
    for (var i = 0; i < num_quads; ++i) {
      var q = quads[i];
      var pos = new_verts.length;
      new_verts.push({x: verts[q.i0].x, y: verts[q.i0].y, z: verts[q.i0].z});
      new_verts.push({x: verts[q.i1].x, y: verts[q.i1].y, z: verts[q.i1].z});
      new_verts.push({x: verts[q.i2].x, y: verts[q.i2].y, z: verts[q.i2].z});
      q.i0 = pos;
      q.i1 = pos + 1;
      q.i2 = pos + 2;
      if (q.isTriangle() !== true) {
        new_verts.push({x: verts[q.i3].x, y: verts[q.i3].y, z: verts[q.i3].z});
        q.i3 = pos + 3;
      }
    }
    shape.vertices = new_verts;
    return shape;
  }

  function Extruder() {
    this.distance_ = 1.0;
    this.count_ = 1;
    this.selector_ = null;
    this.selectAll();


    this.scale = {x: 1, y: 1, z: 1};
    this.rotate = {x: 0, y: 0, z: 0};
  }

  Extruder.prototype.selectAll = function() {
    this.selector_ = function(shape, vertex_index) { return true; };
  };

  Extruder.prototype.selectCustom = function(select_func) {
    this.selector_ = select_func;
  };

  Extruder.prototype.distance = function() {
    return this.distance_;
  };
  Extruder.prototype.set_distance = function(d) {
    this.distance_ = d;
  };

  Extruder.prototype.count = function() {
    return this.count_;
  };
  Extruder.prototype.set_count = function(c) {
    this.count_ = c;
  };

  Extruder.prototype.extrude = function extrude(shape) {
    var distance = this.distance();
    var count = this.count();

    var rx = this.rotate.x;
    var ry = this.rotate.y;
    var rz = this.rotate.z;
    var sx = this.scale.x;
    var sy = this.scale.y;
    var sz = this.scale.z;

    var vertices = shape.vertices;
    var quads = shape.quads;

    var faces = [ ];
    for (var i = 0, il = quads.length; i < il; ++i) {
      if (this.selector_(shape, i))
        faces.push(i);
    }

    for (var i = 0, il = faces.length; i < il; ++i) {
      var face_index = faces[i];
      var qf = quads[face_index];
      var original_cent = qf.centroid;

      var surface_normal = unitVector3d(addPoints3d(qf.normal1, qf.normal2));

      var is_triangle = qf.isTriangle();

      var inner_normal0 = subPoints3d(vertices[qf.i0], original_cent);
      var inner_normal1 = subPoints3d(vertices[qf.i1], original_cent);
      var inner_normal2 = subPoints3d(vertices[qf.i2], original_cent);
      if (is_triangle !== true) {
        var inner_normal3 = subPoints3d(vertices[qf.i3], original_cent);
      }

      for (var z = 0; z < count; ++z) {
        var m = (z + 1) / count;

        var t = new Pre3d.Transform();
        t.rotateX(rx * m);
        t.rotateY(ry * m);
        t.rotateZ(rz * m);

        var new_cent = addPoints3d(original_cent,
          mulPoint3d(t.transformPoint(surface_normal), m * distance));

        t.scalePre(
          linearInterpolate(1, sx, m),
          linearInterpolate(1, sy, m),
          linearInterpolate(1, sz, m));

        var index_before = vertices.length;

        vertices.push(addPoints3d(new_cent, t.transformPoint(inner_normal0)));
        vertices.push(addPoints3d(new_cent, t.transformPoint(inner_normal1)));
        vertices.push(addPoints3d(new_cent, t.transformPoint(inner_normal2)));
        if (is_triangle !== true) {
          vertices.push(
              addPoints3d(new_cent, t.transformPoint(inner_normal3)));
        }

        quads.push(new Pre3d.QuadFace(
            qf.i1,
            index_before + 1,
            index_before,
            qf.i0));
        quads.push(new Pre3d.QuadFace(
            qf.i2,
            index_before + 2,
            index_before + 1,
            qf.i1));

        if (is_triangle === true) {
          quads.push(new Pre3d.QuadFace(
              qf.i0,
              index_before,
              index_before + 2,
              qf.i2));
        } else {
          quads.push(new Pre3d.QuadFace(
              qf.i3,
              index_before + 3,
              index_before + 2,
              qf.i2));
          quads.push(new Pre3d.QuadFace(
              qf.i0,
              index_before,
              index_before + 3,
              qf.i3));
        }

        qf.i0 = index_before;
        qf.i1 = index_before + 1;
        qf.i2 = index_before + 2;
        if (is_triangle !== true)
          qf.i3 = index_before + 3;
      }
    }

    rebuildMeta(shape);  
  };

  function complement(shape) {
    var s = new Pre3d.Shape();

        s.vertices = shape.vertices;

        var oldQuads = shape.quads;
    var complementQuads = [];
    oldQuads.forEach(function(quad, index, quads){
            complementQuads.push(new Pre3d.QuadFace(quad.i3, quad.i2, quad.i1, quad.i0));
        });
    s.quads = oldQuads.concat(complementQuads);

    rebuildMeta(s);

    return s;
  }


  function rotateTesseract(shape, phase){
    var s = new Pre3d.Shape();
    s.vertices = makeTesseractVertices(phase);
    s.quads = shape.quads;

        rebuildMeta(s);

        return s;
  }

    return {
    rebuildMeta: rebuildMeta,
    triangulate: triangulate,
    forEachFace: forEachFace,
    forEachVertex: forEachVertex,

    makePlane: makePlane,
    makeCube: makeCube,
    makeTesseract: makeTesseract,
    makeBox: makeBox,
    makeBoxWithHole: makeBoxWithHole,
    makeSphericalShape: makeSphericalShape,
    makeSphere: makeSphere,
    makeOctahedron: makeOctahedron,

    averageSmooth: averageSmooth,
    linearSubdivide: linearSubdivide,
    linearSubdivideTri: linearSubdivideTri,
    explodeFaces: explodeFaces,
    complement: complement,
    rotateTesseract: rotateTesseract,

    Extruder: Extruder
  };
})();
function drawTesseract(){

  var screen_canvas = document.getElementById('tesseract');
  var renderer = new Pre3d.Renderer(screen_canvas);

  var shape = Pre3d.ShapeUtils.makeTesseract(2);

  renderer.draw_overdraw = false;
  renderer.fill_rgba = new Pre3d.RGBA(0xff/255, 0xff/255, 0xff/255, 0);
  renderer.ctx.lineWidth = 2;
  renderer.stroke_rgba = new Pre3d.RGBA(0xdd/255, 0xdd/255, 0xdd/255, 0.33);

  function setTransform(x, y) {
    var ct = renderer.camera.transform;
    ct.reset();
    ct.rotateZ(0.0);
    ct.rotateY(-2.06 * x - 0.5);
    ct.rotateX(2.2 * y + 1.5);
    ct.translate(0, 0, -12);
  }

  renderer.camera.focal_length = 6;
  setTransform(0, 0);

  function draw() {
    renderer.clearBackground();
    renderer.bufferShape(shape);
    renderer.drawBuffer();
    renderer.emptyBuffer();
  }


    document.addEventListener('mousemove', function(e) {
    setTransform(e.clientX / 1600, e.clientY / 1600);
    draw();
  }, false);


    var phase = 0;
  var deltaPhase = 2*Math.PI/1600 ; 
  intervalId = setInterval(function(){
    phase += deltaPhase;
    shape = Pre3d.ShapeUtils.rotateTesseract(shape, phase);
    draw();
  },40);

    draw();
}

function gridSound () {
	var oscillator, context, AudioContext;

		AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext();

	oscillator = context.createOscillator();

	function makeSound() {

				setFrequency(4);
		oscillator.type = 'sine';

		oscillator.connect(context.destination);
		oscillator.start(0);

	}

	function stopSound() {
		oscillator.stop(0);
		oscillator.disconnect(context.destination);
	}

	function setFrequency(frequency) {
    	oscillator.frequency.value = 5000;
	}

	return {
		setFrequency: setFrequency,
		makeSound: makeSound,
		stopSound: stopSound
	}
}
(function($) {
	$(document).ready(function(){
		var creditsToggleBtn = $('#credits-toggle'),
		creditsSection = $('#credits-section'),
		initialSection = $('#initial-section');

		creditsToggleBtn.on('click', function(e) {
			e.preventDefault();
			var isCreditsActive = $(this).data('credits-visible');
			toggleCredits(creditsToggleBtn, creditsSection, initialSection, isCreditsActive);
		});

		function toggleCredits(showTrigger, creditsSection, initialSection, isCreditsActive) {
			if (isCreditsActive) {
				showTrigger.removeClass('hidden');
				showTrigger.data('credits-visible', false);
				creditsSection.addClass("hidden");
				window.setTimeout(function () {
					initialSection.removeClass("hidden");
				}, 300);
			} else {
				showTrigger.addClass('hidden');
				showTrigger.data('credits-visible', true);
				initialSection.addClass("hidden");
				creditsSection.removeClass("hidden");
			}

		}
	});
})(jQuery);
var _int = function(pStr) { return parseInt(pStr, 10); }

function getAvailableSystemFonts() {
  detective = new FontDetector();  

  var fontList = getFontList(),
      availableFonts = [];

  fontList.forEach(function(fontName){
    if (detective.detect(fontName)){
      availableFonts.push(fontName);
    }
  });

  void 0;
  return availableFonts;
};

function onFontChange(e) {
  var id = $(this).attr('id'),  
      lhEl = $('#input-lineheight'),
      fsEl = $('#input-fontsize');

  localStorage.setItem(id, this.value);

  switch(id){
  case 'select-font':
    $('.example-text').css('font-family', this.value+",monospace"); 
    $('.text').css('font-family', this.value+",monospace");
    metricsContext.curr_typeface = this.value; 

    drawMetrics();
    drawText();
    break;

  case 'input-fontsize':
      lhEl.val( Math.round(_LHFS_R*_int(this.value)) + 'px');
      $('.example-text').css('font-size', _int(this.value)+'px');
      $('.example-text').css('line-height', _int(lhEl.val())+'px');
      $('.text').css('font-size', parseInt(this.value)+'px');
      break;

  case 'input-lineheight':
      _LHFS_R = _int(this.value) / _int( fsEl.val() ); 
      $('.example-text').css('line-height', _int(this.value)+'px');
      break;
  }



    var lh   = _int(lhEl.val()),
      blit  = $("#baseline-info-text"),
      blint = $("#baseline-invalid-text");

  if (lh%2==0 || lh%3==0) {
    _LHBL_F = lh%2 ? 3 : 2;

      lhEl.css('background-color', '');
      blit.text(lh/_LHBL_F + ' px');
      blint.text('');
      blit.removeClass('invalid-baseline');


      if (allConfigs){
        el = allConfigs.radioForms[2]; 
        $('input', el).each(function(){  $(this).prop('disabled', false); });
        var prevSelection = localStorage.getItem($(el).attr('id')),
            selector = prevSelection ? 'input[value="'+prevSelection+'"]' : 'input:first';
        $(selector, el).prop('checked', true);

        $('#gridBaseline > input[value='+lh/_LHBL_F+']').prop('checked', true);
        $('.rulers-wrapper-horizontal').removeClass('hidden');
        allConfigs.radioForms.eq(0).trigger('change');
      } 


      resetBaselineSelections();


  } else {
    _LHBL_F = lh/lh; 
    lhEl.css('background-color', 'lightpink');
    blit.text('not valid');
    blint.text('Line height must be divisible by 2 or 3.');
    blit.addClass('invalid-baseline');

    if (allConfigs){
      el = allConfigs.radioForms[2];

      if ($('input:checked', $(el)).val())
        localStorage.setItem($(el).attr('id'), $('input:checked', $(el)).val());

            $('input', el).each(function(){  $(this).prop('disabled', true).val([]); });
      $('.text').css('line-height', lh+'px');
      $('.rulers-wrapper-horizontal').addClass('hidden');
    }
  }


  $('#lineheight-percent-label').text( 
    Math.round( _int(lhEl.val())/_int(fsEl.val() ) *100) + '%'
  );

};


function resetBaselineSelections(){
    var blEl = $('#gridBaseline'), 
        fsVal = _int($('#input-fontsize').val()), 
        lhVal = _int($('#input-lineheight').val()),
        lhMin = Math.round(fsVal * allConfigs.lineHeightLimit.min), 
        lhMax = Math.round(fsVal * allConfigs.lineHeightLimit.max), 
        blRange = [], 
        labelStr = 'gridBaseline'; 

    for (var lh = lhMin; lh<=lhMax; lh++){
        if (lh % _LHBL_F == 0){
            blRange.push(lh/_LHBL_F);
        }
    }

    blEl.empty();
    blRange.forEach(function(value,i){
        var input = $('<input>').prop({
                type: "radio",
                id: labelStr+String(value),
                name: labelStr,
                value: value
            });

        if (value*_LHBL_F == lhVal) 
          input.prop('checked', true); 

        var label = $('<label>').prop('for', labelStr+value).text(value);

        blEl.append(input).append(label);
    });

    return ;
}




function onKeyDown(e) {
    var input = $(e.target),
        val = _int(input.val()),
        code = (e.which || e.keyCode),
        limit = null;

    if (input.attr('id') === 'input-fontsize')
        limit = allConfigs.fontSizeLimit;

    if (input.attr('id') === 'input-lineheight'){
        var fsVal = _int($('#input-fontsize').val());
        limit = { min: Math.round(fsVal*allConfigs.lineHeightLimit.min),
                  max: Math.round(fsVal*allConfigs.lineHeightLimit.max) };
    }

    if ([38,40,13].indexOf(code) > -1){
      if (code === 40) val = val > limit.min ? val - 1 : val;
      if (code === 38) val = val < limit.max ? val + 1 : val;
      if (code === 13) val = val < limit.min ? limit.min : val > limit.max ? limit.max : val;
      input.val((isNaN(val) ? limit.min : val) +'px');
      e.preventDefault();
      input.trigger('change');
    }

}


function onMetricsTextChange(e) {
  var mCtx = metricsContext;
  var code = (e.keyCode || e.which);

  if( [37, 38, 39, 40, 16, 17, 18].indexOf(code) > -1 ) {
      return;
  }

  mCtx.curr_mtext = this.value;
  mCtx.curr_mtext_width = mCtx.curr_mtext ? 
      Math.round(mCtx.contextT.measureText(mCtx.curr_mtext).width) : 0;

    drawText();

}


function getFontList() {
  return [
    'Georgia', 'Baskerville', 'Baskerville Old Face', 'Century', 'Lucida Bright',
    'Times', 'Helvetica', 'Helvetica Neue', 'Arial', 'Verdana', 'Century Gothic', 
    'Calibri', 'Charter', 'Avenir', 'PT Serif', 'PT Sans'
  ];
}

var TCNDDF = TCNDDF || {};

(function(){
	var dropContainer,
		dropListing,
		displayContainer,
		domElements,
		fontPreviewFragment = document.createDocumentFragment(),
		styleSheet,
		fontFaceStyle,
		persistantStorage = window.localStorage || false,
		webappCache = window.applicationCache || window,
		contentStorageTimer;

		TCNDDF.setup = function () {
		dropListing = document.getElementById("fonts-listing");
		dropContainer = document.getElementById("drop-area");
		displayContainer = document.getElementById("displayContainer");
		styleSheet = document.styleSheets[0];

				dropListing.addEventListener("click", TCNDDF.handleFontChange, false);

		if(persistantStorage) {
			displayContainer.addEventListener("keyup", function(){contentStorageTimer = setTimeout("TCNDDF.writeContentEdits('mainContent')",1000);}, false);
			displayContainer.addEventListener("keydown", function(){clearTimeout(contentStorageTimer);}, false);

			TCNDDF.readContentEdits("mainContent");
		}

		dropContainer.addEventListener("dragenter", function(event){TCNDDF.preventActions(event);}, false);
		dropContainer.addEventListener("dragover", function(event){TCNDDF.preventActions(event);}, false);
		dropContainer.addEventListener("drop", TCNDDF.handleDrop, false);

		webappCache.addEventListener("updateready", TCNDDF.updateCache, false);
		webappCache.addEventListener("error", TCNDDF.errorCache, false);
	};

		TCNDDF.handleDrop = function (evt) {
		var dt = evt.dataTransfer,
			files = dt.files || false,
			count = files.length,
			acceptedFileExtensions = /^.*\.(ttf|otf|woff)$/i;


							TCNDDF.preventActions(evt);

				for (var i = 0; i < count; i++) {
			var file = files[i],
				droppedFullFileName = file.name,
				droppedFileName,
				droppedFileSize;

						if(droppedFullFileName.match(acceptedFileExtensions)) {
				droppedFileName = droppedFullFileName.replace(/\..+$/,""); 
				droppedFileName = droppedFileName.replace(/\W+/g, "-"); 
				droppedFileSize = Math.round(file.size/1024) + "kb";

								TCNDDF.processData(file,droppedFileName,droppedFileSize);
			} else {
				void 0;
			}
		}
	};

		TCNDDF.processData = function (file, name, size) {
		var reader = new FileReader();
			reader.name = name;
			reader.size = size;

		reader.readAsDataURL(file);
		reader.addEventListener('load', function () {
			TCNDDF.buildFontListItem(event);
		});
	};

		TCNDDF.buildFontListItem = function (event) {
		domElements = [
			document.createElement('li'),
			document.createElement('span'),
			document.createElement('span')
		];

				var name = event.target.name,
			size = event.target.size,
			data = event.target.result,
			fontList = getFontList(),
			option = $('<option>').prop('value', name).text(name);


		var dataURL = data.split("base64");

				if(dataURL[0].indexOf("application/octet-stream") == -1) {
			dataURL[0] = "data:application/octet-stream;base64"

						data = dataURL[0] + dataURL[1];
		}

		fontFaceStyle = "@font-face{font-family: "+name+"; src:url("+data+");}";
		styleSheet.insertRule(fontFaceStyle, 0);

		fontList.push(name);

				domElements[2].appendChild(document.createTextNode(size));
		domElements[1].appendChild(document.createTextNode(name));
		domElements[0].className = "active";
		domElements[0].title = name;
		domElements[0].style.fontFamily = name;
		domElements[0].appendChild(domElements[1]);

				fontPreviewFragment.appendChild(domElements[0]);

				dropListing.appendChild(fontPreviewFragment);
		$(dropListing).fadeIn();
		TCNDDF.updateActiveFont(domElements[0]);
		displayContainer.style.fontFamily = name;


		window.setTimeout(function () {
			$('#select-font').append(option);
			$('#select-font').val(name).trigger('change');
		}, 0);
	};

	TCNDDF.handleFontChange = function (evt) {
		var clickTarget = evt.target || window.event.srcElement;

				if(clickTarget.nodeName.toLowerCase() === 'span') {
			clickTarget = clickTarget.parentNode;
			TCNDDF.updateActiveFont(clickTarget);
		} else {
			TCNDDF.updateActiveFont(clickTarget);
		}
	};
	TCNDDF.updateActiveFont = function (target) {
		var getFontFamily = target.title,
			dropListItem = dropListing.getElementsByTagName("li");

				displayContainer.style.fontFamily = getFontFamily;

				for(var i=0, len = dropListItem.length; i<len; i++) {
			dropListItem[i].className = "";
		}
		target.className = "active";
	};

	TCNDDF.readContentEdits = function (storageKey) {
		var editedContent = persistantStorage.getItem(storageKey);

				if(!!editedContent && editedContent !== "undefined") {
			displayContainer.innerHTML = editedContent;
		}
	};
	TCNDDF.writeContentEdits = function (storageKey) {
		var content = displayContainer.innerHTML;

				persistantStorage.setItem(storageKey, content);
	};

	TCNDDF.updateCache = function () {
		webappCache.swapCache();
		void 0;
	};
	TCNDDF.errorCache = function () {
		void 0;
	};

	TCNDDF.preventActions = function (evt) {
		if(evt.stopPropagation && evt.preventDefault) {
			evt.stopPropagation();
			evt.preventDefault();
		} else {
			evt.cancelBubble = true;
			evt.returnValue = false;
		}
	};

		window.addEventListener("load", TCNDDF.setup, false);
})();

var metricsContext = (function(){

  var int = function(str){ return parseInt(str,10); };

  var _canvas  = $('#metrics-canvas')[0],
      _canvasT = $('#text-canvas')[0];

  _canvas.width   = int( $(_canvas).css('width') ) * 2;
  _canvas.height  = int( $(_canvasT).css('height') ) * 2;
  _canvasT.width  = int( $(_canvasT).css('width') ) * 2;
  _canvasT.height = int( $(_canvasT).css('height') ) * 2;


  return {
    canvas  : _canvas,
    canvasT : _canvasT,
    context : _canvas.getContext('2d'),
    contextT: _canvasT.getContext('2d'),

    reference_alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    metrics_fontsize: 140*2,
    metrics_fallback: '60px sans', 

    curr_typeface: null,
    curr_mtext: null,
    curr_mtext_width: 0,

    label_font: '24px Helvetica',
    'label_font_upm': '20px Helvetica',
    baseline_y: Math.round( _canvas.height*.70 ),
    xOffL: int( $(_canvasT).css('margin-left') ) * 2,  
    xOffR: int( $(_canvasT).css('margin-right') ), 

    dragging: false,
    lastX: 0,
    translated: 0
  };
})();



function drawText()
{
  var startTime = performance.now(), 
    mCtx = metricsContext, 
    canvasT = mCtx.canvasT,
    ctxT = mCtx.contextT;

  ctxT.clearRect(0, 0, canvasT.width, canvasT.height);
  ctxT.font = mCtx.metrics_fallback;  
  ctxT.font = mCtx.metrics_fontsize + "px " + mCtx.curr_typeface;
  canvasT.style.font = ctxT.font;

  if (ctxT.font == mCtx.metrics_fallback)
    return;

  ctxT.fillText(mCtx.curr_mtext,   
                mCtx.translated,   
                mCtx.baseline_y);  

  var timing = performance.now() - startTime;
};




function drawMetrics() {
  var startTime = performance.now(),
      error_font = false;

  var canvas = metricsContext.canvas,
      ctx = metricsContext.context,
      metrics_fontsize = metricsContext.metrics_fontsize,
      baseline_y = metricsContext.baseline_y,
      xOffL = metricsContext.xOffL;


  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = metricsContext.metrics_fallback;
  ctx.font = metrics_fontsize + "px " + metricsContext.curr_typeface;
  canvas.style.font = ctx.font;

  if (ctx.font == metricsContext.metrics_fallback)
      error_font = true;

    metricsContext.curr_mtext_width = 
      Math.round( ctx.measureText(metricsContext.curr_mtext).width );

  var metrics   = ctx.measureText(metricsContext.reference_alphabet),  
      ascent    = metrics.ascent,
      descent   = metrics.descent,
      x_height  = ctx.measureText('x').ascent,
      cap_height= ctx.measureText('H').ascent,
      safebox_h = Math.round(metrics_fontsize / 2), 
      xh_offset = Math.round((x_height / safebox_h - 1)*500),  
      xh_offset_label = (xh_offset>=0?'+ ':'– ') + Math.abs(xh_offset) + ' UPM',
      isValid_xh_offset = Math.abs(xh_offset) <= 50;
      line_length = canvas.width - metricsContext.xOffR, 
      labelRectW = 58*2, 
      labelRectH = 15*2; 

  $('#x-height-offset-text').text(xh_offset_label).removeClass('invalid-offset');
  if (!isValid_xh_offset) 
      $('#x-height-offset-text').addClass('invalid-offset');


  ctx.font = metricsContext.label_font;
  canvas.style.font = ctx.font;

  ctx.beginPath();
  ctx.fillStyle= 'rgba(230, 230, 230, 0.5)';
  ctx.lineWidth = 0;
  ctx.clearRect(0, baseline_y-safebox_h, line_length, safebox_h);
  var img = document.getElementById('fontmetrics-pattern');
  var pat=ctx.createPattern(img, "repeat");
  ctx.rect(0, baseline_y-safebox_h, line_length, safebox_h);
  ctx.fillStyle=pat;
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(230, 230, 230, 0.5)';
  ctx.lineWidth = 1;
  ctx.moveTo(0, baseline_y-safebox_h-1);
  ctx.lineTo(line_length, baseline_y-safebox_h-1);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = '#C5C5C5';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 2;
  ctx.setLineDash([5,2]);
  ctx.moveTo(0, baseline_y-ascent);
  ctx.lineTo(line_length, baseline_y-ascent);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, baseline_y+descent);
  ctx.lineTo(line_length, baseline_y+descent);
  ctx.stroke();

  ctx.beginPath();
  ctx.setLineDash([0, 0]);
  ctx.fillStyle = '#C5C5C5';
  ctx.lineWidth = 2;
  ctx.fillRect(0, baseline_y-ascent-1, labelRectW, labelRectH);

  ctx.beginPath();
  ctx.fillStyle = '#C5C5C5';
  ctx.lineWidth = 2;
  ctx.fillRect(0, baseline_y+descent-labelRectH+1, labelRectW, labelRectH);

  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.fillStyle = '#D0021B';
  ctx.lineWidth = 0;
  ctx.fillRect(canvas.width - labelRectW, baseline_y-cap_height-labelRectH, labelRectW, labelRectH);

  ctx.beginPath();
  ctx.fillStyle = '#D0021B';
  ctx.lineWidth = 0;
  ctx.fillRect(canvas.width - labelRectW, baseline_y, labelRectW, labelRectH);


  ctx.beginPath();
  ctx.strokeStyle = '#D0021B';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 2;
  ctx.moveTo(xOffL, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.lineTo(line_length, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.stroke();

  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';
  ctx.fillText('baseline', line_length-10, baseline_y);


  if (error_font){
      $('.example-text').css('color', 'white');
      return;
  } else {
      $('.example-text').css('color', '');
  }

  ctx.beginPath();
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#D0021B';
  ctx.lineWidth = 0;
  ctx.moveTo(xOffL, baseline_y - x_height);
  ctx.lineTo(line_length, baseline_y - x_height);
  ctx.stroke();


  ctx.beginPath();
  ctx.fillStyle = hex2rgba( isValid_xh_offset ? '#8014CF74' : '#80FFA500' );
  ctx.fillRect(xOffL, baseline_y-x_height, line_length, x_height-safebox_h);

  ctx.textBaseline = xh_offset > 0 ? 'bottom' : 'top';
  ctx.textAlign = 'right';
  ctx.font = metricsContext.label_font_upm;
  ctx.fillStyle = 'black';
  if (true) { 
    if (false){
      ctx.save();
      ctx.rotate(Math.PI/2); 
      ctx.fillText(xh_offset_label, baseline_y-x_height-3, -line_length); 
      ctx.restore();
    } else {
      ctx.fillText(xh_offset_label, line_length, baseline_y-x_height);
    }
  }
  ctx.font = metricsContext.label_font;

  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('ascend', 18, baseline_y-ascent-1);

  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('descend', 12, baseline_y+descent-labelRectH+1);

  ctx.beginPath();
  ctx.setLineDash([0, 0]);
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.fillRect(0, baseline_y-labelRectH, labelRectW, labelRectH);

  ctx.fillStyle = '#999';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('500UPM', 10, baseline_y-labelRectH+3);

  ctx.beginPath();
  ctx.strokeStyle = '#D0021B';
  ctx.fillStyle = 'white';
  ctx.setLineDash([0, 0]);
  ctx.lineWidth = 2;
  ctx.moveTo(xOffL, baseline_y - cap_height);
  ctx.lineTo(line_length, baseline_y - cap_height);
  ctx.stroke();

  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';
  ctx.fillText('cap height', line_length-1, baseline_y-cap_height-labelRectH);

  var timing = performance.now() - startTime;
  void 0;
};



var hex2rgba = function(str) {
  var num = parseInt(str.slice(1), 16); 
  var rgba = [num >> 16 & 255, num >> 8 & 255, num & 255, (num >> 24 & 255)/255];
  return 'rgba(' + rgba.join(', ') + ')';
};



function restrictRange(transdelta){
  var mCtx = metricsContext,
      mtextW = mCtx.curr_mtext_width,
      width  = mCtx.canvasT.width;

    var pm = 0; 
  if (mtextW < width)
    return transdelta > width-mtextW*(1-pm) ? width-mtextW*(1-pm) :
           transdelta < -mtextW*pm ? -mtextW*pm : transdelta;
  else {
    return transdelta > width*(pm) ? width*(pm)  :
           transdelta < -mtextW+width*(1-pm) ? -mtextW+width*(1-pm) : 
           transdelta;
  }
}

window.onmousemove = function(e){
  var evt = e || window.event;
  var mCtx = metricsContext;
  if (mCtx.dragging){
    pauseEvent(evt);
    var delta = evt.clientX - mCtx.lastX;
    mCtx.translated = restrictRange(mCtx.translated+delta);
    mCtx.lastX = evt.clientX;
    drawText();
  }

}

metricsContext.canvasT.onmousedown = function(e){
  var evt = e || event;
  metricsContext.dragging = true;
  metricsContext.lastX = evt.clientX;
}

window.onmouseup = function(){
  metricsContext.dragging = false;
}




function mouseWheelEvent(e){
    var mCtx = metricsContext;
    var delta = 0;

    switch (e.type){
      case 'DOMMouseScroll': 
        delta = Math.round(e.wheelDelta || e.detail*10);
        break;

      case 'mousewheel': 
        delta = Math.round(e.deltaX || e.deltaY || e.wheelDelta);
        break; 

            default:
        void 0;
        return false;
    }
    mCtx.translated = restrictRange(mCtx.translated+delta);

    drawText();
    e.preventDefault();
    e.stopPropagation();

    return false; 
};


function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}
function setupRadioItems(){
    allConfigs.radioForms.each( function(idx, el){
        $(el).empty(); 
        $(el).append( createRadioInputs(allConfigs.inputNames[idx], 
                                        allConfigs.rangeArrs[idx]) );

        var prevSelection = localStorage.getItem($(el).attr('id'));
        if (prevSelection)
            $('input[value="'+prevSelection+'"]', el).prop('checked', true);

        if ($(el).attr('id') === 'gridRatio'){
            var ratioStr = $('#gridRatio > input:checked').val();
            $('.ratio-selector input[name=ratioSelector][id=ratio'+ratioStr+']')
                .prop('checked', true);
        }

        $(el).on('change', onGridChange);
    });


    $('#input-fontsize').trigger('change');
}


function createRadioInputs(inputName, valueRange){
	var elements = [];
	valueRange.forEach(function(value,i){
		var input = $('<input>').prop({
				type: "radio",
				id: inputName+String(value),
				name: inputName,
				value: value
			});

        var name = allConfigs.inputNames;
        switch (inputName) {
 case name[0]:  if(i==1) input.prop('checked', true); break;  
 case name[1]:  if(i==0) input.prop('checked', true); break;  
 case name[2]:  if(i==1) input.prop('checked', true); break;  
 case name[3]:  if(i==2) input.prop('checked', true); break;  
 case name[4]:  if(i==3) input.prop('checked', true); break;  
        }

		switch(allConfigs.inputNames.indexOf(inputName)) {
			case 1:  labelText = value.replace('x',':'); break;
			case 4:  labelText = allConfigs.baselineArr[0]*value; break; 
			default: labelText = String(value);
		}
		var label = $('<label>')
			.prop('for', inputName+String(value))
			.text( labelText );

				elements.push(input, label);
	});

	return elements;
}


function onGridChange(e){
    var getAllSelections = function(){
        return $('input:checked', allConfigs.radioForms)
                .map(function() {
                    var val = $(this).val(); 
                    return isNaN(val) ? val : ~~val;
                 }).toArray();
    }

    var el = $(e.target).parent();  
    var allGridSelections = getAllSelections();


    refreshRadioInputs(allConfigs.radioForms, allGridSelections); 
    allGridSelections = getAllSelections(); 

    var selected = $('input:checked', el);

    if (el.attr('id') === 'gridRatio'){
        var ratioStr = selected.val();
        $('.ratio-selector input[name=ratioSelector][id=ratio'+ratioStr+']')
            .prop('checked', true);
    }

    if (el.attr('id') === 'gridBaseline'){
        var newLH = selected.val()*_LHBL_F;
        $('#input-lineheight').val( newLH+'px' );
        $('.example-text').css('line-height', newLH+'px');
        $('#baseline-info-text').text(selected.val() + ' px');

        _LHFS_R = newLH / parseInt( $('#input-fontsize').val() );
        $('#lineheight-percent-label').text( 
            Math.round( newLH / parseInt($('#input-fontsize').val()) * 100)+'%'
        );
    }

    localStorage.setItem(el.attr('id'), selected.val());

    var gridConfig = RhythmicGridGenerator.selectGrid(
                allConfigs.allValidGrids, allGridSelections );

         if (gridConfig) {
        $('#photoshopButton').removeClass('link-disabled').attr('href', 
            'http://162.247.154.128/psd?'+
            'w='+gridConfig.maxCanvasWidth+'&'+
            'r='+gridConfig.ratio.str+'&'+
            'b='+gridConfig.baseline+'&'+
            'c='+gridConfig.columnsNum+'&'+
            'g='+(gridConfig.gutter.W/gridConfig.baseline));
        drawRhythmicGrid(gridConfig);
    }
    else {
        $('#photoshopButton').addClass('link-disabled');
        allConfigs.gridContainer.empty();
    }
}   


function refreshRadioInputs(radioForms, selectedInputs){
	var validInputs = 
		RhythmicGridGenerator.getValidConfigValues(
			allConfigs.allValidGrids, selectedInputs);

	var ids = allConfigs.inputNames;
	if (ids.length !== validInputs.length) 
		throw 'ERROR: wrong length of IDs in '+arguments.callee.name+'()';

	validInputs.forEach( function(v, i) {

		$('input', radioForms[i]).each(function(k, opt){
			$(this).prop('disabled', !v[k][1] || null );

			if (ids[i] === ids[ids.length-1]){ 
				$(this).next().text( v[k][0]*selectedInputs[2] );  
			}
		}); 

		var selectedOp = $('input:checked', radioForms[i]);
		if ( selectedOp.prop('disabled') ) {
			var enabled = $('input:enabled:last', radioForms[i]);
			if (enabled.length){
				enabled.prop('checked', true);
			}
		}

	});  
}



function drawRhythmicGrid(gridConfig){
    var startTime = performance.now();
    void 0;

    $('#grid-width-text').text(gridConfig.rhythmicGrid.W + ' px');
    $('#column-width-text').text(gridConfig.rhythmicGrid.blocks[0][0] + ' px');


    var container = allConfigs.gridContainer,
        c = 0;

    container.empty();
    gridConfig.rhythmicGrid.blocks.forEach( function(val, idx, arr){
        var row = $('<div>').addClass('row');

        var blockWidth  = val[0],
            blockHeight = val[1],
            blocksInRow = val[2];


        if (gridConfig.gutter.W == 0) {
            for (var i=1; i<=blocksInRow; i++){
                var inner = $('<div>').addClass('inner').addClass('inner'+i);
                var imgId = c++ % allConfigs.imageMocks + 1;
                inner.attr('style', 'background-image: url(img/'+gridConfig.ratio.str+'/' + imgId +'.jpg)');
                void 0
                var column = $('<div>').addClass('column').append(inner);
                row.append(column);
            }

            container.append(row);
            return ;
        }


        if (blocksInRow > 9) 
            return;

        for (var i=1; i<=blocksInRow; i++){
            if (idx===arr.length-1  )
                continue; 

            var inner = $('<div>').addClass('inner').addClass('inner'+i);

            c++;
            if (i===1 && !(c%2) ) c++; 

                        if (c%2 || idx+1===arr.length){ 
                var imgId = Math.floor(c/2) % allConfigs.imageMocks + 1;
                inner.attr('style', 'background-image: url(img/' + 
                                     gridConfig.ratio.str+'/' + imgId +'.jpg)');
            } else {
                var txtMock = allConfigs.textMocks[idx] + '.';


                inner.height(blockHeight);
                inner.append( $('<span>').addClass('strut')
                    .height(parseInt($('#input-lineheight').val())) );
                inner.append( $('<span>').addClass('text').text(txtMock).height(blockHeight) );
            }

            var column = $('<div>').addClass('column').append(inner);
            row.append(column);
        }

        container.append(row);
    });


    var g = gridConfig.gutter.W;
    var margin = gridConfig.rhythmicGrid.margin;
    $('body').css({
        'min-width': gridConfig.maxCanvasWidth+'px'
    });

    $('.grid-outer-wrapper').css({
        'max-width': gridConfig.maxCanvasWidth+'px',
        'padding': (margin > 30 ? 30 : margin) +'px 0'
    });

    $('.grid-container').css({
        'max-width': gridConfig.rhythmicGrid.W+'px',
        'margin-bottom': 0
    });

    $('.row').css({
        'margin-left': -(g/2),
        'margin-right': -(g/2)
    });

    $('.column').css({
        'padding-left': g/2,
        'padding-right': g/2,
        'padding-bottom': g
    });

    $('.column .inner').css('padding-bottom', 100/gridConfig.ratio.R+'%');

    var fs = parseInt($('#input-fontsize').val()),
        lh = parseInt($('#input-lineheight').val());

        $('.column .inner .text')
        .css({
            'font-family': $('#select-font').val()+", monospace",
            'font-size'  : fs+'px',
            'line-height': lh+'px'
        });


    var ellipsisStartTime = performance.now();
    $('.grid-section .inner')
        .has('.text')
        .each( function() { 
            var postfix = '.', 
                textEl = $('.text', this),
                textArr = textEl.text().split(' '),
                curr = '',
                inner = this;
            for (var i=0; i<textArr.length; i++) {
                curr = textArr.slice(0,i).join(' ')
                textEl.text( curr + ' ' + textArr[i] + postfix ); 
                if (inner.scrollHeight > inner.clientHeight + gridConfig.baseline) { 
                    textEl.text( curr + postfix ); 
                    break; 
                }  
            } 
        });
    var ellipsisTiming = performance.now() - ellipsisStartTime;
    void 0;


    var rulersWrapperVertical = $('<div>').addClass('rulers-wrapper-vertical'),
        rulersWrapperHorizontal = $('<div>').addClass('rulers-wrapper-horizontal'),
        currentGridHeight = allConfigs.gridContainer.height();

    for (var i = 0; i < Math.ceil(currentGridHeight / gridConfig.baseline)+1; i++) {
        rulersWrapperHorizontal.append('<div class="ruler-horizontal"></div>');
    }

    for (var i = 0; i < gridConfig.columnsNum; i++) {
        rulersWrapperVertical.append('<div class="ruler-vertical-outer"><div class="ruler-vertical"></div></div>');
    }

    container.append(rulersWrapperVertical);
    container.append(rulersWrapperHorizontal);

    $('.rulers-wrapper-vertical').css({
        'margin-left': -(g/2),
        'margin-right': -(g/2)
    });

    $('.ruler-vertical-outer').css({
        'padding-left': g/2,
        'padding-right': g/2
    });

    $('.ruler-horizontal').css({
        'margin-bottom': gridConfig.baseline - 1 
    });

    if ($('#grid-toggle').data('grid-toggle') === 'on'){
        $('.rulers-wrapper-vertical').removeClass('hidden');
        $('.rulers-wrapper-horizontal').removeClass('hidden');
    } else {
        $('.rulers-wrapper-vertical').addClass('hidden');
        $('.rulers-wrapper-horizontal').addClass('hidden');
    }


    var timing = performance.now() - startTime;
    return ;
}


window.addEventListener('load', drawTesseract, false);


localStorage.clear();


var allConfigs = Object.freeze((function(){
    var startTime = performance.now();

    var rgg = RhythmicGridGenerator,
        widthArr    = [960, 1280, 1440],
        ratioArr    = ['1x1', '4x3', '3x2', '16x9'],
        baselineArr = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        columnsArr  = [5, 6, 9, 12],
        gutter2baselineFactorArr = [0, 1, 2, 3, 4];


    var allValidGrids = rgg.generateAllRhytmicGrids(
        widthArr, ratioArr, baselineArr, columnsArr, gutter2baselineFactorArr);

    var srt = function(a,b){ return parseInt(a) > parseInt(b) ? 1 : -1; };

    baselineArr = allValidGrids.map(function(g){ return g.baseline }).unique().sort(srt);
    columnsArr  = allValidGrids.map(function(g){ return g.columnsNum }).unique().sort(srt);
    gutter2baselineFactorArr  = allValidGrids.map(function(g){ return g.gutterBaselineFactor }).unique().sort(srt);

    var timing = performance.now() - startTime;
    void 0;
    return {
        widthArr     : widthArr,
        ratioArr     : ratioArr,
        baselineArr  : baselineArr,
        columnsArr   : columnsArr,
        gutter2baselineFactorArr: gutter2baselineFactorArr,
        allValidGrids: allValidGrids,

                fontSizeLimit  : {min: 14, max: 21},    
        lineHeightLimit: {min: 1, max: 1.5},  

                rangeArrs    : [widthArr, ratioArr, baselineArr, columnsArr, gutter2baselineFactorArr],
        inputNames   : ['canvasWidth', 'gridRatio', 'gridBaseline', 'gridColumns', 'gridGutter'],

        gridContainer: $('.grid-container'),   
        radioForms   : $('.grid-section > .container > .flex-row >'+
                         ' .flex-child:lt(5) > .form-group'), 

        imageMocks   : 9, 
        textMocks    : Array.apply(null, {length: 5}) 
                            .map(function(_,i) {
                                return Lorem.prototype.createText(
                                    30*Math.exp(i*1.5), 
                                    Lorem.TYPE.WORD)
                                .replace(/^(\w)/, function(v) { return v.toUpperCase(); }); 
                            })
    }
})());

$('.tabs-toggle-wrapper a').click(function (event) {
    toggleTab.call(this, event, '.tab-content');
});

function toggleTab(e, content) {
    e.preventDefault();
    var tab = $(this).attr('href');
    $(this).addClass('current');
    $(this).siblings().removeClass('current');
    $(content).not(tab).css('display', 'none');
    $(tab).fadeIn('fast');
}


['#select-font', '#input-fontsize', '#input-lineheight']
.forEach(function(selector, idx){
      switch(idx){
        case 0:
            var fontList = getAvailableSystemFonts();
            var select = $(selector);
            select.empty();

              fontList.forEach(function(val, idx) {
              var option = $('<option>').prop('value', val).text(val);
              if (!idx) option.prop('selected', true);  
              select.append(option);
            });

            var prevFont = localStorage.getItem(select.attr('id'))
            if (prevFont)
                select.find('option[value="'+prevFont+'"]')
                      .attr('selected','selected');

            $('.example-text').css('font-family', select.val()+",monospace");

            select.on('change', onFontChange).trigger('change');

            break;

        case 1:
        case 2:
            var input = $(selector);

            var prevSize = localStorage.getItem(input.parent().attr('class'));
            if (prevSize)  input.val(prevSize);            

                    if (idx==1)
                $('.example-text').css('font-size', parseInt(input.val())+'px');
            else 
                $('.example-text').css('line-height', parseInt(input.val())+'px');

            input.on('change', onFontChange);
            input.on('keydown', onKeyDown);
            break;
        default:
            void 0
      }
  });

var _LHFS_R = parseInt($('#input-lineheight').val(),10) / 
              parseInt($('#input-fontsize').val(),10);

var _LHBL_F = (function(){
    var lh = parseInt($('#input-lineheight').val(),10);
    return !(lh%3) ? 3 : !(lh%2) ? 2  : 1;
})();

$('#fontmetrics-input-wrapper').on('keyup', onMetricsTextChange).trigger('keyup');


$('.ratio-selector .flex-row').on('change', function(){
    var radioObj = $('.ratio-selector input[name=ratioSelector]:checked');
    var ratioStr = /\d+x\d+$/.exec( radioObj.attr('id') )[0];

    var gridRatioObj = $('.grid-section .flex-child input[name="gridRatio"][value="' + ratioStr + '"]');
    gridRatioObj.prop('checked', true).trigger('change');
});


setupRadioItems(allConfigs);

$('#grid-toggle').on('click', function(e){
    e.preventDefault();
    gridToggleBtn = $(e.target);

        if (gridToggleBtn.data('grid-toggle') === 'on') {
        $('.rulers-wrapper-vertical').addClass('hidden');
        $('.rulers-wrapper-horizontal').addClass('hidden');
        gridToggleBtn.text('Show rulers');
        gridToggleBtn.data('grid-toggle', 'off');
    } else {
        $('.rulers-wrapper-vertical').removeClass('hidden');
        $('.rulers-wrapper-horizontal').removeClass('hidden');
        gridToggleBtn.text('Hide rulers');
        gridToggleBtn.data('grid-toggle', 'on');
    }

    localStorage.setItem('gridToggle', gridToggleBtn.data('grid-toggle'));

});

$('#grid-toggle')
    .data('grid-toggle', localStorage.getItem('gridToggle')==='off' ? 'on' : 'off')
    .trigger('click');

$('#sound-toggle').on('click', function (e) {
    e.preventDefault();
    soundToggleBtn = $(e.target);
    if (soundToggleBtn.data('sound-toggle') === 'on') {
        soundToggleBtn.data('sound-toggle', 'off');
    } else {
        soundToggleBtn.data('sound-toggle', 'on');
    }
});

$('#photoshopButton').on('click', function(){
    $(this).addClass('link-disabled');
    window.setTimeout(function(){
        $('#photoshopButton').removeClass('link-disabled');
    }, 3500);
});

$('.controls .up').each(function () {
    $(this).on('click', function (e) {
        e.preventDefault();
        setFontControls(38, this);
    });
});

$('.controls .down').each(function () {
    $(this).on('click', function (e) {
        e.preventDefault();
        setFontControls(40, this);
    });
});

function setFontControls (key, self) {
    var input = $(self).closest('.font-control-wrapper').find('input');
    var press = jQuery.Event("keydown");
    press.which = key;
    $(input).trigger(press);
}


$(window).on('load', drawMetrics);

