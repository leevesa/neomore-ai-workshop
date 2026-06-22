const fs = require('fs');
const { parse } = require('csv-parse');

const generateOrderCount = 500;
let data = {};
const dataKeys = {
    persons: {
        path: 'simple.cap.backend-Person.csv',
        done: false
    },
    plants: {
        path: 'simple.cap.backend-Plant.csv',
        done: false
    },
    workcenters: {
        path: 'simple.cap.backend-WorkCenter.csv',
        done: false
    },
    equipments: {
        path: 'simple.cap.backend-Equipment.csv',
        done: false
    },
    functionallocations: {
        path: 'simple.cap.backend-FunctionalLocation.csv',
        done: false
    },
    priorities: {
        path: 'simple.cap.backend-Priority.csv',
        done: false
    },
    workorders: {
        path: 'simple.cap.backend-WorkOrder.csv',
        done: false
    },
    operations: {
        path: 'simple.cap.backend-Operation.csv',
        done: false
    }
};

const words = 'Lorem ipsum dolor sit amet co nsectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');

const dataMap = {
    WorkOrders: {
        OrderId: {
            type: 'numeric-string',
            start: '1000000000'
        },
        Description: {
            type: 'random-string',
            source: 'words',
            words: 3
        },
        Workcenter: {
            type: 'helper-string',
            source: 'workcenters',
            key: 'WorkCenterId'   
        },
        Plant: {
            type: 'helper-string',
            source: 'plants',
            key: 'PlantId'   
        },
        Priority: {
            type: 'helper-string',
            source: 'priorities',
            key: 'PriorityId'   
        },
        StartDate: {
            type: 'date',
            format: 'yyyy-MM-dd'
        },
        FinishDate: {
            type: 'date',
            format: 'yyyy-MM-dd',
            laterThan: 'StartDate'
        },
        StartTime: {
            type: 'time',
            format: 'HH:mm:ss'    
        },
        FinishTime: {
            type: 'time',
            format: 'HH:mm:ss'
        },
        FunctLoc: {
            type: 'helper-string',
            source: 'functionallocations',
            key: 'FunctionalLocationId'
        },
        Equipment: {
            type: 'helper-string',
            source: 'equipments',
            key: 'EquipmentId'
        },
        NotifNo: {
            type: 'numeric-optional-string',
            start: '1000000000'
        },
        RespPerson: {
            type: 'helper-string',
            source: 'persons',
            key: 'PersonId'
        },
        Released: {
            type: 'boolean'
        },
        Completed: {
            type: 'boolean'
        }
    },
    Operations: {
        OrderId: {
            type: 'parent-string',
            from: 'OrderId'
        },
        Activity: {
            type: 'numeric-string',
            start: '10',
            stringLength: 4,
            addition: 10
        },
        Description: {
            type: 'random-string',
            source: 'words',
            words: 3
        },
        Plant: {
            type: 'parent-string',
            from: 'Plant'
        },
        WorkCenter: {
            type: 'parent-string',
            from: 'Workcenter'
        },
        Duration: {
            type: 'numeric-random-string'
        },
        DurationUnit: {
            type: 'string',
            values: ['H', 'D', 'W', 'M']
        },
        EarlSchedStartDate: {
            type: 'date'
        },
        EarlSchedStartTime: {
            type: 'time'
        },
        EarlSchedFinDate: {
            type: 'date',
            laterThan: 'EarlSchedStartDate'
        },
        EarlSchedFinTime: {
            type: 'time'
        }
    }
};

const allDone = () => {
    return Object.keys(dataKeys).every((key) => dataKeys[key].done);
};

const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
};

const nextStep = () => {
    const orders = [];
    for (let i = 0; i < generateOrderCount; i++) {
        orders.push(generateWorkOrder(i));
    }
    const operations = [];
    orders.forEach((order) => {
        for (let i = 0; i < getRandomInt(10); i++) {
            operations.push(generateOperation(order, i));
        }
    });
    let orderData = data.workorders.keys.join(';') + '\n';
    orders.forEach((order) => {
        orderData += Object.keys(order).map((key) => order[key]).join(';') + '\n';
    });
    writeFile(dataKeys.workorders.path, orderData);
    let operationData = data.operations.keys.join(';') + '\n';
    operations.forEach((operation) => {
        operationData += Object.keys(operation).map((key) => operation[key]).join(';') + '\n';
    });
    writeFile(dataKeys.operations.path, operationData);
};

const writeFile = (fileName, data) => {
    fs.writeFile(`../db/data/${fileName}`, data, (err) => {
        if (err) {
            console.log(err);
        }
    });
};

const generateWorkOrder = (index) => {
    let workOrder = {};
    data.workorders.keys.forEach((key) => {
        workOrder[key] = getValue(dataMap.WorkOrders, key, workOrder, index);
    });
    return workOrder;
};

const generateOperation = (order, index) => {
    let operation = {};
    data.operations.keys.forEach((key) => {
        operation[key] = getValue(dataMap.Operations, key, operation, index, order);
    });
    return operation;
};

const getValue = (oDataMap, key, oItem, index, oParent) => {
    let value = '';
    switch(oDataMap[key].type) {
        case 'parent-string':
            value = oParent[oDataMap[key].from];
            break;
        case 'string':
            value = oDataMap[key].values[getRandomInt(oDataMap[key].values.length)];
            break;
        case 'numeric-string':
            let add = (oDataMap[key].addition ? oDataMap[key].addition : 1) * index;
            value = (parseInt(oDataMap[key].start) + add).toString();
            if (oDataMap[key].stringLength) {
                value = value.padStart(oDataMap[key].stringLength, '0');
            }
            break;
        case 'numeric-random-string':
            value = getRandomInt(100).toString();
            break;
        case 'random-string':
            // Get random words from words array and join them together with a space and capitalize the first letter of fist word
            let randomWordStart = getRandomInt(words.length - oDataMap[key].words);
            value = words.slice(randomWordStart, randomWordStart + oDataMap[key].words).join(' ').replace(/^\w/, c => c.toUpperCase());
            break;
        case 'numeric-optional-string':
            value = getRandomInt(2) === 0 ? '' : (parseInt(oDataMap[key].start) + index).toString();
            break;
        case 'boolean':
            value = getRandomInt(2) === 0 ? true : false;
            break;
        case 'date':
            let date = new Date();
            date.setDate(date.getDate() + getRandomInt(30));
            value = date.toISOString().split('T')[0];
            if (oDataMap[key].laterThan && oItem[oDataMap[key].laterThan] > value) {
                date.setDate(date.getDate() + 30);
                value = date.toISOString().split('T')[0];
            }
            break;
        case 'time':
            let time = new Date();
            time.setHours(time.getHours() + getRandomInt(24));
            value = time.toISOString().split('T')[1].split('.')[0];
            break;
        case 'helper-string':
            if (oDataMap[key].match) {
                data[oDataMap[key].source].data.some((dataItem) => {
                    if (dataItem[oDataMap[key].key] === oItem[oDataMap[key].match]) {
                        value = dataItem[oDataMap[key].description];
                        return true;
                    }
                });
            } else {
                value = data[oDataMap[key].source].data[getRandomInt(data[oDataMap[key].source].data.length)][oDataMap[key].key];
            }
            break;
    }
    return value
};

const readCSVData = (path, dataKey) => {
    fs.createReadStream(path)
        .pipe(parse({ delimiter: ';', from_line: 1 }))
        .on('data', (row) => {
            if (!data[dataKey]) {
                data[dataKey] = {};
                data[dataKey].keys = row;
                data[dataKey].data = [];
            } else {
                const newData = {};
                row.forEach((value, index) => {
                    newData[data[dataKey].keys[index]] = value;
                });
                data[dataKey].data.push(newData);
            }
        })
        .on('end', () => {
            dataKeys[dataKey].done = true;
            if (allDone()) {
                nextStep();
            }
        });
};

Object.keys(dataKeys).forEach(async (key) => {
    await readCSVData(`../db/data/${dataKeys[key].path}`, key);
});
