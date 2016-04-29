function setupRadioItems(){
    allConfigs.radioForms.each( function(idx, el){
        $(el).empty(); // clear default (index.html) radio options
        // append <input> and <label> for each config value
        $(el).append( createRadioInputs(allConfigs.inputNames[idx], 
                                        allConfigs.rangeArrs[idx]) );

        // restore selection from previous session (if any)
        var prevSelection = localStorage.getItem($(el).attr('id'));
        if (prevSelection)
            $('input[value="'+prevSelection+'"]', el).prop('checked', true);

        // set default ratio selected in ratio section as well
        if ($(el).attr('id') === 'gridRatio'){
            var ratioStr = $('#gridRatio > input:checked').val();
            $('.ratio-selector input[name=ratioSelector][id=ratio'+ratioStr+']')
                .prop('checked', true);
        }

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
		
		// default radio selection
        var name = allConfigs.inputNames;
        switch (inputName) {
            /* canvasWdith  */ case name[0]:  if(i==1) input.prop('checked', true); break;  
            /* gridRatio    */ case name[1]:  if(i==0) input.prop('checked', true); break;  
            /* gridBaseline */ case name[2]:  if(i==1) input.prop('checked', true); break;  
            /* gridColumns  */ case name[3]:  if(i==2) input.prop('checked', true); break;  
            /* gridGutter   */ case name[4]:  if(i==3) input.prop('checked', true); break;  
        }

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

    // console.log("id: %s; grid config: %s  [%s^]", el.attr('id'), allGridSelections.join(', '), arguments.callee.name);

    // process ALL radio selections on every single change in grid config
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
        var newLH = selected.val()*_LHBL_F;
        $('#input-lineheight').val( newLH );
        $('.example-text').css('line-height', newLH+'px');

        // update percent label
        _LHFS_R = newLH / parseInt( $('#input-fontsize').val() );
        $('#lineheight-percent-label').text( 
            Math.round( newLH / parseInt($('#input-fontsize').val()) * 100)+'%'
        );
    }

    // save current selection for the future sessions
    localStorage.setItem(el.attr('id'), selected.val());

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
    console.log('blocks: %s  [%s>%s^]', 
        gridConfig
            .rhythmicGrid
            .blocks
            .map(function(v){ return v[0]+"x"+v[1] })
            .join(', '),
        arguments.callee.caller.name,
        arguments.callee.name
    );

    $('#grid-width-text').text(gridConfig.rhythmicGrid.W);
    $('#column-width-text').text(gridConfig.rhythmicGrid.blocks[0][0]);
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
        var blockWidth  = val[0],
            blockHeight = val[1],
            blocksInRow = val[2];

        if (blocksInRow > 9) // no need to show very small micro-blocks
            return;

        for (var i=1; i<=blocksInRow; i++){
            if (idx===arr.length-1  )
                continue; // skip if the last row and block is wider than 1000

            var inner = $('<div>').addClass('inner').addClass('inner'+i);
            
            c++;
            // pairwise image & text blocks (if c odd - image, if c even - text)
            if (i===1 && !(c%2) ) c++; // first column in row always start with an image, not text
            
            if (c%2 || idx+1===arr.length){ // the last biggest block bett with an image, then text
                var imgId = Math.floor(c/2) % allConfigs.imageMocks + 1;
                inner.attr('style', 'background-image: url(img/'+gridConfig.ratio.str+'/' + imgId +'.jpg)');
                // console.log(inner.attr('style'));
            } else {
                var txtmck = 'Hdxp ' + allConfigs.textMocks[idx] + '.';
                inner.append( $('<div>').addClass('text').text(txtmck)
                    .width(blockWidth).height(blockHeight) );
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

    // TOFIX a problem with relative flex values and floats, eg 66.666667%
    $('.column .inner').css('padding-bottom', 100/gridConfig.ratio.R+'%')

    // text formatting AND aligning with horizontal ruler
    var lh = parseInt($('#input-lineheight').val()),
        fs = parseInt($('#input-fontsize').val());
    $('.column .inner .text').css({
        'font-family': $('#select-font').val()+",monospace",
        'font-size': parseInt($('#input-fontsize').val())+'px',
        'line-height': parseInt($('#input-lineheight').val())+'px',
        'padding': + Math.ceil((lh-fs)/2+3)+'px 0',
        'overflow': 'unset',
        // 'text-decoration': 'underline',
        // 'vertical-align': 'text-top',
        // 'white-space': 'nowrap',
        // 'text-overflow': 'ellipsis' // not working
    }).dotdotdot({ellipsis: '...', tolerance : 15});


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