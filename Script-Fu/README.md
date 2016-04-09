Script-Fu is a [Scheme](https://en.wikipedia.org/wiki/Scheme_%28programming_language%29)-based  scripting language (Lisp dialect) embeded into GIMP for automation purposes. It can be used for scripting image processing procedures via command line and GIMP in non-interactive (e.g. to generate .psd files on server-side), which is not possible with Photoshop CC 2015 and prior. Scheme scripts are launched in [TinyScheme](http://tinyscheme.sourceforge.net/) interpreter embeded into GIMP.

Current Script-Fu script generates [PSD](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/) files with a single layer, an empty canvas, and with horizontal/vertical [guides](https://docs.gimp.org/2.6/en/gimp-concepts-image-guides.html) of specifed rhythmic grid.  *Rhythimic Grid* generator (JavaScript or Octave/Matlab implementation) is used to obtain grid parameters.

Place Scipt-Fu file (`rhythmic-guides.scm`) into GIMP scripts directory `~/.gimp-2.4/scripts/`.

Shell command example:
`gimp -i -b "(rhythmic-guides 500 8 5 16 '((45 30) (40 60) (80 90)) )" -b "(gimp-quit 0)"`

---

In Windows, if you get *zlib1.dll error*, you can fix it by copying `zlib1.dll` from `<gimp_dir>\bin\` to `<gimp_dir>\lib\gimp\2.0\plug-ins\`