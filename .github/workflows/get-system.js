let fs = require('fs');
let moduleData = JSON.parse(fs.readFileSync('./module.json', 'utf8'));
console.log(moduleData.relationships.systems[0].compatibility.verified);
