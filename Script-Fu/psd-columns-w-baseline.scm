(define (psd-columns-w-baseline maxWidth maxHeight baseline xCoords psdDirPath psdFilename)

; Generates vertical guides
; xCoords - x coordinates wher vertical guides is put

    ; (gimp-message "debug info")
    
    ; INITIALIZE VARS, IMAGE AND LAYER
    (let* (
        (baselinesNum (- (floor (/ maxHeight baseline)) 1))
        (msgFontsizePx 32)
        (msgX (+ (car xCoords) 1))
        (msgY (- (* (ceiling (/ msgFontsizePx baseline)) baseline) (- msgFontsizePx 2)) )
        (rhImage (car (gimp-image-new maxWidth maxHeight RGB)) )
        (rhLayer (car (gimp-layer-new rhImage 
                                      maxWidth   
                                      maxHeight 
                                      RGB-IMAGE 
                                      "Background" 
                                      100 
                                      NORMAL-MODE)) )
        )

    (gimp-image-insert-layer rhImage rhLayer 0 0)
    (gimp-drawable-fill rhLayer WHITE-FILL)


    ; INSERT VERTICAL GUIDES (columns of micro-blocks)
    ; columns guides (vertical gutters)
    (while (not (null? xCoords))
        (gimp-image-add-vguide rhImage (car xCoords))
        (set! xCoords (cdr xCoords))
    )

    ; INSERT HORIZONTAL GUIDES (per baseline)
    (while (not (= baselinesNum 0))
        (gimp-image-add-hguide rhImage (* baselinesNum baseline))
        (set! baselinesNum (- baselinesNum 1))
    )
    
    (gimp-text-fontname rhImage rhLayer msgX msgY "Make sure guides are visible" -1 1 msgFontsizePx 0 "sans")


    
    ; DEBUG, OUTPUT TO ERROR CONSOLE (Menu > Windows > Dockable Dialogs > Error Console)
    ; (gimp-display-new rhImage)   
    ; (gimp-image-clean-all rhImage)
    ; (gimp-message psdDirPath)

    (file-psd-save RUN-NONINTERACTIVE rhImage rhLayer (string-append psdDirPath psdFilename) psdFilename 0 0)
    ; (file-psd-save RUN-NONINTERACTIVE rhImage rhLayer "D:\\testi.psd" "testi.psd" 0 0)
    
    ; RETURN LIST
    (list rhImage rhLayer)
    
    )   
)

; Register current Script-Fu script
(script-fu-register "psd-columns-w-baseline"  ; function names
                    "Vertical guides"  ; menu label
                    "Creates new image along with specified vertical guides. Returns ID of the created image and ID of its drawable (layer)."  ; description
                    "nazariy.hrabovskkyy@gmail.com"    ; author
                    "Nazariy Hrabovskyy" ; copyright
                    "22-01-2017"         ; date created     
                    ""                   ; image mode (not needed for scripts creating new images)
)

; command examples for Script-Fu console (Menu > Filters > Script-Fu > Console):
; (psd-columns-w-baseline 960 900 '(100 300 320 520 540 740 760) "D:\\" "psd_name_vglpsd")
