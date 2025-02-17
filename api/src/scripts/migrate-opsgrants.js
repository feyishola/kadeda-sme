const db = require('../database'); // SQLite connection
const mongoose = require('mongoose');
const { mongoURI } = require('../config');
const OpsGrants = require('../model/opsgrants.model');

async function migrateOpsGrants() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Get all records from SQLite
        const records = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM opgrants', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        console.log(`Found ${records.length} records to migrate`);

        // Transform and insert records
        for (const record of records) {
            try {
                // Transform SQLite record to match Mongoose schema
                const transformedRecord = {
                    firstName: record.firstName,
                    lastName: record.lastName,
                    dob: new Date(record.dob),
                    gender: record.gender,
                    phoneNumber: record.phone,
                    bvn: record.bvn,
                    idDocument: {
                        idDocType: record.idDocType,
                        idDocPhotoUrl: record.idDocPhotoUrl
                    },
                    email: record.email,
                    ownerPassportPhotoUrl: record.ownerPassportPhotoUrl,
                    address: record.homeAddress,
                    isCivilServant: Boolean(record.civilServant),
                    businessName: record.businessName,
                    businessAddress: record.businessAddress,
                    businessLGA: record.businessLGA,
                    businessLGACode: record.businessLGACode,
                    businessWard: record.businessWard,
                    businessRegCat: {
                        catType: record.catType,
                        enum: [], // Add enum values if available
                        certPhotoUrl: record.certPhotoUrl,
                        cacProofDocPhotoUrl: record.cacProofDocPhotoUrl
                    },
                    businessRegIssuer: record.businessRegIssuer,
                    businessRegNum: record.businessRegNum,
                    ownerAtBusinessPhotoUrl: record.ownerAtBusinessPhotoUrl,
                    latitude: record.latitude,
                    longitude: record.longitude,
                    yearsInOperation: record.yearsInOperation,
                    numStaff: record.numStaff,
                    itemsPurchased: JSON.parse(record.itemsPurchased),
                    costOfIitems: record.costOfIitems || 0,
                    bank: record.bank,
                    accountNumber: record.accountNumber,
                    capturedBy: new mongoose.Types.ObjectId(),
                };
                console.log({transformedRecord})

                // Create new document in MongoDB
                const newGrant = new OpsGrants(transformedRecord);
                await newGrant.save();
                console.log(`Migrated record for ${record.firstName} ${record.lastName}`);
            } catch (error) {
                console.error(`Failed to migrate record:`, error.message);
                // console.error('Record:', record);
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Close both connections
        mongoose.connection.close();
        db.close();
    }
}

// Run migration
migrateOpsGrants(); 