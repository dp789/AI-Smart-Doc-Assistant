// STATIC MODE - Database operations bypassed
console.log('User model loaded in STATIC MODE - Database operations bypassed');

// Mock user for static mode
const mockUsers = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        createdAt: new Date()
    }
];

class User {
    static async findByUsername(username) {
        console.log(`[STATIC MODE] Finding user: ${username}`);
        // Return mock user data instead of database query
        const user = mockUsers.find(u => u.username === username);
        return user || null;
    }

    static async create(user) {
        console.log('[STATIC MODE] Creating user (mock operation):', user.username);
        // Mock user creation - return success without actual database operation
        const newUser = {
            id: mockUsers.length + 1,
            username: user.username,
            email: user.email,
            createdAt: new Date()
        };
        mockUsers.push(newUser);
        return newUser;
    }

    static async validatePassword(username, password) {
        console.log(`[STATIC MODE] Validating password for: ${username}`);
        // Mock validation - always return true for demo purposes
        // In real implementation, you'd check against hashed password
        return username === 'admin' && password === 'admin';
    }
}

module.exports = User; 