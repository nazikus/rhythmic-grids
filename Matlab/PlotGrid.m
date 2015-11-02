function fig_h = PlotGrid(CanvasW, Baseline, Ratio, GutterW, Opts)
% Baseline [px] - Baseline height
% CanvasW  [px] - Canvas width (input from user)
% GutterV  [px] - vertical gutter width between columns
% Ratio   struct 'W': Width; 'H': Height; 'R': Width/Height
%         - aspect ratio structure: width, height, ration (eg 16, 9, 1.777)
% Options struct OutputDir: 'path';
%                Formats  : {'fig', 'png', 'svg', 'pdf', 'eps'};
%                Mode     : 'show' or 'save'

elast = @(x) x(1:end-1);  % 'except last' lambda-f for the n-1 elements of a vector
if ~exist('Opts', 'var'); Opts = struct('OutputDir', '.\', 'Formats', {}, 'Mode', 'show'); end

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
ColumnsNum   = floor( (CanvasW + GutterW) / (uBlockW + GutterW) );
MacroRowsNum = floor( CanvasW/uBlockW ) ;  % each subsequent row height is x2 of preceding
RowsNum = sum(1:MacroRowsNum); % total uBlock rows

% actual grid width & height containing max possible uBlock widths
GridW = (uBlockW + GutterW) * ColumnsNum - GutterW;
GridH = sum(uBlockH*(1:MacroRowsNum)) + GutterH*(MacroRowsNum-1);  
% canvas height = grid height + optional vertical margings
CanvasH = GridH + 0;  
% horizontal (left or right) margins between canvas and actual grid
CanvasMargin = floor( (CanvasW - GridW)/2 );

% X coordinates of all vertical gridlines considerring canvas margins
GridLinesX = unique( ...
             [0, CanvasMargin + [0 elast(cumsum(reshape( ...
              [uBlockW;GutterW]*ones(1,ColumnsNum), [1 ColumnsNum*2] )))], CanvasW] ...
              );

% Y coordinates of baseline gridlines
GridBaseY = [Baseline:Baseline:GridH];

% Y coordinates of all horizontal uBlock gridlines
TightUBlocksY = cumsum(uBlockH*ones(1,RowsNum));  % no vertical canvas margins
GridLinesY = sort([ TightUBlocksY+GutterH*(repelem(1:MacroRowsNum, 1:MacroRowsNum)-1), ...
                    arrayfun(@(i)  TightUBlocksY(sum(1:i))+i*GutterH, 1:MacroRowsNum-1) ]);

% Y tick lables per uBlock height considerring gutter height
% GridLabelsY(1:numel(GridLinesY)) = cellfun(@(x) num2str(x), num2cell(GridLinesY), 'UniformOutput', false);
RowsIndx = sort([cumsum(1:MacroRowsNum)+[1:MacroRowsNum], ...
                 cumsum(1:MacroRowsNum)+[1:MacroRowsNum]-1]);
GridLabelsY(RowsIndx(1:end-1)) = cellfun(@(x) num2str(x), ...
                                         num2cell(GridLinesY(RowsIndx(1:end-1))), ...
                                         'UniformOutput', false);

% disp('GridLinesX:'), disp(GridLinesX); disp('GridLinesY:'), disp(GridLinesY);

FileName = sprintf('Width%d_Base%d_Ratio%dx%d_Gut%d', ...
                   CanvasW, Baseline, Ratio.W, Ratio.H, GutterW);

GridTitle  = sprintf( ...
    'CanvasW %d | Baseline %d | ARatio %d:%d | Gutter %d | \\Rightarrow  %sBlock %dx%d | Cols %d | GridW %d | Margins 2x%d', ...
    CanvasW, Baseline, Ratio.W, Ratio.H, GutterW, char(956), uBlockW, uBlockH, ColumnsNum, GridW, CanvasMargin );
                 
%% INITIALIZING FIGURE

ModeShow = strcmp(Opts.Mode, 'show');
visibility = {'off', 'on'};
menubar = {'none', 'figure'};
k = [2.2 3.6]/3432 * CanvasH;  % empirical coeffs, 3432 reference canvas height
FontRatios = [k(1) k(2); 10 10];
fR = FontRatios(ModeShow+1, :);

% auxiliary margins between figure and canvas/plot (optional, matlab specific)
figMargin = [110 170 40]; % [left/right; top; bottom]
figW = CanvasW + figMargin(1)*2;
figH = min([ScreenH-50, CanvasH + figMargin(2)+figMargin(3)]); 

if strcmp(Opts.Mode, 'save')
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
% fig_h.Resize        = 'off';

% INITIALIZE AXIS
ax = axes();
hold on; pan yon;
TPos = ax.Title.Position;
ax.Title.String     = GridTitle;
ax.Title.FontSize   = fR(2)*1.4;
ax.Title.FontWeight = 'normal';
if ~ModeShow
    ax.Title.Position   = [TPos(1)+600 TPos(2)-60 TPos(3)];
end

ax.Units      = 'pixels';
ax.Position   = [figMargin(1) -(CanvasH-figH+figMargin(2)) CanvasW CanvasH];
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
% TODO filter big blocks
for r=0:MacroRowsNum-1

    MacroColsNum = floor( (GridW+GutterW) / (uBlockW*(r+1)+GutterW) ) + 0*logical(r);

    blockW = uBlockW*(r+1);
    blockH = uBlockH*(r+1);
    
    fit = MacroColsNum*(uBlockW*(r+1)+GutterW)-GutterW == GridW;
    if fit % if columns fit grid evently
        colors = [0 1 0]; else colors = [0 .6 0]; end
    %if blockW > ceil(GridW/2) && ~fit; continue; end

    for c=0:MacroColsNum-1
    
    x_pos = CanvasMargin + c*(blockW+GutterW);
    y_pos = sum(uBlockH*(0:r)) + GutterH*r;
    
    rectangle('Position',  [x_pos, y_pos, blockW, blockH ], ...
              'FaceColor', colors, ...
              'LineStyle','none',  ...
              'Clipping', 'on'     ...
              );
    end
        
    % bock size, ublock ratio, columns
    text(CanvasMargin+4, y_pos+7, ...
         sprintf('%d: (%d x %d) X %d', r+1, uBlockW*(r+1), uBlockH*(r+1), MacroColsNum), ...
         'FontSize', fR(2)*1, 'FontWeight', 'Bold', ...
         'Color', [0 0 0], 'Clipping', 'on');
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

% plottools
hold off;

%% SAVING FIGURE TO FILE(S)

%TODO fix fig invisibility
%TODO fix fullscale printing

out = Opts.OutputDir;
addpath(genpath('d:\Dropbox\Backup\Matlab\utility\'));

if strcmp(Opts.Mode, 'save')
    if ~exist(out, 'dir'); 
        mkdir(out); 
    end
    for i=1:numel(Opts.Formats)
        ext = Opts.Formats{i};
        if ~exist([out ext '\'], 'dir'); mkdir([out ext '\']); end

        if strcmp(ext, 'fig')
            fprintf('Saving image: %s ... ', ext); tic;
            savefig(fig_h, [out 'fig\' FileName], 'compact'); 
            fprintf('%ds\n', round(toc));
        else
            fprintf('Saving image: %s ... ', ext); tic;
            hgexport(fig_h, [out ext '\' FileName], hgexport('factorystyle'), 'Format', ext);
            fprintf('%ds\n', round(toc));

            % print to file - font size and line width deviates
            figpos = getpixelposition(fig_h);
            ScrnPPI = get(0,'ScreenPixelsPerInch');  % 96ppi
            set(fig_h, 'paperunits', 'inches', 'papersize', figpos(3:4)/ScrnPPI,...
                    'paperposition', [0 0 figpos(3:4)/ScrnPPI]);
            for dpi = [ScrnPPI]
                fprintf('Printing image: %s %d dpi ... ', upper(ext), dpi); tic;
                print(fig_h, fullfile(out,  [ext '\dpi' num2str(dpi) '_' FileName]), ...
                      ['-d' ext], ['-r', num2str(dpi)], '-painters');

                % export_fig function - crashing when rendering full grid in -opengl mode (45Mpx image)
%                 export_fig([out FileName '_fige' '.' ext], ['-d' ext], ['-r' num2str(600)], '-painters'); 

                fprintf('%ds\n', round(toc));
            end
        end
    end


%     fig_h.Visible = 'on';
    close(fig_h);    
end
if ~ModeShow; system(fullfile(out, [FileName '_dpi' num2str(dpi) '.' ext])); end
end
