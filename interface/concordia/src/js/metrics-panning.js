
///////////////////////////////////////////////////////////////////////////////
///////////////////// CANVAS PANNING //////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**********************
     CANVAS PANNING 
***********************/

var dragging = false,
    lastX = 0,
    translated = 0; // localStorage.getItem('drag-translation') || 0;

// TODO fix glitch when dragging cursor outside the canvas
// stops scrolling if text goes outside the canvas
function restrictRange(transdelta){
  // console.log('Scrolling lastX: %s; delta: %s; translated: %s; width: %s', lastX, transdelta-translated, translated, curr_mtext_width);
  // if text fits within canvas width completely
  if (curr_mtext_width < canvasT.width)
    return transdelta > canvasT.width-curr_mtext_width ? canvasT.width-curr_mtext_width :
           transdelta < 0 ? 0 : transdelta;
  // if text is wider then the canvas width
  else {
    var pm = 0.15; // panning margin, normalized
    return transdelta > canvasT.width*(pm) ? canvasT.width*(pm)  :
           transdelta < -curr_mtext_width+canvasT.width/(1+pm) ? -curr_mtext_width+canvasT.width/(1+pm) : 
           transdelta;
  }
}

window.onmousemove = function(e){
  var evt = e || event;

  if (dragging){
    e=e || window.event;
    pauseEvent(e);
    var delta = evt.offsetX - lastX;
    translated = restrictRange(translated+delta);
    lastX = evt.offsetX;
    drawText(curr_typeface, curr_mtext);
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
// TODO horizontal scroll-panning (currently only in FireFox)
// canvasT.addEventListener('DOMMouseScroll', mouseWheelEvent);
// canvasT.addEventListener('mousewheel', mouseWheelEvent, false);

function mouseWheelEvent(e){
    var delta = 0;

    // console.log(e);
    switch (e.type){
      case 'DOMMouseScroll': // FireFox
        delta = Math.round(e.wheelDelta || e.detail*10);
        break;

      case 'mousewheel': // Chrome (e.deltaY),  IE & Opera (e.wheelDelta)
        delta = Math.round(e.deltaX || e.deltaY || e.wheelDelta);
        break; 
      
      default:
        console.log('Currently "%s" type is not supported.', e.type);
        return false;
    }
    translated = restrictRange(translated+delta);
    // translated += delta;

    drawText(curr_typeface, curr_mtext);
    // mouseController.wheel(e);
    return false; 
};

// disable wheel events in main window, but still accessible in canvas
// TOFIX works in chrome but not in FF
// window.onwheel = function() { return false; }

// in order to prevent unwanted selection while dragging
function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}