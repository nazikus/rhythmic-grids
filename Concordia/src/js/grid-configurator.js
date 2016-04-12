function setupRadioItems(allConfigs){
    allConfigs.radioForms.each( function(idx, el){
        $(el).empty(); // clear default (index.html) radio options
        // append <input> and <label> for each config value
        $(el).append( createRadioInputs(allConfigs.inputNames[idx], 
                                        allConfigs.rangeArrs[idx]) );

        // restore selection from previous session (if any)
        var prevSelection = localStorage.getItem($(el).attr('id'));
        if (prevSelection)
            $('input[value="'+prevSelection+'"]', el).prop('checked', true);

        $(el).on('change', onGridChange);
    });

    // append extra baseline radio selection for degenerated baseline
    // (when line height is not divisible by 2 nor by 3)
    // var gBLin = allConfigs.inputNames[2]; // 'gridBaseline' input name
    // $('#'+gBLin)
    //     .append( $('<input>').attr({'type':'radio', 'id':gBLin+'X', 'name':gBLin}).val(0))
    //     .append( $('<label>').attr('for', gBLin+'X').text(0) );

    // refresh radio inputs by triggering fontSize -> lineHeight -> grid onChange
    $('#input-fontsize').trigger('change');
}

////////////////////////////////////////////////////////////////////////////////

// called several times during setupRadioItems()
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

// process ALL radio selections on every single change in grid config
function onGridChange(e){
    var getAllSelections = function(){
        return $('input:checked', allConfigs.radioForms)
                .map(function() {
                    var val = $(this).val(); 
                    return isNaN(val) ? val : ~~val;
                 }).toArray();
    }

    var el = $(e.target).parent();  // .form-group element
    var allGridSelections = getAllSelections();

    refreshRadioInputs(allConfigs.radioForms, allGridSelections); // NB! this might modify the selection
    allGridSelections = getAllSelections(); // update if selection modified

    var selected = $('input:checked', el);

    // if ratio form: change-back the grphic ratio selector (from previous section)
    if (el.attr('id') === 'gridRatio'){
        var ratioStr = selected.val();
        $('.ratio-selector input[name=ratioSelector][id=ratio'+ratioStr+']')
            .prop('checked', true);
    }

    // if baseline form: change line height in font selector, and in text samples
    if (el.attr('id') === 'gridBaseline'){
        $('#input-lineheight').val(selected.val()*_LHBL_F).trigger('change');
        return ; // to avoid grid double-generation, onLineheightChange generates it anyway
    }

    // save current selection for the future sessions
    localStorage.setItem(el.attr('id'), selected.val());

    // console.log("Grid conifg: [%s]", allGridSelections.join(', '));

    // re-draw the grid
    var gridConfig = RhythmicGridGenerator.selectGrid(
                allConfigs.allValidGrids, allGridSelections );

    if (gridConfig)
        drawRhythmicGrid(gridConfig);
    else
        allConfigs.gridContainer.empty();
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
    
    ///////////////////////////////////////
    /////// GENERATE BLOCK DIVS ///////////
    ///////////////////////////////////////
    var container = allConfigs.gridContainer,
        c = 0;

    container.empty();
    gridConfig.rhythmicGrid.blocks.forEach( function(val, idx, arr){
        var row = $('<div>').addClass('row');

        //val[2] - number of blocks in current row
        // see @class Grid (RhythmicGridGenerator.js)
        var blocksInRow = val[2],
            blockWidth = val[0];

        if (blocksInRow > 9) // no need to show very small micro-blocks
            return;

        for (var i=1; i<=blocksInRow; i++){
            if (idx===arr.length-1 && blockWidth>=1000)
                continue; // skip if the last row and block is wider than 1000

            var inner = $('<div>').addClass('inner').addClass('inner'+i);
            
            c++;
            // pairwise image & text blocks (if c odd - image, if c even - text)
            
            if (i===1 && !(c%2) ) c++; // first column in row always start with an image, not text
            
            if (c%2 || idx+1===arr.length){ // the last biggest block bett with an image, then text
                var imgId = Math.floor(c/2) % allConfigs.imageMocks + 1;
                inner.attr('style', 'background-image: url(img/mocks/' + imgId +'.jpg)');
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


    ////////////////////////////////////////////
    ////////////  SET BLOCKS STYLE  ////////////
    ////////////////////////////////////////////
    var g = gridConfig.gutter.W;
    console.log('Blocks: ' + gridConfig.rhythmicGrid.blocks.map(function(v){ return v[0]+"x"+v[1] }));

    $('.grid-outer-wrapper').css({
        'max-width': gridConfig.maxCanvasWidth+'px'
    });

    $('.grid-container').css({
        'max-width': gridConfig.rhythmicGrid.W+'px'
    });

    $('.row').css({
        'margin-left': -(g/2),
        'margin-right': -(g/2)
    });

    $('.column').css({
        'padding-left': g/2,
        'padding-right': g/2,
        'margin-bottom': g
    });

    $('.text').css({
        // 'text-decoration': 'underline',
        'font-family': $('#fontSelect').val()+",monospace",
        'font-size': parseInt($('.input-fontsize > input').val(), 10)+'px'
    });

    // TOFIX a problem with relative flex values and floats, eg 66.666667%
    $('.column .inner').css('padding-bottom', 100/gridConfig.ratio.R+'%')


    $('.column .inner .text').css({
        'line-height': 1+(gridConfig.baseline-3)/10+'em',
        // 'display': 'inline-block',
        // 'white-space': 'nowrap',
        // 'overflow': 'hidden',
        'text-overflow': 'ellipsis'
    });


    // truncate overflow text
    // TOFIX not working with grid divs
    // $(".column .inner .text").dotdotdot();


    // var gridRules = Object
    //     .keys(document.styleSheets)
    //     .map(function(me) { return document.styleSheets[e] })
    //     .filter(function(fe) { return /grid\.css/.test(e.href); })[0];
    // gridRules = gridRules.cssRules || gridRules.rules;


    /////////////////////////////////////////
    /////// GENERATE RULER GUIDES ///////////
    /////////////////////////////////////////
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
        'margin-bottom': gridConfig.baseline - 1 // border takes 1px
    });

    // hide/show ruler guides
    if ($('#grid-toggle').data('grid-toggle') === 'on'){
        $('.rulers-wrapper-vertical').removeClass('hidden');
        $('.rulers-wrapper-horizontal').removeClass('hidden');
    } else {
        $('.rulers-wrapper-vertical').addClass('hidden');
        $('.rulers-wrapper-horizontal').addClass('hidden');
    }
    

    ////////////////////////////////////////////////////////////////////
    var timing = performance.now() - startTime;
    // console.log('... grid rendering finished (%.1dms).', timing);
    return ;
}