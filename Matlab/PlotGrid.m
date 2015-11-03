function fig_h = PlotGrid(CanvasW, Ratio, Baseline, GutterW, Opts)
% Baseline [px] - Baseline height
% CanvasW  [px] - Canvas width (input from user)
% GutterV  [px] - vertical gutter width between columns
% Ratio   struct 'W': Width; 'H': Height; 'R': Width/Height
%         - aspect ratio structure: width, height, ration (eg 16, 9, 1.777)
% Options struct OutputDir: 'path';
%                Formats  : {'fig', 'png', 'svg', 'pdf', 'eps', 'tiff'};
%                Mode     : 'show' or 'save' or 'savetop'
%                Show     : 'all' or 'fit'

% 'except last' lambda-f for the n-1 elements of a vector
elast = @(x) x(1:end-1);  
if ~exist('Opts', 'var'); 
    Opts = struct('OutputDir', '.\', 'Formats', {}, 'Mode', 'show', 'Show', 'fit'); 
end

%% DETERMINE MAIN QUANTITIES - DIMENSIONS, SIZES, MARGINS

% current screen (display) size
scrn = get(groot, 'ScreenSize');  % get current display screen resolution
ScreenW = scrn(3);
ScreenH = scrn(4);
clear scrn;

% micro-block width & height (minimum possible for current canvas and ratio)
minBlockH = lcm(Baseline, Ratio.H);
minBlockW = minBlockH * Ratio.R;
uBlockH = minBlockH;
uBlockW = minBlockW;
% max_uBlockW = (CanvasW+GutterW)/ColumnN - GutterW;
% fprintf('minBlockW = %d\nmax_uBlockW = %d\nblocks=%d\n',minBlockW, max_uBlockW, floor(max_uBlockW/minBlockW));

% gutter height between rows
GutterH = GutterW;

% number of columns proportional to uBlock
ColumnsNum   = floor( (CanvasW + GutterW) / (uBlockW + GutterW) );

% number of rows: row height = uBlockH; macroRow height = incremental +uBlockH;
MacroRowsNum = floor( CanvasW/uBlockW ) ;  % each subsequent row height is x2 of preceding
RowsNum = sum(1:MacroRowsNum); % total uBlock rows

% grid width (<=canvas width) with current uBlockW
GridW = (uBlockW + GutterW) * ColumnsNum - GutterW;

if strcmp(Opts.Show, 'fit')
    % filtering blocks (indices) only that fit grid proportions horizontally
    MacroRowIdx = [];
    for r=1:MacroRowsNum
        if mod(GridW+GutterW, uBlockW*r+GutterW) == 0
            MacroRowIdx(end+1) = r;
        end
    end
    Opts.OneRowFail = false;
    if numel(MacroRowIdx) <= 1
        Opts.Show = 'all';
        Opts.OneRowFail = true;
    end
end

if strcmp(Opts.Show, 'all')
    MacroRowIdx = [1:ceil(MacroRowsNum/2) MacroRowsNum];
end
MacroRowsNum = numel(MacroRowIdx);

% grid height with select uBlocks
GridH = sum(uBlockH*MacroRowIdx) + GutterH*(numel(MacroRowIdx)-1);  
% canvas height = grid height + optional vertical marging
CanvasH = GridH + 0;  
% horizontal (left or right) margins between canvas and actual grid
CanvasMargin = floor( (CanvasW - GridW)/2 );

% X coordinates of all vertical gridlines (ticks) considerring canvas margins
GridLinesX = unique( ...
             [0, CanvasMargin + [0 elast(cumsum(reshape( ...
              [uBlockW;GutterW]*ones(1,ColumnsNum), [1 ColumnsNum*2] )))], CanvasW] ...
              );

% Y coordinates of baseline gridlines
GridBaseY = [Baseline:Baseline:GridH];

% Y coordinates of all horizontal uBlock gridlines (ticks)
TightUBlocksY = cumsum(uBlockH*ones(1,sum(MacroRowIdx)));  % no horizontal gutters
GridLinesY = unique(sort( ...
    [ TightUBlocksY+GutterH*(repelem(1:MacroRowsNum, MacroRowIdx)-1), ... % ticks along vertical side -1st
	  arrayfun(@(i)  sum(TightUBlocksY(MacroRowIdx(1:i))) + ...    % first tick along vertical side
                     i * GutterH, ...    
      1:MacroRowsNum) ...  
    ]));

% Y tick lables per uBlock height considerring gutter height
% GridLabelsY(1:numel(GridLinesY)) = cellfun(@(x) num2str(x), num2cell(GridLinesY), 'UniformOutput', false);
MacroRowsY = sort([cumsum(MacroRowIdx) + [1:numel(MacroRowIdx)], ...
                   cumsum(MacroRowIdx) + [1:numel(MacroRowIdx)]-1]);

GridLabelsY(MacroRowsY) = cellfun(@(x) num2str(x), ...
                                  num2cell(GridLinesY(MacroRowsY)), ...
                                  'UniformOutput', false);

% title and file names
FileName = sprintf('Width%d_Ratio%dx%d_Base%d_Gut%d', ...
                   CanvasW, Ratio.W, Ratio.H, Baseline, GutterW);

GridTitle  = sprintf( ...
    ['     Input: CanvasW %d | ARatio %d:%d | Baseline %d | Gutter %d\n' ...
     'Output: %sBlock %dx%d | Cols %d | GridW %d | Margins 2x%d'], ...
    CanvasW, Ratio.W, Ratio.H, Baseline, GutterW, ...
    char(956), uBlockW, uBlockH, ColumnsNum, GridW, CanvasMargin );
                 
%% INITIALIZE FIGURE

ModeShow = strcmp(Opts.Mode, 'show');
ModeSave = strcmp(Opts.Mode, 'save');
ModeSaveTop = strcmp(Opts.Mode, 'savetop');
visibility = {'off', 'on'};
menubar = {'none', 'figure'};
k = [2.2 3.6]/3432 * CanvasH;  % empirical coeffs, 3432 reference canvas height
FontRatios = [10 10; k(1) k(2)];
fR = FontRatios(ModeSave+1, :);


% auxiliary margins between figure and canvas/plot (optional, matlab specific)
figMargin = [110 170 40]; % [left/right; top; bottom]
figW = CanvasW + figMargin(1)*2;
figH = min([ScreenH-50, CanvasH + figMargin(2)+figMargin(3)]); 

if ModeSave
    figH = CanvasH + figMargin(2)+figMargin(3); 
    FileName = [FileName '_full'];
end

fig_h = figure('Menubar', menubar{ModeShow+1}, ...
               'Visible', visibility{ModeShow+1});
fig_h.Name          = FileName;
fig_h.OuterPosition = [(ScreenW-figW)/2, ScreenH-figH, figW, figH];
fig_h.NumberTitle   = 'off';
fig_h.DockControls  = 'off';
fig_h.GraphicsSmoothing = 'off';

%% INITIALIZE AXIS
ax = axes();
hold on; pan yon;
ax.Title.String     = GridTitle;
ax.Title.FontSize   = fR(2)*1.4;
ax.Title.FontWeight = 'normal';
% TPos = ax.Title.Position; TExt = ax.Title.Extent;
% ax.Title.Position   = [CanvasW*(1-TExt(3)) TPos(2)-50 0];

ax.Units      = 'pixels';
ax.Position   = [figMargin(1) -(CanvasH-figH+figMargin(2)+20*ModeShow) CanvasW CanvasH];
ax.XLim       = [0 CanvasW];
ax.YLim       = [0 CanvasH];
ax.Layer      = 'top'; 
ax.TickDir    = 'out';
ax.FontSize   = fR(1)*.9;
ax.TickLength = [10/CanvasH 0];  % magical ratio :)
ax.GridAlpha  = 0.2;
ax.GridColor  = [0 0 0];

% Y AXIS
ax.YLabel.String   = sprintf('%d px | %d x block types', CanvasH, MacroRowsNum);
ax.YLabel.Position = [-60 200];  % disables pan-tracing property
ax.YLabel.FontSize = fR(2)*1.4;
ax.YLabel.Color    = [0 0 0];
ax.YTickLabel = GridLabelsY;
ax.YTick      = [GridLinesY];
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
ax.XTickLabel(numel(ax.XTickLabel)) = {''};   % remove last X tick label

%% PLOT BLOCKS, GUIDES AND MARGINS

% plot rectangles for canvas margins
rectangle('Position' , [0 0 CanvasMargin GridH], ...
          'FaceColor', [.97 .92 .92], 'LineStyle', 'none');
rectangle('Position' , [CanvasMargin+GridW 0 CanvasMargin GridH], ...
          'FaceColor', [.97 .92 .92], 'LineStyle', 'none');

     
% plot all blocks
for r=MacroRowIdx
    ri = find(MacroRowIdx==r); % r index
    
    % MacroCol width == current macro blockW
    MacroColsNum = floor( (GridW+GutterW) / (uBlockW*r+GutterW) ) + 0*logical(r);
    blockW = uBlockW*r;
    blockH = uBlockH*r;
    
    fit = MacroColsNum*(uBlockW*r + GutterW) - GutterW == GridW;
    if fit % if columns fit grid evently
        colors = [0 1 0]; else colors = [0 .6 0]; 
    end

    for c=0:MacroColsNum-1
        x_pos = CanvasMargin + c*(blockW+GutterW);
        y_pos = sum(elast([0 MacroRowIdx(1:ri)]))*uBlockH + (ri-1)*GutterH;
        rectangle('Position',  [x_pos, y_pos, blockW, blockH ], ...
                  'FaceColor', colors, ...
                  'LineStyle','none',  ...
                  'Clipping', 'on'     ...
                  );
    end
    
    % bock size, ublock ratio, columns
    text(CanvasMargin+4, y_pos+7, ...
         sprintf('%d: (%d x %d) X %d', r, uBlockW*r, uBlockH*r, MacroColsNum), ...
         'FontSize', fR(2)*1, 'FontWeight', 'Bold', ...
         'Color', [0 0 0], 'Clipping', 'on');
     
    % annotations arrows for fitting gap
    if ~fit
        line([x_pos+blockW+2; CanvasMargin+GridW-3], [y_pos+blockH/2; y_pos+blockH/2], ...
             'LineWidth', 2, 'Marker', 'd', 'MarkerSize', 5, 'MarkerFaceColor', [0 0 1]); 
        gap = (CanvasMargin+GridW - (x_pos+blockW));
        t=text(CanvasMargin+GridW, y_pos+blockH/2-10, sprintf('%dpx', gap));
        t.Position = [t.Position(1)-t.Extent(3)-5 t.Position(2) 0];  % Align right precisely
        clear t;
    end
end 

% plot horizontal grid lines, multiples baseline height
x = [zeros(1, numel(GridBaseY)); CanvasW*ones(1, numel(GridBaseY))];
y = [GridBaseY; GridBaseY];
line(x, y, 'Color', [.8 0 0 .3], 'LineWidth', .5);

% Baseline tick and label
if uBlockH ~= Baseline
    line([0; -10], [Baseline; Baseline], 'LineWidth', .5, 'Clipping', 'off');
    text(-30,Baseline-3, num2str(Baseline), 'FontSize', fR(1)*.9, 'Color', [0 0 .6]);
end

% last X tick label
text(CanvasW, -23, num2str(CanvasW), 'FontSize', fR(1)*.9, 'Color', [0 0 .6], 'Rotation', XTickRotation); %9

% if grid failed, only 1 row fits
if Opts.OneRowFail
   text(50, 200, 'FAILED GRID', ...
        'Rotation', 45, 'Color', [1 0 0], 'FontSize', 36, 'FontWeight', 'bold', ...
        'EdgeColor', [1 0 0], 'LineWidth', 2, 'BackgroundColor', [1 1 1 .4], ...
        'Clipping', 'on');
end

% plottools
hold off;


%% SAVING FIGURE TO FILE(S)
if ~ModeShow
    Fig2File(fig_h, FileName, Opts);
    close(fig_h);    
    % fig_h.Visible = 'on';
end    
% if ModeSave; system(fullfile(Opts.OutputDir, [Opts.Formats{1} '\dpi96_' FileName '.' Opts.Formats{1}])); end
end
