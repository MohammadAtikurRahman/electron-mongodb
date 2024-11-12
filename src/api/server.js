// src/api/server.js

const express = require('express');
const path = require('path');
const portableMongo = require('portable-mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/User');

const app = express();
const PORT = 3000;

// Define the paths for MongoDB binaries and data based on the environment
const mongoDbPath = process.env.NODE_ENV === 'production'
    ? path.join(process.resourcesPath, 'mongodb-binaries')
    : path.join(__dirname, '..', 'node_modules', 'portable-mongodb', 'mongodb-binaries');

const mongoDataPath = process.env.NODE_ENV === 'production'
    ? path.join(process.resourcesPath, 'mongodb-data')
    : path.join(__dirname, '..', 'node_modules', 'portable-mongodb', 'mongodb-data');

// Initialize and start MongoDB with portableMongo
(async () => {
    try {
        // Attempt to start MongoDB with portableMongo using the specified binary and data paths
        await portableMongo.connectToDatabase('portable-mongodb-database', {
            dbPath: mongoDataPath,
            binPath: mongoDbPath,
        });
        
        console.log('MongoDB started successfully');

        // Connect Mongoose to MongoDB once portableMongo is initialized
        await mongoose.connect('mongodb://127.0.0.1:27017/electron-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Mongoose connected to MongoDB');

        // Middleware for parsing JSON
        app.use(bodyParser.json());

        // Define API routes
        app.post('/api/users', async (req, res) => {
            const { name, address } = req.body;
            try {
                if (!name || !address) {
                    return res.status(400).json({ error: "Name and address are required." });
                }
                const newUser = new User({ name, address });
                await newUser.save();
                res.status(201).json({ message: 'User added successfully', user: newUser });
            } catch (error) {
                console.error('Error adding user:', error);
                res.status(500).json({ error: 'Failed to add user', details: error.message });
            }
        });

        app.get('/api/users', async (req, res) => {
            try {
                const users = await User.find({});
                res.json(users);
            } catch (error) {
                console.error('Error retrieving users:', error);
                res.status(500).json({ error: 'Failed to retrieve users', details: error.message });
            }
        });

        // Start the Express server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Error starting MongoDB or Mongoose:', error);
    }
})();
