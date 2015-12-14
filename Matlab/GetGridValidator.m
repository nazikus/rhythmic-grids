function f_handle = GetGridValidator()
%GETGRIDVALIDATOR Returns logical validator function for a grid.
%
%  Validator function accepts Grid object (structure) as an input (e.g., from 
%  GridConfig.RhythmicGrid OR GridConfi.Grids{1}) and returns a single logical 
%  value.
    
    % a valid rhythmic grid contains more than n blocks (rows)
    f_handle = @(grid) numel(grid.uFactors) > 1;
end

