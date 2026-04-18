const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Conversation = require('./src/models/Conversation');

dotenv.config();

const testUsers = [
    {
        username: 'Test Researcher',
        email: 'test@curalink.ai',
        password: 'password123',
        onboardingComplete: true,
        interests: ['clinical_trials', 'drug_discovery'],
        medicalFocus: 'Neurodegenerative disease genomics'
    },
    {
        username: 'Assistant Researcher',
        email: 'test1@curalink.ai',
        password: 'password123',
        onboardingComplete: true,
        interests: ['epidemiology', 'patient_care'],
        medicalFocus: 'Global health equity and vaccine distribution'
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas...');

        // NON-DESTRUCTIVE SEEDING: only add if missing
        console.log('Checking for existing test users...');
        for (const userData of testUsers) {
            const existing = await User.findOne({ email: userData.email });
            if (!existing) {
                await User.create(userData);
                console.log(`Initialized new account: ${userData.email}`);
            } else {
                console.log(`Preserving existing account and history: ${userData.email}`);
            }
        }
        console.log('Test Users Verified Successfully (Data Preservation Enabled)!');
        
        console.log('\n--- LOGIN ACCESS ---');
        testUsers.forEach(u => {
            console.log(`User: ${u.username}`);
            console.log(`Email: ${u.email}`);
            console.log(`Password: ${u.password}`);
            console.log('--------------------');
        });
        console.log('');

        process.exit();
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedDatabase();
