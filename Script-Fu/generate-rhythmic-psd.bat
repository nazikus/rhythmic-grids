@echo off

SET WIDTH=960
SET RATIO_W=3
SET RATIO_H=2
SET BASELINE=5
SET COLUMNS=6
SET GUTTERX=3

SET PSD_PATH=%CD%\
SET PSD_BASENAME=W%WIDTH%_R%RATIO_W%x%RATIO_H%_C%COLUMNS%_G%GUTTERX%
:: skip the extension (.psd) in basename

SET GIMPDIR=d:\Images\.Media\GIMPPortable\App\gimp\bin
SET GIMP="%GIMPDIR%\gimp-console-2.8.exe"

:: %GIMP% -h
echo. & echo Generating %PSD_PATH%%PSD_BASENAME%.psd ... & echo.
%GIMP% -i -b "(rhythmic-guides 960 '(3 2) 5 6 3)" -b "(gimp-quit 0)"
:: %GIMP% -i -b "(rhythmic-guides %WIDTH% '(%RATIO_W% %RATIO_H%) %BASELINE% %COLUMNS% %GUTTERX% nil %PSD_PATH% %PSD_BASENAME%)" -b "(gimp-quit 0)"

:: pause