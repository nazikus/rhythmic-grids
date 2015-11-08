% grid generator function test
addpath('./Utils/');

% PRECONDITION TEST ON A KNOWN REFERENCE GRID
% TODO reference grid screenshot

GridConf = GenerateRhythmicGrid(1200, '3x2', 8, 12, 24);
fprintf('\nPrecondition test against known reference grid, generated manually:\n\n');
fprintf('\t\tmax. width 1200, columns 12, gutter 24 => uBlock 72x48, grid width 1128\n');
fprintf('\nGenerated grid:\n');  DispGrid(GridConf);

assert(GridConf.RhythmicGrid.W == 1128, 'Grid width = %g; Reference grid width must be 1128.', GridConf.RhythmicGrid.W);
assert(all(GridConf.RhythmicGrid.Blocks(1, :) == [72 48]),   'Micro-block = %gx%g; Expected: 72x48.', GridConf.RhythmicGrid.Blocks(1, :));
assert(all(GridConf.RhythmicGrid.Blocks(2, :) == [168 112]), '2nd block = %gx%g; Expected: 168x112.', GridConf.RhythmicGrid.Blocks(2, :));
assert(all(GridConf.RhythmicGrid.Blocks(3, :) == [264 176]), '3rd block = %gx%g; Expected: 264x176.', GridConf.RhythmicGrid.Blocks(3, :));
assert(all(GridConf.RhythmicGrid.Blocks(4, :) == [360 240]), '4th block = %gx%g; Expected: 360x240.', GridConf.RhythmicGrid.Blocks(4, :));

% GENERATE RANGE OF GRIDS
MaxWidths = [960 1280 1440];
Ratios    = {'16x9', '3x2', '1x1'};
Baselines =  3:12;
Columns   =  [5 6 9 12];
GutterToBaselineRatios = [0 1 2];

off = 10;
TotalCombinations = numel(MaxWidths)*numel(Ratios)*numel(Baselines)*numel(Columns)*numel(GutterToBaselineRatios);
fprintf('\n%s\n\n', repelem('=', 60));
fprintf('Generating %d grids from the following configuration combinations:\n\n', TotalCombinations);
fprintf('\t%*s:%s\b\n', off, 'Max widths', sprintf(' %d,', MaxWidths));
fprintf('\t%*s:', off, 'Ratios'); cellfun(@(x) fprintf(' %s,', x), Ratios); fprintf('\b\n');
fprintf('\t%*s:%s\b\n', off, 'Baselines', sprintf(' %d,', Baselines));
fprintf('\t%*s:%s\b\n', off, 'Columns', sprintf(' %d,', Columns));
fprintf('\t%*s:%s\b\n', off, 'Gutter factors', sprintf(' %d,', GutterToBaselineRatios));

GridConfs = {};
CTotal = 0; CZero = 0; CFailGrid = 0;
for width = MaxWidths
for ratio = Ratios; ratio=ratio{1};
for baseline = Baselines
for column = Columns
for gutter = [GutterToBaselineRatios*baseline]
    GridConf = GenerateRhythmicGrid(width, ratio, baseline, column, gutter);
    GridConfs{end+1} = GridConf;

    CTotal = CTotal + 1;
    if numel(GridConf.Grids)
        CFailGrid = CFailGrid + ~(numel(GridConf.RhythmicGrid.MacroRowIdx) >= 2);
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

clear width ratio baseline column gutter GridConf offs;
clear Options MaxWidths Ratios Baselines Columns GutterToBaselineRatios;


%% Test 1: Grids number
% Total number of grids generated
assert(numel(GridConfs) == TotalCombinations, 'Total grids configurations:%d. Expected: %d', numel(GridConfs), TotalCombinations);

%% Test 2: Grid width
% Grid width <= Canvas width
for gc = GridConfs
    gc = gc{1};
    if numel(gc.Grids) > 0 % if contains any fitting grid 
        assert(gc.RhythmicGrid.W <= gc.MaxCanvasWidth, 'Grid width %d px > max canvas width %d px', gc.RhythmicGrid.W, gc.MaxCanvasWidth);
    end
end

%% Test 3: columns
% number of micro-block columns = number of input columns
for gc = GridConfs
    gc = gc{1};
    if numel(gc.Grids) > 0 % if contains any fitting grid
        gw = gc.Gutter.W;
        uBlockColumns = (gc.RhythmicGrid.W+gw) / (gc.RhythmicGrid.uBlock.W+gw);
        assert(uBlockColumns == gc.ColumnsNum, 'micro-blocks columns %d. Expected: %d', uBlockColumns, gc.ColumnsNum);
    end
end

%% Test 4: Baseline factor
% each rhytmic block height is a factor of baseline
for gc = GridConfs
    gc = gc{1};
    if numel(gc.Grids) > 0 % if contains any fitting grid
        assert(all( ~mod(gc.RhythmicGrid.Blocks(:,2), gc.Baseline) ));
    end
end
