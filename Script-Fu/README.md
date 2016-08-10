Scripts to generate [PSD][PSD Spec] documents in different environments. PSD generator is implementnted on [Concorida][Concordia Grid] server-side for "PSD" button of its front-end.

Types of scripts:
 - `.scm` - Script-Fu script, .psd generator, the main script used by all the other scripts
 - `.lua` - Lua script for [Lua nginx module][Lua Nginx]
 - `.bat` - Windows batch
 - `.sh`  - *nix bash 
 - `.m`   - Octave/Matlab script generating complete rhythmic grid & PSD with additional horizontal rulers

## Info

[GIMP][Gimp Home] is required to generate PSD files. Script-Fu is a scripting language based on [Scheme][Scheme Wiki] (lexically scoped dialect of [Lisp][Lisp Wiki]). Its [TinyScheme][TinyScheme Home] interpreter is embeded into GIMP for automation purposes. It can be utilized for scripting image processing routines with GIMP in non-interactive command-line mode (to generate .psd files on server-side, for example), which is not possible with Photoshop CC 2015 and prior.

Current [`rhythmic-guides.scm`][ScriptFu script] script generates a PSD document with single layer, empty canvas, and with horizontal/vertical [guides][Gimp Guides] of rhythmic grid configured via [Concordia web interface][Concordia Grid].  *Rhythimic Grid generator* ([JavaScript][Grids JS] or [Octave/Matlab][Grids Matlab] implementation) is used to obtain grid parameters.

## Installation & usage

Place Scipt-Fu file (`rhythmic-guides.scm`) into GIMP scripts directory (where all `*.scm` plugins are located), e.g.:

    usr/share/.gimp-2.x/scripts/
    C:\Program Files\GIMP\share\gimp\2.x\scripts\

Several command-line examples how to run Script-Fu in different environments:
    
    . generate-rhythmic-psd.sh 960 3x2 5 6 3 nil /home/user/psd/
    
    generate-rhythmic-psd.bat 960 3x2 5 6 3 nil # generates .psd into script's dir
    
    gimp-console --no-interface --no-data --no-fonts --batch="(rhythmic-guides 960 1x1 10 9 1 nil \"/path/to/psddir/\")" --batch="(gimp-quit 0)" # for vertical guides only

    
    gimp-console --no-interface --no-data --no-fonts --batch="(rhythmic-guides 960 1x1 10 9 1 '((45 30) (40 60) (80 90)) \"/path/to/psddir/\")" --batch="(gimp-quit 0)" # for vertical AND horizontal guides

---

In order to run Script-Fu in __nginx__ request response, you need to have nginx bundled with [Lua module][Nginx Lua] (e.g., nginx-extras). Refer to `[nginx.conf][Nginx Config]` for configuration details. Currently [Lua script][Lua Script] handles URLs with following parameters:

    http://server.com/psd?w=960&r=3x2&b=12&c=9&g=2
    # will generated .psd file with corresponding width, ratio, baseline, columns, gutter

--- 

In __Windows__, if you get *zlib1.dll error*, you can fix it by copying `zlib1.dll` from `<gimp_dir>\bin\` to `<gimp_dir>\lib\gimp\2.0\plug-ins\`

----

If you have any problems with generating .psd, feel free to [post an issue](https://github.com/nazikus/rhythmic-grids/issues/new?title=Issue with generating PSD).

[PSD Spec]: https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/ "PSD File Format Specification"
[Concordia Grid]: http://www.concordiagrid.com/ "Rhythmic grids"
[Nginx Lua]: https://github.com/openresty/lua-nginx-module "Nginx Lua module"
[Gimp Home]: https://www.gimp.org/ "Gimp Home"
[Gimp Guides]: https://docs.gimp.org/2.6/en/gimp-concepts-image-guides.html "Gimp Docs"
[Scheme Wiki]: https://en.wikipedia.org/wiki/Scheme_%28programming_language%29 "Wikipedia"
[Lisp Wiki]: https://www.wikiwand.com/en/Lisp_(programming_language) "Wikipedia"
[TinyScheme Home]: http://tinyscheme.sourceforge.net/ "TinyScheme SourceForge"
[ScriptFu Script]: https://github.com/nazikus/rhythmic-grids/blob/master/Script-Fu/rhythmic-guides.scm "rhythmic-guides.scm"
[Lua Script]: https://github.com/nazikus/rhythmic-grids/blob/master/Script-Fu/generate-rhythmic-psd.lua "generate-rhythmic-psd.lua"
[Grids JS]: https://github.com/nazikus/rhythmic-grids/blob/master/JavaScript/RhythmicGridGenerator.js "RhythmicGridGenerator.js"
[Grids Matlab]: https://github.com/nazikus/rhythmic-grids/blob/master/Matlab/GenerateRhythmicGrid.m "GenerateRhythmicGrid.m"
[Ngfinx Config]: https://github.com/nazikus/rhythmic-grids/blob/master/Script-Fu/nginx.conf "nginx.conf"

