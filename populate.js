#!/usr/bin/env node

// DATABASE INFO
const uri = 'bolt://localhost:7687';
const user = 'neo4j';
const pass = '';

// Import for handling Files
const fs = require('fs');
// Import for neo4j driver
const neo4j = require('neo4j-driver'); // ONLY PACKAGE REQUIRED TO INSTALL
// Import for prompting user
const readline = require('readline');

// Pipeline for prompting user
const cli = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// function to fetch CSV file
function getData() {
    // Create a promise which will resolve with formatted data, or reject with an error
    return new Promise((resolve, reject) => {
        cli.question('Please enter the filepath of your import csv: ', (filePath) => {     
            // Check to make sure the user provided a '.csv' file
            if (!filePath.endsWith('.csv')) {
                reject(new Error('The file must be a csv file'));
            }

            try {
                let data = fs.readFileSync(filePath, { encoding: 'utf-8' }).trim();
                let rows = data.split('\n');
                const concepts = rows.shift().split(',');
                resolve([concepts, rows]);
            } catch (e) {
                reject(e);
            }
        });
    });
}


// function to create nodes from the concepts we have
async function createNodes(concepts, session) {
    let errors = 0;
    // For each concepts
    for (const concept of concepts) {
        // Check for the top left value we want to ignore in our matrix
        if (concept == 'concepts') continue;
        try {
            // Create a Concept node with the name property being the concept name
            const result = await session.run(
                'CREATE (a:Concept {name: $name}) RETURN a',
                { name: concept }
            )
            console.log(`Created ${concept} node`);
        } catch (e) {
            console.error(e);
            console.error(`Couldn't create ${concept} node`);
            errors++;
        }
    }
    return errors;
}

// Create the edges for our nodes
async function createEdges(concepts, rows, session) {
    let errors = 0;
    // For each row
    for (i in rows) {
        // Split the row and iterate over each value
        let data = rows[i].split(',');
        for (j in data) {
            // Skip the first column (As they're duplicate keys in a symmetrical matrix)
            if (j === 0) continue;

            try {
                // Match the two nodes to be connected, and create the Distance edge between them
                const result = await session.run(
                    `MATCH  
                        (c1:Concept {name: $conceptName1}), 
                        (c2:Concept {name: $conceptName2}) 
                    CREATE (c1)-[r:Distance {distance: $distance}]->(c2) 
                    return r`,
                    { conceptName1: concepts[i], conceptName2: concepts[j], distance: data[j] }
                )
                console.log(`Created "(${concepts[i]})--[${data[j]}]-->(${concepts[j]})"`);
            } catch (e) {
                console.error(e);
                console.error(`Failed to create "(${concepts[i]})--[${data[j]}-->(${concepts[j]})"`);
                errors++;
            }
        }
    }
    return errors;
}

// Function to clear the database
async function clearDB(session) {
     try {
        const result = await session.run(
            'MATCH (e) DETACH DELETE e'
        );
         return 0;
        console.log('Cleared database');
    } catch (e) {
        console.error(e);
        return 1;
    }   
}

// Main function that handles the import
async function main() {
    // Error flag for user
    let errorFlag = 0;

    // Get our data
    try {
        const [concepts, rows] = await getData();

        // Setup our connection
        const driver = neo4j.driver(uri, neo4j.auth.basic(user, pass));
        const session = await driver.session();

        // Clear database
        if (await clearDB(session) === 0) {
            console.log('Cleared database successfully');
        } else {
            console.error('Failed to clear database successfully');
            errorFlag = errorFlag + 1;
        }

        // Populating our database 
        // Create nodes from concepts
        errorFlag = errorFlag + await createNodes(concepts, session);
        // Create edges
        errorFlag = errorFlag + await createEdges(concepts, rows, session);

        // Alert the user we've finished importing their data
        console.log(`Finished importing data with ${errorFlag} errors.`);

        // Close the database session
        await session.close();
        // Close the driver
        await driver.close();
    } catch (e) {
        console.error(e);
        console.error('Error loading the data file.');
    }

    // Close the user's input/output
    cli.close();
    return;
}

// Run the main function
main();
