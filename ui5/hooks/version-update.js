// Constants
const fs = require('fs');
const yaml = require('js-yaml');
const manifestJson = './webapp/manifest.json';
const mtaYaml = './mta.yaml';

// Get version to update from the arguments
let updateVersion = process.env.npm_config_updateVersion;
if (!updateVersion || (updateVersion !== 'patch' && updateVersion !== 'minor' && updateVersion !== 'major')) {
    // Default to patch if argument not defined or not valid
    updateVersion = 'patch';
}
console.log(`Updating ${updateVersion.toUpperCase()} version of the application`);


// Load manifest.json version
let rawData = fs.readFileSync(manifestJson);
let json = JSON.parse(rawData);

// Create new version number
let version = json['sap.app'] && json['sap.app']['applicationVersion'] ? json['sap.app']['applicationVersion']['version'] : '1.0.0';
console.log(`Version before update is ${version}`);
let versionParts = version.split('.');
switch (updateVersion) {
    case 'patch':
        versionParts[2] = Number(versionParts[2]) +1;
        break;
    case 'minor':
        versionParts[1] = Number(versionParts[1]) +1;
        versionParts[2] = 0;
        break;
    case 'major':
        versionParts[0] = Number(versionParts[0]) +1;
        versionParts[1] = 0;
        versionParts[2] = 0;
        break;
}
let newVersion = versionParts.join('.');

// Update manifest.json version
json['sap.app']['applicationVersion']['version'] = newVersion;
fs.writeFileSync(manifestJson, JSON.stringify(json, null, 4));
console.log(`manifest.json version after update is ${newVersion}`);

// Load and update mta.yaml
let rawYaml = fs.readFileSync(mtaYaml);
let yamlData = yaml.load(rawYaml);
yamlData.version = newVersion;
let yamlUpdated = yaml.dump(yamlData);
fs.writeFileSync(mtaYaml, yamlUpdated);
console.log(`mta.yaml version updated to  ${newVersion}`);

console.log(`Version update finished successfully.`);
console.info(`Run npm run build:mta before running ctms-upload.`);