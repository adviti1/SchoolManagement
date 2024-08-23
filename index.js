const express = require('express');  
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

//connecting sql with the project 
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database');
});

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//first API : addSchool  
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Validating the input data
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // SQL query to insert the new schools
    const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';

    // Executing the query
    db.query(query, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            console.error('Error inserting school into database:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        //success response 
        res.status(201).json({ message: 'School added successfully', id: result.insertId });
    });
});


//second API : listSchool
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    // Validating the  input
    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Query to fetch all schools
    const query = 'SELECT * FROM schools';

    db.query(query, (err, schools) => {
        if (err) {
            console.error('Error fetching schools from database:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        // Calculate distance for each school
        schools.forEach(school => {
            school.distance = calculateDistance(latitude, longitude, school.latitude, school.longitude);
        });

        // Sort schools by distance
        schools.sort((a, b) => a.distance - b.distance);

        // Return the sorted list
        res.json(schools);
    });
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}


