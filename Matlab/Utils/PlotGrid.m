function fig_h = PlotGrid(GridConf, Opts)
%PLOTGRID Plots harmonic grid based on given configuration. 
%Possible multiple grids (if ShowGrid option is 'all') or none.
%
% GridConf  - grid configuration structure (see GenerateRhythmicGrid.m docs).
%       
% Options struct fields:
%       OutputDir: 'path';
%       Formats  : {'fig', 'png', 'svg', 'pdf', 'eps', 'tiff'};
%       Mode     : 'show' | 'save' | 'savefull'
%       ShowRows : 'fit'  | 'all'
%       ShowGrid : 'largest' | 'all'

% except last, except first - lambda-f for the 1:n-1, 2:n elements of a vector
elast  = @(x) x(1:end-1);
efirst = @(x) x(2:end);

% default Options
if ~exist('Opts', 'var'); 
    Opts = struct('OutputDir', '.\', ...
                  'Formats', {},  ...
                  'Mode', 'show', ...
                  'ShowRows', 'all', ...
                  'ShowGrid', 'largest');
end

fprintf('Configuration: Width %dpx, Ratio %dx%d, Baseline %dpx, Columns %d, Gutter %dpx\n', ...
         GridConf.MaxCanvasWidth, GridConf.Ratio.W, GridConf.Ratio.H, ...
         GridConf.Baseline, GridConf.ColumnsNum, GridConf.Gutter.W);
%fn_structdisp(GridConf);
     
%% MAIN QUANTITIES - DIMENSIONS, SIZES, MARGINS, DISPLAY MODES
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% micro-block width & height (minimum possible for current canvas and ratio)
min_uBlockW = GridConf.uBlock.min_W;
min_uBlockH = GridConf.uBlock.min_H;

CanvasW    = GridConf.MaxCanvasWidth;
Ratio      = GridConf.Ratio;
Baseline   = GridConf.Baseline;
ColumnsNum = GridConf.ColumnsNum;
GutterH    = GridConf.Gutter.H;
GutterW    = GridConf.Gutter.W;

fprintf('Min. uBlock %dx%d\n', min_uBlockW, min_uBlockH);
fprintf('Number of candidates: %d\n', numel(GridConf.Grids));

% plot dummy grid if 0 fitting rows
if numel(GridConf.Grids)==0; 
    PlotZeroRhythmGrid(GridConf, Opts);
    return;
end

% first element Grids cell array containts the biggest uBlock suitable, the 
% rest are just fractions of it, s.t. provide the same proportion for the rest 
% of blocks, hence they are redundant. But could be useful for proportion visualization.
if strcmp(Opts.ShowGrid, 'largest')
    grids = GridConf.Grids(1);
else
    grids = GridConf.Grids(1:end);
end

%% IF 'LARGEST' ShowGrid MODE, THEN THIS LOOP HAS ONLY 1 ITERATION.
for grid = grids
grid = grid{1};

uBlockW = grid.uBlock.W;
uBlockH = grid.uBlock.H;
% grid width (<=canvas width) with current uBlockW
GridW = grid.W;
GridMargin = grid.Margin;

% NB! grid acceptance criteria:
%     - number of uBlocks factors (unique blocks) >= 2 
Opts.FailGrid = ~(numel(grid.MacroRowIdx) >= 2);

% in case gird has only 1 fit row, then show full grid
% in order to visualize the fitting proglem
Mode.ShowFit  =  (numel(grid.MacroRowIdx) > 1);
if strcmp(Opts.ShowRows, 'all')
    Mode.ShowFit = false;
end
if Mode.ShowFit
    % number of rows (macroRow height is incremental +min_uBlockH)
    MacroRowsNum = numel(grid.MacroRowIdx);
    % macro row indices - each index is a factor for micro-block
    MacroRowIdx  = grid.MacroRowIdx;
    GridH = grid.H;
    % usually, canvas height = grid height
    CanvasH = grid.Canvas.H;
    % all blocks sizes [W H]
    Blocks = grid.Blocks;
else
    MacroRowsNum = numel(grid.Full.MacroRowIdx);
    MacroRowIdx  = grid.Full.MacroRowIdx;
    GridH = grid.Full.H;
    CanvasH = grid.Full.Canvas.H;
    Blocks = grid.Full.Blocks;
end

% print out blocks info (and if invalid according to acceptance criteria)
if Opts.FailGrid; RejMsg = 'INVALID - '; else RejMsg = ''; end;
fprintf('\t%sblocks %d:[ %s], margins 2x%dpx\n', ...
    RejMsg, MacroRowsNum, sprintf('%gx%g ', Blocks'), GridMargin);
clear RejMsg;

%% DETERMINE AXES DIMENSIONS, TICKS, LABELS

% X coordinates of all vertical gridlines (ticks) considerring canvas margins
GridLinesX = unique( ...
             [0, ...
              GridMargin + [0 elast(cumsum(reshape( ...
                                           [uBlockW;GutterW]*ones(1,ColumnsNum), ...
                                           [1 ColumnsNum*2]  )))], ...
              CanvasW]);

% Y coordinates of baseline gridlines
GridBaseY = [Baseline:Baseline:GridH];

% row heights and Y coordinates for each fitting block and its sub-micro-blocks
MacroRowH = ((uBlockW+GutterW)*MacroRowIdx - GutterW) / Ratio.R;
MacroRowY = cumsum(MacroRowH)  + GutterH*[0:MacroRowsNum-1];
uFactorH  = MacroRowH / uBlockH;
uFactorY  = cellfun( @(y,f) y+uBlockH*([1:floor(f)]), ...
                     num2cell(elast(MacroRowY+GutterH)), num2cell(efirst(uFactorH)), ...
                     'UniformOutput', false);

% Y coordinates of all horizontal uBlock gridlines (ticks)
GridLinesY = unique(sort( [ MacroRowY, MacroRowY+GutterH, [uFactorY{:}] ]  ));

% TODO GridLines mode 'adaptive' (current) vs 'linear' (to implement)
% if  strcmp(Mode.GridLines, 'linear')
% GridLinesY = uBlockH:uBlockH:GridH;  % monothonic uBlock Y gridlines

% Y tick lables per uBlock height considerring gutter height.
% ticks array indices on the top & bottom of each block
if GutterW>0
    MacroRowsY = unique(sort([[0:MacroRowsNum-1] + cumsum(ceil(uFactorH)), ...
                              [1:MacroRowsNum] + cumsum(ceil(uFactorH)) ]));
else
    MacroRowsY = cumsum(MacroRowIdx);
end

% assigning those ticks string representation of their value 
% (the rest are imlicitly asigned empty strings)
GridLabelsY(MacroRowsY) = cellfun(@(x) num2str(x), ...
                                  num2cell(GridLinesY(MacroRowsY)), ...
                                  'UniformOutput', false);
clear MacroRowY uFactorH uFactorY;

%% TITLES, FILE NAMES, AUX. VARS
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
FileName = sprintf('Width%d_Ratio%dx%d_Base%d_Cols%d_Gut%d_Block%dx%d', ...
                   CanvasW, Ratio.W, Ratio.H, Baseline, ColumnsNum, GutterW, uBlockW, uBlockH);

GridTitle  = sprintf( ...
    ['     Input: CanvasW %d | ARatio %d:%d | Baseline %d | Columns %d | Gutter %d\n' ...
     'Output: %sBlock %dx%d | Blocks #%d | GridW %d | Margins 2x%d'], ...
    CanvasW, Ratio.W, Ratio.H, Baseline, ColumnsNum, GutterW, ...
    char(956), uBlockW, uBlockH, MacroRowsNum, GridW, GridMargin );
                 
if ~Mode.ShowFit; FileName = [FileName '_all'];  end

visibility = {'off', 'on'};
menubar    = {'none', 'figure'};

Mode.Show     = strcmp(Opts.Mode, 'show');
Mode.Save     = strcmp(Opts.Mode, 'save');
Mode.SaveFull = strcmp(Opts.Mode, 'savefull');
Mode.menuFlag = strcmp(menubar{Mode.Show+1}, 'figure');

if numel(Opts.Formats) == 0
    % skip generating figures if no formats specified in Options
    continue;
end

k = [2.2 3.6]/3432/10 * CanvasH;  % empirical coeffs, 3432 reference canvas height
FontRatios = [1 1; k(1) k(2)];
fR = FontRatios(Mode.SaveFull+1, :);
% fprintf('CanvasH=%d; k1=%f; k2=%f;\n', CanvasH, k(1), k(2));

% current or secondary screen (display) size
scrn = get(groot, 'ScreenSize');  % get current display screen resolution
mp = get(0, 'MonitorPositions');
if size(mp,1) == 1  % if single screen
    ScreenW = scrn(3);
    ScreenH = 768; % in order to fit most popular 768 height %  scrn(4);
    ShiftX  = 0;
else % if multiple screens
    ScreenW = mp(2,3);
    ScreenH = mp(2,4);
    ShiftX  = mp(2,1);
end

clear scrn mp FontRatios k;

%% INITIALIZE FIGURE      
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% auxiliary margins between figure and canvas/plot (optional, matlab specific)
Fig = struct('LR', 110, 'Top', 160, 'Bot', 60); % [left/right; top; bottom] margins
Fig.W = min([ CanvasW + Fig.LR*2]);
Fig.H = ScreenH-50*Mode.Show; 
% Fig.H = min([ScreenH-50*Mode.Show, max(ScreenH/2, CanvasH+Fig.Top+Fig.Bot)]); 
Fig.TitleMargin = 60; % margin between title and cavnas

if Mode.SaveFull
    Fig.H = CanvasH + Fig.Top + Fig.Bot; 
end

fig_h = figure('Menubar', menubar{Mode.Show+1}, ...
               'Visible', visibility{Mode.Show+1});
fig_h.Name          = FileName;
fig_h.OuterPosition = [ShiftX + (ScreenW-Fig.W)/2, ScreenH-Fig.H, Fig.W, Fig.H];
fig_h.NumberTitle   = 'off';
fig_h.DockControls  = 'off';
fig_h.GraphicsSmoothing = 'off';

clear menubar visibility ShiftX ScreenW;

%% INITIALIZE AXES
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

ax = axes();
hold on; pan yon;
ax.Title.String     = GridTitle;
ax.Title.FontSize   = 14*fR(2);
ax.Title.FontWeight = 'normal';
% ax.Title.Margin = 8;
% ax.Title.HorizontalAlignment = 'left';
TPos = ax.Title.Position; TExt = ax.Title.Extent;
ax.Title.Position   = [Fig.LR+CanvasW*(1-TExt(3)) TPos(2)-Fig.TitleMargin 0];  % disable anti-panning

ax.Units      = 'pixels';
ax.Position   = [Fig.LR -(CanvasH-Fig.H+Fig.Top + 50*Mode.menuFlag) CanvasW CanvasH];
ax.XLim       = [0 CanvasW];
ax.YLim       = [0 CanvasH];
ax.Layer      = 'top'; 
ax.TickDir    = 'out';
ax.FontSize   = 9*fR(1);
ax.TickLength = [10 / max([CanvasW CanvasH]) 0];  % magic ratio :)
ax.GridAlpha  = 0.2;
ax.GridColor  = [0 0 0];

% Y AXIS
ax.YLabel.String   = sprintf('%g px | %d x block types', CanvasH, MacroRowsNum);
ax.YLabel.FontSize = 14*fR(2);
ax.YLabel.Color    = [0 0 0];
ax.YLabel.Position = [-60 Fig.Top-40];  % disables anti-panning
ax.YTick      = [GridLinesY(1:end-1)];
ax.YTickLabel = GridLabelsY;
ax.YColor     = [0 0 .6];
ax.YGrid      = 'on';
ax.YDir       = 'reverse';

% X AXIS
XTickRotation = 60*(GutterW<28|uBlockW<28);
ax.XTickLabelRotation = XTickRotation;
ax.XTick      = [GridLinesX];
ax.XColor     = [0 0 .6];
ax.XGrid      = 'on';
ax.XAxisLocation = 'top';
ax.XTickLabel(numel(ax.XTickLabel)) = {''};   
% removes last X tick label, 'cause it overlaps previous tick if margin is small

clear ax GridTitle TPos TExt;

%%  PLOT BLOCKS, GUIDES AND MARGINS
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% plot rectangles for canvas margins
rectangle('Position' , [0 0 GridMargin GridH], ...
          'FaceColor', [.97 .92 .92], 'LineStyle', 'none');
rectangle('Position' , [GridMargin+GridW 0 GridMargin GridH], ...
          'FaceColor', [.97 .92 .92], 'LineStyle', 'none');

if GutterW>0;  RecLineStyle = 'none'; else RecLineStyle = '-'; end

% plot all blocks
for r=MacroRowIdx
    ri = find(MacroRowIdx==r); % r index
    
    % MacroCol width == current macro blockW
    blockW = -GutterW + (GutterW+uBlockW)*r;
    blockH = blockW / Ratio.R;
    MacroColsNum = floor( (GridW+GutterW) / (blockW+GutterW) ) + 0*logical(r);

    fit = (blockW+GutterW)*MacroColsNum - GutterW == GridW  ...
                          && mod(blockH,Baseline) == 0;
    if fit % if columns fit grid evently
        colors = [0 1 0]; else colors = [0 .6 0]; 
    end

    currRows= elast([0 MacroRowIdx(1:ri)]);
    y_pos = sum((currRows*(uBlockW+GutterW)-GutterW*logical(currRows)) / Ratio.R) + (ri-1)*GutterH;
    for c=0:MacroColsNum-1
        x_pos = GridMargin + c*(blockW+GutterW);
        rectangle('Position',  [x_pos, y_pos, blockW, blockH ], ...
                  'FaceColor', colors, ...
                  'LineStyle', RecLineStyle,  ...
                  'Clipping', 'on'     ...
                  );

        % draw rectangle at the bottom of block, denoting baseline remainder
        if mod(blockH,Baseline) || mod(blockW,1)
            blockQuot = floor(blockH/Baseline) * Baseline;
            rectangle('Position', [x_pos, y_pos+blockQuot, ...
                                   blockW, blockH-blockQuot], ...
                      'FaceColor', [0 1 1], ...
                      'LineStyle', 'none', ...
                      'Clipping', 'on');
            % change text label color for non-integer blocks
            blockLabelColor = [1 1 0];         
        else
            blockLabelColor = [0 0 0];
        end
    
    end
    
    % text: block size, uBlock ratio, columns
    text(GridMargin+4, y_pos+7, ...
         sprintf('%s%d  (%g x %g) X %d', char(956), ...
         r, blockW, blockH, MacroColsNum), ...
         'FontSize', 10*fR(2), 'FontWeight', 'Bold', ...
         'Color', blockLabelColor, 'Clipping', 'on');
     
    % annotations arrows for fitting gap
    if ~fit
        line([x_pos+blockW+2; GridMargin+GridW-3], [y_pos+blockH/2; y_pos+blockH/2], ...
             'LineWidth', 2, 'Marker', 'd', 'MarkerSize', 5, 'MarkerFaceColor', [0 0 1]); 
        gap = (GridMargin+GridW - (x_pos+blockW));
        t=text(GridMargin+GridW, y_pos+blockH/2-10, sprintf('%dpx', gap), 'Clipping', 'on');
        t.Position = [t.Position(1)-t.Extent(3)-5 t.Position(2) 0];  % Align right precisely
        clear t;
    end
end % rectangle plot loop

% plot horizontal grid lines, multiple of baseline height
x = [zeros(1, numel(GridBaseY)); CanvasW*ones(1, numel(GridBaseY))];
y = [GridBaseY; GridBaseY];
line(x, y, 'Color', [.8 0 0 .3], 'LineWidth', .5);

% Baseline tick and label
if uBlockH ~= Baseline
    line([0; -10], [Baseline; Baseline], 'LineWidth', .5, 'Color', [1 0 0], 'Clipping', 'off');
    text(-30,Baseline-3, ['b' num2str(Baseline)], 'FontSize', 9*fR(1), 'Color', [1 0 .6]);
end

% last X tick label
text(CanvasW, -23, num2str(CanvasW), 'FontSize', 9*fR(1), 'Color', [0 0 .6], 'Rotation', XTickRotation); %9

% if grid failed, only 1 row fits
if Opts.FailGrid
   text(200, 220, 'INVALID', ...
        'Rotation', 30, 'Color', [1 0 0], 'FontSize', 76*fR(1), 'FontWeight', 'bold', ...
        'EdgeColor', [1 0 0], 'LineWidth', 2, 'BackgroundColor', [1 1 1 .7], ...
        'Clipping', 'off');
    FileName = [FileName '_X'];
end

% plottools
hold off;


%%  SAVING FIGURE TO FILE(S)
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
if ~Mode.Show
    Fig2File(fig_h, FileName, Opts);
    close(fig_h);    
    % fig_h.Visible = 'on';
else
%     pause;
%     close(fig_h);
end    
% if Mode.SaveFull; system(fullfile(Opts.OutputDir, [Opts.Formats{1} '\dpi96_' FileName '.' Opts.Formats{1}])); end
% fprintf('\n');
end  % uBlock biiig loop

end


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%                                                                   %%%%%%
%%%%%%    FUNCTION FOR DUMMY PLOT OF ZERO RHYTHM GRID, FOR CONSISTENCY   %%%%%%
%%%%%%                                                                   %%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function fig_h = PlotZeroRhythmGrid(GridConf, Opts)

Ratio   = GridConf.Ratio;
uBlockW = GridConf.uBlock.min_W;
uBlockH = GridConf.uBlock.min_H;
Baseline= GridConf.Baseline;
ColumnsNum = GridConf.ColumnsNum;
GutterW = GridConf.Gutter.W;
CanvasW = GridConf.MaxCanvasWidth;

GridW = (uBlockW+GutterW)*ColumnsNum - GutterW;
GridH = uBlockH*4;
CanvasH = GridH + 0;
Cols  = floor( (CanvasW+GutterW)/(uBlockW+GutterW) );

fprintf('\t%smin. uBlock size is [%dx%d]. For %d columns it requires %dpx width and max. cavnas is %dpx\n', ...
    'INVALID - ', uBlockW, uBlockH, ColumnsNum, GridW, CanvasW);

FileName = sprintf('Width%d_Ratio%dx%d_Base%d_Cols%d_Gut%d_Block%dx%d', ...
   CanvasW, Ratio.W, Ratio.H, Baseline, ColumnsNum, GutterW, uBlockW, uBlockH);
FileName = [FileName '_X'];
GridTitle  = sprintf( ...
    ['     Input: CanvasW %d | ARatio %d:%d | Baseline %d | Columns %d | Gutter %d\n' ...
     'Output: %sBlock %dx%d | no hip hop, no rhythm'], ...
    CanvasW, Ratio.W, Ratio.H, Baseline, ColumnsNum, GutterW, ...
    char(956), uBlockW, uBlockH);


%% AUXILIARY VARS

visibility = {'off', 'on'};
% current or secondary screen (display) size
scrn = get(groot, 'ScreenSize');  % get current display screen resolution
mp = get(0, 'MonitorPositions');
if size(mp,1) == 1  % if single screen
    ScreenW = scrn(3);
    ScreenH = 768; % in order to fit most popular 768 height %  scrn(4);
    ShiftX  = 0;
else % if multiple screens
    ScreenW = mp(2,3);
    ScreenH = mp(2,4);
    ShiftX  = mp(2,1);
end

Fig = struct('LR', 110, 'Top', 160, 'Bot', 40); % [left/right; top; bottom] margins
Fig.W = CanvasW + Fig.LR*2;
Fig.H = ScreenH-50*strcmp(Opts.Mode, 'show'); 
Fig.TitleMargin = 60; % margin between title and cavnas

%% FIGURE

fig_h = figure('Menubar', 'none', ...
               'Visible', visibility{strcmp(Opts.Mode, 'show')+1});
fig_h.Name          = FileName;
fig_h.OuterPosition = [ShiftX + (ScreenW-Fig.W)/2, ScreenH-Fig.H, Fig.W, Fig.H];
fig_h.NumberTitle   = 'off';
fig_h.DockControls  = 'off';
fig_h.GraphicsSmoothing = 'off';

ax = axes();
hold on; pan yon;
ax.Title.String     = GridTitle;
ax.Title.FontSize   = 14;
ax.Title.FontWeight = 'normal';
% ax.Title.Margin = 8;
% ax.Title.HorizontalAlignment = 'left';
TPos = ax.Title.Position; TExt = ax.Title.Extent;
ax.Title.Position   = [Fig.LR+CanvasW*(1-TExt(3)) TPos(2)-Fig.TitleMargin 0];  % disable anti-panning

ax.Units      = 'pixels';
ax.Position   = [Fig.LR -(CanvasH-Fig.H+Fig.Top) CanvasW CanvasH];
ax.XLim       = [0 CanvasW];
ax.YLim       = [0 CanvasH];
ax.Layer      = 'top'; 
ax.TickDir    = 'out';
ax.FontSize   = 9;
ax.TickLength = [10 / max([CanvasW CanvasH]) 0];  % magic ratio :)
ax.GridAlpha  = 0.2;
ax.GridColor  = [0 0 0];

% Y AXIS
ax.YTick      = [0, uBlockH];
ax.YColor     = [0 0 .6];
ax.YGrid      = 'on';
ax.YDir       = 'reverse';

% X AXIS
GridLinesX = unique(sort([0, [1:Cols]*uBlockW + GutterW*[0:Cols-1], ...
              [1:Cols]*uBlockW + GutterW*[0:Cols-1] + GutterW, CanvasW]));
ax.XTick      = [GridLinesX];
ax.XColor     = [0 0 .6];
ax.XGrid      = 'on';
ax.XAxisLocation = 'top';
XTickRotation = 60*(GutterW<28|uBlockW<28);
ax.XTickLabelRotation = XTickRotation;

%% PLOT BLOCKS

if GutterW>0;  RecLineStyle = 'none'; else RecLineStyle = '-'; end
for c = 0:Cols
    x_pos = (uBlockW+GutterW)*c;
    rectangle('Position', [x_pos, 0, uBlockW, uBlockH], ...
          'FaceColor', [0 .6 0], 'LineStyle', RecLineStyle, 'Clipping', 'on');
            
end

% out of canvas portion of block
uBlockRem =  (uBlockW+GutterW)*(Cols+1)-GutterW - CanvasW;
rectangle('Position', [x_pos + uBlockW-uBlockRem, 0, uBlockRem, uBlockH], ...
    'FaceColor', [.5 1 .7], 'LineStyle', RecLineStyle, 'Clipping', 'off');

% text: block size, uBlock ratio, columns
text(0+4, 0+7, ...
     sprintf('%s1  (%g x %g) X %d [of %d]', char(956), ...
     uBlockW, uBlockH, Cols, ColumnsNum), ...
     'FontSize', 10, 'FontWeight', 'Bold', ...
     'Color', [1 1 0], 'Clipping', 'on');

text(200, 220, 'INVALID', ...
    'Rotation', 30, 'Color', [1 0 0], 'FontSize', 76, 'FontWeight', 'bold', ...
    'EdgeColor', [1 0 0], 'LineWidth', 2, 'BackgroundColor', [1 1 1 .7], ...
    'Clipping', 'off');

    if ~strcmp(Opts.Mode, 'show')
        Fig2File(fig_h, FileName, Opts);
        close(fig_h);    
    end

end