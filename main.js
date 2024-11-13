const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const portableMongo = require('portable-mongodb');
const mongoose = require('mongoose');

// Import your Mongoose model
const User = require('./User');

let mainWindow;

// Function to start Portable MongoDB
async function startMongoDB() {
    try {
        // Define a persistent path for MongoDB data
        const mongoDataPath = path.join(app.getPath('userData'), 'mongodb-data');

        // Start Portable MongoDB server with persistence
        await portableMongo.connectToDatabase('electron-mongodb-database', {
            dbPath: mongoDataPath,
        });
        console.log('Portable MongoDB started successfully.');

        // Connect Mongoose to MongoDB
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect('mongodb://127.0.0.1:27017/electron-mongodb-database', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Mongoose connected to Portable MongoDB.');
        } else {
            console.log('Mongoose is already connected.');
        }
    } catch (error) {
        console.error('Error starting Portable MongoDB:', error);
    }
}

// Function to create the Electron window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Security measure
        },
    });

    // Load the HTML file for the renderer process
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

// Define IPC Handlers for database operations
ipcMain.handle('get-users', async () => {
    try {
        const users = await User.find(); // Fetch all users
        return { success: true, users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('add-user', async (event, user) => {
    if (!user.name || !user.email) {
        return { success: false, error: 'Name, email, are required.' };
    }
    try {
        const newUser = new User(user); // Add a new user
        const savedUser = await newUser.save();
        return { success: true, user: savedUser };
    } catch (error) {
        console.error('Error adding user:', error);
        return { success: false, error: error.message };
    }
});

// App lifecycle
app.whenReady().then(async () => {
    await startMongoDB(); // Start MongoDB when the app is ready
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Clean up MongoDB process on quit
app.on('quit', async () => {
    if (mongoose.connection.readyState !== 0) {
        try {
            await mongoose.disconnect();
            console.log('Mongoose disconnected gracefully.');
        } catch (error) {
            console.error('Error during MongoDB disconnect:', error);
        }
    }
});
