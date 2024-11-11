// src/api/server.js

const express = require('express');
const portableMongo = require('portable-mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/User');

const app = express();
const PORT = 3000;

async function main() {
    try {
        // Start portable MongoDB
        await portableMongo.connectToDatabase("portable-mongodb-database");
        console.log("MongoDB connected successfully to database: portable-mongodb-database");

        // Connect Mongoose to portable MongoDB after it's fully started
        await mongoose.connect('mongodb://127.0.0.1:27017/portable-mongodb-database', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Mongoose successfully connected.");

        // Middleware
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        // POST endpoint to add a new user
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

        // GET endpoint to retrieve all users
        app.get('/api/users', async (req, res) => {
            try {
                const users = await User.find({});
                res.json(users);
            } catch (error) {
                console.error('Error retrieving users:', error);
                res.status(500).json({ error: 'Failed to retrieve users', details: error.message });
            }
        });

        // Start Express server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Failed to initialize MongoDB or Mongoose:', error);
    }
}

// Run the main function
main().catch(error => {
    console.error('Unexpected error starting the server:', error);
});
