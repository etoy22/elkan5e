@echo off
echo Checking for dependencies...
IF NOT EXIST node_modules (
    echo Installing dependencies...
    npm install
) ELSE (
    echo Dependencies already installed.
)

echo Running pack...
call npm run pack

pause
