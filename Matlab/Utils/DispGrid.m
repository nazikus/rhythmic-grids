function DispGrid(GridConf, Mode)
%DISPGRID print grid configuration to stdout.
    Mode = 'short';

    w = 14;
    if strcmp(Mode, 'short')
        fprintf('%*s : %d px\n', w, 'MaxCanvasWidth', GridConf.MaxCanvasWidth);
        fprintf('%*s : %d px\n', w, 'Baseline'      , GridConf.Baseline);
        fprintf('%*s : %dx%d\n', w, 'Ratio'         , GridConf.Ratio.W, GridConf.Ratio.H);
        fprintf('%*s : %d\n'   , w, 'Columns'       , GridConf.ColumnsNum);
        fprintf('%*s : %d px\n', w, 'Gutter'        , GridConf.Gutter.W);
        
        fprintf('\n%*s : min %gx%g px, max %gx%g px\n', w, 'micro-block', GridConf.uBlock.min_W, GridConf.uBlock.min_H, GridConf.uBlock.max_W, GridConf.uBlock.max_H);
        fprintf('%*s : [ %s]\n', w, 'Fit blocks'    , sprintf('%gx%g ', GridConf.Grids{1}.Fit.Blocks'));
        fprintf('%*s : %d px\n', w, 'Grid width'    , GridConf.Grids{1}.W);
        fprintf('%*s : 2x%d px\n',w,'Margins'       , GridConf.Grids{1}.Margin);
        fprintf('\n');
    end

end
