// ../backend/db.js

import mongoose from 'mongoose';

const connect = async () => {
    try {
        await mongoose.connect(process.env.DB);
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
        throw error;
    }
};

export default connect;
