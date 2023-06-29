# Leximancer-To-Neo4j
A simple JS script that imports a Leximancer Prominence Map export csv file to a Neo4j database.


# Dependencies
Only requires the javascript neo4j-driver package to be installed. \
`npm install neo4j-driver`

# Instructions
Replace the variables within the script with your database's URI, username and password.
```js
const uri = 'your-uri-here'
const user = 'your-user-here'
const pass = 'your-password-here'
```

Or if other authentication is required, change the driver settings within the script's main function
```js
const driver = neo4j.driver(uri, your-auth-settings-here)
```
See [neo4j-driver](https://neo4j.com/developer/javascript/) for details.

Then simply execute the script, and it will prompt you for your csv file path.
Give it the correct path, and it will begin importing and alert you of how many errors occured (if any).

# WARNING
This script does clear your database before it begins importing!

# Example CSV
Included in the repository is a sample CSV file (sample-input-matrix.csv) if you want to test it out!
