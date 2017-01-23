#!/bin/bash
# eg: . generate-rhythmic-psd.sh 960 3x2 5 6 3 nil /home/user/temp/

# GIMP_DIR=/usr/bin
GIMP=gimp-console-2.8

IFS='x', read -a ratio <<< "$2"

WIDTH=$1
RATIO_W=${ratio[0]}
RATIO_H=${ratio[1]}
BASELINE=$3
COLUMNS=$4
GUTTERX=$5
BLOCKS=$6

PSD_DIR=$7
PSD_FILENAME="W${WIDTH}_R${RATIO_W}x${RATIO_H}_B${BASELINE}_C${COLUMNS}_G${GUTTERX}.psd"
# skip the extension (.psd) in basename, added by Script-Fu later

echo Generating "$PSD_DIR/$PSD_FILENAME"...

$GIMP -i -d -b "(psd-rhythmic-guides ${WIDTH} '(${RATIO_W} ${RATIO_H}) ${BASELINE} ${COLUMNS} ${GUTTERX} ${BLOCKS} \"${PSD_DIR}/\" \"${PSD_FILENAME}\")" -b "(gimp-quit 0)"


##### DEBUGGING #####
# $GIMP -h
# $GIMP -i -d -b "(rhythmic-guides 960 '(3 2) 5 6 3 nil \"/home/user/temp/\" \"testpsd.psd\")" -b "(gimp-quit 0)"
