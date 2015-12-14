clc; clear variables; 
close all;
addpath('Utils');

%% INPUT
MaxCanvasWidth = 1280;      % 960 1280 1440
RatioStr = '3x2';           % '1x1' '3x2' '16x9'
Baseline =  9;              % 3:12
Columns  =  11;             % 5 6 9 12
GutterToBaselineRatio = 1;  % 0 1 2 3

%% PLOT OPTIONS
Options.Mode       = 'show';    % 'show', 'save', 'savefull'
Options.ShowBlocks = 'rhythm';  % 'rhythm', 'sub-rhythm', 'all'
Options.ShowGrid   = 'largest'; % 'largest', 'all'
Options.Formats    = {'png'};   % {'png', 'tiff', 'svg', 'pdf', 'eps', 'fig'}
Options.OutputDir  = '..\Grids\';

Options.IsOctave   = exist('OCTAVE_VERSION', 'builtin') ~= 0; % Octave/Matlab detection

%% Plotting grids
Gutter = Baseline * GutterToBaselineRatio;
GridConfig = GenerateRhythmicGrid(MaxCanvasWidth, RatioStr, Baseline, Columns, Gutter);

DispGrid(GridConfig, 'short');
if ~Options.IsOctave
    PlotGrid(GridConfig, Options);
end


% TODO interactive interface
% http://blogs.mathworks.com/community/2008/02/18/interactive-web-pages-in-matlab-part-2/

