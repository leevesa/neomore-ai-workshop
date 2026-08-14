const replace = require('replace');
const { program } = require('commander');

program.version('0.0.1');
program.option('-s, --source [source]', 'Project id to change from (fi.neomore.template)');
program.requiredOption('-t, --target [target]', 'Project id to change to (com.example.pp.app)');
program.parse(process.argv);

const options = program.opts();
if (!options.source) {
    options.source = 'fi.neomore.template';
}

const oRegex = {
    dash: options.source.split('.').join('-'),
    join: options.source.split('.').join(''),
    slash: options.source.split('.').join('/'),
    dot: options.source
};

const oReplacement = {
    dash: options.target.split('.').join('-'),
    join: options.target.split('.').join(''),
    slash: options.target.split('.').join('/'),
    dot: options.target
};

const aPaths = [
    './webapp/',
    './mta.yaml',
    './ui5.yaml',
    './ui5-deploy.yaml',
    './ui5-local.yaml',
    './ui5-localhost.yaml',
    './ui5-mockserver.yaml',
    './package.json',
    './xs-app.json',
    './xs-security.json',
    './karma.conf.js'
];

const aKeys = Object.keys(oRegex);

aKeys.map((sKey) => {
    replace({
        regex: oRegex[sKey],
        replacement: oReplacement[sKey],
        paths: aPaths,
        recursive: true,
        silent: false
    });
});

console.log('Project initialized.');