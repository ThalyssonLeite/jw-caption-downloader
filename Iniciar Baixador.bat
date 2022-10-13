cd %cd%/frontend
start "" index.html

cd %cd%/../backend
taskkill /im node.exe /F
node ./node_modules/pm2/bin/pm2 start -f app.js --watch
