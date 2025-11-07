// STATIC MODE - Database operations bypassed
console.log('Customer model loaded in STATIC MODE - Database operations bypassed');

// Static customer data for demo purposes
const staticCustomers = [
    {
        "id": 1,
        "name": "John Smith",
        "email": "jsmith@test.com",
        "phone": "123456789",
        "city": "bangalore",
        "state": "karnataka", 
        "country": "India",
        "organization": "Company 1",
        "jobProfile": "Software Developer",
        "additionalInfo": "Has Bought a lot of products before and a high Value Customer"
    },
    {
        "id": 2,
        "name": "ABCD",
        "email": "abcd@test.com",
        "phone": "987654321",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India", 
        "organization": "Company 2",
        "jobProfile": "Project Manager",
        "additionalInfo": "New customer with potential for long-term partnership"
    },
    {
        "id": 3,
        "name": "Tyrion",
        "email": "tyrion@test.com",
        "phone": "123412345",
        "city": "Delhi",
        "state": "Delhi",
        "country": "India",
        "organization": "Company 3", 
        "jobProfile": "Business Analyst",
        "additionalInfo": "Experienced customer with diverse requirements"
    }
];

class Customer {
    static async getAll() {
        console.log('[STATIC MODE] Getting all customers from static data');
        return staticCustomers;
    }

    static async getById(id) {
        console.log(`[STATIC MODE] Getting customer by ID: ${id}`);
        const customer = staticCustomers.find(c => c.id == id);
        return customer || null;
    }

    static async create(customer) {
        console.log('[STATIC MODE] Creating customer (mock operation):', customer.name);
        const newCustomer = {
            id: staticCustomers.length + 1,
            ...customer,
            createdAt: new Date()
        };
        staticCustomers.push(newCustomer);
        return newCustomer;
    }

    static async update(id, customer) {
        console.log(`[STATIC MODE] Updating customer ${id} (mock operation)`);
        const index = staticCustomers.findIndex(c => c.id == id);
        if (index !== -1) {
            staticCustomers[index] = { ...staticCustomers[index], ...customer };
            return staticCustomers[index];
        }
        return null;
    }

    static async delete(id) {
        console.log(`[STATIC MODE] Deleting customer ${id} (mock operation)`);
        const index = staticCustomers.findIndex(c => c.id == id);
        if (index !== -1) {
            const deletedCustomer = staticCustomers.splice(index, 1)[0];
            return deletedCustomer;
        }
        return null;
    }
}

module.exports = Customer; 