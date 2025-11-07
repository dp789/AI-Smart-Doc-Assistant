require('dotenv').config({ path: 'backend/.env' });
const { sql, poolPromise } = require('../db');

async function setupDatabase() {
    let pool;
    try {
        console.log('Connecting to database...');
        pool = await poolPromise;
        console.log('Connected to database!');

        // Create Users table if it doesn't exist
        console.log('Setting up Users table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            CREATE TABLE Users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                username NVARCHAR(100) NOT NULL UNIQUE,
                password NVARCHAR(255) NOT NULL,
                email NVARCHAR(255) NOT NULL,
                createdAt DATETIME DEFAULT GETDATE()
            )
        `);
        console.log('Users table is ready!');

        // Create Customers table if it doesn't exist
        console.log('Setting up Customers table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Customers' AND xtype='U')
            CREATE TABLE Customers (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(100) NOT NULL,
                email NVARCHAR(255) NOT NULL,
                phone NVARCHAR(50),
                city NVARCHAR(100),
                state NVARCHAR(100),
                country NVARCHAR(100),
                organization NVARCHAR(255),
                jobProfile NVARCHAR(255),
                additionalInfo NVARCHAR(MAX),
                createdAt DATETIME DEFAULT GETDATE()
            )
        `);
        console.log('Customers table is ready!');

        // Insert sample customers if the table is empty
        const customersResult = await pool.request().query('SELECT COUNT(*) as count FROM Customers');
        if (customersResult.recordset[0].count === 0) {
            console.log('Inserting sample customers...');
            await pool.request().query(`
                INSERT INTO Customers (name, email, phone, city, state, country, organization, jobProfile, additionalInfo)
                VALUES 
                ('John Smith', 'jsmith@test.com', '123456789', 'Bangalore', 'Karnataka', 'India', 'Company 1', 'Software Developer', 'Has Bought a lot of products'),
                ('Priya Mehra', 'priya.mehra@example.com', '9876543210', 'Mumbai', 'Maharashtra', 'India', 'Company 2', 'Product Manager', 'Interested in enterprise-level solutions'),
                ('Rahul Verma', 'rahulv@example.org', '9999999999', 'Delhi', 'Delhi', 'India', 'Company 3', 'Data Analyst', 'Looking for dashboard integrations'),
                ('Anjali Rao', 'anjali.rao@example.net', '8888888888', 'Hyderabad', 'Telangana', 'India', 'Company 4', 'HR Manager', 'Requested bulk product demo'),
                ('David Lee', 'dlee@foreigncorp.com', '7777777777', 'San Francisco', 'California', 'USA', 'Company 5', 'Sales Executive', 'International client with regional needs')
            `);
            console.log('Sample customers inserted!');
        } else {
            console.log('Customers table already has data. Skipping sample data insertion.');
        }

        console.log('Database setup completed successfully!');
    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        if (pool) {
            console.log('Closing database connection...');
            await sql.close();
        }
    }
}

setupDatabase(); 