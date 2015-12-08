function GridConfig = GenerateRhythmicGrid(CanvasW, Ratio, Baseline, ColumnsNum, GutterW)
%GENERATERHYTHMICGRID Generate rhythmic grid(s) based on input configuration.
%Possible return of multiple grids (including non-optimal) or none.
%
% CanvasW  [px] - Max canvas width
% Ratio    string representing ratio (eg, '3x2', '16x9')
% Baseline [px] - Baseline height
% ColumnN  [num]- number of columns (of uBlocks)
% GutterW  [px] - vertical gutter width between columns
%
% return cell array of structures (grid configuration):
%(* - the most useful fields for plotting the grid)
%       MaxCanvasWidth : Canvas Width, px (input)
%       Ratio          : Ratio struct {'W': Width, 'H': Height, 'R': W/H}(input)
%      *Baseline       : baseline height, px (input)
%      *ColumnsNum     : number of columns (input)
%      *Gutter         : Gutter struct {'W': Width, 'H': Height} (input) 
%       GutterBaselineRatio - self-explanatory (input)
%      *RhythmicGrid   : optimal (largest) out of all rhytmic grids possible
%       uBlock         : minimum/maximum possible micro-block, struct:
%          min_W : miNimum possible micro-block width  for current configuration
%          min_H : miNimum possible micro-block height for current configuration
% (unused) max_W : maXimum possible micro-block width  for current configuration
% (unused) max_H : maXimum possible micro-block height for current configuration
%       Grids : cell array of all possible rhytmic grids (structs).
%       Grid struct: 
%             uBlock  : current micro-block: {'W': Width, 'H': Height}
%            *W       : actual grid width (<= max canvas width)
%            *H       : grid height needed to fit all rhytmic blocks
%             CanvasH : minimum canvas height to fit all current blocks (usually  == grid height)
%            *Margin  : length px of left & right margin beteen canvas and grid
%            *Blocks  : Matrix of all blocks sizes [W; H] fitting the 
%                       rhythm. Each block width is a multiple of some 
%                       uFactros value.
%            *uFactors: vector, each value is a factor of micro-block width,
%                       formula: (uBw+Gw)*uFactors-Gw.
%                       uBw - micro-block width, Gw - gutter width.
%   (unusued) MaxColumnsNum : maximum columns num (>= input columns num)
%
%             Full    : structure contianing all blocks, regardless if fitting the rhythm or not:
%                H         : grid height needed to fit all the possible blocks
%                CanvasH   : minimum canvas height to plot all the blocks
%                uFactors  : vector, each value is a factor of micro-block
%                            width, formula: (uBw+Gw)*uFactors-Gw.
%                            uBw - micro-block width, Gw - gutter width.
%                Blocks    : Matrix of all blocks sizes [W; H]. Each block 
%                            width is a multiple of some uFactors value.
%       
% Options struct fields:
%       OutputDir  : 'path';
%       Formats    : {'fig', 'png', 'svg', 'pdf', 'eps', 'tiff'};
%       Mode       : 'show' | 'save' | 'savefull'
%       ShowBlocks : 'fit'  | 'all'
%       ShowGrid   : 'largest' | 'all'

Ratio = RatioStr2Struct(Ratio);

% micro-block width & height (minimum possible for current canvas and ratio)
min_uBlockH = lcm(Baseline, Ratio.H);
min_uBlockW = min_uBlockH * Ratio.R;

% max possible uBlock width for selected columnsN
max_uBlockW = (CanvasW+GutterW)/ColumnsNum - GutterW;
max_uBlockH = max_uBlockW / Ratio.R;

% horizontal gutter height between blocks
GutterH = GutterW;

% Initialize return structure - grid configuration for plotting
GridConfig = struct();
GridConfig.MaxCanvasWidth = CanvasW;
GridConfig.Ratio = Ratio;
GridConfig.Baseline = Baseline;
GridConfig.ColumnsNum = ColumnsNum;
GridConfig.Gutter.W = GutterW;
GridConfig.Gutter.H = GutterH;
GridConfig.uBlock.min_W = min_uBlockW;
GridConfig.uBlock.min_H = min_uBlockH;
GridConfig.uBlock.max_W = max_uBlockW;
GridConfig.uBlock.max_H = max_uBlockH;
GridConfig.GutterBaselineRatio = GutterW / Baseline;
GridConfig.RhythmicGrid = 0;
GridConfig.Grids = {};

% First element of 'bws' is the biggest uBlock suitable. The rest are fractions
% which provide the same proportion for the rest of blocks, hence are redundant.
bws = fliplr( [min_uBlockW : min_uBlockW : max_uBlockW] );
if numel(bws)==0; return; end

% iterate through all possible uBlocks within give columns number
% (but first one is the most useful (biggest) - has the smallest margins)
for bw = bws

uBlockW = bw;
uBlockH = bw/Ratio.R;

% number of max possible columns for current uBlock. For small enough uBlocks
% this number could be smaller then ColumnsNum input. Usually not used.
MaxColumnsNum = floor( (CanvasW + GutterW) / (uBlockW + GutterW) );

% needed only if you need to generate max columns possible, not the number of
% columnes entered in input
% ColumnsNum = MaxColumnsNum; 

% grid width (<=canvas width) with current uBlockW
GridW = (uBlockW + GutterW) * ColumnsNum - GutterW;

% horizontal (left or right) margins between actual grid and canvas
GridMargin = floor( (CanvasW - GridW)/2 );

% number of all possible blocks
uFactorsAllNum = floor( (GridW+GutterW)/(uBlockW+GutterW) ) ;  

% block factors with no filtering (if need to plot all possible blocks including 
% those that don't fit the rhythm). But ingore blocks wider then GridW/2 - no 
% sense to iterate through them.
uFactorsAll = [1:ceil(uFactorsAllNum/2), uFactorsAllNum];
uFactorsAllNum = numel(uFactorsAll); % update total number correspondingly

% filtering blocks (indices) only that fit grid proportions horizontally
uFactorsFit = [];  % uBlock factors for each block fitting the rhythm

%fprintf('\tuBlock %dx%d\n', uBlockW, uBlockH);
for r=uFactorsAll
    blockW = (uBlockW+GutterW)*r - GutterW;
    blockH = blockW / Ratio.R;
    if mod(GridW+GutterW, blockW+GutterW) == 0 ...
                  && mod(blockH, Baseline) == 0; ...
        uFactorsFit(end+1) = r;
    end
    %fprintf('\t\tx%d: mod(%d,%d) == %d\n', r, GridW, blockW, mod(GridW+GutterW, blockW+GutterW));
    %fprintf('\t\tx%d: mod(%g,%g) == %g\n\n', r, blockH, Baseline, mod(blockH, Baseline));
end
uFactorsFitNum = numel(uFactorsFit);

% fprintf('\tblocks %d:[ %s] \n', numel(uFactorsFit), ...
%     sprintf('%dx%d ',[(uBlockW+GutterW)*uFactorsFit-GutterW; ...
%                      ((uBlockW+GutterW)*uFactorsFit-GutterW)/Ratio.R]));

% grid blocks that fit the rhythm
BlocksFit = [(uBlockW+GutterW)*uFactorsFit-GutterW; ...
            ((uBlockW+GutterW)*uFactorsFit-GutterW) / Ratio.R]';

BlocksAll = [(uBlockW+GutterW)*uFactorsAll-GutterW; ...  % block width
            ((uBlockW+GutterW)*uFactorsAll-GutterW) / Ratio.R; ... % block height
(GridW+GutterW) ./ (((uBlockW+GutterW)*uFactorsAll-GutterW)+GutterW) ]';  % block columns

% grid height with selected uBlock
GridHFit = sum(BlocksFit(:,2)) + (uFactorsFitNum-1)*GutterH;
GridHAll = sum(BlocksAll(:,2)) + (uFactorsAllNum-1)*GutterH;

% canvas height = grid height + optional vertical marging
% CanvasH = GridHFit + 0;

% populating a return structure
Grid = struct();
Grid.uBlock.W = uBlockW;
Grid.uBlock.H = uBlockH;
Grid.W = GridW;  % the same for Full grids
Grid.H = GridHFit;
Grid.Margin = GridMargin;
Grid.Canvas.H = GridHFit + 0;  % grid height + (optional) margin
Grid.Blocks = BlocksFit;
Grid.uFactors = uFactorsFit;

Grid.AllBlocks.H = GridHAll;
Grid.AllBlocks.Canvas.H = GridHAll + 0;  % grid height + (optional) marging
Grid.AllBlocks.uFactors = uFactorsAll;
Grid.AllBlocks.Blocks = BlocksAll;

Grid.MaxColumnsNum = MaxColumnsNum; % unused so far

GridConfig.Grids{end+1} = Grid;

end  % bws iteration

% Out of all fitting grids, rhythmic grid is with the biggest uBlock (the first one)
GridConfig.RhythmicGrid = GridConfig.Grids{1};

end
