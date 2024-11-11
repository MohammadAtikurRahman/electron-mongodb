// src/api/server.js
const express = require('express');
const portableMongo = require('portable-mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/User'); // Import the User model

const app = express();
const PORT = 3000;

async function main() {
    // Connect to the embedded MongoDB server with a specified database name
    await portableMongo.connectToDatabase("portable-mongodb-database");
    console.log("Connected to the portable MongoDB database.");

    // Middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Define API Endpoints
    app.post('/api/users', async (req, res) => {
        const { name, address } = req.body;
        try {
            const newUser = new User({ name, address });
            await newUser.save();
            res.status(201).json({ message: 'User added successfully', user: newUser });
        } catch (error) {
            res.status(500).json({ error: 'Failed to add user' });
        }
    });

    app.get('/api/users', async (req, res) => {
        try {
            const users = await User.find({});
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve users' });
        }
    });

    // Start Express server
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Run the main function
main().catch(console.error);
