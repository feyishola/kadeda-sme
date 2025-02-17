const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '/db/kaddep.db');

// Add error handling and connection retries
let retryCount = 0;
const maxRetries = 3;

function connectToDatabase() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                setTimeout(connectToDatabase, 1000 * retryCount);
                return;
            }
            throw new Error('Failed to connect to database after multiple attempts');
        }

        console.log('Connected to SQLite database');
        
        // Wrap table creation in a promise for better error handling
        createTable(db)
            .then(() => console.log('Table creation/verification successful'))
            .catch(error => {
                console.error('Error creating/verifying table:', error);
                db.close();
                process.exit(1);
            });
    });

    return db;
}

function createTable(db) {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS opgrants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                dob TEXT NOT NULL,
                gender TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                homeAddress TEXT,
                civilServant INTEGER DEFAULT 0,
                bvn TEXT,
                ownerPassportPhotoUrl BLOB,
                idDocType TEXT,
                idDocPhotoUrl BLOB,
                businessName TEXT,
                businessAddress TEXT,
                businessLGA TEXT,
                businessLGACode TEXT,
                businessWard TEXT,
                ownerAtBusinessPhotoUrl BLOB,
                latitude REAL,
                longitude REAL,
                businessRegCat TEXT,
                catType TEXT,
                certPhotoUrl BLOB,
                cacProofDocPhotoUrl BLOB,
                businessRegIssuer TEXT,
                businessRegNum TEXT,
                yearsInOperation INTEGER,
                numStaff INTEGER,
                businessOpsExpenseCat TEXT,
                itemsPurchased TEXT,
                costOfItems INTEGER,
                renumerationPhotoUrl BLOB,
                groupPhotoUrl BLOB,
                comment TEXT,
                bank TEXT,
                accountNumber TEXT,
                accountName TEXT,
                taxId TEXT,
                issuer TEXT,
                taxRegPhotoUrl BLOB,
                dataType TEXT DEFAULT 'newData',
                syncStatus INTEGER DEFAULT 0,
                dataComplete INTEGER DEFAULT 0,
                serverVerified INTEGER DEFAULT 0,
                syncErrorMessage TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

const db = connectToDatabase();

// Add graceful shutdown handling
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
            process.exit(1);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});

module.exports = db;
