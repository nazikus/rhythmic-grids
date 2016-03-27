
function initializeRadioItems(allConfigs){

    // all config radio elements
    radioForms = $('.grid-section > .container > .flex-row > ' +
                   '.flex-child:lt(5) > .form-group');

    var getSelected = function(){
        return $('input:checked', radioForms) 
                .map(function() {  
                    var val = $(this).val();
                    return isNaN(val) ? val : ~~val;
                })
                .toArray(); 
    };

    radioForms.each( function(idx, el){
        // clear default config radio options
        $(el).empty();

        // append <input> and <label> for each config value
        $(el).append( createRadioInputs(allConfigs.inputNames[idx], 
                                        allConfigs.rangeArrs[idx]) );

        $(el).on('change', function(){
          // get ALL inputs on every single change
          refreshRadioInputs(radioForms, getSelected()); // might modify selection

          // console.log("Grid conifg: [%s]", getSelected().join(', '));
        });
     });

    // trigger onChange event to refresh radio inputs at startup
    $(radioForms[0]).trigger('change');
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