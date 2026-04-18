const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: 'User already exists' });

        user = await User.create({ username, email, password });
        res.status(201).json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                onboardingComplete: user.onboardingComplete
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                interests: user.interests,
                onboardingComplete: user.onboardingComplete
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.completeOnboarding = async (req, res) => {
    const { interests, medicalFocus } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.interests = interests;
        user.medicalFocus = medicalFocus;
        user.onboardingComplete = true;
        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
