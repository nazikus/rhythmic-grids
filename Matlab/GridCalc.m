clc; clear variables; 
close all;

%% OUTPUT OPTIONS
Options.Mode      = 'show';  % 'show', 'save', 'savetop'
Options.Show      = 'fit';   %'all', 'fit'
Options.Formats   = {'png'}; %{'png', 'tiff', 'svg', 'pdf', 'eps', 'fig'}
Options.Verbose   = true;
Options.OutputDir = 'd:\Dropbox\Photos\Grids\';
% Options.OutputDir = '..\Grids\';

%% All possible input values
MaxWidths = [640 960 1150 1440 1680];
Ratios = {'1x1', '2x1',  '3x2', '4x3', '16x9'};
Baselines =  8:14;
Columns   = 10:14;
GutterToBaselineRatios = [0 1 2 3 4];

%% Single input
MaxCanvasWidth = 1200;
RatioStr = '3x2';
Baseline = 8;
Column = 12;
GutterToBaselineRatio = 3;

%% Determine number of micro-blocks
Ratio = RatioStr2Struct(RatioStr);
Gutter = Baseline * GutterToBaselineRatio;

uBlockHeight = lcm(Baseline, Ratio.H);
uBlockWidth = uBlockHeight * Ratio.R;

uBlockColumns = floor( (MaxCanvasWidth + Gutter) / (uBlockWidth + Gutter) );
% uBlockColumns = uBlockColumns - mod(uBlockNum,2);

GridWidth = (uBlockWidth + Gutter) * uBlockColumns - Gutter;

%% Plotting grids
PlotGrid(MaxCanvasWidth, RatioStr, Baseline, Column, Gutter, Options);
return;

for width = MaxWidths
for ratio = Ratios
for baseline = Baselines
for columns = Columns
for gutter = [GutterToBaselineRatios*baseline]
    PlotGrid(width, ratio{1}, baseline, columns, gutter, Options);
end
end   
end
end
end

clear Ratios Baselines GutterBaselineRatios;
clear GutterBaselineRatio MinColumnNum;
% clear Ratio MaxCanvasWidth uBlockNum CanvasWidth;


