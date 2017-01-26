(define (psd-rhythmic-guides maxWidth
                         ratio
                         baseline
                         columns
                         gutterX
                         blocks
                         psdDirPath
                         psdFilename)
; Generates vertical guides along micro-block sides and horizontal lines along each baseline
; maxWidth - width of a canvas/layer
; ratio    - list of ratio values '(width height)
; baseline - (unused) show first few baseline guides
; columns  - number of micro-blocks fitting horizontally into maxWidth
; gutterX  - gutter width ratio

    (gimp-message "1")
    
    ; INITIALIZE VARS, IMAGE AND LAYER
    ; uBlockW - micro-block width
    ; uBlockH - micro-block height
    (let* (
        (incV (reverse (makelist (- columns 1))))
        (incH (reverse (makelist (length blocks))))

        (r (/ (car ratio) (cadr ratio) ) )
        (gutter (* baseline gutterX))
        (uBlockH_min (lcm baseline (cadr ratio)) )
        (uBlockW_min (* uBlockH_min r) )

        ; uBlockW max == floor[ ((maxWidth+gutter)/columns - gutter) / uBlockW_min ] * uBlockW_min
        (uBlockW (* (truncate (/ (- (/ (+ maxWidth gutter) columns) gutter) uBlockW_min )) uBlockW_min) )
        (uBlockH (/ uBlockW r) )

        ; read from 'blocks' input, if not nil
        ; (uBlockW (caar blocks))
        ; (uBlockH (cadar blocks))

        (margin (/ (- maxWidth (- (* columns (+ uBlockW gutter)) gutter)) 2) )

        ; left & right guides for each vertical gutter
        (guidesVertL (map (lambda (x) (+ (* x (+ uBlockW gutter)) margin)) incV) )
        (guidesVertR (map (lambda (x) (+ (+ (* x (+ uBlockW gutter)) margin) uBlockW))  incV) )

        ; top & bottom guides for each vertical gutter
        (guidesHorizT 
            (if (null? blocks)
                nil
                (map (lambda (x) (+ (car x) (* (cadr x) gutter)) )
                    (zip (cons 0 (cumsum (map (lambda (x) (cadr x)) blocks))) incH) )
            )
        )
        (guidesHorizB (map (lambda (h) (+ h gutter) ) guidesHorizT) )

        (maxHeight (if (null? blocks) 900 (car (reverse guidesHorizB)) ))

        (baselinesV (makelist (/ maxHeight baseline)))
        (guidesHoriz (map (lambda (x) (* x baseline) ) baselinesV))

        ; joke, guide per each pixel height
        ; (baselinesV (makelist (- maxHeight 10)))
        ; (guidesHoriz  baselinesV) 

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


    ; INSERT RHYTHMIC GUIDES
    ; columns guides (vertical gutters)
    (while (not (null? guidesVertL))
        (gimp-image-add-vguide rhImage (car guidesVertL))
        (gimp-image-add-vguide rhImage (car guidesVertR))
        (set! guidesVertL (cdr guidesVertL))
        (set! guidesVertR (cdr guidesVertR))
    )
    
    ; block height guides (horizontal gutters)
    (while (not (null? guidesHorizT))
        (gimp-image-add-hguide rhImage (car guidesHorizT))
        (gimp-image-add-hguide rhImage (car guidesHorizB))
        (set! guidesHorizT (cdr guidesHorizT))
        (set! guidesHorizB (cdr guidesHorizB))
    )

    ; baseline guides
    (while (not (null? guidesHoriz))
        (gimp-image-add-hguide rhImage (car guidesHoriz))
        (set! guidesHoriz (cdr guidesHoriz))
    )

    ; DEBUG, OUTPUT TO ERROR CONSOLE (Menu > Windows > Dockable Dialogs > Error Console)
    ; (gimp-display-new rhImage)   
    ; (gimp-image-clean-all rhImage)
    ; (gimp-message psdDirPath)
    ; (gimp-message (string-append "Generated rhythmic guides with micro-block " (number->string uBlockW) "X" (number->string uBlockH) ))

    (file-psd-save RUN-NONINTERACTIVE rhImage rhLayer (string-append psdDirPath psdFilename) psdFilename 0 0)
    ; (file-psd-save RUN-NONINTERACTIVE rhImage rhLayer "D:\\testi.psd" "testi.psd" 0 0)
    
    ; RETURN LIST
    (list rhImage rhLayer)
    
    )   
)

; ------------------------------
; ------ HELPER FUNCTIONS ------
; ------------------------------

; generate incremental list
(define (makelist n)
  (if (= n 0)
     (list n)                       ; base case. Just return (0)
     (cons n (makelist (- n 1)))))  ; recursive case. Add n to the head of (n-1 n-2 ... 0)

; modulo operation
(define (mod a b) 
    (- a (* b (truncate (/ a b)) ) ) 
)

; greatest common divisor
(define (gcd a b) 
    (if (= b 0) 
        a 
        (gcd b (mod a b)) 
    )
)

; least common multiple
(define (lcm a b) 
    (/ (* a b) (gcd a b) ) 
)

; zip (pairwise concat) two lists. Source: https://github.com/magnars/dash.el/issues/14
(define (zip list1 list2)
    (let ((r nil))
        (while (not (or (null? list1) (null? list2)))
            (set! r (cons (list (car list1) (car list2)) r))
            (set! list1 (cdr list1))
            (set! list2 (cdr list2)))
        (reverse r)
    )
)

; cumulative sum of list elements
(define (cumsum lst)
    (let ((r (list (car lst))))
        (set! lst (cdr lst))
        (while (not (null? lst))
            (set! r (cons (+(car r) (car lst)) r))
            (set! lst (cdr lst)) )
        (reverse r)
    )

)

; Register current Script-Fu script
(script-fu-register "psd-rhythmic-guides makelist mod gcd lcm zip cumsum"  ; function names
                    "Rhythmic Guides"  ; menu label
                    "Creates new image along with guides for rhythmic grid. Returns ID of the created image and ID of its drawable (layer)."  ; description
                    "nazariy.hrabovskkyy@gmail.com"    ; author
                    "Nazariy Hrabovskyy" ; copyright
                    "21-12-2015"         ; date created     
                    ""                   ; image mode (not needed for scripts creating new images)
)

; command examples for Script-Fu console (Menu > Filters > Script-Fu > Console):
; (psd-rhythmic-guides 960 '(3 2) 5 6 3 '((135 90) (285 190) (435 290) (885 590)) "D:\\" "psd_name.psd")
; (psd-rhythmic-guides 960 '(3 2) 5 6 3 nil "D:\\" "psd_name.psd")
