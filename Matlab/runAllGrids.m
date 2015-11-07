clc; clear variables; 
close all;
addpath('Utils');

%% OUTPUT MODE
GenerateImagesMode = true;  % if False, show statistics only, without images

%% INPUT RANGES
MaxWidths = [960 1280];             % [960 1280 1440];
Ratios    = {'16x9', '1x1', '3x2'}; % {'1x1', '3x2', '16x9'};
Baselines =  8:12;                  % 3:12;
Columns   =  [5 6 9 12];            % [5 6 9 12];
GutterToBaselineRatios = [0 1 2];   % [0 1 2];

%% PLOT OPTIONS
Options.MinFitRowsTest = 2;   % minimum acceptable amount of fitting rows in rhythmic grid
Options.Mode     = 'save';    % 'show', 'save', 'savefull'
Options.ShowRows = 'fit';     % 'fit', 'all'
Options.ShowGrid = 'largest'; % 'largest', 'all'
Options.Formats  = {'png'};   % {'png', 'tiff', 'svg', 'pdf', 'eps', 'fig'}
Options.OutputDir = '..\Grids\';

if ~GenerateImagesMode; Options.Formats = {}; end;

%% TRAVERSING GRIDS
logfilename = strrep(strrep(datestr(now),':','-'), ' ', '_');
diary([Options.OutputDir logfilename '.txt']);

TotalCombinations = numel(MaxWidths)*numel(Ratios)*numel(Baselines)*numel(Columns)*numel(GutterToBaselineRatios);
CTotal = 0; CZero = 0; CFailGrid = 0;
for width = MaxWidths
for ratio = Ratios; ratio=ratio{1};
for baseline = Baselines
for column = Columns
for gutter = [GutterToBaselineRatios*baseline]
    GridConfig = ...
        GenerateRhythmicGrid(width, ratio, baseline, column, gutter);
    
    fprintf('(%d/%d) ', CTotal+1, TotalCombinations);
    PlotGrid(GridConfig, Options);
    fprintf('\n%s\n', repelem('-', 60));
    
    CTotal = CTotal + 1;
    if numel(GridConfig.Grids)
        CFailGrid = CFailGrid + ~(numel(GridConfig.Grids{1}.Fit.MacroRowIdx) >= 2);
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
offs = 0;
fprintf('\n\n\nStatistics: \n');
fprintf('\t%s: %d\n', 'Total models generated', CTotal);
fprintf('\t%*s: %d (%.0f%%)\n', offs, 'Valid', CValid, (CValid/CTotal)*100);
fprintf('\t%*s: %d (%.0f%%)\n\n', offs, 'Invalid', CInvalid, (CInvalid/CTotal)*100);
fprintf('\t%*s: %d\n', offs+4, 'Zero candidates', CZero);
fprintf('\t%*s: %d\n', offs+4, sprintf('fitting rows less then %d', 2), CFailGrid);

diary off;
% if GenerateImagesMode
    % log grep configurations with 0 uBlocks
    currDir = pwd; cd(Options.OutputDir)
    system(['grep -B3 -A1 "candidates\: 0" "' [logfilename '.txt" '] ['> "' logfilename '.candidates0.txt"'] ]);
    system(['grep -B4 -A2 "INVALID " "' [logfilename '.txt" '] ['> "' logfilename '.invalid.txt"'] ]);    
    cd(currDir);
% end

% TODO gif animatino out of all possible grids (including smaller ones)

clear offs currDir;