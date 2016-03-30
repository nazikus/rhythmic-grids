
///////////////////////////////////////////////////////////////////////////////
///////////////////// CANVAS PANNING //////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// NB! REQUIRES metricsContext object, initialized in metrics-drawings.js

// TODO fix glitch when dragging cursor outside the canvas
// stops scrolling if text goes outside the canvas
function restrictRange(transdelta){
  var mCtx = metricsContext,
      mtextW = mCtx.curr_mtext_width,
      width  = mCtx.canvasT.width;
  // console.log('Scrolling lastX: %s; delta: %s; translated: %s; width: %s', 
     // mCtx.lastX, transdelta-mCtx.translated, mCtx.translated, mtextW);
  
  // if text fits within canvas width completely
  if (mtextW < width)
    return transdelta > width-mtextW ? width-mtextW :
           transdelta < 0 ? 0 : transdelta;
  // if text is wider then the canvas width
  else {
    var pm = 0.15; // panning margin, normalized
    return transdelta > width*(pm) ? width*(pm)  :
           transdelta < -mtextW+width/(1+pm) ? -mtextW+width/(1+pm) : 
           transdelta;
  }
}

window.onmousemove = function(e){
  var evt = e || event;
  var mCtx = metricsContext;

  if (mCtx.dragging){
    e=e || window.event;
    pauseEvent(e);
    var delta = evt.offsetX - mCtx.lastX;
    mCtx.translated = restrictRange(mCtx.translated+delta);
    mCtx.lastX = evt.offsetX;
    drawText();
  }

}

metricsContext.canvasT.onmousedown = function(e){
  var evt = e || event;
  metricsContext.dragging = true;
  metricsContext.lastX = evt.offsetX;
}

window.onmouseup = function(){
  metricsContext.dragging = false;
  // localStorage.setItem('drag-translation', metricsContext.translated);
}


// SCROLL PANNING
// TODO drag cursor for Chrome
// TODO block further wheel event propagation
// TODO kinectic scrolling: http://ariya.ofilabs.com/2013/11/javascript-kinetic-scrolling-part-2.html
// TODO horizontal scroll-panning (currently only in FireFox)
// canvasT.addEventListener('DOMMouseScroll', mouseWheelEvent);
// canvasT.addEventListener('mousewheel', mouseWheelEvent, false);

function mouseWheelEvent(e){
    var mCtx = metricsContext;
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
    mCtx.translated = restrictRange(mCtx.translated+delta);
    // translated += delta;

    drawText();
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