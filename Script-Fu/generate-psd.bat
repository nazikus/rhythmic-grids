:: eg: generate-rhythmic-psd.bat 960 3x2 5 6 3 nil
@echo off

:: SET GIMPDIR=d:\Images\PortableApps\GIMPPortable\App\gimp\bin
SET GIMPDIR=c:\Program Files\GIMP 2\bin
SET GIMP="%GIMPDIR%\gimp-console-2.8.exe"

SET WIDTH=%1
for /f "tokens=1,2 delims=x" %%a in ("%2") do set "RATIO_W=%%a" &set "RATIO_H=%%b"
SET BASELINE=%3
SET COLUMNS=%4
SET GUTTERX=%5
SET BLOCKS=%6

SET PSD_PATH=%~dp0
SET PSD_FILENAME=W%WIDTH%_R%RATIO_W%x%RATIO_H%_B%BASELINE%_C%COLUMNS%_G%GUTTERX%

echo. & echo Generating '%PSD_PATH%%PSD_FILENAME%.psd' ...

%GIMP% -i -d -b "(psd-rhythmic-guides %WIDTH% '(%RATIO_W% %RATIO_H%) %BASELINE% %COLUMNS% %GUTTERX% %BLOCKS% \"%PSD_PATH%\" \"%PSD_FILENAME%\")" -b "(gimp-quit 0)"

:::::::::::::::::::::::::::::::::::
::             DEBUG             ::
:::::::::::::::::::::::::::::::::::
:: %GIMP% -h
:: %GIMP% -i -d -b "(psd-rhythmic-guides 960 '(3 2) 5 6 3 nil \"D:\\\" \"testpsd.psd\")" -b "(gimp-quit 0)"
:: pause
