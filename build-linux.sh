#!/bin/bash
# example ./build-linux.sh 0.2.42

rm -rf build

[ -z $1 ] && echo "AGAMA_VERSION variable is not set." && exit 0
[ ! -d build ] && mkdir build

echo
echo "Build script for Iguana application for Linux x64 platform."
echo "Preparing electron package $1"

npm run make-patch
electron-packager . --platform=linux --arch=x64 \
  --icon=assets/icons/agama_icons/128x128.png \
  --out=build/ \
  --buildVersion=$1 \
  --ignore=assets/bin/win64 \
  --ignore=assets/bin/osx \
  --ignore=react/node_modules \
  --ignore=react/src \
  --ignore=react/www \
  --overwrite
cd build/Agama-linux-x64/resources/app
rm -rf gui
unzip -o patch.zip
rm patch.zip
cd ../../../
zip -r Agama-linux-x64 Agama-linux-x64
mv Agama-linux-x64.zip Agama-linux-x64-v$1.zip