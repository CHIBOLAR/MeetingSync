@echo off
echo Building frontend...
cd static\meeting-app
call npm run build
echo Fixing case sensitivity...
cd build
if exist Index.html (
    move Index.html index.html
    echo Fixed Index.html -> index.html
)
cd ..\..\..
echo Build complete!
