const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('No version specified');
  process.exit(1);
}

const moduleJsonPath = path.join(__dirname, '../../module.json');

const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));

moduleJson.version = version;
moduleJson.manifest = `https://github.com/etoy22/elkan5e/releases/download/${version}//module.json`;
moduleJson.download = `https://github.com/etoy22/elkan5e/releases/download/${version}/module.zip`;

fs.writeFileSync(moduleJsonPath, JSON.stringify(moduleJson, null, 2));
console.log(`Updated module.json to version ${version}`);