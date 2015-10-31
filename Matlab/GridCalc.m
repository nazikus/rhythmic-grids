clc; clear variables; 
close all;

%% All possible input values
Ratios = struct( 'R_3x2',  struct('W',  3, 'H', 2, 'R',  3/2), ...
                 'R_4x3',  struct('W',  4, 'H', 3, 'R',  4/3), ...
                 'R_16x9', struct('W', 16, 'H', 9, 'R', 16/9) );
Baselines = 8:12;
GutterBaselineRatios = [1 2 3 4];  % Assumption: gutter is proportional to baseline

%% Selected inputs
MaxCanvasWidth = 1200;
Ratio = Ratios.('R_16x9');
Baseline = 12;
GutterBaselineRatio = 1;


%% Determine gutter width and number of theoretical micro-blocks

Gutter = Baseline * GutterBaselineRatio;

uBlockHeight = lcm(Baseline, Ratio.H);
uBlockWidth = uBlockHeight * Ratio.R;

uBlockColumns = floor( (MaxCanvasWidth + Gutter) / (uBlockWidth + Gutter) );
% uBlockColumns = uBlockColumns - mod(uBlockNum,2);

GridWidth = (uBlockWidth + Gutter) * uBlockColumns - Gutter;

%% Plotting grids
PlotGrid(Baseline, MaxCanvasWidth, Gutter, Ratio, 'on');

% saveas(gcf, 'TestGrid', 'png');

clear Ratios Baselines GutterBaselineRatios;
clear GutterBaselineRatio MinColumnNum;
% clear Ratio ScreenWidthMax uBlockNum CanvasWidth;


