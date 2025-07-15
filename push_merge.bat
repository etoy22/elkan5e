@echo off
echo Checking for dependencies...
IF NOT EXIST node_modules (
    echo Installing dependencies...
    npm install
) ELSE (
    echo Dependencies already installed.
)

echo Running unpack...
call npm run unpack

echo Running remove...
call npm run remove

pause
