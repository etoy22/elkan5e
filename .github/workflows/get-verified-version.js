const fs = require('fs');

const moduleJson = JSON.parse(fs.readFileSync('module.json', 'utf8'));
console.log(moduleJson.verifiedVersion || '12.331');
