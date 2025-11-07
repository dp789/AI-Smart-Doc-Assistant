const { poolPromise } = require('../db');

// Get all document categories
const getAllDocumentCategories = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Query to get all document categories from dbo.document_category table
        const query = `
            SELECT id, type 
            FROM dbo.document_category 
            ORDER BY type ASC
        `;
        
        const result = await pool.request().query(query);
        
        // Transform the data to match the frontend expected format
        const categories = result.recordset.map(record => ({
            id: record.id,
            value: record.id, // Use ID as value for database storage
            label: record.type.charAt(0).toUpperCase() + record.type.slice(1) // Capitalize first letter
        }));
        
        // Add the default "Select Document Category" option
        categories.unshift({ id: null, value: '', label: 'Select Document Category' });
        
        console.log('📋 Retrieved document categories:', categories.length);
        
        res.json({
            success: true,
            data: categories,
            message: 'Document categories retrieved successfully'
        });
        
    } catch (error) {
        console.error('❌ Error fetching document categories:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document categories',
            error: error.message
        });
    }
};

// Get document category by ID
const getDocumentCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        const query = `
            SELECT id, type 
            FROM dbo.document_category 
            WHERE id = @id
        `;
        
        const result = await pool.request()
            .input('id', id)
            .query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document category not found'
            });
        }
        
        const category = result.recordset[0];
        
        res.json({
            success: true,
            data: {
                id: category.id,
                value: category.type,
                label: category.type.charAt(0).toUpperCase() + category.type.slice(1)
            },
            message: 'Document category retrieved successfully'
        });
        
    } catch (error) {
        console.error('❌ Error fetching document category by ID:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document category',
            error: error.message
        });
    }
};

// Create new document category
const createDocumentCategory = async (req, res) => {
    try {
        const { type } = req.body;
        
        if (!type || typeof type !== 'string' || type.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category type is required and must be a non-empty string'
            });
        }
        
        const pool = await poolPromise;
        
        // Check if category already exists
        const checkQuery = `
            SELECT id FROM dbo.document_category 
            WHERE type = @type
        `;
        
        const existingCategory = await pool.request()
            .input('type', type.trim())
            .query(checkQuery);
        
        if (existingCategory.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Document category already exists'
            });
        }
        
        // Insert new category
        const insertQuery = `
            INSERT INTO dbo.document_category (type)
            OUTPUT INSERTED.id, INSERTED.type
            VALUES (@type)
        `;
        
        const result = await pool.request()
            .input('type', type.trim())
            .query(insertQuery);
        
        const newCategory = result.recordset[0];
        
        console.log('✅ Created new document category:', newCategory.type);
        
        res.status(201).json({
            success: true,
            data: {
                id: newCategory.id,
                value: newCategory.type,
                label: newCategory.type.charAt(0).toUpperCase() + newCategory.type.slice(1)
            },
            message: 'Document category created successfully'
        });
        
    } catch (error) {
        console.error('❌ Error creating document category:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to create document category',
            error: error.message
        });
    }
};

// Update document category
const updateDocumentCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body;
        
        if (!type || typeof type !== 'string' || type.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category type is required and must be a non-empty string'
            });
        }
        
        const pool = await poolPromise;
        
        // Check if category exists
        const checkQuery = `
            SELECT id FROM dbo.document_category 
            WHERE id = @id
        `;
        
        const existingCategory = await pool.request()
            .input('id', id)
            .query(checkQuery);
        
        if (existingCategory.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document category not found'
            });
        }
        
        // Check if new type already exists (excluding current category)
        const duplicateCheckQuery = `
            SELECT id FROM dbo.document_category 
            WHERE type = @type AND id != @id
        `;
        
        const duplicateCategory = await pool.request()
            .input('type', type.trim())
            .input('id', id)
            .query(duplicateCheckQuery);
        
        if (duplicateCategory.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Document category type already exists'
            });
        }
        
        // Update category
        const updateQuery = `
            UPDATE dbo.document_category 
            SET type = @type
            OUTPUT INSERTED.id, INSERTED.type
            WHERE id = @id
        `;
        
        const result = await pool.request()
            .input('type', type.trim())
            .input('id', id)
            .query(updateQuery);
        
        const updatedCategory = result.recordset[0];
        
        console.log('✅ Updated document category:', updatedCategory.type);
        
        res.json({
            success: true,
            data: {
                id: updatedCategory.id,
                value: updatedCategory.type,
                label: updatedCategory.type.charAt(0).toUpperCase() + updatedCategory.type.slice(1)
            },
            message: 'Document category updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Error updating document category:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to update document category',
            error: error.message
        });
    }
};

// Delete document category
const deleteDocumentCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        // Check if category exists
        const checkQuery = `
            SELECT id, type FROM dbo.document_category 
            WHERE id = @id
        `;
        
        const existingCategory = await pool.request()
            .input('id', id)
            .query(checkQuery);
        
        if (existingCategory.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document category not found'
            });
        }
        
        // Delete category
        const deleteQuery = `
            DELETE FROM dbo.document_category 
            WHERE id = @id
        `;
        
        await pool.request()
            .input('id', id)
            .query(deleteQuery);
        
        console.log('✅ Deleted document category:', existingCategory.recordset[0].type);
        
        res.json({
            success: true,
            message: 'Document category deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Error deleting document category:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to delete document category',
            error: error.message
        });
    }
};

module.exports = {
    getAllDocumentCategories,
    getDocumentCategoryById,
    createDocumentCategory,
    updateDocumentCategory,
    deleteDocumentCategory
}; 