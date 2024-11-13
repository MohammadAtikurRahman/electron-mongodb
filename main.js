const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const portableMongo = require('portable-mongodb');
const mongoose = require('mongoose');
const log = require('electron-log');
const User = require('./User'); // MongoDB User model

let mainWindow;
const isProduction = process.env.NODE_ENV === 'production';
const mongoDataPath = isProduction
    ? path.join(app.getPath('userData'), 'mongodb-data')
    : path.join(__dirname, 'mongodb-data');

// Helper to check and connect MongoDB
async function retryMongoConnection(maxRetries = 5, delayMs = 5000) {
    if (mongoose.connection.readyState === 1) {
        log.info('Mongoose is already connected.');
        return;
    }

    for (let i = 0; i < maxRetries; i++) {
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/electron-mongodb-database');
            log.info('Mongoose connected to MongoDB.');
            return;
        } catch (error) {
            log.error(`Attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

// Start Portable MongoDB
async function startMongoDB() {
    try {
        await portableMongo.connectToDatabase('electron-mongodb-database', {
            dbPath: mongoDataPath,
        });
        log.info(`Portable MongoDB started successfully in ${isProduction ? 'production' : 'development'} mode.`);
        await retryMongoConnection();
    } catch (error) {
        log.error('Error starting Portable MongoDB or Mongoose:', error);
    }
}

// Create the Electron main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    log.info('Main window created.');
}

// IPC Handlers for Database Operations
ipcMain.handle('get-users', async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database is not connected.');
        }
        const users = await User.find().lean();
        log.info('Fetched users successfully.');
        return { success: true, users };
    } catch (error) {
        log.error('Error fetching users:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('add-user', async (event, user) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database is not connected.');
        }
        const existingUser = await User.findOne({ email: user.email }).lean();
        if (existingUser) {
            log.warn(`Duplicate email: ${user.email}`);
            return { success: false, error: 'A user with this email already exists.' };
        }

        const newUser = new User(user);
        const savedUser = await newUser.save();
        log.info('User added successfully:', savedUser.toObject());
        return { success: true, user: savedUser.toObject() };
    } catch (error) {
        log.error('Error adding user:', error);
        return { success: false, error: error.message };
    }
});

// App lifecycle
app.whenReady().then(async () => {
    log.info('App is starting...');
    await startMongoDB();
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

app.on('quit', async () => {
    log.info('App is quitting...');
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        log.info('Mongoose disconnected.');
    }
});
