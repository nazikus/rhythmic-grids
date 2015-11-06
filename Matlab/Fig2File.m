function Fig_h = Fig2File(Fig_h, FileName, Opts)
%FIG2FILE saves provided figure to file with give options.
%
% Fig_h   [h] - figure handler
% Options [struct] OutputDir: 'path';
%                  Formats  : {'fig', 'png', 'svg', 'pdf', 'eps', 'tiff'};
%                  Mode     : 'show', 'save', 'savefull'
%                  Show     : 'all', 'fit'


% FIXME invisibility for 'fig' export
% FIXME fullscale printing - pain in the ass, matlab bugs
out = Opts.OutputDir;
addpath(genpath('d:\Dropbox\Backup\Matlab\utility\'));

if ~exist(out, 'dir'); 
    mkdir(out); 
end
for i=1:numel(Opts.Formats)
    ext = Opts.Formats{i};
    if ~exist([out ext '\'], 'dir'); mkdir([out ext '\']); end

    if strcmp(ext, 'fig')
        fprintf('\tSaving image: %s ... ', upper(ext)); tic;
        savefig(Fig_h, [out 'fig\' FileName], 'compact'); 
        fprintf('%ds\n', round(toc));
    else
        if strcmp(Opts.Mode, 'save')
            fprintf('\tSaving image: %s ... ', upper(ext)); tic;
            hgexport(Fig_h, [out ext '\' FileName], hgexport('factorystyle'), 'Format', ext);
            fprintf('%ds\n', round(toc));
        else
            % print to file - font size and line width deviates
            figpos = getpixelposition(Fig_h);
            ScrnPPI = get(0,'ScreenPixelsPerInch');  % 96ppi
            set(Fig_h, 'paperunits', 'inches', 'papersize', figpos(3:4)/ScrnPPI,...
                    'paperposition', [0 0 figpos(3:4)/ScrnPPI]);

            for dpi = [ScrnPPI]
                fprintf('\tPrinting image: %s %d dpi ... ', upper(ext), dpi); tic;
                print(Fig_h, fullfile(out,  [ext '\dpi' num2str(dpi) '_' FileName]), ...
                      ['-d' ext], ['-r', num2str(dpi)], '-painters');

                % export_fig function - crashing when rendering full grid in -opengl mode (45Mpx image)
    %                 export_fig([out FileName '_fige' '.' ext], ['-d' ext], ['-r' num2str(600)], '-painters'); 

                fprintf('%ds\n', round(toc));
            end
        end
    end
end

end

