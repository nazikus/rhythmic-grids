var typeface_arr = ['Helvetica', 'Verdana', 'Times New Roman'];
var fontsize_arr = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]; // px
var lineheight_arr = [11, 22]; // px

// var metrics_sample = 'abcdefghijklmnopqstuvwxyzABCDEFGHIJKLMNOPQSTUVWXYZ';
var metrics_sample = 'Munchy';
var metrics_fontsize = 150; // px

var canvas = $('#metrics-canvas')[0];
var ctx = canvas.getContext('2d');

canvas.width = parseInt( $('#metrics-canvas').css('width'), 10);
canvas.height = parseInt( $('#metrics-canvas').css('height'), 10);
console.log('Canvas %sx%s', canvas.width, canvas.height);
  
detective = new Detector();
font.setup();
typeface_arr = getAvailableFontList();
$('#options')
  .append(createDropDown('Typeface', 'typeface-dd', typeface_arr))
  .append(createDropDown('Font size', 'fontsize-dd', fontsize_arr))
  .append(createDropDown('Line height', 'lineheight-dd', lineheight_arr));


////////////////////////////////////////////////////////////////////////////

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


function getSelectedOptionsArr() {
  return $('.dd :selected')
             .map( function(i) { return this.value })
             .toArray()
             .map( function(e, i) { return  i ? ~~e : e;  });
}


function onDropDownChange(e) {
  var id = $(this).attr('id');
  console.log("onChange: %s %s", id, this.value );

  // store selections between sessions
  localStorage.setItem(id, this.value);

  // update text sample
  switch(id){
    case 'typeface-dd':

      // test if typeface is supported in browser
      if (typeof detective !== 'undefined'){
        // console.log("Lalit detector: %s", detective.detect(this.value));
        // console.log("Font detector: %s", font.isInstalled(this.value));
      }

      $('#text-sample').css('font-family', this.value+ ', monospace');

      break;

    case 'fontsize-dd':
      $('#text-sample').css('font-size', this.value+'px');
      break;
    
    case 'lineheight-dd':
      $('#text-sample').css('line-height', this.value+'px');
      break;
  }

  // draw font metrics
  drawText( $('#typeface-dd').val() );
};


function drawText(typeface) {
  // TODO metric lines labels


  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var baseline_y = canvas.height/3*2,
      xoff = 30,   // x offset from left
      b = 15;     // size of metric lines "brackets" (extending outside bounding box)


  // Text sample
  ctx.font= metrics_fontsize + "px " + typeface;
  canvas.style.font = ctx.font;
  var metrics = ctx.measureText(metrics_sample); // fontmetrics.js
  var line_length = canvas.width - 100;//metrics.width+b*2-xoff;
  
  console.log('Baseline Y: %s', baseline_y);
  console.log(metrics);

  // Baseline 
  ctx.beginPath();
  ctx.strokeStyle = 'lightseagreen';
  ctx.lineWidth = 3;
  ctx.moveTo(xoff, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.lineTo(line_length, baseline_y + Math.floor(ctx.lineWidth/2));
  ctx.stroke();

  // Ascent
  ctx.beginPath();
  ctx.strokeStyle = 'lightgray';
  ctx.lineWidth = 2;
  ctx.moveTo(xoff, baseline_y-metrics.ascent);
  ctx.lineTo(line_length, baseline_y-metrics.ascent);
  ctx.stroke();

  // Descent
  ctx.beginPath();
  ctx.strokeStyle = 'lightgray';
  ctx.lineWidth = 2;
  ctx.moveTo(xoff, baseline_y+metrics.descent);
  ctx.lineTo(line_length, baseline_y+metrics.descent);
  ctx.stroke();

  // Safebox
  var safe_h = Math.round(metrics_fontsize/2);
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 107, 255, .8)';
  ctx.fillStyle = 'rgba(0, 107, 255, .3)';
  ctx.lineWidth = 2;
  ctx.fillRect(xoff, baseline_y-safe_h, line_length-xoff, safe_h);
  ctx.stroke();

  // draw text
  ctx.fillStyle = 'black';
  ctx.fillText(metrics_sample, xoff+b, baseline_y);
};

$(document).ready(function() {
    detective = new Detector();
    font.setup();

});


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

