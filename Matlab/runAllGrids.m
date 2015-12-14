clc; clear variables; 
close all;
addpath('Utils');

%% INPUT RANGES
MaxWidths = [960 1280 1440];        % [960 1280 1440];
Ratios    = {'3x2', '16x9', '1x1'}; % {'1x1', '3x2', '16x9'};
Baselines =  3:12;                  % 3:12;
Columns   =  [5 6 9 12];            % [5 6 9 12];
GutterToBaselineRatios = [0 1 2 3]; % [0 1 2];

%% OUTPUT MODE
GenerateImagesMode = false;  % if False, show statistics only, without images

%% PLOT OPTIONS
Options.Mode       = 'save';     % 'save', 'savefull'.  NB! do NOT use 'show' - will display hundreds of figures
Options.ShowBlocks = 'rhythm';   % 'rhythm', 'all'
Options.ShowGrid   = 'largest';  % 'largest', 'all' - out of all fitting grids for current configuration
Options.Formats    = {'png'};    % currently supports 'png' only
Options.OutputDir  = '..\Grids\';

Options.IsOctave   = exist('OCTAVE_VERSION', 'builtin') ~= 0; % Octave/Matlab detection

%% TRAVERSING GRIDS

if Options.IsOctave % if Octave - force false, Octave does not support GridPlot() yet
    GenerateImagesMode = false;  
    hline = repelems('-', [1; 60]);
else
    hline = repelem('-', 60);
end

if GenerateImagesMode
    % log output to file
    logfilename = strrep(strrep(datestr(now),':','-'), ' ', '_');
    diary([Options.OutputDir logfilename '.txt']);
else 
    % supress figure creation
    Options.Formats = {};
end

TotalCombinations = numel(MaxWidths)*numel(Ratios)*numel(Baselines)*numel(Columns)*numel(GutterToBaselineRatios);
CTotal = 0; CZero = 0; CFailGrid = 0;
IsValidGrid = GetGridValidator();

tic;
for width = MaxWidths
for ratio = Ratios; ratio=ratio{1};
for baseline = Baselines
for column = Columns
for gutter = [GutterToBaselineRatios*baseline]
    GridConfig = GenerateRhythmicGrid(width, ratio, baseline, column, gutter);

    if strcmp(Options.ShowBlocks, 'all') || ...
     ( numel(GridConfig.Grids) && IsValidGrid(GridConfig.RhythmicGrid) )
        fprintf('(%d/%d) ', CTotal+1, TotalCombinations);
        PlotGrid(GridConfig, Options);
        fprintf('\n%s\n', hline);
    end
    
    % counting stats
    CTotal = CTotal + 1;
    if numel(GridConfig.Grids)
        CFailGrid = CFailGrid + ~IsValidGrid(GridConfig.RhythmicGrid);
    else
        CZero = CZero + 1;
    end    
end
end   
end
end
end

CInvalid = CFailGrid + CZero;
CValid   = CTotal - CInvalid;
offs = 0; t = round(toc);
fprintf('\n\nTime elapsed: %dm %02ds', floor(t/60), mod(t,60));
fprintf('\n\nStatistics: \n');
fprintf('\t%s: %d\n', 'Total models generated', CTotal);
fprintf('\t%*s: %d (%.0f%%)\n', offs, 'Valid', CValid, (CValid/CTotal)*100);
fprintf('\t%*s: %d (%.0f%%)\n\n', offs, 'Invalid', CInvalid, (CInvalid/CTotal)*100);
fprintf('\t%*s: %d\n', offs+4, 'Zero candidates', CZero);
fprintf('\t%*s: %d\n', offs+4, 'Criteria fail', CFailGrid);
fprintf('\t%*s: ', offs+4, 'Criteria'); disp(IsValidGrid);

if GenerateImagesMode
    diary off;
    % log grep configurations with 0 uBlocks
    currDir = pwd; cd(Options.OutputDir)
    system(['grep -B3 -A1 "candidates\: 0" "' [logfilename '.txt" '] ['> "' logfilename '.candidates0.txt"'] ]);
    system(['grep -B4 -A2 "INVALID " "' [logfilename '.txt" '] ['> "' logfilename '.invalid.txt"'] ]);    
    cd(currDir);
end
% TODO gif animatino out of all possible grids (including smaller ones)

clear offs currDir t;
