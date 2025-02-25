let fs = require('fs');
let changelog = fs.readFileSync('./CHANGELOG.md', 'utf8');
let releaseNotes = changelog.split('\n').slice(2).join('\n').split(/^# v/)[1].split('\n').slice(1).join('\n');
console.log(releaseNotes);
