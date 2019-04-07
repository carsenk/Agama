#!/bin/bash
# Script to build gui for Agama App

[ -d ${WORKSPACE}/gui/EasyDEX-GUI ] && cd ${WORKSPACE}/gui/EasyDEX-GUI
[ -d ../gui/EasyDEX-GUI ] && cd ../gui/EasyDEX-GUI
[ -d gui/EasyDEX-GUI ] && cd gui/EasyDEX-GUI

echo "Building Agama-GUI"
echo "Actual directory is: ${PWD}"

echo "Checkout to master branch."
git checkout master
git pull origin master

[ -d react ] && cd react || echo "!!! I can't find react"
echo "Actual directory is: ${PWD}"
echo "Installing nodejs modules."
npm install 
npm install webpack

echo "Building Agama-GUI app."
npm run build 
echo "Agama-GUI is built!"
