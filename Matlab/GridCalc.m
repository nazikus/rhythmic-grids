clc; clear variables; 
close all;

%% OUTPUT OPTIONS
Options.Mode      = 'show';  % 'show', 'save', 'savefull'
Options.Show      = 'fit';   %'all', 'fit'
Options.Formats   = {'png'}; %{'png', 'tiff', 'svg', 'pdf', 'eps', 'fig'}
Options.Verbose   = true;
Options.OutputDir = '..\Grids\';

%% All possible input values
MaxWidths = [960 1280]; % [960 1280 1440];
Ratios = {'1x1', '3x2', '16x9'}; % {'1x1', '3x2', '16x9'};
Baselines =  8:12; % 3:12;
Columns   =  [5 6 9 12]; % [5 6 9 12];
GutterToBaselineRatios = [0 1 2]; % [0 1 2];


%% Single input
% TODO make interactive interface: http://blogs.mathworks.com/community/2008/02/18/interactive-web-pages-in-matlab-part-2/
MaxCanvasWidth = 960; %1000;
RatioStr = '3x2';
Baseline = 12; % 11;
Column   = 6;
GutterToBaselineRatio = 2;


%% Determine number of micro-blocks
Ratio = RatioStr2Struct(RatioStr);
Gutter = Baseline * GutterToBaselineRatio;

uBlockHeight = lcm(Baseline, Ratio.H);
uBlockWidth = uBlockHeight * Ratio.R;

uBlockColumns = floor( (MaxCanvasWidth + Gutter) / (uBlockWidth + Gutter) );
% uBlockColumns = uBlockColumns - mod(uBlockNum,2);

GridWidth = (uBlockWidth + Gutter) * uBlockColumns - Gutter;

%% Plotting grids
PlotGrid(MaxCanvasWidth, RatioStr, Baseline, Column, Gutter, Options); return;

logfilename = strrep(datestr(now),':','-');
diary([Options.OutputDir logfilename '.txt']);

for width = MaxWidths
for ratio = Ratios
for baseline = Baselines
for columns = Columns
for gutter = [GutterToBaselineRatios*baseline]
    PlotGrid(width, ratio{1}, baseline, columns, gutter, Options);
    fprintf('\n%s\n', repelem('-', 80));
end
end   
end
end
end
% TODO print valid/invalid statistics
diary off;

% log grep configurations with 0 uBlocks
currDir = pwd;
cd(Options.OutputDir)
system(['grep -B3 -A1 "candidates\: 0" "' [logfilename '.txt" '] ['> "' logfilename '.candidates0.txt"'] ]);
cd(currDir);

clear Ratios Baselines GutterBaselineRatios;
clear GutterBaselineRatio MinColumnNum;
% clear Ratio MaxCanvasWidth uBlockNum CanvasWidth;
% TODO gif animatino out of all possible grids (even small ones)

