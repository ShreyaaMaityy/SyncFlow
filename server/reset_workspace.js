require('dotenv').config();
const mongoose = require('mongoose');
const Workspace = require('./models/Workspace');

if (!process.env.MONGODB_URI) {
    console.error("No MONGODB_URI in .env");
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const res = await Workspace.deleteOne({ workspaceId: 'default-workspace' });
            console.log('Workspace deleted:', res);
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })
    .catch((err) => {
        console.error('DB Connection Failed', err);
        process.exit(1);
    });
