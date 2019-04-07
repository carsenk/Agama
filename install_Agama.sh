#!/bin/bash
agamamatch=`expr match "$(pwd)" '.*\([Aa]gama\)'`
if [[ -z $agamamatch ]]
	#This IS NOT INTENDED to be run in any other submodule
then
    git clone --recursive https://github.com/komodoplatform/Agama
    cd Agama
fi
git checkout dev
git pull upstream dev

npm install
npm install webpack@3.0.0 webpack-cli@3.0.0
./binary_artifacts.sh

cd gui
if [[ -d EasyDEX-GUI ]]
then
	echo The EasyDEX-GUI dir already existed
	cd EasyDEX-GUI/react
  git pull upstream dev
else
	git clone https://github.com/komodoplatform/EasyDEX-GUI
	cd EasyDEX-GUI/react
fi
echo edex en:
git checkout dev
git pull upstream dev
sudo /usr/local/bin/node /usr/local/bin/npm install -g electron-packager
npm install electron
npm install
cd src
npm install
cd ../../../../
#Detect OS and run the adequate builder
os=${OSTYPE//[0-9.-]*/}

case "$os" in
  darwin)
    echo "I'm a Mac. ¿Do I need to run more steps?."
    ;;

  msys)
    echo "I'm Windows using git bash. ¿Do I need to run more steps?.";
	;;
  linux)
    echo "Building on Linux"
	./build-linux.sh $(python buildscripts/devversion.py version)
	;;
  *)

  echo "Unknown Operating system $OSTYPE"
  exit 1
esac
