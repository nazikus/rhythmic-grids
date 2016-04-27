Scripts to generate [PSD](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/) documents in different environments:
 - `.scm` - Script-Fu script, the main script used by all other scripts
 - `.lua` - Lua script for [Lua nginx module](https://github.com/openresty/lua-nginx-module)
 - `.bat` - Windows batch
 - `.sh`  - *nix bash 
 - `.m`   - Octave/Matlab script generating complete rhythmic grid & PSD with additional horizontal rulers

## Info

[GIMP](https://www.gimp.org/) is required to generate PSD files. Script-Fu is a [Scheme](https://en.wikipedia.org/wiki/Scheme_%28programming_language%29)-based scripting language (Lisp dialect). It's [TinyScheme](http://tinyscheme.sourceforge.net/) interpreter is embeded into GIMP for automation purposes. It can be utilized for scripting image processing routines with GIMP in non-interactive command-line mode (to generate .psd files on server-side, for example), which is not possible with Photoshop CC 2015 and prior.

Current `rhythmic-guides.scm` script generates a PSD document with single layer, empty canvas, and with horizontal/vertical [guides](https://docs.gimp.org/2.6/en/gimp-concepts-image-guides.html) of rhythmic grid configured via [Concordia interface](http://nazikus.github.io/rhythmic-grids/).  *Rhythimic Grid generator* ([JavaScript](https://github.com/nazikus/rhythmic-grids/blob/master/JavaScript/RhythmicGridGenerator.js) or [Octave/Matlab](https://github.com/nazikus/rhythmic-grids/blob/master/Matlab/GenerateRhythmicGrid.m) implementation) is used to obtain grid parameters.

## Installation & usage

Place Scipt-Fu file (`rhythmic-guides.scm`) into GIMP scripts directory (where all `*.scm` plugins are located), e.g.:

    usr/share/.gimp-2.x/scripts/
    C:\Program Files\GIMP\share\gimp\2.x\scripts\

Shell command example to run Script-Fu:
    
    . generate-rhythmic-psd.sh 960 3x2 5 6 3 nil /home/user/psd/
    generate-rhythmic-psd.bat 960 3x2 5 6 3 nil # generates .psd into script's dir
    gimp-console --no-interface --no-data --no-fonts --batch="(rhythmic-guides 960 1x1 10 9 1 nil \"/path/to/psddir/\")" --batch="(gimp-quit 0)" # for vertical guides only
    gimp-console --no-interface --no-data --no-fonts --batch="(rhythmic-guides 960 1x1 10 9 1 '((45 30) (40 60) (80 90)) \"/path/to/psddir/\")" --batch="(gimp-quit 0)" # for vertical AND horizontal guides

---

In order to run Script-Fu in __nginx__ request response, you need to have nginx bundled with [Lua module](https://github.com/openresty/lua-nginx-module) (e.g., nginx-extras). Refer to [nginx.conf](https://github.com/nazikus/rhythmic-grids/blob/master/Script-Fu/nginx.conf) for configuration details. Currently Lua script handles URLs with following parameters:

    http://server.com/psd?w=960&r=3x2&b=12&c=9&g=2
    # width, ratio, baseline, columns, gutter - correspondingly

--- 

In __Windows__, if you get *zlib1.dll error*, you can fix it by copying `zlib1.dll` from `<gimp_dir>\bin\` to `<gimp_dir>\lib\gimp\2.0\plug-ins\`

----

If you have any problems with generating .psd, feel free to [post an issue](https://github.com/nazikus/rhythmic-grids/issues/new).