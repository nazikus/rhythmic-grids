# Rhythmic grids generator

Rhythmic grid is a type of grid for layout design where size of blocks (grid cells) are aligned strictly and with preserved proportions to baseline and gutter width between blocks.

Current generator computes optimal rhythmic blocks for given grid configuration (max. width, aspect ratio, baseline, columns, gutter). The generator is based on derived modular arithmetic [formula](https://github.com/nazikus/rhythmic-grids/blob/master/micro-block_formula.pdf). Source code includes Matlab and JavaScript implementations with WebInterface as seperate sub-project - [Concordia](http://www.concordiagrid.com/).

###Rhythmic grid example###
 * Max. canvas width - 960px
 * Aspect ratio - 3x2
 * Baseline - 8px
 * Columns - 12
 * Gutter - 24px
 * blocks - [48x32 120x80 192x128 264x176 408x272] px

For current grid configuration algorithm generates a grid with micro-block of size 48x32px, s.t. the rest blocks are generated and aligned proportionally (including gutter) preserving ratio with baseline.


![Rhythmic grid sample](https://raw.githubusercontent.com/wiki/nazikus/rhythmic-grids/img/Width960_Ratio3x2_Base8_Cols12_Gut24_Block48x32.png)

# Font metrics explorer #

In addition, font metrics explorer is avialable allowing to test your system fonts for compliance with web 'safebox' convention (500UPM) as a difference from recommended UPM size. See `interface/safe-box.html`.


![Rhythmic grid sample](https://raw.githubusercontent.com/wiki/nazikus/rhythmic-grids/img/font-metrics-explorer.png)