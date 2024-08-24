const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log(`Request method: ${req.method}`);
    console.log(`Request path: ${req.path}`);
    console.log(`Request headers: ${JSON.stringify(req.headers)}`);
    console.log(`Request body: ${JSON.stringify(req.body)}`);
    next(); // Skip all authentication for debugging purposes
});

// Connecting SQL with the project
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000 // 10 seconds timeout
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the Railway MySQL database');
});

console.log(`Connecting to database at ${process.env.DB_HOST}:${process.env.DB_PORT}`);

// API: addSchool
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';

    db.query(query, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            console.error('Error inserting school into database:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.status(201).json({ message: 'School added successfully', id: result.insertId });
    });
});

// API: listSchools
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    const query = 'SELECT * FROM schools';

    db.query(query, (err, schools) => {
        if (err) {
            console.error('Error fetching schools from database:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        schools.forEach(school => {
            school.distance = calculateDistance(lat, lon, parseFloat(school.latitude), parseFloat(school.longitude));
        });

        schools.sort((a, b) => a.distance - b.distance);

        res.json(schools);
    });
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});