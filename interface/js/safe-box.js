var typeface_arr = ['Helvetica', 'Verdana', 'Times New Roman'];
var fontsize_arr = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]; // px
var lineheight_arr = [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]; // px

var metrics_sample = 'Munchy';

var canvas = $('#metrics-canvas')[0];
var ctx = canvas.getContext('2d');

// set canvas width attribute same as css width style
canvas.width = parseInt( $('#metrics-canvas').css('width'), 10);
canvas.height = parseInt( $('#metrics-canvas').css('height'), 10);

console.log('Canvas %sx%s', canvas.width, canvas.height);
  
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

// text rendering with font metrics visualized
function drawText(typeface, text) {
  var metrics_alphabet = '\\/\'`?<>;{}!@#$%^&*()abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      metrics_fontsize = 150; // px

  // Initialize text font and extract its metrics
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = metrics_fontsize + "px " + typeface;
  canvas.style.font = ctx.font;
  var metrics  = ctx.measureText(metrics_alphabet),  // fontmetrics.js
      x_height = ctx.measureText('x').ascent,
      cap_height=ctx.measureText('H').ascent,
      ascent  = metrics.ascent,
      descent = metrics.descent;

  // coordinates values for drawing metric lines
  var baseline_y = canvas.height/3*2,
      xoff = 30,   // x offset from left
      b = 15,     // size of metric lines "brackets" (extending outside bounding box)
      line_length = canvas.width - 100, //metrics.width+b*2-xoff;
      safebox_h = Math.round(metrics_fontsize / 2); // Math.round(height/2)

  // console.log('Baseline Y: %sx', baseline_y);
  // console.log('Safe-box height: %s', safebox_h);
  console.log(metrics);


  // TODO metric lines labels
  // Safebox rectangle
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 107, 255, .3)';
  ctx.lineWidth = 2;
  ctx.fillRect(xoff, baseline_y-safebox_h, line_length-xoff, safebox_h);
  ctx.stroke();

  // Baseline line
  ctx.beginPath();
  ctx.strokeStyle = 'lightseagreen';
  ctx.lineWidth = 3;
  ctx.moveTo(xoff, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.lineTo(line_length, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.stroke();

  // x-height line
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 1;
  ctx.moveTo(xoff, baseline_y - x_height);
  ctx.lineTo(line_length, baseline_y - x_height);
  ctx.stroke();

  // cap-height line
  ctx.beginPath();
  ctx.strokeStyle = 'orange';
  ctx.lineWidth = 1;
  ctx.moveTo(xoff, baseline_y - cap_height);
  ctx.lineTo(line_length, baseline_y - cap_height);
  ctx.stroke();

  // Ascent line
  ctx.beginPath();
  ctx.strokeStyle = 'lightgray';
  ctx.lineWidth = 2;
  ctx.moveTo(xoff, baseline_y-ascent);
  ctx.lineTo(line_length, baseline_y-ascent);
  ctx.stroke();

  // Descent line
  ctx.beginPath();
  ctx.strokeStyle = 'lightgray';
  ctx.lineWidth = 2;
  ctx.moveTo(xoff, baseline_y+descent);
  ctx.lineTo(line_length, baseline_y+descent);
  ctx.stroke();

  // draw text
  ctx.fillStyle = 'black';
  ctx.fillText(text, xoff+b, baseline_y);

  console.log('-------------------------------------')
};



// it is recommended to initialize Detector on document ready
$(document).ready(function() {
  // TODO some fonts that are detected are rendered incorrectly
  //      see Bodoni*, Bookshelf
  detective = new Detector();
  font.setup();

  // since detector is initialized just above,
  // system fonts can be extract only after document is loaded.
  typeface_arr = getAvailableFontList();
  var metrics_text = localStorage.getItem('metrics-text-dd') || metrics_sample;

  // populate dropdown controls
  $('#options')
    .append(createDropDown('Typeface', 'typeface-dd', typeface_arr))
    .append(createDropDown('Font size', 'fontsize-dd', fontsize_arr))
    .append(createDropDown('Line height', 'lineheight-dd', lineheight_arr))
    .append( $('<div>').attr('class', 'dd')
                       .append( $('<label>').text(' Text:') )
                       .append( $('<input>')
                                  .attr('id', 'metrics-text-dd')
                                  .attr('type', 'text')
                                  .attr('value', metrics_text)
                                  .width(70)
                                  .on('keyup', onTextChange)
                        )
           );
});



// populates option selects (dropdown list)
function createDropDown(label, id, values) {
  var container = $('<div>').addClass('dd');
  var l = $('<label>').text(label);
  var d = $('<select>').prop('id', id);

  container.append(l);
  container.append(d);

  values.forEach(function(value, i) {
    var o = $('<option>').prop('value', value).text(value);
    if (!i) o.prop('selected', true);  // init with the first value
    d.append(o);
  });

  d.on('change', onDropDownChange);
  d.on('keyup', function(){  $(this).trigger('change');  });

  // initialize dropdown values (from previous session if any)
  d.find('option[value="'+localStorage.getItem(id)+'"]')
   .attr('selected','selected')
   .parent()
   .trigger('change');

  return container;
}

// update canvas text drawing when input text field edited
function onTextChange(e){
  var id = $(this).attr('id');

  localStorage.setItem(id, this.value);
  // console.log('onChange: %s %s', id, this.value);

  // for some reason hangs when no text in canvas, so stubbed with 'x'
  var text = $('#metrics-text-dd').val() || 'x';
  drawText( $('#typeface-dd').val(), text);
}

// dropdown event handler
function onDropDownChange(e) {
  var id = $(this).attr('id');

  // store selections between sessions
  localStorage.setItem(id, this.value);
  console.log("onChange: %s %s", id, this.value );

  // update text sample
  switch(id){
    case 'typeface-dd':

      // test if typeface is supported in browser
      if (typeof detective !== 'undefined'){
        // console.log("Lalit detector: %s", detective.detect(this.value));
        // console.log("Font detector: %s", font.isInstalled(this.value));
      }

      $('#text-sample').css('font-family', this.value+ ', monospace');

      // DEBUG - compare layout engine rendering to canvas rendering //
      // $('#test-metrics').text(metrics_sample);
      // $('#test-metrics').css('font-family', this.value+ ', monospace');
      // DEBUG - end//
      break;

    case 'fontsize-dd':
      $('#text-sample').css('font-size', this.value+'px');
      break;
    
    case 'lineheight-dd':
      $('#text-sample').css('line-height', this.value+'px');
      break;
  }

  // draw font metrics
  var text_sample = $('#metrics-text-dd').val() || localStorage.getItem('metrics-text-dd') || metrics_sample;
  drawText( $('#typeface-dd').val(),  text_sample);
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
    "Heather", "Heiti SC", "Heiti TC", "HELV", "Herald", "High Tower Text", 
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

