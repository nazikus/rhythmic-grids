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
ColumnsNum   = floor( (CanvasW + GutterW) / ( uBlockW + GutterW) );
MacroRowsNum = floor( CanvasW/uBlockW) ;  % each subsequent row height is x2 of preceding
RowsNum = sum(1:MacroRowsNum); % total uBlock rows

% actual grid width & height containing max possible uBlock widths
GridW = (uBlockW + GutterW) * ColumnsNum - GutterW;
GridH = sum(uBlockH*(1:MacroRowsNum)) + GutterH*(MacroRowsNum-1);  
% canvas height = grid height + optional vertical margings
CanvasH = GridH + 0;  
% horizontal (left or right) margins between canvas and actual grid
CanvasMargin = floor( (CanvasW - GridW)/2 );

% X coordinates of all vertical gridlines considerring canvas margins
GridLinesX = [0, CanvasMargin + [0 elast(cumsum(reshape( ...
              [uBlockW;GutterW]*ones(1,ColumnsNum), [1 ColumnsNum*2] )))], CanvasW];

% Y coordinates of baseline gridlines
GridBaseY = [Baseline:Baseline:GridH];

% Y coordinates of all horizontal uBlock gridlines
TightUBlocksY = cumsum(uBlockH*ones(1,RowsNum));  % no vertical canvas margins
GridLinesY = sort([ TightUBlocksY+GutterH*(repelem(1:MacroRowsNum, 1:MacroRowsNum)-1), ...
                    arrayfun(@(i)  TightUBlocksY(sum(1:i))+i*GutterH, 1:MacroRowsNum-1) ]);

% Y tick lables per uBlock height considerring gutter height
% GridLabelsY(1:numel(GridLinesY)) = cellfun(@(x) num2str(x), num2cell(GridLinesY), 'UniformOutput', false);
RowsIndx = sort([cumsum(1:14)+[1:14], cumsum(1:14)+[1:14]-1]);
GridLabelsY(RowsIndx) = cellfun(@(x) num2str(x), num2cell(GridLinesY(RowsIndx)), 'UniformOutput', false);

% disp('GridLinesX:'), disp(GridLinesX); disp('GridLinesY:'), disp(GridLinesY);

%% INITIALIZING FIGURE
FileName = sprintf( ...
    'Canvas %dx%d;  Grid %dx%d;  %sBlock %dx%d (%d:%d); Cols=%d; Rows=%d; GutterW=%d;', ...
    CanvasW, CanvasH, GridW, GridH, char(956), uBlockW, uBlockH, Ratio.W, Ratio.H, ColumnsNum, MacroRowsNum, GutterW);

GridTitle  = sprintf( ...
    'Baseline %d | Gutter %d | CanvasW %d | ARatio %d:%d  \\Rightarrow  %sBlock %dx%d | GridW %d | Margins 2x%d', ...
    Baseline, GutterW, CanvasW, Ratio.W, Ratio.H, char(956), uBlockW, uBlockH, GridW, CanvasMargin );
                 
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
ax.TickLength = [10/CanvasH 0];  % magical ratio :)
ax.GridAlpha  = 0.5;
ax.GridColor  = [0 0 0];

% Y AXIS
ax.YLabel.String   = sprintf('%d px | %d x block types', CanvasH, MacroRowsNum);
ax.YLabel.Position = [-60 CanvasH/2];  % disables pan-tracing property
ax.YLabel.FontSize = 14;
ax.YLabel.Color    = [0 0 0];
ax.YTickLabel = GridLabelsY;
ax.YTick      = [GridLinesY];
ax.YColor     = [0 0 .6];
ax.YGrid      = 'on';
ax.YDir       = 'reverse';

% X AXIS
XTickRotation = 60*(GutterW<28|uBlockW<28);
ax.XLabel.String = ' ';  % hack, just to position figure title up higher
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
% TODO filter big blocks
for r=0:MacroRowsNum-1

    MacroColsNum = floor( (GridW+GutterW) / (uBlockW*(r+1)+GutterW) ) + 0*logical(r);
    for c=0:MacroColsNum-1
    x_pos = CanvasMargin + c*(uBlockW*(r+1)+GutterW);
    y_pos = sum(uBlockH*(0:r)) + GutterH*r;
    if (MacroColsNum*(uBlockW*(r+1)+GutterW)-GutterW == GridW) % if columns fit grid evently
        colors = [0 1 0]; else colors = [0 .6 0]; end
    rectangle('Position',  [x_pos, y_pos, uBlockW*(r+1), uBlockH*(r+1) ], ...
              'FaceColor', colors, ...  % if good then yellow,
              'LineStyle','none',  ...
              'Clipping', 'on'     ...
              );
    end
    % bock size, ublock ratio, columns
    text(CanvasMargin+4, y_pos+7, ...
         sprintf('%d: (%d x %d) X %d', r+1, uBlockW*(r+1), uBlockH*(r+1), MacroColsNum), ...
         'FontWeight', 'Bold');
end 

% plot horizontal grid lines, multiples baseline height
x = [zeros(1, numel(GridBaseY)); CanvasW*ones(1, numel(GridBaseY))];
y = [GridBaseY; GridBaseY];
line(x, y, 'Color', [.8 0 0 .5], 'LineWidth', .5);

% Baseline tick and label
if uBlockH ~= Baseline
    line([0; -10], [Baseline; Baseline], 'LineWidth', .5, 'Clipping', 'off');
    text(-30,Baseline-3, num2str(Baseline), 'FontSize', 9, 'Color', [0 0 .6]);
end

% last X tick label
text(CanvasW, -23, num2str(CanvasW), 'FontSize', 9, 'Color', [0 0 .6], 'Rotation', XTickRotation);

% plottools
hold off;

end

