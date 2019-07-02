//#region imports
//user input
const readline = require('readline-sync');

//file imports
record = require('./record.js');
Person = require('./person.js').Person;
createPeopleObject = require('./person.js').createPeopleObject;
//#endregion

//#region logging
var log4js = require('log4js');

log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: './logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});

const logger = log4js.getLogger('./logs/debug.log');
//#endregion

//#region input and reading
function getInput(people){
    //return [Name] or All
    console.log("1) List All")
    console.log("2) List [Account Name]")

    var input = readline.prompt();
    logger.debug('User input: ' + input);
    input = input.split(" ");

    var command = input.shift();
    var name = input.reduce(function(value, accumulator){ return value + " " + accumulator;});

    if(command === "List"){
        if (people.hasOwnProperty(name) || name === "All"){
            return name;
        }
        else{
            logger.debug('Inputted name is not in records');
            console.log("That person is not in our records. Try Again \n");
            return getInput();
        }
    }

    else{
        logger.debug('Unsupported command');
        console.log("Invalid command. Try again \n");
        return getInput();
    }
}

function readCSV(csvString){
    try{
        csvString = String(csvString);
        let lines = csvString.split('\n');
        let recordArray = record.createRecordArrayFromCSV(lines); 
        return recordArray;
    }  
    catch(err) {
        console.log('Error parsing CSV string:', err)
        logger.error('Error parsing CSV string:', err)
    }
    
}

function readJSON(jsonString){
    try{
        let jsonArray = JSON.parse(jsonString);
        let recordArray = record.createRecordArrayFromJson(jsonArray);
        return recordArray;
    }  
    catch(err) {
        console.log('Error parsing JSON string:', err)
        logger.error('Error parsing JSON string:', err)
    }
}

function readXML(xmlString){
    const translator = {
        "Date": "attributes.Date",
        "Narration": "Description._text",
        "From": "Parties.From._text",
        "To": "Parties.To._text",
        "Amount": "Value._text"
    };
    
    try{
        let convert = require('xml-js');
        let jsonString = convert.xml2json(xmlString, {compact: true, spaces: 4});
        
        let jsonArray = JSON.parse(jsonString);
        jsonArray = jsonArray.TransactionList.SupportTransaction;

        const propNames = Object.keys(translator);

        let jsonModelArray = new Array();

        for(let i = 0; i < jsonArray.length; i++){
            let jsonRecord = jsonArray[i];
            let jsonModelRecord = new Object();

            for(let j = 0; j < propNames.length; j ++){
                let propertyInModel = propNames[j];
                let propertyInXml = translator[propertyInModel];
                let x = [jsonRecord].concat(propertyInXml.split('.'));
                let value = x.reduce(function(a, b) { return a[b] })
                jsonModelRecord[propertyInModel] = value;

            }

            jsonModelArray.push(jsonModelRecord);
        }

        return readJSON(jsonString);
    }
    catch(err) {
        console.log('Error parsing XML :', err)
        logger.error('Error parsing XML :', err)
    }    
}

function readFile(path){
    const fs = require('fs');
    logger.debug('Trying to read from ' + path)
    let recordArray;

    fs.readFile(path, (err, text) => {
        if (err) {
            console.log("File read failed:", err);
            logger.error('File read failed', err)
            return;
        }

        if(path.match("/*.json")){
            recordArray = readJSON(text);
            main(recordArray);
        }
        else if(path.match("/*.csv")){
            recordArray = readCSV(text);
            main(recordArray);
        }
        else if(path.match("/*.xml")){
            recordArray = readXML(text);
            main(recordArray);
        }
        else{
            console.log('Unsupported filetype');
            logger.error('Unsupported filetype');
            return;
        }

    })

}
//#endregion

//main
function main(recordArray){
    let people = createPeopleObject(recordArray);
    
    while(true){
        var secondOption = getInput(people);
        var name, person;

        if(secondOption === "All"){
            var nameArray = Object.keys(people).sort();

            for(var i = 0; i < nameArray.length; i++){
                name = nameArray[i];
                person = people[name];
                person.displayBalance();
            }
        }
        else{
            var name = secondOption;
            var person = new Person(recordArray, name);

            person.displayTransactions();
        }
    }
}

logger.debug('Program launched');
readFile("./Transactions2012.xml")
