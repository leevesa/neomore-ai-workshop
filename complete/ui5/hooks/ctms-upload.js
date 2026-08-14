/**
 * Upload Multi-Target Application to
 * Cloud Transport Management
 * 
 * Run in the command line:
 * node hooks/ctms-upload.js -d '{description of transport}' 
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { program } = require('commander');

// Load ctms-settings.json
const rawSettings = fs.readFileSync('./hooks/ctms-settings.json');
const jsonSettings = JSON.parse(rawSettings);
if (jsonSettings &&
    jsonSettings.clientId && 
    jsonSettings.clientSecret &&
    jsonSettings.tmUrl &&
    jsonSettings.tokenUrl &&
    jsonSettings.targetNode &&
    jsonSettings.mtarPath &&
    jsonSettings.owner) {
    program.version('0.0.1');
    program.option('-d, --description [description]', 'Transport Description');

    program.parse(process.argv);
    const options = program.opts();
    const clientId = jsonSettings.clientId;
    const clientSecret = jsonSettings.clientSecret;
    const transportDescription = options.description || (`Export/upload of app From NodeJS ${new Date()}`);
    const transportOwner = jsonSettings.owner || '';
    console.log(`Parameters: clientid and clientsecret hidden - ${transportOwner} - ${transportDescription}`);

    var tmUrl = jsonSettings.tmUrl;
    var targetNode = jsonSettings.targetNode;
    var filePath = jsonSettings.mtarPath;

    var getToken = async function() {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('response_type', 'token');
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        return await axios.post(jsonSettings.tokenUrl, params, config);
    };

    var uploadFile = async function(accessToken) {
        var data = new FormData();
        data.append('file', fs.createReadStream(filePath));

        var config = {
            method: 'post',
            url: tmUrl + '/v2/files/upload',
            headers: { 
                'Authorization': 'Bearer ' + accessToken, 
                'DataServiceVersion': '"2.0"',  
                ...data.getHeaders()
            },
            data : data
        };

        return axios(config);
    };

    var uploadToNode = async function(accessToken, fileId){
        var data = JSON.stringify({
            "nodeName": targetNode,
            "contentType": "MTA",
            "storageType": "FILE",
            "entries": [
                {
                "uri": fileId
                }
            ],
            "description": transportDescription,
            "namedUser": transportOwner
        });

        var config = {
            method: 'post',
            url: tmUrl + '/v2/nodes/upload',
            headers: { 
                'Authorization': 'Bearer ' + accessToken, 
                'Content-Type': 'application/json'
            },
            data : data
        };

        return axios(config)
            .then(function (response) {
                console.log('Uploaded to ' + targetNode + ' successfully.');
            })
            .catch(function (error) {
                console.log(error.response.data.message);
            });

    };

    getToken().then(function(response) {
        console.log('Access token fetched successfully.');
        var accessToken = response.data.access_token;
        uploadFile(accessToken).then(function(response) {
            console.log('File uploaded successfully');
            var fileId = response.data.fileId;
            uploadToNode(accessToken, fileId);        
        }).catch(function(error) {
            console.log(error);
        });
    }).catch(function(error) {
        console.log(error);
    });
} else {
    console.error('Missing/incomplete CTMS settings file!');
}