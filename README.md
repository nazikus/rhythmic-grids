# Rhythmic grids generator

Rhythmic grids are type of grids for layout design where size of micro-blocks (grid cells) are aligned strictly and with preserved proportions to baseline and gutter between blocks.

Currenet generator computes optimal rhythmic grid for given grid configuration (max. width, aspect ration, basline, columns, gutter). Source code includes Matlab and JavaScript implementation.

**Rhythmic grid example**
 * Max. canvas width - 1280px
 * Aspect ratio - 3x2
 * Baseline - 8px
 * Columns - 12
 * Gutter - 24px
 
For current grid configuration it generates gir with micro-block of size 85x56px and the rest blocks are generated and aligned proportionally (including gutter) preserving ratio with baseline.


![Rhythmic grid sample](https://dl.dropboxusercontent.com/u/553423/Grids/1.png)