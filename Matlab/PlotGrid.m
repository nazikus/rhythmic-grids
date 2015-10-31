function fig_h = PlotGrid(Baseline, CanvasW, GridW, uBlockW, uBlockH, GutterW, Ratio, visible)
% Baseline [px] - Baseline height
% CanvasW  [px] - Canvas width (input from user)
% GridW    [px] - Grid width (depends on micro-block dimensions and gutter)
% uBlockW  [px] - micro-block width  (minimum possible)
% uBlockH  [px] - micro-block height (minimum possible)
% GutterV  [px] - vertical gutter width between columns
% Ratio   struct({'W': Width; 'H': Height; 'R': Width/Height}) 
%         - aspect ratio structure: width, height, ration (eg 16, 9, 1.777)
% visible 'on' (default) |'off' - set plot figure visibility 'on' or 'off'

elast = @(x) x(1:end-1);
xywh2xy = @(a) [a(1) a(1) a(1)+a(3) a(1)+a(3); ...
                 a(2) a(2)+a(4) a(2)+a(4) a(2) ]; 
if ~exist('visible', 'var'); visible = 'on'; end;

%% Determine dimensions, sizes & margins
% current screen (display) size
scrn = get(groot, 'ScreenSize');  % get current display screen resolution
ScreenW = scrn(3);
ScreenH = scrn(4);
clear scrn;

% gutter height between rows
GutterH = GutterW;
% horizontal (left or right) margins between canvas and actual grid
CanvasMargin = floor( (CanvasW - GridW)/2 );

% maximum number of columns and rows number proportional to uBlock
ColumnsNum = floor( (CanvasW + GutterW) / ( uBlockW + GutterW) );
MacroRowsNum = ColumnsNum;  % each subsequent row height is x2 of preceding
MacroRowsNum = 3;
RowsNum = sum(1:MacroRowsNum);

% actual grid height containing all possible block-size combinations
GridH = sum(uBlockH*(1:MacroRowsNum)) + GutterH*(MacroRowsNum-1);  
% canvas height = grid height + optional vertical margings (not tested)
CanvasH = GridH + 0;  

% X coordinates of all vertical gridlines considerring canvas margins
GridLinesX = CanvasMargin + [0 elast(cumsum(reshape( ...
              [uBlockW;GutterW]*ones(1,ColumnsNum), [1 ColumnsNum*2] )))];

% Y coordinates of baseline gridlines
GridBaseY = [Baseline:Baseline:GridW];

% Y coordinates of all horizontal uBlock gridlines (no vertical canvas margins)
TightUBlocksY = cumsum(uBlockH*ones(1,RowsNum));
GridLinesY = sort([ TightUBlocksY+GutterH*(repelem(1:MacroRowsNum, 1:MacroRowsNum)-1), ...
                    arrayfun(@(i)  TightUBlocksY(sum(1:i))+i*11, 1:MacroRowsNum-1) ]);

GutterH*(repelem(1:MacroRowsNum, 1:MacroRowsNum)-1)
GridLinesY

% Y ticks lables per uBlock height considerring horizontal gutters
GridLabelsY(GridLinesY/Baseline) = cellfun(@(x) num2str(x), num2cell(GridLinesY), 'UniformOutput', false);
LabelsYCount = numel(GridLinesY);

disp('GridLinesX:'), disp(GridLinesX);
disp('GridLinesY:'), disp(GridLinesY);

%% Initializing figure
FigureName = sprintf('Canvas %dx%d;  Grid %dx%d;  %sBlock %dx%d (%d:%d); Cols=%d; GutterW=%d;', ...
                     CanvasW, CanvasH, GridW, GridH, char(956), uBlockW, uBlockH, Ratio.W, Ratio.H, ColumnsNum,GutterW);

% [left/right; top; bottom] auxiliary margins between figure and cavnas (plot)
figMargin = [100 140 40]; % (optional, matlab specific)
figW = CanvasW + figMargin(1)*2;
figH = CanvasH + figMargin(2)+figMargin(3);

fig_h = figure('Menubar', 'figure', 'Visible', visible);
fig_h.Name          = FigureName;
fig_h.OuterPosition = [(ScreenW-figW)/2, ScreenH-figH, figW, figH];
fig_h.NumberTitle   = 'off';
fig_h.DockControls  = 'off';
fig_h.Resize        = 'off';
fig_h.GraphicsSmoothing = 'off';

ax_h = axes();
hold on;
ax_h.Title.FontWeight = 'normal';
ax_h.Title.FontSize   = 14;
ax_h.Title.String     = sprintf( ...
    'Baseline %d | Canvas %dpx | ARatio %d:%d | Grid %dpx | %sBlock %dx%dpx | Gutter %dpx | Margins 2x%dpx', ...
    Baseline, CanvasW, Ratio.W, Ratio.H, GridW, char(956), uBlockW, uBlockH, GutterW, CanvasMargin ...
);

ax_h.Units      = 'pixels';
ax_h.Position   = [figMargin(1) figMargin(3) CanvasW CanvasH];
ax_h.XLim       = [0 CanvasW];
ax_h.YLim       = [0 CanvasH];
ax_h.TickDir    = 'out';
ax_h.Layer      = 'top';  % doesn't work (?)

ax_h.YGrid      = 'on';
ax_h.YDir       = 'reverse';
ax_h.YTick      = [GridBaseY];
ax_h.YTickLabel = GridLabelsY;

ax_h.XGrid      = 'on';
ax_h.XAxisLocation = 'top';
ax_h.XTick      = [GridLinesX];

% plot auxiliary horizontal lines, multiples of uBlock height
x = [zeros(1, LabelsYCount); CanvasMargin*ones(1, LabelsYCount)];
y = [GridLinesY; GridLinesY];
line(x, y, 'Color', [0 0 0]);

% m1 = xywh2xy([0 0 CanvasMargin CanvasH]);
% ph = patch(m1(1,:), m1(2,:), .1*ones(1,3)); 
% set(ph, 'FaceAlpha', 0.1');
% m2 = xywh2xy([CanvasMargin+GridW 0 CanvasMargin CanvasH]);
% ph = patch(m2(1,:), m2(2,:), .1*ones(1,3)); 
% set(ph, 'FaceAlpha', 0.1');

% todo centering off-blocks
for r=0:MacroRowsNum-1

    MacroColsNum = floor( (GridW+GutterW) / (uBlockW*(r+1)+GutterW) ) + logical(r);
    for c=0:MacroColsNum-1
    x_pos = CanvasMargin + c*(uBlockW*(r+1)+GutterW);
    y_pos = sum(uBlockH*(0:r)) + GutterH*r;
    rectangle('Position',  [x_pos, y_pos, uBlockW*(r+1), uBlockH*(r+1) ], ...
              'FaceColor', [0 1 0], ...
              'LineStyle', 'none',  ...
              'Clipping',  'off'     ... 
              );
    end;
end;    
% set(gca,'layer','top');

% plotting screen frame
%contour(peaks(20));

% plottools
hold off;

end

