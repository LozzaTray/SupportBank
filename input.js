//user input
const readline = require('readline-sync');
const logger = require("./logger.js").logger;
const DataFormatter = require("./dataConversion").DataFormatter;
const writeFile = require("./output.js").writeFile;

exports.getInput = function(people, recordArray){
    //return [Name] or All
    console.log("1) List All");
    console.log("2) List [Account Name]");
    console.log("3) Export [Filename]");

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
            return exports.getInput(people, recordArray);
        }
    }
    else if(command === "Export"){
        writeFile(name, recordArray);
        console.log("File saved");
        return exports.getInput();
    }
    else{
        logger.debug('Unsupported command');
        console.log("Invalid command. Try again \n");
        return exports.getInput(people, recordArray);
    }
}

exports.createRecordArray = function(path){
    const fs = require('fs');
    console.log("Reading from " + path)
    logger.debug('Trying to read from ' + path)
    let text;

    try{
        text = fs.readFileSync(path);
    }
    catch (err) {
        logger.error('File read failed', err)
        throw err;
    }

    try{
        if(path.match("/*.json")){
            return DataFormatter.createRecordArrayFromJson(text);
        }
        else if(path.match("/*.csv")){
            return DataFormatter.createRecordArrayFromCsv(text);
        }
        else if(path.match("/*.xml")){
            return DataFormatter.createRecordArrayFromXml(text);
        }
        else{
            let message = 'Unsupported filetype';
            logger.error(message);
            throw message;
        }
    }
    catch(err){
        logger.error("Error while converting to domain model", err);
        throw err;
    }
}