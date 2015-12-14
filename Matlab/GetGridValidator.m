function f_handle = GetGridValidator()
%GETGRIDVALIDATOR Returns logical validator function for a grid.
%
%  Validator function accepts Grid object (structure) as an input (e.g., from 
%  GridConfig.RhythmicGrid OR GridConfi.Grids{1}) and returns a single logical 
%  value.
    
    % a valid rhythmic grid satisfies following criteria:
    % - contains more than 1 blocks (rows)
    % - does not contain only micro-block and a block with width == grid width
    f_handle = @(grid) numel(grid.uFactors) > 1 && ...
                       grid.Blocks(2,1) < grid.W;
end

