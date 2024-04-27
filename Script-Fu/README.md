**Table of Contents**

- [Info](#info)
- [Setup](#setup)
	- [Installation](#installation)
		- [Linux](#linux)
		- [Windows](#windows)
	- [Visual guides](#visual-guides)
	- [Nginx](#nginx)
- [Troubleshooting](#troubleshooting)

---

Scripts to generate [PSD][psd-spec] documents in different environments. PSD generator is to be used on the server for the UI "PSD" button.

Types of scripts:
 - `.scm` - Script-Fu script, `.psd` file generator, the main script used by all the other scripts
 - `.lua` - Lua script for [Lua nginx module][nginx-lua]
 - `.bat` - Windows batch
 - `.sh`  - *nix bash
 - `.m`   - Octave/Matlab script generating complete rhythmic grid & PSD with additional horizontal rulers

## Info

[GIMP][gimp-home] is required to generate PSD files. Script-Fu is a scripting language based on Schemescheme-wiki (a lexically scoped dialect of [Lisp][lisp-wiki]). Its [TinyScheme][tiny-home] interpreter is embedded into GIMP for automation purposes. It can be utilized for scripting image processing routines with GIMP in headless command line mode (to generate `.psd` files on the server side, for example), which is not possible with Photoshop CC 2015 and prior.

Current [`psd-rhythmic-guides.scm`][scriptfu-script] script generates a PSD document with a single layer, an empty canvas, and with horizontal/vertical [guides][gimp-guides] of rhythmic grid configured via [Concordia web interface][Concordia Grid]. In the command line, you can use *Rhythmic Grid generator* ([JavaScript][grid-js] or [Octave/Matlab][grids-matlab] implementation) to obtain block sizes, but block sizes are required only if you need horizontal guides as well. For vertical guides only its enough to provide grid parameters as arguments in `(psd-rhythmic-guides <maxWidth> <ratio> <baseline> <columns> <gutterMultiplier> <blockSizes> <psdPath|nil> <psdBasename> </path/to/output/dir>)`.

## Setup

### Installation
Place Scipt-Fu file (`psd-rhythmic-guides.scm`) into the GIMP scripts directory (where all `*.scm` plugins are located) and run the following commands:

#### Linux

```sh
cp psd-rhythmic-guides.scm /usr/share/.gimp-2.x/scripts/

source generate-rhythmic-psd.sh 960 3x2 5 6 3 nil /path/to/output/dir/ filename.psd
```

#### Windows


```powershell
Copy-Item psd-rhythmic-guides.scm C:\Program Files\GIMP\share\gimp\2.x\scripts\

generate-rhythmic-psd.bat 960 3x2 5 6 3 nil # generates .psd into script's dir

```
---
### Visual guides

Generate visual guides in PSD document:
```sh
# for vertical guides only
gimp-console --no-interface --no-data --no-fonts --batch="(psd-rhythmic-guides 960 '(1 1) 10 9 1 nil \"/path/to/output/dir/\" \"psdname.psd\")" --batch="(gimp-quit 0)"

# for vertical AND horizontal guides
gimp-console --no-interface --no-data --no-fonts --batch="(psd-rhythmic-guides 960 '(1 1) 10 9 1 '((45 30) (40 60) (80 90)) \"/path/to/output/dir/\" "\psdname.psd\")" --batch="(gimp-quit 0)"
```
---

### Nginx

In order to run Script-Fu with __nginx__, you need to have nginx bundled with [Lua module][nginx-lua] (e.g., nginx-extras). Refer to [`nginx.conf`][nginx-conf] for configuration details. Currently, [Lua script][lua-script] handles URLs with the following parameters:

```conf
http://server.com/psd?w=960&r=3x2&b=12&c=9&g=2
# will generated .psd file with corresponding width, ratio, baseline, columns, gutter
```
---

## Troubleshooting

In __Windows__, if you get *'zlib1.dll error'*, you can fix it by copying `zlib1.dll` from `<gimp_dir>\bin\` to `<gimp_dir>\lib\gimp\2.0\plug-ins\`

----

If you have any problems with generating `.psd`, feel free to [post an issue](https://github.com/nazikus/rhythmic-grids/issues/new?title=Issue%20with%20generating%20PSD).

[psd-spec]: https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/ "PSD File Format Specification"
[Concordia Grid]: http://www.concordiagrid.com/ "Rhythmic grids"
[nginx-lua]: https://github.com/openresty/lua-nginx-module "Nginx Lua module"
[gimp-home]: https://www.gimp.org/ "Gimp Home"
[gimp-guides]: https://docs.gimp.org/2.6/en/gimp-concepts-image-guides.html "Gimp Docs"
[scheme-wiki]: https://en.wikipedia.org/wiki/Scheme_%28programming_language%29 "Wikipedia"
[lisp-wiki]: https://www.wikiwand.com/en/Lisp_(programming_language) "Wikipedia"
[tiny-home]: http://tinyscheme.sourceforge.net/ "TinyScheme SourceForge"
[scriptfu-script]: https://github.com/nazikus/rhythmic-grids/blob/master/Script-Fu/psd-rhythmic-guides.scm "psd-rhythmic-guides.scm"
[lua-script]: https://github.com/nazikus/rhythmic-grids/blob/master/Script-Fu/generate-rhythmic-psd.lua "generate-rhythmic-psd.lua"
[grid-js]: https://github.com/nazikus/rhythmic-grids/blob/master/JavaScript/RhythmicGridGenerator.js "RhythmicGridGenerator.js"
[grids-matlab]: https://github.com/nazikus/rhythmic-grids/blob/master/Matlab/GenerateRhythmicGrid.m "GenerateRhythmicGrid.m"
[nginx-conf]: https://github.com/nazikus/rhythmic-grids/blob/master/Script-Fu/nginx.conf "nginx.conf"

