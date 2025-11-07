const User = require('../models/User');
const auth = require('../middleware/auth');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // Validate input
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Please provide username, password and email' });
        }
        
        // Check if user already exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Create user (in static mode, this is a mock operation)
        const user = await User.create({ username, password, email });
        
        // Generate token
        const token = auth.generateToken(user);
        
        console.log('[STATIC MODE] User registered successfully:', username);
        res.status(201).json({
            message: 'User registered successfully (STATIC MODE)',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error registering user', message: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide username and password' });
        }
        
        // Find user
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Validate password (updated for static mode)
        const isMatch = await User.validatePassword(username, password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = auth.generateToken(user);
        
        console.log('[STATIC MODE] User logged in successfully:', username);
        res.status(200).json({
            message: 'Login successful (STATIC MODE)',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in', message: error.message });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByUsername(req.user.username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('[STATIC MODE] User profile retrieved:', req.user.username);
        res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Error getting user profile', message: error.message });
    }
}; 