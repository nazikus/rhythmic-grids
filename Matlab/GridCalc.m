clc; clear variables; 
close all;

%% All possible input values
% SaveOptions.OutputDir = '..\Grids\';
Options.OutputDir = 'd:\Dropbox\Photos\Grids\';
Options.Formats   = {'png', 'svg'}; % fig, png, svg, pdf, eps
Options.Mode      = 'show';    % 'show' or 'save'

MaxWidths = [640 960 1150 1440 1680];
Baselines = 8:12;
Ratios = struct( 'R_3x2',  struct('W',  3, 'H', 2, 'R',  3/2), ...
                 'R_4x3',  struct('W',  4, 'H', 3, 'R',  4/3), ...
                 'R_16x9', struct('W', 16, 'H', 9, 'R', 16/9) );
GutterBaselineRatios = [1 2 3 4];  % Assumption: gutter is proportional to baseline

%% Single input
MaxCanvasWidth = 1200;
Baseline = 8;
Ratio = Ratios.('R_3x2');
GutterBaselineRatio = 3;


%% Determine number of micro-blocks

Gutter = Baseline * GutterBaselineRatio;

uBlockHeight = lcm(Baseline, Ratio.H);
uBlockWidth = uBlockHeight * Ratio.R;

uBlockColumns = floor( (MaxCanvasWidth + Gutter) / (uBlockWidth + Gutter) );
% uBlockColumns = uBlockColumns - mod(uBlockNum,2);

GridWidth = (uBlockWidth + Gutter) * uBlockColumns - Gutter;

%% Plotting grids
PlotGrid(MaxCanvasWidth, Baseline, Ratio, Gutter, Options);
return;

ratios = fieldnames(Ratios);
for width = MaxWidths
for r = 1:numel(ratios)
for baseline = Baselines
for gutter = [GutterBaselineRatios*baseline]
    fprintf('Printing width %dpx, baseline %dpx, gutter %dpx, ratio %dx%d...\n', width, baseline, gutter, Ratios.(ratios{r}).W, Ratios.(ratios{r}).H);
    PlotGrid(width, baseline, Ratios.(ratios{r}), gutter, 'save');
end
end   
end
end

clear Ratios Baselines GutterBaselineRatios;
clear GutterBaselineRatio MinColumnNum;
% clear Ratio MaxCanvasWidth uBlockNum CanvasWidth;


