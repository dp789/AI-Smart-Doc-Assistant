import envConfig, { verifyEnvironmentUrls } from '../envConfig';
import { getUploadAuthHeaders } from '../utils/authUtils';

// Get all document categories
export const fetchDocumentCategories = async () => {
    try {
        const config = verifyEnvironmentUrls();
        const authHeaders = await getUploadAuthHeaders();
        
        console.log('🎯 Fetching document categories from:', `${config.apiUrl}/document-categories`);
        
        const response = await fetch(`${config.apiUrl}/document-categories`, {
            method: 'GET',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
            }
            
            throw new Error(errorData.message || errorData.error || 'Failed to fetch document categories');
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Document categories fetched successfully:', result.data.length);
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to fetch document categories');
        }
        
    } catch (error) {
        console.error('❌ Error fetching document categories:', error);
        throw error;
    }
};

// Get document category by ID
export const fetchDocumentCategoryById = async (id) => {
    try {
        const config = verifyEnvironmentUrls();
        const authHeaders = await getUploadAuthHeaders();
        
        const response = await fetch(`${config.apiUrl}/document-categories/${id}`, {
            method: 'GET',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
            }
            
            throw new Error(errorData.message || errorData.error || 'Failed to fetch document category');
        }

        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to fetch document category');
        }
        
    } catch (error) {
        console.error('❌ Error fetching document category by ID:', error);
        throw error;
    }
};

// Create new document category (admin only)
export const createDocumentCategory = async (categoryData) => {
    try {
        const config = verifyEnvironmentUrls();
        const authHeaders = await getUploadAuthHeaders();
        
        const response = await fetch(`${config.apiUrl}/document-categories`, {
            method: 'POST',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
            }
            
            throw new Error(errorData.message || errorData.error || 'Failed to create document category');
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Document category created successfully:', result.data);
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to create document category');
        }
        
    } catch (error) {
        console.error('❌ Error creating document category:', error);
        throw error;
    }
};

// Update document category (admin only)
export const updateDocumentCategory = async (id, categoryData) => {
    try {
        const config = verifyEnvironmentUrls();
        const authHeaders = await getUploadAuthHeaders();
        
        const response = await fetch(`${config.apiUrl}/document-categories/${id}`, {
            method: 'PUT',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
            }
            
            throw new Error(errorData.message || errorData.error || 'Failed to update document category');
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Document category updated successfully:', result.data);
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to update document category');
        }
        
    } catch (error) {
        console.error('❌ Error updating document category:', error);
        throw error;
    }
};

// Get category ID by type
export const getCategoryIdByType = async (categoryType) => {
    try {
        const config = verifyEnvironmentUrls();
        const authHeaders = await getUploadAuthHeaders();
        
        const response = await fetch(`${config.apiUrl}/document-categories`, {
            method: 'GET',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('📋 Available categories:', result.data);
            console.log('🔍 Looking for category type:', categoryType);
            
            // Find the category with matching type
            // First try to match by label (most reliable)
            let category = result.data.find(cat => 
                cat.label && 
                typeof cat.label === 'string' &&
                cat.label.toLowerCase() === categoryType.toLowerCase()
            );
            
            console.log(`🔍 Exact label match result:`, category);
            
            // If no match by label, try to match by value (if it's a string)
            if (!category && categoryType) {
                category = result.data.find(cat => 
                    cat.value && 
                    typeof cat.value === 'string' &&
                    cat.value.toLowerCase() === categoryType.toLowerCase()
                );
                console.log(`🔍 Value match result:`, category);
            }
            
            // If still no match, try partial matching on labels
            if (!category && categoryType) {
                category = result.data.find(cat => 
                    cat.label && 
                    typeof cat.label === 'string' &&
                    cat.label.toLowerCase().includes(categoryType.toLowerCase())
                );
                console.log(`🔍 Partial label match result:`, category);
            }
            
            // If still no match, try fuzzy matching (case-insensitive contains)
            if (!category && categoryType) {
                const searchTerm = categoryType.toLowerCase();
                category = result.data.find(cat => 
                    cat.label && 
                    typeof cat.label === 'string' &&
                    (cat.label.toLowerCase().includes(searchTerm) || 
                     searchTerm.includes(cat.label.toLowerCase()))
                );
                console.log(`🔍 Fuzzy match result:`, category);
            }
            
            if (category && category.id) {
                console.log(`✅ Found category ID ${category.id} for type "${categoryType}" (matched: "${category.label}")`);
                return category.id;
            } else {
                console.warn('⚠️ No exact match found, available categories:', result.data.map(c => ({ id: c.id, label: c.label, value: c.value })));
                throw new Error(`Category type "${categoryType}" not found. Available categories: ${result.data.filter(c => c.id).map(c => c.label).join(', ')}`);
            }
        } else {
            throw new Error(result.message || 'Failed to fetch categories');
        }
        
    } catch (error) {
        console.error('❌ Error getting category ID by type:', error);
        throw error;
    }
};

// Update document metadata with selected category
export const updateDocumentMetadataCategory = async (documentId, categoryType) => {
    try {
        const config = verifyEnvironmentUrls();
        const authHeaders = await getUploadAuthHeaders();
        
        // First, get the category ID by type
        const categoryId = await getCategoryIdByType(categoryType);
        
        if (!categoryId) {
            throw new Error(`Could not find category ID for type: ${categoryType}`);
        }
        
        console.log(`🔄 Updating document ${documentId} with category ID ${categoryId} (type: ${categoryType})`);
        
        const response = await fetch(`${config.apiUrl}/documents/${documentId}/metadata`, {
            method: 'PUT',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                documentCategory: categoryId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
            }
            
            throw new Error(errorData.message || errorData.error || 'Failed to update document category');
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Document category updated successfully:', result.data);
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to update document category');
        }
        
    } catch (error) {
        console.error('❌ Error updating document category:', error);
        throw error;
    }
};

// Delete document category (admin only)
export const deleteDocumentCategory = async (id) => {
    try {
        const config = verifyEnvironmentUrls();
        const authHeaders = await getUploadAuthHeaders();
        
        const response = await fetch(`${config.apiUrl}/document-categories/${id}`, {
            method: 'DELETE',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
            }
            
            throw new Error(errorData.message || errorData.error || 'Failed to delete document category');
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Document category deleted successfully');
            return true;
        } else {
            throw new Error(result.message || 'Failed to delete document category');
        }
        
    } catch (error) {
        console.error('❌ Error deleting document category:', error);
        throw error;
    }
}; 