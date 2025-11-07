const Customer = require('../models/Customer'); // Re-enabled for STATIC MODE

// Get all customers - STATIC MODE
exports.getAllCustomers = async (req, res) => {
    try {
        // Using Customer model (now in static mode)
        const customers = await Customer.getAll();
        
        console.log('[STATIC MODE] Returning customer data from model');
        res.status(200).json({ data: customers });
    } catch (error) {
        console.error('Controller error getting all customers:', error);
        res.status(500).json({ 
            error: 'Error fetching customers', 
            message: error.message 
        });
    }
};

// Get customer by ID - STATIC MODE
exports.getCustomerById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }

        // Using Customer model (now in static mode)
        const customer = await Customer.getById(id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        console.log(`[STATIC MODE] Returning customer data for ID: ${id}`);
        res.status(200).json({ data: customer });
    } catch (error) {
        console.error(`Controller error getting customer ${req.params.id}:`, error);
        res.status(500).json({
            error: 'Error fetching customer details',
            message: error.message
        });
    }
};

// Create new customer - STATIC MODE
exports.createCustomer = async (req, res) => {
    try {
        console.log('[STATIC MODE] Create customer called - using mock operation');
        
        const { name, email, phone, city, state, country, organization, jobProfile, additionalInfo } = req.body;
        
        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Using Customer model (now in static mode)
        const customer = await Customer.create({
            name, email, phone, city, state, country, organization, jobProfile, additionalInfo
        });

        console.log('[STATIC MODE] Customer created successfully:', customer.name);
        res.status(201).json({ 
            message: 'Customer created successfully (STATIC MODE)',
            data: customer 
        });
    } catch (error) {
        console.error('Controller error creating customer:', error);
        res.status(500).json({
            error: 'Error creating customer',
            message: error.message
        });
    }
};

// Update customer - STATIC MODE
exports.updateCustomer = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }

        console.log(`[STATIC MODE] Update customer called for ID: ${id}`);
        
        const { name, email, phone, city, state, country, organization, jobProfile, additionalInfo } = req.body;
        
        // Using Customer model (now in static mode)
        const customer = await Customer.update(id, {
            name, email, phone, city, state, country, organization, jobProfile, additionalInfo
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        console.log(`[STATIC MODE] Customer updated successfully: ${id}`);
        res.status(200).json({ 
            message: 'Customer updated successfully (STATIC MODE)',
            data: customer 
        });
    } catch (error) {
        console.error(`Controller error updating customer ${req.params.id}:`, error);
        res.status(500).json({
            error: 'Error updating customer',
            message: error.message
        });
    }
};

// Delete customer - STATIC MODE
exports.deleteCustomer = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }

        console.log(`[STATIC MODE] Delete customer called for ID: ${id}`);
        
        // Using Customer model (now in static mode)
        const deletedCustomer = await Customer.delete(id);

        if (!deletedCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        console.log(`[STATIC MODE] Customer deleted successfully: ${id}`);
        res.status(200).json({ 
            message: 'Customer deleted successfully (STATIC MODE)',
            data: deletedCustomer 
        });
    } catch (error) {
        console.error(`Controller error deleting customer ${req.params.id}:`, error);
        res.status(500).json({
            error: 'Error deleting customer',
            message: error.message
        });
    }
}; 