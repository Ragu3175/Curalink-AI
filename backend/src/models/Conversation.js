const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientContext: {
        name: String,
        disease: String,
        location: String,
        intent: String
    },
    history: [MessageSchema],
    // ADDED: Store the actual results to restore sidebar state
    publications: { type: Array, default: [] },
    clinicalTrials: { type: Array, default: [] },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', ConversationSchema);
