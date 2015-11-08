clc; clear variables; 
close all;
addpath('Utils');

%% INPUT
MaxCanvasWidth = 960;       % 960 1280 1440
RatioStr = '3x2';           % '1x1' '3x2' '16x9'
Baseline =  9;              % 3:12
Columns  =  9;              % 5 6 9 12
GutterToBaselineRatio = 2;  % 0 1 2 3

%% PLOT OPTIONS
Options.Mode     = 'show';  % 'show', 'save', 'savefull'
Options.ShowRows = 'fit';   % 'fit', 'all'
Options.ShowGrid = 'largest'; % 'largest', 'all'
Options.Formats  = {'png'}; %{'png', 'tiff', 'svg', 'pdf', 'eps', 'fig'}
Options.OutputDir = '..\Grids\';


%% Plotting grids
Gutter = Baseline * GutterToBaselineRatio;
GridConfig = GenerateRhythmicGrid(MaxCanvasWidth, RatioStr, Baseline, Columns, Gutter);

DispGrid(GridConfig, 'short');
PlotGrid(GridConfig, Options);

% TODO interactive interface
% http://blogs.mathworks.com/community/2008/02/18/interactive-web-pages-in-matlab-part-2/

