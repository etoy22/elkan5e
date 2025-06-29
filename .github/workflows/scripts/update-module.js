import fs from 'fs';

function updateModuleJson(version, compatibility) {
  const filePath = 'module.json';
  const moduleJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  moduleJson.version = version;

  if (!moduleJson.compatibility) moduleJson.compatibility = {};

  moduleJson.compatibility.minimum = compatibility.minimum;
  moduleJson.compatibility.verified = compatibility.verified;

  if (compatibility.maximum !== null && compatibility.maximum !== undefined) {
    moduleJson.compatibility.maximum = compatibility.maximum;
  } else if ('maximum' in moduleJson.compatibility) {
    delete moduleJson.compatibility.maximum;
  }

  fs.writeFileSync(filePath, JSON.stringify(moduleJson, null, 2), 'utf8');
  console.log(`Updated module.json with version ${version} and compatibility.`);
}

const version = process.argv[2];
const compatibility = {
  minimum: process.argv[3],
  verified: process.argv[4],
  maximum: process.argv[5] === 'null' ? null : process.argv[5],
};

updateModuleJson(version, compatibility);
