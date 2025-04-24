
// Required modules
const fs = require('fs');
const csvParser = require('csv-parser');
const { MongoClient } = require('mongodb');

// MongoDB URI and Database Information
const uri = 'mongodb://localhost:27017';  // Replace with your MongoDB connection string
const dbName = 'csvdata';  // Database name
const collectionName = 'info';  // Collection name

// CSV file path (you can replace this with the path of your file)
const csvFilePath = 'recent_graduates.csv';

// Function to read CSV and insert data into MongoDB
async function importCSVToMongoDB() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Array to hold CSV data
    const csvData = [];

    // Reading and parsing the CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        csvData.push(row);  // Push each row into the array
      })
      .on('end', async () => {
        // Insert data into MongoDB
        try {
          const result = await collection.insertMany(csvData);
          console.log(`${result.insertedCount} records inserted successfully.`);
        } catch (err) {
          console.error('Error inserting data:', err);
        } finally {
          client.close();  // Close the MongoDB connection
        }
      });

  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

// Call the function to import CSV data
importCSVToMongoDB();
