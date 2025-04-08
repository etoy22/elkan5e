const fs = require('fs');

const moduleJson = JSON.parse(fs.readFileSync('module.json', 'utf8'));
console.log(moduleJson.systemVersion || '12.0');
