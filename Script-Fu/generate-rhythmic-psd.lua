-- args parameters validation
if not (ngx.var.arg_w and ngx.var.arg_r and ngx.var.arg_b and ngx.var.arg_c and ngx.var.arg_g) then
    -- print to nginx's error_log
    ngx.log(ngx.STDERR, "Wrong parameters passed")

    -- goofy stub, gutters in ascii-art style
    local column = '              '
    local gutter = '   '
    local grid = column..'Wrong  configuration parameters: '..ngx.var.args..'\n'..
                 column..'Please enter correct grid.\n\n'
    for r = 1, 48 do
        grid = grid..column
        for c = 1, 9 do grid = grid..'|'..gutter..'|'..column end
        grid = grid..'\n'
    end
    ngx.say(grid)  -- prints to stdout (http response body)
    -- end stub

    ngx.exit(ngx.HTTP_OK)
end

-- -----------------------------------------------------------------------------

local gimp = 'gimp-console-2.8'
local psd_path = '/home/user/www/psd/'
local psd_name = 'W'..ngx.var.arg_w..'_R'..ngx.var.arg_r..'_B'..ngx.var.arg_b..
                '_C'..ngx.var.arg_c..'_G'..ngx.var.arg_g

-- wtf? why k,v get such values (but it works this way anyway)
local rW = 0
local rH = 0
for k,v in ngx.var.arg_r:gmatch("(%d+)x(%d+)") do
    rW = k
    rH = v
end

-- check if current .psd is already generated (cached)
local handle = io.popen(string.format('[ -f %s ] && printf "1" || printf "0"', psd_path..psd_name..'.psd'))
local result = handle:read("*a")
handle:close()

-- if .psd file not found, generate it
if result == "0" then
    --ngx.say("generating new .psd...")
    local command = string.format('%s --no-interface --no-data --no-fonts --batch='..
        '"(rhythmic-guides %d \'(%d %d) %d %d %d nil \\"%s\\" \\"%s\\")" '..
        '--batch="(gimp-quit 0)"', gimp, ngx.var.arg_w, rW, rH,
        ngx.var.arg_b, ngx.var.arg_c, ngx.var.arg_g, psd_path, psd_name)

    --ngx.say("command: "..command)
    os.execute(command)
end

--ngx.say("Rewriting to: psd_name..'.psd')
return ngx.redirect(psd_name..'.psd')

-- NB! if ngx.say or ngx.print is uncommented (for debugging),
-- it will terminate current request, hence ngx.redirect will fail.
