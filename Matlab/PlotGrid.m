function fig_h = PlotGrid(CanvasW, Ratio, Baseline, ColumnsNum, GutterW, Opts)
%PLOTGRID Plots harmonic grid based on given configuration. Possible multiple grids.
%
% CanvasW  [px] - Max canvas width
% Ratio    string representing ratio (eg, '3x2', '16x9')
%          (aspect ratio structure: width, height, ratio, eg {16, 9, 1.777})
% Baseline [px] - Baseline height
% ColumnN  [num]- number of columns (of uBlocks)
% GutterW  [px] - vertical gutter width between columns
% Options struct OutputDir: 'path';
%                Formats  : {'fig', 'png', 'svg', 'pdf', 'eps', 'tiff'};
%                Mode     : 'show', 'save', 'savefull'
%                Show     : 'all' or 'fit'

% except last, except first - lambda-f for the 1:n-1, 2:n elements of a vector
elast  = @(x) x(1:end-1);
efirst = @(x) x(2:end);
Ratio = RatioStr2Struct(Ratio);

% default Options
if ~exist('Opts', 'var'); 
    Opts = struct('OutputDir', '.\', ...
                  'Formats', {},  ...
                  'Mode', 'show', ...
                  'Show', 'fit',  ...
                  'Verbose', true); 
end

if Opts.Verbose
    fprintf('Configuration: Width %dpx, Ratio %dx%d, Baseline %dpx, Columns %d, Gutter %dpx\n', ...
             CanvasW, Ratio.W, Ratio.H, Baseline, ColumnsNum, GutterW);
end

%% DETERMINE MAIN QUANTITIES - DIMENSIONS, SIZES, MARGINS
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% micro-block width & height (minimum possible for current canvas and ratio)
min_uBlockH = lcm(Baseline, Ratio.H);
min_uBlockW = min_uBlockH * Ratio.R;

% max possible uBlock width for selected columnsN
max_uBlockW = (CanvasW+GutterW)/ColumnsNum - GutterW;

% iterate through all possible uBlocks within give columns number
% TODO test what heppens if to increment by Ratio.H instead of min_uBlockH (if 'vertical' search)
fprintf('Min. uBlock %dx%d\n', min_uBlockW, min_uBlockH);
fprintf('Number of candidates: %d\n', floor(max_uBlockW/min_uBlockW));

% first element of 'bws' is the biggest uBlock suitable, the rest are fractions
% which provide the same proportion for the rest of blocks, hence are redundant.
bws = fliplr( [min_uBlockW : min_uBlockW : max_uBlockW] );
if numel(bws)==0; return; end
for bw = bws(1:1)

uBlockW = bw;
uBlockH = bw/Ratio.R;

% gutter height between rows
GutterH = GutterW;

% number of max possible columns for current uBlock
MaxColumnsNum = floor( (CanvasW + GutterW) / (uBlockW + GutterW) );

% number of rows (macroRow height is incremental +min_uBlockH)
MacroRowsNum = floor( CanvasW/uBlockW ) ;  

% grid width (<=canvas width) with current uBlockW
GridW = (uBlockW + GutterW) * ColumnsNum - GutterW;

% horizontal (left or right) margins between canvas and actual grid
GridMargin = floor( (CanvasW - GridW)/2 );

% filtering blocks (indices) only that fit grid proportions horizontally
Opts.FailGrid = false;
if strcmp(Opts.Show, 'fit')
    MacroRowIdx = [];  % horizontal factors of uBlock for each fitting row
    %fprintf('\tuBlock %dx%d\n', uBlockW, uBlockH);
    for r=1:MacroRowsNum
        blockW = (uBlockW+GutterW)*r - GutterW;
        blockH = blockW / Ratio.R;
        if mod(GridW+GutterW, blockW+GutterW) == 0 && mod(blockH, 1) == 0
            MacroRowIdx(end+1) = r;
        end
        %fprintf('\t\tx%d: mod(%d,%d) == %d\n', r, GridW, blockW, mod(GridW+GutterW, blockW+GutterW));
        %fprintf('\t\tx%d: mod(%g,%g) == %g\n\n', r, blockH, 1, mod(blockH, 1));
    end
    if numel(MacroRowIdx) <= 1
        Opts.FailGrid = true;
        fprintf('\tuBlock %dx%d *%d  REJECTED\n', uBlockW, uBlockH, numel(MacroRowIdx));
    else
        fprintf('\tuBlock %dx%d *%d\n', uBlockW, uBlockH, numel(MacroRowIdx));
    end
end
% continue;

% no filtering, plot all possible blocks including those that don't fit the grid
if strcmp(Opts.Show, 'all') || numel(MacroRowIdx) <= 1
    MacroRowIdx = [1:ceil(MacroRowsNum/2) MacroRowsNum];
end
MacroRowsNum = numel(MacroRowIdx);

% grid height with selected uBlock
GridH = sum(((uBlockW+GutterW)*MacroRowIdx-GutterW)/Ratio.R)  + (MacroRowsNum-1)*GutterH;

% canvas height = grid height + optional vertical marging
CanvasH = GridH + 0;  

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

% TODO GridLines mode 'adaptive' (implemented) vs 'linear' (todo)
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
clear r TightUBlocksY blockW blockH MacroRowY uFactorH;

%% TITLES, FILES, AUX. VARS
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
FileName = sprintf('Width%d_Ratio%dx%d_Base%d_Cols%d_Gut%d_Block%dx%d', ...
                   CanvasW, Ratio.W, Ratio.H, Baseline, ColumnsNum, GutterW, uBlockW, uBlockH);

GridTitle  = sprintf( ...
    ['     Input: CanvasW %d | ARatio %d:%d | Baseline %d | Columns %d | Gutter %d\n' ...
     'Output: %sBlock %dx%d | Blocks #%d | GridW %d | Margins 2x%d'], ...
    CanvasW, Ratio.W, Ratio.H, Baseline, ColumnsNum, GutterW, ...
    char(956), uBlockW, uBlockH, MacroRowsNum, GridW, GridMargin );
                 
if strcmp(Opts.Show, 'all'); FileName = [FileName '_all'];  end

visibility = {'off', 'on'};
menubar    = {'none', 'figure'};

Mode.Show     = strcmp(Opts.Mode, 'show');
Mode.Save     = strcmp(Opts.Mode, 'save');
Mode.SaveFull = strcmp(Opts.Mode, 'savefull');
Mode.menuFlag     = strcmp(menubar{Mode.Show+1}, 'figure');

k = [2.2 3.6]/3432/10 * CanvasH;  % empirical coeffs, 3432 reference canvas height
FontRatios = [1 1; k(1) k(2)];
fR = FontRatios(Mode.SaveFull+1, :);
% fprintf('CanvasH=%d; k1=%f; k2=%f;\n', CanvasH, k(1), k(2));

% current or secondary screen (display) size
scrn = get(groot, 'ScreenSize');  % get current display screen resolution
mp = get(0, 'MonitorPositions');
if size(mp,1) == 1  % if single screen
    ScreenW = scrn(3);
    ScreenH = scrn(4);
    ShiftX  = 0;
else % if multiple screens
    ScreenW = mp(2,3);
    ScreenH = mp(2,4);
    ShiftX  = mp(2,1);
end

clear scrn mp FontRatios k;

%% INITIALIZE FIGURE      
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% TODO fix axis margin for menubar->figure 

% auxiliary margins between figure and canvas/plot (optional, matlab specific)
Fig = struct('LR', 110, 'Top', 160, 'Bot', 40); % [left/right; top; bottom] margins
Fig.W = CanvasW + Fig.LR*2;
Fig.H = min([ScreenH-50, max(ScreenH/2, CanvasH+Fig.Top+Fig.Bot)]); 
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

clear menubar visibility ShiftX ScreenW ScreenH;

%% INITIALIZE AXES
%  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

ax = axes();
hold on; pan yon;
ax.Title.String     = GridTitle;
ax.Title.FontSize   = 14*fR(2);
ax.Title.FontWeight = 'normal';
ax.Title.Margin = 8;
TPos = ax.Title.Position; TExt = ax.Title.Extent;
ax.Title.Position   = [Fig.LR+CanvasW*(1-TExt(3)) TPos(2)-Fig.TitleMargin 0];  % disable anti-panning

ax.Units      = 'pixels';
ax.Position   = [Fig.LR -(CanvasH-Fig.H+Fig.Top + 20*Mode.menuFlag) CanvasW CanvasH];
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
ax.YLabel.Position = [-60 Fig.Top-60];  % disables anti-panning
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

if GutterW>0;  RecLine = 'none'; else RecLine = '-'; end

% plot all blocks
for r=MacroRowIdx
    ri = find(MacroRowIdx==r); % r index
    
    % MacroCol width == current macro blockW
    blockW = -GutterW + (GutterW+uBlockW)*r;
    blockH = blockW / Ratio.R;
    MacroColsNum = floor( (GridW+GutterW) / (blockW+GutterW) ) + 0*logical(r);

    fit = (blockW+GutterW)*MacroColsNum - GutterW == GridW;
    if fit % if columns fit grid evently
        colors = [0 1 0]; else colors = [0 .6 0]; 
    end

    currRows= elast([0 MacroRowIdx(1:ri)]);
    y_pos = sum((currRows*(uBlockW+GutterW)-GutterW*logical(currRows)) / Ratio.R) + (ri-1)*GutterH;
    for c=0:MacroColsNum-1
        x_pos = GridMargin + c*(blockW+GutterW);
        rectangle('Position',  [x_pos, y_pos, blockW, blockH ], ...
                  'FaceColor', colors, ...
                  'LineStyle', RecLine,  ...
                  'Clipping', 'on'     ...
                  );
    end
    
    % text: block size, uBlock ratio, columns
    text(GridMargin+4, y_pos+7, ...
         sprintf('%d: (%d x %d) X %d', r, blockW, blockH, MacroColsNum), ...
         'FontSize', 10*fR(2), 'FontWeight', 'Bold', ...
         'Color', [0 0 0], 'Clipping', 'on');
     
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
    line([0; -10], [Baseline; Baseline], 'LineWidth', .5, 'Clipping', 'off');
    text(-30,Baseline-3, num2str(Baseline), 'FontSize', 9*fR(1), 'Color', [0 0 .6]);
end

% last X tick label
text(CanvasW, -23, num2str(CanvasW), 'FontSize', 9*fR(1), 'Color', [0 0 .6], 'Rotation', XTickRotation); %9

% if grid failed, only 1 row fits
if Opts.FailGrid
   text(-10, 270, 'REJECTED', ...
        'Rotation', 30, 'Color', [1 0 0], 'FontSize', 76*fR(1), 'FontWeight', 'bold', ...
        'EdgeColor', [1 0 0], 'LineWidth', 2, 'BackgroundColor', [1 1 1 .5], ...
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
