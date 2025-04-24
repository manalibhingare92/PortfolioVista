const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3005;

// MongoDB connection
const uri = 'mongodb://localhost:27017/csvdata'; 
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = 'csvdata';
const collectionName = 'info';

app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' folder

// Endpoint to get students by university
app.get('/get-students', async (req, res) => {
    const university = req.query.university;
    if (!university) {
        return res.status(400).json({ error: 'University name is required' });
    }

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const students = await collection.find({ university }).toArray();

        if (students.length === 0) {
            return res.status(404).json({ error: 'No students found for this university' });
        }

        res.json({ students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to get students by sector with sorting
app.get('/get-students-by-sector', async (req, res) => {
    const sector = req.query.sector;
    const sortBy = req.query.sortBy; // Retrieve sorting preference

    if (!sector) {
        return res.status(400).json({ error: 'Sector is required' });
    }

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        // Find students by sector
        const students = await collection.find({ sector }).limit(5).toArray();
       

        if (students.length === 0) {
            return res.status(404).json({ error: 'No students found for this sector' });
        }

        // Sort students based on the selected criterion (GPA or salary)
        if (sortBy === 'gpa') {
            students.sort((a, b) => b.GPA - a.GPA); // Sort by GPA in descending order
        } else if (sortBy === 'salary') {
            students.sort((a, b) =>  a.expected_salary-b.expected_salary ); // Sort by expected salary in descending order
        }

        res.json({ students });
    } catch (error) {
        console.error('Error fetching students by sector:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
