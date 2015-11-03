clc; clear variables; 
close all;

%% All possible input values
% SaveOptions.OutputDir = '..\Grids\';
Options.Mode      = 'show';  % 'show', 'save', 'savetop'
Options.Show      = 'fit';   %'all', 'fit'
Options.Formats   = {'png'}; %{'png', 'tiff', 'svg', 'pdf', 'eps'}; % fig
Options.OutputDir = 'd:\Dropbox\Photos\Grids\';
Options.Verbose   = true;

MaxWidths = [640 960 1150 1440 1680];
Ratios = struct( 'R_1x1',  struct('W',  1, 'H', 1, 'R',  1/1), ...
                 'R_2x1',  struct('W',  2, 'H', 1, 'R',  2/1), ...
                 'R_3x2',  struct('W',  3, 'H', 2, 'R',  3/2), ...
                 'R_4x3',  struct('W',  4, 'H', 3, 'R',  4/3), ...
                 'R_16x9', struct('W', 16, 'H', 9, 'R', 16/9) );
Baselines =  8:14;
Columns   = 10:14;
GutterToBaselineRatios = [0 1 2 3 4];

%% Single input
MaxCanvasWidth = 1200;
Ratio = Ratios.('R_3x2');
Baseline = 8;
Column = 12;
GutterToBaselineRatio = 3;


%% Determine number of micro-blocks

Gutter = Baseline * GutterToBaselineRatio;

uBlockHeight = lcm(Baseline, Ratio.H);
uBlockWidth = uBlockHeight * Ratio.R;

uBlockColumns = floor( (MaxCanvasWidth + Gutter) / (uBlockWidth + Gutter) );
% uBlockColumns = uBlockColumns - mod(uBlockNum,2);

GridWidth = (uBlockWidth + Gutter) * uBlockColumns - Gutter;

%% Plotting grids
PlotGrid(MaxCanvasWidth, Ratio, Baseline, Column, Gutter, Options);
return;

ratios = fieldnames(Ratios);
for width = MaxWidths
for r = 1:numel(ratios)
for baseline = Baselines
for columns = Columns
for gutter = [GutterToBaselineRatios*baseline]
    PlotGrid(width, Ratios.(ratios{r}), baseline, columns, gutter, Options);
end
end   
end
end
end

clear Ratios Baselines GutterBaselineRatios;
clear GutterBaselineRatio MinColumnNum;
% clear Ratio MaxCanvasWidth uBlockNum CanvasWidth;


