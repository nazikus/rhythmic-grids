function fig_h = PlotGrid(Baseline, CanvasW, GutterW, Ratio, visible)
% Baseline [px] - Baseline height
% CanvasW  [px] - Canvas width (input from user)
% GutterV  [px] - vertical gutter width between columns
% Ratio   struct({'W': Width; 'H': Height; 'R': Width/Height}) 
%         - aspect ratio structure: width, height, ration (eg 16, 9, 1.777)
% visible 'on' (default) |'off' - set plot figure visibility 'on' or 'off'

elast = @(x) x(1:end-1);  % 'excep last' lambda-f for the n-1 elements of a vector
if ~exist('visible', 'var'); visible = 'on'; end;

%% DETERMINE VARIOUS DIMENSIONS, SIZES & MARGINS

% current screen (display) size
scrn = get(groot, 'ScreenSize');  % get current display screen resolution
ScreenW = scrn(3);
ScreenH = scrn(4);
clear scrn;

% gutter height between rows
GutterH = GutterW;

% micro-block width & height (minimum possible for current canvas and gutter)
uBlockH = lcm(Baseline, Ratio.H);
uBlockW = uBlockH * Ratio.R;

% maximum number of columns and rows proportional to uBlock
ColumnsNum = floor( (CanvasW + GutterW) / ( uBlockW + GutterW) );
MacroRowsNum = ColumnsNum;  % each subsequent row height is x2 of preceding
RowsNum = sum(1:MacroRowsNum); % total uBlock rows

% actual grid width containing max possible uBlock widths
GridW = (uBlockW + GutterW) * ColumnsNum - GutterW;
% actual grid height containing all possible block-size combinations
GridH = sum(uBlockH*(1:MacroRowsNum)) + GutterH*(MacroRowsNum-1);  
% canvas height = grid height + optional vertical margings (not tested)
CanvasH = GridH + 0;  
% horizontal (left or right) margins between canvas and actual grid
CanvasMargin = floor( (CanvasW - GridW)/2 );

% X coordinates of all vertical gridlines considerring canvas margins
GridLinesX = [0, CanvasMargin + [0 elast(cumsum(reshape( ...
              [uBlockW;GutterW]*ones(1,ColumnsNum), [1 ColumnsNum*2] )))], CanvasW];

% Y coordinates of baseline gridlines
GridBaseY = [Baseline:Baseline:GridH];

% Y coordinates of all horizontal uBlock gridlines (no vertical canvas margins)
TightUBlocksY = cumsum(uBlockH*ones(1,RowsNum));
GridLinesY = sort([ Baseline, ...
                    TightUBlocksY+GutterH*(repelem(1:MacroRowsNum, 1:MacroRowsNum)-1), ...
                    arrayfun(@(i)  TightUBlocksY(sum(1:i))+i*GutterH, 1:MacroRowsNum-1) ]);

% Y ticks lables per uBlock height considerring horizontal gutters
GridLabelsY(GridLinesY/Baseline) = cellfun(@(x) num2str(x), ...
                                                num2cell(GridLinesY), ...
                                                'UniformOutput', false);
LabelsYCount = numel(GridLinesY);

% disp('GridLinesX:'), disp(GridLinesX); disp('GridLinesY:'), disp(GridLinesY);

%% INITIALIZING FIGURE
FileName = sprintf('Canvas %dx%d;  Grid %dx%d;  %sBlock %dx%d (%d:%d); Cols=%d; GutterW=%d;', ...
                     CanvasW, CanvasH, GridW, GridH, char(956), uBlockW, uBlockH, Ratio.W, Ratio.H, ColumnsNum,GutterW);

GridTitle  = sprintf( ...
    'Baseline %d | Gutter %d | CanvasW %d | ARatio %d:%d  \\Rightarrow  %sBlock %dx%d | GridW %d | Margins 2x%d', ...
    Baseline, GutterW, CanvasW, Ratio.W, Ratio.H, char(956), uBlockW, uBlockH, GridW, CanvasMargin ...
);
                 
                 
% AUXILIARY MARGINS BETWEEN FIGURE AND CAVNAS/PLOT (optional, matlab specific)
figMargin = [110 170 40]; % [left/right; top; bottom]
figW = CanvasW + figMargin(1)*2;
figH = min([ScreenH-50, CanvasH + figMargin(2)+figMargin(3)]);

fig_h = figure('Menubar', 'figure', 'Visible', visible);
fig_h.Name          = FileName;
fig_h.OuterPosition = [(ScreenW-figW)/2, ScreenH-figH, figW, figH];
fig_h.NumberTitle   = 'off';
fig_h.DockControls  = 'off';
fig_h.Resize        = 'off';
fig_h.GraphicsSmoothing = 'off';

% INITIALIZE AXIS
ax = axes();
hold on; pan yon;
ax.Title.String     = GridTitle;
ax.Title.FontSize   = 14;
ax.Title.FontWeight = 'normal';

ax.Units      = 'pixels';
ax.Position   = [figMargin(1) -(CanvasH-figH+figMargin(2)) CanvasW CanvasH];
ax.XLim       = [0 CanvasW];
ax.YLim       = [0 CanvasH];
ax.Layer      = 'top'; 
ax.TickDir    = 'out';
ax.FontSize   = 9;
ax.TickLength = [0.005 0];
ax.GridAlpha  = 0.3;
ax.GridColor  = [.5 0 0];

% Y AXIS
ax.YLabel.String   = sprintf('%d px | %d x block types', CanvasH, MacroRowsNum);
ax.YLabel.Position = [-60 CanvasH/2];  % disables pan-tracing property
ax.YLabel.FontSize = 14;
ax.YLabel.Color    = [0 0 0];
ax.YTickLabel = GridLabelsY;
ax.YTick      = [GridBaseY];
ax.YColor     = [0 0 .6];
ax.YGrid      = 'on';
ax.YDir       = 'reverse';

% X AXIS
ax.XLabel.String = ' ';  % hack, just to position figure title up higher
ax.XTickLabelRotation = 60*(GutterW<28);
ax.XTick      = [GridLinesX];
ax.XColor     = [0 0 .6];
ax.XGrid      = 'on';
ax.XAxisLocation = 'top';

%% PLOT BLOCKS, GUIDES AND MARGINS

% plot rectangles for canvas margins
rectangle('Position' , [0 0 CanvasMargin GridH], ...
          'FaceColor', [.97 .92 .92], 'LineStyle', 'none');
rectangle('Position' , [CanvasMargin+GridW 0 CanvasMargin GridH], ...
          'FaceColor', [.97 .92 .92], 'LineStyle', 'none');

% plot all blocks
% TODO block text labels
% TODO remove suprlus YLabels
% TODO fix ticks lengths
for r=0:MacroRowsNum-1

    MacroColsNum = floor( (GridW+GutterW) / (uBlockW*(r+1)+GutterW) ) + 1*logical(r);
    for c=0:MacroColsNum-1
    x_pos = CanvasMargin + c*(uBlockW*(r+1)+GutterW);
    y_pos = sum(uBlockH*(0:r)) + GutterH*r;
    rectangle('Position',  [x_pos, y_pos, uBlockW*(r+1), uBlockH*(r+1) ], ...
              'FaceColor', [0 1 0], ...
              'LineStyle','none',  ...
              'Clipping', 'on'     ...
              );
    end;
end;    

% plot horizontal guide lines, multiples of uBlock height
% -1 to remove first baseline guide (useless to show it)
x = [zeros(1, LabelsYCount-1); CanvasW*ones(1, LabelsYCount-1)];
y = [GridLinesY(2:end); GridLinesY(2:end)];
line(x, y, 'Color', [0 0 0], 'LineWidth', .5);

% plottools
hold off;

end

