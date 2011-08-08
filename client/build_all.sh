#!/bin/bash

NAME="nodegame-all"
VERSION="0.3"

BUILD="./build/"$VERSION"/"
EXT=".js"
MIN="-min"

NODEGAME=$BUILD$NAME"-"$VERSION$EXT
NODEGAMEMIN=$BUILD$NAME$MIN"-"$VERSION$EXT

DATE=`eval date` #+%Y%m%d`
AUTHOR="Copyright 2011, Stefano Balietti"

# Custom Funcs

function addBlanks {
	
	COUNT=$1
 	FILE=$2
	
	while [ $COUNT -gt 0 ]; do
		echo " " >> $FILE
		let COUNT=COUNT-1
	done 
}


# Produce partial builds

./build_client.sh $VERSION
./build_window.sh $VERSION
./build_gadgets.sh $VERSION

# Init the file

echo "/*!" > $NODEGAME
echo " * nodeGame-all v$VERSION" >> $NODEGAME
echo " * http://nodegame.org" >> $NODEGAME
echo " *" >> $NODEGAME
echo " *" $AUTHOR >> $NODEGAME
echo " *" >> $NODEGAME
echo " * Built on" $DATE >> $NODEGAME
echo " *" >> $NODEGAME
echo " */" >> $NODEGAME
addBlanks 2 $NODEGAME



# Add all the classes

FILES=$BUILD"*"

for f in $FILES	; do

	if [ -f "$f" ]
	then
		if [ ${f##*.} == "js" ]
			then
				if [ $f != $NODEGAME ]
				then
					echo "Processing $f file..."
					`cat $f >> $NODEGAME`
					addBlanks 4 $NODEGAME
				fi
			fi
		fi
done

`chmod +x $NODEGAME`

echo $NODEGAME built correctly.

# Producing a minified version as well
# exec yui $NODEGAME -o $NODEGAMEMIN   --charset=utf-8

