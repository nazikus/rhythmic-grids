% octave CLI parameters: --no-gui --eval <code> --exec-path <path> --no-line-editing --no-window-system --norc --quite <filepath_with_commands>
addpath('../Matlab/;../Matlab/Utils/')

Width    = 1280;  % 960 1280 1440
RatioW   = 1;     % '1x1' '3x2' '16x9'
RatioH   = 1;       
Baseline = 9;     % 3:18
Columns  = 10;    % 5 6 9 12
GutterToBaselineRatio = 1; % 0 1 2 3 4

Gutter = Baseline * GutterToBaselineRatio;
GridConfig = GenerateRhythmicGrid(Width, sprintf("%dx%d", RatioW, RatioH), Baseline, Columns, Gutter);

BlocksStr = sprintf("%dx%d,", GridConfig.RhythmicGrid.Blocks')(1:end-1);
gimp = sprintf("%s\\%s", 'C:\Program Files\GIMP 2\bin', 'gimp-console-2.8.exe');
psd_path = pwd();
psd_filename = sprintf("W%d_R%dx%d_B%d_C%d_G%d_BLCK=%s.psd", Width, RatioW, RatioH, Baseline, Columns, Gutter, BlocksStr);
BlocksStr = sprintf("(%d %d), ", GridConfig.RhythmicGrid.Blocks')(1:end-2);

command = sprintf("\"%s\" -i -d -b \"(psd-rhythmic-guides %d '(%d %d) %d %d %d '(%s) \"%s\\\" \"%s\")\" -b \"(gimp-quit 0)\"", 
    gimp, Width, RatioW, RatioH, Baseline, Columns, Gutter, BlocksStr, psd_path, psd_filename)

system(command)