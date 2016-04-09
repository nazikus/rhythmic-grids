(define (rhythmic-guides maxWidth ratio baseline columns gutterX)
; Generates vertical guides along micro-block sides and horizontal lines along each baseline
; blocks psdPath psdBasename)
; maxWidth - width of a canvas/layer
; ratio    - list of ratio values '(width height)
; baseline - (unused) show first few baseline guides
; columns  - number of micro-blocks fitting horizontally into maxWidth
; gutter   - gutter width ratio

    
    ; INITIALIZE VARS, IMAGE AND LAYER
    (let* (
        (maxHeight 600)
        (inc (makelist (- columns 1)) )

        (r (/ (car ratio) (cadr ratio) ) )
        (gutter (* baseline gutterX))
        (uBlockH_min (lcm baseline (cadr ratio)) )
        (uBlockW_min (* uBlockH_min r) )

        ; uBlockW max == floor[ ((maxWidth+gutter)/columns - gutter) / uBlockW_min ] * uBlockW_min
        (uBlockW (* (truncate (/ (- (/ (+ maxWidth gutter) columns) gutter) uBlockW_min )) uBlockW_min) )
        (uBlockH (/ uBlockW r) )

        ; (uBlockW (caar blocks))
        ; (uBlockH (cadar blocks))

        (margin (/ (- maxWidth (- (* columns (+ uBlockW gutter)) gutter)) 2) )

        (guidesVertL (mapcar (lambda (x) (+ (* x (+ uBlockW gutter)) margin)) inc) )
        (guidesVertR (mapcar (lambda (x) (+ (+ (* x (+ uBlockW gutter)) margin) uBlockW))  inc) )
        
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
    (while (not (null? guidesVertL))
        (gimp-image-add-vguide rhImage (car guidesVertL))
        (gimp-image-add-vguide rhImage (car guidesVertR))
        (set! guidesVertL (cdr guidesVertL))
        (set! guidesVertR (cdr guidesVertR))
    )
    ; (gimp-image-add-hguide rhImage uBlockH)
    ; (gimp-image-add-hguide rhImage (+ uBlockH gutter))

    ; (if (not (null? blocks)) (gimp-message "TODO draw blocks") )

    ; DEBUG IN GIMP GUI
    (gimp-display-new rhImage)   
    (gimp-image-clean-all rhImage)
    ; (gimp-message psdPath)
    ; (gimp-message (string-append "Generated rhythmic guides with micro-block " (number->string uBlockW) "X" (number->string uBlockH) ))

    (file-psd-save RUN-NONINTERACTIVE rhImage rhLayer "D:\\testi.psd" "testi.psd" 0 0)
    ; (file-psd-save RUN-NONINTERACTIVE rhImage rhLayer (string-append psdPath psdBasename ".psd") (string-append psdBasename ".psd") 0 0)
    
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

; Register current Script-Fu script
(script-fu-register "rhythmic-guides makelist mod gcd lcm"  ; function names
                    "Rhythmic Guides"  ; menu label
                    "Creates new image along with guides for rhythmic grid.\
                    Returns ID of the created image and ID of its drawable (layer)."  ; description
                    "nazariy.hrabovskkyy@gmail.com"    ; author
                    "Nazariy Hrabovskyy" ; copyright
                    "21-12-2015"         ; date created     
                    ""                   ; image mode (not needed for scripts creating new images)
)


; (rhythmic-guides 960 '(3 2) 5 6 3 '((135 90) (285 190) (435 290) (885 590)) "D:\\" "psd_name")
; (rhythmic-guides 960 '(3 2) 5 6 3 nil "D:\\" "psd_name")
