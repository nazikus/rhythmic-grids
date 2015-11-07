function Ratio = RatioStr2Struct(rstr)
%RATIOSTR2STRUCT Parses ratio string and returns structured representation of it.
%
% rstr   - string representing ratio, e.g. {'3x2', '16x9'}
% Returns struct of ratio like this: struct('W',  1, 'H', 1, 'R',  1/1)

    Ratio = struct();
    s = strsplit(lower(rstr), 'x');
    if numel(s) ~= 2; warning('Wrong ratio string %s', rstr); end

    Ratio = struct( 'W', str2num(s{1}), ...
                                   'H', str2num(s{2}), ...
                                   'R', str2num(s{1}) / str2num(s{2}) );
        
end