var typeface_arr   = ['Helvetica', 'Verdana', 'Times New Roman'];
var fontsize_arr   = Array.apply(0, Array(40-7)).map(function(v,i) { return i+8; }); // 8..40 px
var lineheight_arr = Array.apply(0, Array(30-2)).map(function(v,i) { return i+3; }); // 3..30 px

var metrics_alphabet = 'xMHy|$    (){}!?/\\\'`.,:;@#%^&*<>abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    metrics_fontsize = 170, // px
    metrics_default_text = metrics_alphabet, //'Munchy',
    curr_typeface = null,
    curr_mtext = null,
    xoff = 25;   // x offset from left

var canvas  = $('#metrics-canvas')[0],
    canvasT = $('#text-canvas')[0],
    ctx  = canvas.getContext('2d');
    ctxT = canvasT.getContext('2d');


// set canvas width attribute same as css width style
canvas.width   = parseInt( $('#metrics-canvas').css('width'),  10);
canvas.height  = parseInt( $('#metrics-canvas').css('height'), 10);
canvasT.width  = parseInt( $('#text-canvas').css('width'),  10);
canvasT.height = parseInt( $('#text-canvas').css('height'), 10);

console.log('Canvas %sx%s',  canvas.width,  canvas.height);
console.log('CanvasT %sx%s', canvasT.width, canvasT.height);
  
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

// all the inputs are initialized after document has been loaded.
// It is also recommended to initialize font Detector on document ready
$(document).ready(function() {
  // TODO some fonts that are detected and rendered incorrectly
  //      see Bodoni*, Bookshelf, Universe CE 55 medium, ...
  detective = new Detector();
  font.setup();
  localStorage.clear();

  // since detector is initialized here,
  // system fonts can be extract only after document is loaded.
  typeface_arr = getAvailableFontList();

  // populate dropdown controls
  $('#options')
    .append(createDropDown('Typeface', 'typeface-dd', typeface_arr))
    .append(createDropDown('Font size', 'fontsize-dd', fontsize_arr))
    .append(createDropDown('Line height', 'lineheight-dd', lineheight_arr))
    .append( $('<div>').attr('class', 'dd')
                       .append( $('<label>').text(' Text:') )
                       .append( $('<input>')
                                  .attr('id', 'metrics-text-eb')
                                  .attr('type', 'text')
                                  .attr('value', '')
                                  .width(70)
                                  .on('keyup', onTextChange)
                        )
           );

  curr_typeface   = $('#typeface-dd').val();
  $('#metrics-text-eb').val( localStorage.getItem('metrics-text-eb') || metrics_default_text );
  curr_mtext = $('#metrics-text-eb').val();
  
  $('#typeface-dd').trigger('change');
  $('#fontsize-dd').trigger('change');
  $('#lineheight-dd').trigger('change');
});


function drawText(typeface, text)
{
  var startTime = performance.now();
  var baseline_y = Math.round( canvasT.height*.70 ),
      line_length = canvasT.width - 100;

  // Initialize text font and extract its metrics
  ctxT.clearRect(0, 0, canvasT.width, canvasT.height);
  ctxT.font = metrics_fontsize + "px " + typeface;
  canvasT.style.font = ctxT.font;

  // draw sample text
  // NOTE. canvasT must have higher css z-index for proper overlay rendering
  ctxT.fillText(text, xoff+translated, baseline_y);
  // ctxT.font = '16px sans';  // fallback font in case non-valid typeface is passed

  var timing = performance.now() - startTime;
  // console.log('------------- text rendering finished (%.1fms).', timing);
}


// text rendering with font metrics visualized
function drawMetrics(typeface, text) {
  var startTime = performance.now();
  var metrics_label_font = '16px serif';

  // Initialize text font and extract its metrics
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = metrics_fontsize + "px " + typeface;
  canvas.style.font = ctx.font;
  
  var metrics  = ctx.measureText(metrics_alphabet),  // fontmetrics.js
      ascent  = metrics.ascent,
      descent = metrics.descent,
      x_height = ctx.measureText('x').ascent,
      cap_height=ctx.measureText('H').ascent,
      safebox_h = Math.round(metrics_fontsize / 2), // safe-box height
      xdev = x_height / safebox_h - 1;  // x-height deviation from safe-box height

  var baseline_y = Math.round( canvas.height*.70 ),
      line_length = canvas.width - 100; //metrics.width+b*2-xoff;

  // console.log('Baseline Y: %sx', baseline_y);
  // console.log('Safe-box height: %s', safebox_h);
  // console.log(metrics);
  // console.log('x-height deviation: %.1f%%', xdev*100)

  // font init for metrics labels
  ctx.font = metrics_label_font;
  canvas.style.font = ctx.font;

  // EM BOX lines
  var em_gap = Math.round((metrics_fontsize - (ascent+descent)) / 2);
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 0, 0, .7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, baseline_y-ascent-em_gap, 
                 line_length+xoff+30, metrics_fontsize);
  // console.log('Baseline = %s; Ascent = %s; Descent = %s; Em gap = %s', 
               // baseline_y, ascent, descent, em_gap);
  
  ctx.fillStyle = 'rgba(255, 0, 0, .8)';
  ctx.textBaseline = 'bottom';
  if (true) {  // rotate flag
    ctx.save();
    ctx.textAlign = 'right';
    ctx.rotate(Math.PI/2); // rotate coordinates by 90° clockwise
    ctx.fillText('em box', baseline_y+descent+em_gap-5, -2); // for vertical label
    ctx.restore();
  } else {
    ctx.textAlign = 'left';
    ctx.fillText('em box', 2, baseline_y-ascent-em_gap); // for horizontal label 
  }

  // SAFEBOX rectangle
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 107, 255, .3)';
  ctx.lineWidth = 2;
  ctx.fillRect(xoff, baseline_y-safebox_h, line_length-xoff, safebox_h);

  ctx.fillStyle = 'rgba(0, 107, 255, .8)';
  ctx.textBaseline = 'hanging';
  ctx.textAlign = 'left';
  // ctx.fillText('500UPM', line_length+5, baseline_y-safebox_h);

  // BASELINE line
  ctx.beginPath();
  ctx.strokeStyle = 'lightseagreen';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 3;
  ctx.moveTo(xoff, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.lineTo(line_length, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.stroke();

  ctx.textBaseline = 'hanging';
  ctx.textAlign = 'right';
  ctx.fillText('baseline', line_length, baseline_y+2);

  // X-HEIGHT line
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1;
  ctx.moveTo(xoff, baseline_y - x_height);
  ctx.lineTo(line_length, baseline_y - x_height);
  ctx.stroke();

  ctx.textBaseline = 'hanging';
  ctx.textAlign = 'right';
  ctx.fillText('x-height', line_length, baseline_y-x_height+1);

  // deviation in %
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  ctx.font = "11px sans";
  ctx.fillStyle = 'rgba(0, 107, 255, .9)';
  if (xdev != 0) {
    if (false){ // rotate flag
      ctx.save();
      ctx.rotate(Math.PI/2); // retote coordinates by 90° clockwise
      ctx.fillText((xdev>=0?'+ ':'– ') + Math.abs(Math.round(xdev*500)) + ' UPM', 
                   baseline_y-x_height-3, -line_length); // UPM, vertical label
      ctx.restore();
    } else {
      // ctx.fillText((xdev>=0?'+':'-') + Math.round(xdev*1000)/10 + '%', line_length, baseline_y-x_height+1); // %, horizontal label
      ctx.fillText((xdev>=0?'+':'') + Math.round(xdev*500) + ' UPM', line_length+3, baseline_y-x_height+5); // UPM, horizontal label
    }
  }
  ctx.font = metrics_label_font;

  // CAP HEIGHT line
  ctx.beginPath();
  ctx.strokeStyle = 'chocolate';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1;
  ctx.moveTo(xoff, baseline_y - cap_height);
  ctx.lineTo(line_length, baseline_y - cap_height);
  ctx.stroke();

  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'right';
  ctx.fillText('cap height', line_length, baseline_y-cap_height+1);

  // ASCENT & DESCENT lines
  ctx.beginPath();
  ctx.strokeStyle = 'lightgray';
  ctx.fillStyle = 'gray';
  ctx.lineWidth = 2;
  ctx.moveTo(xoff, baseline_y-ascent);
  ctx.lineTo(line_length, baseline_y-ascent);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xoff, baseline_y+descent);
  ctx.lineTo(line_length, baseline_y+descent);
  ctx.stroke();

  ctx.textBaseline = 'hanging';
  ctx.textAlign = 'left';
  ctx.fillText('ascent', xoff, baseline_y-ascent-2);

  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  ctx.fillText('descent', xoff, baseline_y+descent);

  var timing = performance.now() - startTime;
  console.log('------------- metrics rendering finished (%.1fms).', timing);
};


// create option's selections (dropdown list)
function createDropDown(label, id, values) {
  var container = $('<div>').addClass('dd');
  var l = $('<label>').text(label);
  var d = $('<select>').prop('id', id);

  container.append(l);
  container.append(d);

  values.forEach(function(value, i) {
    var o = $('<option>').prop('value', value).text(value);
    if (!i) o.prop('selected', true);  // init with the 1st value
    d.append(o);
  });

  d.on('change', onDropDownChange);
  d.on('keyup', function(){  $(this).trigger('change');  });

  // initialize dropdown values (from previous session if any)
  d.find('option[value="'+(localStorage.getItem(id) || 21)+'"]')
   .attr('selected','selected')
   .parent()
   .trigger('change');

  return container;
}



// update canvas text drawing when input text field is edited
function onTextChange(e){
  var code = (e.keyCode || e.which);
  // do nothing if pressed key is an arrow key (left, up, right, down), shift, ctrl, alt
  if( [37, 38, 39, 40, 16, 17, 18].indexOf(code) > -1 ) {
      return;
  }

  var id = $(this).attr('id');
  localStorage.setItem(id, this.value);
  // console.log('onChange: %s %s', id, this.value);

  // for some reason browser hangs when no text is rendered, so stubbed with 'x'
  curr_mtext = $('#metrics-text-eb').val() || 'x';
  drawText(curr_typeface, curr_mtext);
}



// dropdown event handler
function onDropDownChange(e) {
  var id = $(this).attr('id');

  // in order to remember selections between sessions
  localStorage.setItem(id, this.value);
  // console.log("onChange: %s %s", id, this.value );

  // update text sample according to the selected item
  switch(id){
    case 'typeface-dd':
      $('#text-paragraph').css('font-family', '"'+this.value+ '", monospace');
      curr_typeface = this.value;

      // re-draw font metrics
      drawMetrics(curr_typeface, $('#metrics-text-eb').val() );
      drawText(curr_typeface, $('#metrics-text-eb').val() );
      break;

    case 'fontsize-dd':
      $('#text-paragraph').css('font-size', this.value+'px');
      break;
    
    case 'lineheight-dd':
      $('#text-paragraph').css('line-height', this.value+'px');
      break;
  }

};



// detect available system fonts out of pre-defined font list (~500 fonts)
function getAvailableFontList() {
  var flist = [
    "Abadi MT Condensed Light", "Academy Engraved LET", "ADOBE CASLON PRO", 
    "Adobe Garamond", "ADOBE GARAMOND PRO", "Agency FB", "Aharoni", 
    "Albertus Extra Bold", "Albertus Medium", "Algerian", "Amazone BT", 
    "American Typewriter", "American Typewriter Condensed", "AmerType Md BT", 
    "Andalus", "Angsana New", "AngsanaUPC", "Antique Olive", "Aparajita", 
    "Apple Chancery", "Apple Color Emoji", "Apple SD Gothic Neo", 
    "Arabic Typesetting", "ARCHER", "ARNO PRO", "Arrus BT", "Aurora Cn BT", 
    "AvantGarde Bk BT", "AvantGarde Md BT", "AVENIR", "Ayuthaya", "Bandy", 
    "Bangla Sangam MN", "Bank Gothic", "BankGothic Md BT", "Baskerville", 
    "Baskerville Old Face", "Batang", "BatangChe", "Bauer Bodoni", "Bauhaus 93",
    "Bazooka", "Bell MT", "Bembo", "Benguiat Bk BT", "Berlin Sans FB",
    "Berlin Sans FB Demi", "Bernard MT Condensed", "BernhardFashion BT", 
    "BernhardMod BT", "Big Caslon", "BinnerD", "Blackadder ITC", 
    "BlairMdITC TT", "Bodoni 72", "Bodoni 72 Oldstyle", "Bodoni 72 Smallcaps",
    "Bodoni MT", "Bodoni MT Black", "Bodoni MT Condensed", 
    "Bodoni MT Poster Compressed", "Bookshelf Symbol 7", "Boulder", 
    "Bradley Hand", "Bradley Hand ITC", "Bremen Bd BT", "Britannic Bold", 
    "Broadway", "Browallia New", "BrowalliaUPC", "Brush Script MT", 
    "Californian FB", "Calisto MT", "Calligrapher", "Candara", 
    "CaslonOpnface BT", "Castellar", "Centaur", "Cezanne", "CG Omega", 
    "CG Times", "Chalkboard", "Chalkboard SE", "Chalkduster", "Charlesworth", 
    "Charter Bd BT", "Charter BT", "Chaucer", "ChelthmITC Bk BT", "Chiller", 
    "Clarendon", "Clarendon Condensed", "CloisterBlack BT", "Cochin", 
    "Colonna MT", "Constantia", "Cooper Black", "Copperplate", 
    "Copperplate Gothic", "Copperplate Gothic Bold", "Copperplate Gothic Light",
    "CopperplGoth Bd BT", "Corbel", "Cordia New", "CordiaUPC", 
    "Cornerstone", "Coronet", "Cuckoo", "Curlz MT", "DaunPenh", "Dauphin", 
    "David", "DB LCD Temp", "DELICIOUS", "Denmark", "DFKai-SB", "Didot", 
    "DilleniaUPC", "DIN", "DokChampa", "Dotum", "DotumChe", "Ebrima", 
    "Edwardian Script ITC", "Elephant", "English 111 Vivace BT", "Engravers MT",
    "EngraversGothic BT", "Eras Bold ITC", "Eras Demi ITC", "Eras Light ITC", 
    "Eras Medium ITC", "EucrosiaUPC", "Euphemia", "Euphemia UCAS",
    "EUROSTILE", "Exotc350 Bd BT", "FangSong", "Felix Titling", "Fixedsys", 
    "FONTIN", "Footlight MT Light", "Forte", "FrankRuehl", "Fransiscan", 
    "Freefrm721 Blk BT", "FreesiaUPC", "Freestyle Script", "French Script MT",
    "FrnkGothITC Bk BT", "Fruitger", "FRUTIGER", "Futura", "Futura Bk BT", 
    "Futura Lt BT", "Futura Md BT", "Futura ZBlk BT", "FuturaBlack BT", 
    "Gabriola", "Galliard BT", "Gautami", "Geeza Pro", "Geometr231 BT", 
    "Geometr231 Hv BT", "Geometr231 Lt BT", "GeoSlab 703 Lt BT", 
    "GeoSlab 703 XBd BT", "Gigi", "Gill Sans", "Gill Sans MT", 
    "Gill Sans MT Condensed", "Gill Sans MT Ext Condensed Bold", 
    "Gill Sans Ultra Bold", "Gill Sans Ultra Bold Condensed", "Gisha", 
    "Gloucester MT Extra Condensed", "GOTHAM", "GOTHAM BOLD", 
    "Goudy Old Style", "Goudy Stout", "GoudyHandtooled BT", "GoudyOLSt BT", 
    "Gujarati Sangam MN", "Gulim", "GulimChe", "Gungsuh", "GungsuhChe", 
    "Gurmukhi MN", "Haettenschweiler", "Harlow Solid Italic", "Harrington", 
    "Heather", "Heiti SC", "Heiti TC", "HELV", "Helvetica", "Herald", "High Tower Text", 
    "Hiragino Kaku Gothic ProN", "Hiragino Mincho ProN", "Hoefler Text", 
    "Humanst 521 Cn BT", "Humanst521 BT", "Humanst521 Lt BT", 
    "Imprint MT Shadow", "Incised901 Bd BT", "Incised901 BT", 
    "Incised901 Lt BT", "INCONSOLATA", "Informal Roman", "Informal011 BT", 
    "INTERSTATE", "IrisUPC", "Iskoola Pota", "JasmineUPC", "Jazz LET", 
    "Jenson", "Jester", "Jokerman", "Juice ITC", "Kabel Bk BT", 
    "Kabel Ult BT", "Kailasa", "KaiTi", "Kalinga", "Kannada Sangam MN", 
    "Kartika", "Kaufmann Bd BT", "Kaufmann BT", "Khmer UI", "KodchiangUPC", 
    "Kokila", "Korinna BT", "Kristen ITC", "Krungthep", "Kunstler Script", 
    "Lao UI", "Latha", "Leelawadee", "Letter Gothic", "Levenim MT", "LilyUPC",
    "Lithograph", "Lithograph Light", "Long Island", "Lydian BT", "Magneto", 
    "Maiandra GD", "Malayalam Sangam MN", "Malgun Gothic", "Mangal", "Marigold", 
    "Marion", "Marker Felt", "Market", "Marlett", "Matisse ITC",
    "Matura MT Script Capitals", "Meiryo", "Meiryo UI", "Microsoft Himalaya", 
    "Microsoft JhengHei", "Microsoft New Tai Lue", "Microsoft PhagsPa", 
    "Microsoft Tai Le", "Microsoft Uighur", "Microsoft YaHei", 
    "Microsoft Yi Baiti", "MingLiU", "MingLiU_HKSCS", "MingLiU_HKSCS-ExtB", 
    "MingLiU-ExtB", "Minion", "Minion Pro", "Miriam", "Miriam Fixed", "Mistral", 
    "Modern", "Modern No. 20", "Mona Lisa Solid ITC TT", "Mongolian Baiti",
    "MONO", "MoolBoran", "Mrs Eaves", "MS LineDraw", "MS Mincho", "MS PMincho", 
    "MS Reference Specialty", "MS UI Gothic", "MT Extra", "MUSEO", "MV Boli", 
    "Nadeem", "Narkisim", "NEVIS", "News Gothic", "News GothicMT",
    "NewsGoth BT", "Niagara Engraved", "Niagara Solid", "Noteworthy", "NSimSun", 
    "Nyala", "OCR A Extended", "Old Century", "Old English Text MT", "Onyx",
    "Onyx BT", "OPTIMA", "Oriya Sangam MN", "OSAKA", "OzHandicraft BT", 
    "Palace Script MT", "Papyrus", "Parchment", "Party LET", "Pegasus", 
    "Perpetua", "Perpetua Titling MT", "PetitaBold", "Pickwick", 
    "Plantagenet Cherokee", "Playbill", "PMingLiU", "PMingLiU-ExtB", 
    "Poor Richard", "Poster", "PosterBodoni BT", "PRINCETOWN LET", "Pristina",
    "PTBarnum BT", "Pythagoras", "Raavi", "Rage Italic", "Ravie", 
    "Ribbon131 Bd BT", "Rockwell", "Rockwell Condensed", "Rockwell Extra Bold",
    "Rod", "Roman", "Sakkal Majalla", "Santa Fe LET", "Savoye LET",
    "Sceptre", "Script", "Script MT Bold", "SCRIPTINA", "Serifa", "Serifa BT", 
    "Serifa Th BT", "ShelleyVolante BT", "Sherwood", "Shonar Bangla", 
    "Showcard Gothic", "Shruti", "Signboard", "SILKSCREEN", "SimHei", 
    "Simplified Arabic", "Simplified Arabic Fixed", "SimSun", "SimSun-ExtB", 
    "Sinhala Sangam MN", "Sketch Rockwell", "Skia", "Small Fonts", "Snap ITC",
    "Snell Roundhand", "Socket", "Souvenir Lt BT", "Staccato222 BT", "Steamer",
    "Stencil", "Storybook", "Styllo", "Subway", "Swis721 BlkEx BT",
    "Swiss911 XCm BT", "Sylfaen", "Synchro LET", "System", "Tamil Sangam MN", 
    "Technical", "Teletype", "Telugu Sangam MN", "Tempus Sans ITC", "Terminal",
    "Thonburi", "Traditional Arabic", "Trajan", "TRAJAN PRO", "Tristan",
    "Tubular", "Tunga", "Tw Cen MT", "Tw Cen MT Condensed", 
    "Tw Cen MT Condensed Extra Bold", "TypoUpright BT", "Unicorn", "Univers", 
    "Univers CE 55 Medium", "Univers Condensed", "Utsaah", "Vagabond", "Vani",
    "Vijaya", "Viner Hand ITC", "VisualUI", "Vivaldi", "Vladimir Script", 
    "Vrinda", "Westminster", "WHITNEY", "Wide Latin", "ZapfEllipt BT", 
    "ZapfHumnst BT", "ZapfHumnst Dm BT", "Zapfino", "Zurich BlkEx BT",
    "Zurich Ex BT", "ZWAdobeF"
  ];
  detective = new Detector();
  font.setup();

  var availableFonts = [];
  var currFont = null;
  for (var f in flist){
    currFont = flist[f];
    // console.log("%s: %s", cuffFont, detective.detect(currFont) );
    if (detective.detect(currFont)){
      availableFonts.push(currFont);
    }
  }

  console.log('Available fonts %s/%s', availableFonts.length, flist.length);
  return availableFonts;
};

/**********************
     CANVAS PANNING 
***********************/

var launchState = false,
    dragging = false,
    lastX = 0,
    translated = 0; //localStorage.getItem('drag-translation') || 0;

window.onmousemove = function(e){
  var evt = e || event;

  if (dragging){
    var delta = evt.offsetX - lastX;
    translated += delta;
    lastX = evt.offsetX;
    drawText(curr_typeface, curr_mtext);
    // console.log('Dragging... lastX: %s; delta: %s; translated: %s', lastX, delta, translated);
  }

}

canvasT.onmousedown = function(e){
  // console.log('Mouse down');
  var evt = e || event;
  dragging = true;
  lastX = evt.offsetX;
}

window.onmouseup = function(){
  // console.log('Mouse up');
  dragging = false;
  localStorage.setItem('drag-translation', translated);
}


// SCROLL PANNING
// TODO drag cursor for Chrome
// TODO block further wheel event propagation
// TODO kinectic scrolling: http://ariya.ofilabs.com/2013/11/javascript-kinetic-scrolling-part-2.html
// TODO horizontal scroll-panning
canvasT.addEventListener('mousewheel', function(e){
    console.log(e);
    translated += e.deltaX || e.deltaY;
    drawText(curr_typeface, curr_mtext);

    // mouseController.wheel(e);
    return false; 
}, false);

// canvasT.onmousewheel = function(e) {
//   console.log(e);
// }