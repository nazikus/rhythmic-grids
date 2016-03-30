
function setupRadioItems(allConfigs){

    var getAllSelected = function(){
        return $('input:checked', allConfigs.radioForms) 
                .map(function() {  
                    var val = $(this).val();
                    return isNaN(val) ? val : ~~val;
                })
                .toArray(); 
    };

    allConfigs.radioForms.each( function(idx, el){
        // clear default config radio options
        $(el).empty();

        // append <input> and <label> for each config value
        $(el).append( createRadioInputs(allConfigs.inputNames[idx], 
                                        allConfigs.rangeArrs[idx]) );

        // restore selection from previous session (if any)
        var prevSelection = localStorage.getItem($(el).attr('id'));
        if (prevSelection)
            $('input[value="'+prevSelection+'"]', el).prop('checked', true);

        // get ALL inputs on every single change in grid config
        $(el).on('change', function(){
          var allGridSelections = getAllSelected();
          refreshRadioInputs(allConfigs.radioForms, allGridSelections); // this might modify the selection
          
          var gridConfig = RhythmicGridGenerator.selectGrid(
                        allConfigs.allValidGrids, allGridSelections );
          
          if (gridConfig)
              drawRhythmicGrid(gridConfig);
          else
              allConfigs.gridContainer.empty();

          var selected = $('input:checked', el);
          
          // if ratio form: change-back the grphic ratio selector (in previous section)
          if ($(el).attr('id') === 'gridRatio'){
              var ratioStr = selected.val();
              $('.ratio-selector input[name=ratioSelector][id=ratio'+ratioStr+']')
                .prop('checked', true);
          }

          // save current selection for the future session
          localStorage.setItem($(el).attr('id'), selected.val());

          // console.log("Grid conifg: [%s]", allGridSelections.join(', '));
        });
     });

    // trigger onChange event to refresh radio inputs at startup
    $(allConfigs.radioForms[0]).trigger('change');
}

////////////////////////////////////////////////////////////////////////////////


// called several times during initializeRadioItems()
function createRadioInputs(inputName, valueRange){
    var elements = [];
    valueRange.forEach(function(value,i){
        var input = $('<input>').prop({
                type: "radio",
                id: inputName+String(value),
                name: inputName,
                value: value
            });
        
        // the first radio is selected by default
        if (!i) input.prop('checked', true); 

        // special cases for Ratio and Gutter labels
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

////////////////////////////////////////////////////////////////////////////////

// disables radio buttons for impossible grids, called on each user selection
function refreshRadioInputs(radioForms, selectedInputs){
    var validInputs = 
        RhythmicGridGenerator.getValidConfigValues(
            allConfigs.allValidGrids, selectedInputs);
    // console.log(selectedInputs);
    // console.log(validInputs);

    var ids = allConfigs.inputNames;
    if (ids.length !== validInputs.length) 
        throw 'ERROR: wrong length of IDs in '+arguments.callee.name+'()';

    validInputs.forEach( function(v, i) {

        // enable/disable each radio input
        $('input', radioForms[i]).each(function(k, opt){
            $(this).prop('disabled', !v[k][1] || null );
            
            // update gutter value according to baseline value
            if (ids[i] === ids[ids.length-1]){ // if the last id (gutter)
                $(this).next().text( v[k][0]*selectedInputs[2] );  // gutter*baseline
            }
        }); // <--- $(<input>).each()

        // change selected element if currently selected option became disabled
        var selectedOp = $('input:checked', radioForms[i]);
        if ( selectedOp.prop('disabled') ) {
            var enabled = $('input:enabled:last', radioForms[i]);
            if (enabled.length){
                enabled.prop('checked', true);
            }
        }

    });  // <--  validInputs.forEach()
}


////////////////////////////////////////////////////////////////////////////////

function drawRhythmicGrid(gridConfig){
    var startTime = performance.now();
    // console.log('Rhythmic config: '); console.log(gridConfig);
    
    /////// GENERATE BLOCK DIVS ///////////
    var container = allConfigs.gridContainer,
        c = 0;

    container.empty();
    gridConfig.rhythmicGrid.blocks.forEach( function(val, idx, arr){
        var row = $('<div>').addClass('row');

        //val[2] - number of blocks (columns) in current row
        // see @class Grid (RhythmicGridGenerator.js)
        for (var i=1; i<=val[2]; i++){
            var inner = $('<div>').addClass('inner').addClass('inner'+i);
            
            // pairwise image & text for odd-even blocks
            c++;
            if ( val[2]===3 && i===1 && !(c%2) ) c++; // if 3 columns, always start with an image
            if (c%2 || idx+1===arr.length/*the last biggest block is better with an image*/){
                var imgId = Math.floor(c/2) % allConfigs.imageMocks + 1;
                inner.attr('style', 'background-image: url(img/mocks/' + imgId +'.jpg');
                // console.log(inner.attr('style'));
            } else {
                var txtmck = allConfigs.textMocks[idx];
                inner.append( $('<div>').addClass('text').text(txtmck) );
            }

            var column = $('<div>').addClass('column').append(inner);
            row.append(column);
        }

        container.append(row);
    });


    //////////  SET BLOCK CSS RULES  ///////////
    var g = gridConfig.gutter.W;
    console.log('Blocks: ' + gridConfig.rhythmicGrid.blocks.map(function(v){ return v[0]+"x"+v[1] }));

    $('.grid-outer-wrapper').css({
        'max-width': gridConfig.maxCanvasWidth+'px'
    });

    $('.grid-container').css({
        'max-width': gridConfig.rhythmicGrid.W+'px'
    });

    $('.row').css({
        'margin-left': g/2,
        'margin-right': g/2
    });
    
    $('.column').css({
        'padding-left': g/2,
        'padding-right': g/2,
        'margin-bottom': g
    });

    // TOFIX
    // a problem with relative flex values and floats, eg 66.666667% 
    $('.column .inner').css('padding-bottom', 100/gridConfig.ratio.R+'%')

    // TOFIX line-height vs baseline
    $('.column .inner .text').css({
        'line-height': 1+(gridConfig.baseline-3)/10+'em',
        // 'display': 'inline-block',
        // 'white-space': 'nowrap',
        // 'overflow': 'hidden',
        'text-overflow': 'ellipsis'
    });


    // truncate overflow text
    $(".column .inner .text").dotdotdot();


    // var gridRules = Object
    //     .keys(document.styleSheets)
    //     .map(function(me) { return document.styleSheets[e] })
    //     .filter(function(fe) { return /grid\.css/.test(e.href); })[0];
    // gridRules = gridRules.cssRules || gridRules.rules;

    var timing = performance.now() - startTime;
    // console.log('... grid rendering finished (%.1dms).', timing);
    return ;
}