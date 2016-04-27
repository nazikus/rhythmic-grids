:: eg: generate-rhythmic-psd.bat 960 3x2 5 6 3 nil
@echo off

SET GIMPDIR=d:\Images\PortableApps\GIMPPortable\App\gimp\bin
SET GIMP="%GIMPDIR%\gimp-console-2.8.exe"

SET WIDTH=%1
for /f "tokens=1,2 delims=x" %%a in ("%2") do set "RATIO_W=%%a" &set "RATIO_H=%%b"
SET BASELINE=%3
SET COLUMNS=%4
SET GUTTERX=%5
SET BLOCKS=%6

SET PSD_PATH=%~dp0
SET PSD_BASENAME=W%WIDTH%_R%RATIO_W%x%RATIO_H%_B%BASELINE%_C%COLUMNS%_G%GUTTERX%
:: skip the extension (.psd) in basename, added by Script-Fu

echo. & echo Generating '%PSD_PATH%%PSD_BASENAME%.psd' ...

%GIMP% -i -d -b "(rhythmic-guides %WIDTH% '(%RATIO_W% %RATIO_H%) %BASELINE% %COLUMNS% %GUTTERX% %BLOCKS% \"%PSD_PATH%\" \"%PSD_BASENAME%\")" -b "(gimp-quit 0)"

:::::::::::::::::::::::::::::::::::
::             DEBUG             ::
:::::::::::::::::::::::::::::::::::
:: %GIMP% -h
:: %GIMP% -i -d -b "(rhythmic-guides 960 '(3 2) 5 6 3 nil \"%PSD_PATH%\" \"testpsd\")" -b "(gimp-quit 0)"
:: pause