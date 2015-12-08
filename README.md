# Rhythmic grids generator

Rhythmic grid is a type of grid for layout design where size of blocks (grid cells) are aligned strictly and with preserved proportions to baseline and gutter length between blocks.

Current generator computes optimal rhythmic blocks for given grid configuration (max. width, aspect ratio, basline, columns, gutter). Source code includes Matlab and JavaScript implementations.

**Rhythmic grid example**
 * Max. canvas width - 1280px
 * Aspect ratio - 3x2
 * Baseline - 8px
 * Columns - 12
 * Gutter - 24px
 * blocks - [85x56px ]

For current grid configuration algorithm generates a grid with micro-block of size 85x56px, s.t. the rest blocks are generated and aligned proportionally (including gutter) preserving ratio with baseline.


![Rhythmic grid sample](https://dl.dropboxusercontent.com/u/553423/Grids/1.png)