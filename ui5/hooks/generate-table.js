/**
 * Table generator script
 * Utility script to generate a Table fragment file with the given parameters.
 * 
 * Minimum required parameters:
 * 1. Fragment file name
 *  - -n or --name
 *  - Default path used: ./webapp/view/fragment
 *  - You can generate the fragment file also to sub directories, just make sure the path exists. For example passing "-n 'subdirectory/FragmentName'" will create the file in ./webapp/view/fragment/subdirectory/FragmentName.fragment.xml
 * 2. ID for the Table
 *  - -i or --id
 * 3. Columns to be added to the Table
 *  - -c or --columns
 *  - Comma separated columns to be added to the Table. For example: "-c 'Column1,Column2,Column3'"
 * 
 * Optional parameters:
 * 1. Model name to be used in the Table
 *  - -m or --model
 *  - Default value: 'ModelName'
 * 
 * Run in the command line:
 * node hooks/generate-table.js -n '{name for the fragment file}' -i '{id of the Table}' -c '{columns to be added to the Table, comma separated}' -m '{model name to be used in the Table}'
 */

const fs = require('node:fs');
const { program } = require('commander');
const FILE_PATH = './webapp/view/fragment';

program.version('0.0.1');
program.option('-n, --name [name]', 'Fragment file name that will be created');
program.option('-i, --id [id]', 'ID for the table');
program.option('-c, --columns [columns]', 'Comma separated columns to be added to the Table');
program.option('-m, --model [model]', 'Model name to be used in the Table');

program.parse(process.argv);
const options = program.opts();
const fileName = options.name;
const tableId = options.id;
const columns = options.columns ? options.columns.split(',') : [];
const modelName = options.model || 'ModelName';

if (!fileName) {
    console.error('Please provide the name of the fragment file');
    process.exit(1);
}

if (!tableId) {
    console.error('Please provide the ID for the Table');
    process.exit(1);
}

if (columns.length === 0) {
    console.error('Please provide the columns to be added to the Table');
    process.exit(1);
}

const filePath = `${FILE_PATH}/${fileName}.fragment.xml`;
console.log(`Generation of ${filePath} started`);

let fragmentContent = `
<c:FragmentDefinition
	xmlns="sap.m"
	xmlns:c="sap.ui.core"
    xmlns:control="fi.neomore.template.control">
    <control:Table
        id="${tableId}"
        items="{
            path: '${modelName}>/Items',
            templateShareable: false
        }"
        title=""
        showTotalCount="false"
        showPersonalization="false"
        showMultiSorting="false"
        showSorting="false"
        showSearch="false"
        showFilteringInfo="false"
        useLiveSearch="false"
        customHeaderContentPosition="Right"> 
        <control:customHeaderContent>
        </control:customHeaderContent>
        <control:columns>
            ${columns.map((sColumn) => {
                return `<control:Column
                id="${tableId}${sColumn}Column"
                sortKey="${sColumn}"
                searchKey="${sColumn}">
                <Label text="{i18n>${tableId.toUpperCase()}_${sColumn.toUpperCase()}_LABEL}" />
            </control:Column>
            `;
            }).join('').trim()}
        </control:columns>
        <control:items>
            <ColumnListItem>
                ${columns.map((sColumn) => {
                    return `<Text text="{${modelName}>${sColumn}}" />
                `;
                }).join('').trim()}
            </ColumnListItem>
        </control:items>
    </control:Table>
</c:FragmentDefinition>
`.trim();

fs.writeFile(filePath, fragmentContent, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('Fragment file created successfully');
});