const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'db', 'kaddep.db');
const newDbPath = path.join(__dirname, 'db', 'kaddep_new.db');
const uploadsDir = path.join(__dirname, 'uploads');

async function ensureUploadsDirectory() {
    try {
        await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

async function closeDatabase(db) {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function migrateBlobToFile() {
    let oldDb = null;
    let newDb = null;

    try {
        // Ensure uploads directory exists
        await ensureUploadsDirectory();

        // Create connections
        oldDb = new sqlite3.Database(dbPath);
        newDb = new sqlite3.Database(newDbPath);

        // Promisify database operations
        const run = (db, sql, params = []) => new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        const all = (db, sql) => new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Get table info from old database
        const tableInfo = await all(oldDb, "PRAGMA table_info(opgrants)");
        const oldColumns = tableInfo.map(col => col.name);

        // Create new table structure in new database
        await run(newDb, `DROP TABLE IF EXISTS opgrants`);
        await createTable(newDb);

        // Get all records from old database
        const records = await all(oldDb, `SELECT ${oldColumns.join(',')} FROM opgrants`);

        // Get new table columns
        const newTableInfo = await all(newDb, "PRAGMA table_info(opgrants)");
        const newColumns = newTableInfo.map(col => col.name);

        // Process and insert records
        for (const record of records) {
            const validColumns = [];
            const values = [];
            const params = {};

            for (const col of Object.keys(record)) {
                if (newColumns.includes(col)) {
                    const val = record[col];
                    if (val !== null) {
                        validColumns.push(col);
                        if (col.endsWith('Url') && val) {
                            try {
                                const uniqueId = uuidv4().replace(/-/g, '');
                                const fileName = `${uniqueId}.jpg`;
                                const filePath = path.join('uploads', fileName);
                                
                                const dataToWrite = Buffer.isBuffer(val) 
                                    ? val 
                                    : typeof val === 'object' && val.type === 'Buffer'
                                        ? Buffer.from(val)
                                        : Buffer.from(val, 'base64');

                                await fs.writeFile(path.join(__dirname, filePath), dataToWrite);
                                params[col] = filePath;
                                values.push(filePath);
                            } catch (error) {
                                console.error(`Error processing file for column ${col}:`, error);
                                params[col] = null;
                                values.push(null);
                            }
                        } else {
                            params[col] = val;
                            values.push(val);
                        }
                    }
                }
            }

            if (validColumns.length > 0) {
                const placeholders = validColumns.map(() => '?').join(',');
                const sql = `INSERT INTO opgrants (${validColumns.join(',')}) VALUES (${placeholders})`;
                
                try {
                    await run(newDb, sql, values);
                } catch (error) {
                    console.error('Error inserting record:', error);
                    console.error('SQL:', sql);
                    console.error('Values:', values);
                }
            }
        }

        // Close database connections
        await closeDatabase(oldDb);
        await closeDatabase(newDb);
        oldDb = null;
        newDb = null;

        // Create backup filename with timestamp
        const backupPath = `${dbPath}.backup-${Date.now()}`;
        
        // Copy old database to backup instead of renaming
        await fs.copyFile(dbPath, backupPath);
        
        // Delete old database file
        await fs.unlink(dbPath);
        
        // Move new database to original location
        await fs.rename(newDbPath, dbPath);

        console.log('Migration completed successfully');
        console.log('Old database backed up to:', backupPath);

    } catch (error) {
        console.error('Migration failed:', error);
        
        // Cleanup on error
        if (oldDb) await closeDatabase(oldDb);
        if (newDb) await closeDatabase(newDb);
        
        // Try to cleanup temporary database
        try {
            await fs.unlink(newDbPath);
        } catch (unlinkError) {
            console.error('Error cleaning up temporary database:', unlinkError);
        }
        
        process.exit(1);
    }
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
                ownerPassportPhotoUrl TEXT,
                idDocType TEXT,
                idDocPhotoUrl TEXT,
                businessName TEXT,
                businessAddress TEXT,
                businessLGA TEXT,
                businessLGACode TEXT,
                businessWard TEXT,
                ownerAtBusinessPhotoUrl TEXT,
                latitude REAL,
                longitude REAL,
                businessRegCat TEXT,
                catType TEXT,
                certPhotoUrl TEXT,
                cacProofDocPhotoUrl TEXT,
                businessRegIssuer TEXT,
                businessRegNum TEXT,
                yearsInOperation INTEGER,
                numStaff INTEGER,
                businessOpsExpenseCat TEXT,
                itemsPurchased TEXT,
                costOfItems INTEGER,
                renumerationPhotoUrl TEXT,
                groupPhotoUrl TEXT,
                comment TEXT,
                bank TEXT,
                accountNumber TEXT,
                accountName TEXT,
                taxId TEXT,
                issuer TEXT,
                taxRegPhotoUrl TEXT,
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

// Run migration
migrateBlobToFile(); 