const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const portableMongo = require('portable-mongodb');
const mongoose = require('mongoose');
const log = require('electron-log');
const fs = require('fs');
const sudo = require('sudo-prompt'); // For requesting admin privileges
const User = require('./User'); // MongoDB User model

let mainWindow;
const isProduction = process.env.NODE_ENV === 'production';
const mongoDataPath = isProduction
    ? path.join(app.getPath('userData'), 'mongodb-data') // Production-safe path
    : path.join(__dirname, 'mongodb-data'); // Development path

// Function to request admin privileges
async function requestAdminPrivileges() {
    const needsAdminPrivileges = isProduction && !fs.existsSync(mongoDataPath);
    log.info(`Does the app need admin privileges? ${needsAdminPrivileges}`);

    if (needsAdminPrivileges) {
        const options = {
            name: 'ElectronMongoDBApp',
        };

        return new Promise((resolve, reject) => {
            sudo.exec(`"${process.execPath}"`, options, (error, stdout, stderr) => {
                if (error) {
                    log.error('Failed to elevate privileges:', error);
                    reject(error);
                } else {
                    log.info('Privileges elevated successfully.');
                    resolve();
                }
            });
        });
    }
}

// Retry MongoDB startup
async function retryMongoStart(maxRetries = 3, delayMs = 5000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await portableMongo.connectToDatabase('electron-mongodb-database', {
                dbPath: mongoDataPath,
            });
            log.info('Portable MongoDB started successfully.');
            return;
        } catch (error) {
            log.error(`MongoDB start attempt ${i + 1} failed:`, error.message);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

// Retry Mongoose connection
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
            log.error(`Attempt ${i + 1} failed:`, error.message);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

// Start Portable MongoDB and Mongoose
async function startMongoDB() {
    log.info(`MongoDB data path: ${mongoDataPath}`);

    // Check if the data directory exists and is writable
    fs.access(mongoDataPath, fs.constants.W_OK, (err) => {
        if (err) {
            log.error('MongoDB data path is not writable:', err);
        } else {
            log.info('MongoDB data path is writable.');
        }
    });

    // Ensure the MongoDB data directory exists
    if (!fs.existsSync(mongoDataPath)) {
        fs.mkdirSync(mongoDataPath, { recursive: true });
        log.info('MongoDB data directory created:', mongoDataPath);
    }

    // Start Portable MongoDB and Mongoose
    try {
        await retryMongoStart();
        await retryMongoConnection();
    } catch (error) {
        log.error('Error starting Portable MongoDB or Mongoose:', error.message);
        if (error.message.includes('fassert')) {
            log.error('MongoDB internal error. Consider cleaning the data directory.');
        }
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

// App Lifecycle
app.whenReady().then(async () => {
    log.info('App is starting...');

    try {
        await requestAdminPrivileges();
    } catch (error) {
        app.quit();
        return;
    }

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
