const express = require('express');
const router = express.Router();
const documentCategoryController = require('../controllers/documentCategoryController');
const auth = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/', documentCategoryController.getAllDocumentCategories);
router.get('/:id', documentCategoryController.getDocumentCategoryById);

// Protected routes (authentication required)
router.post('/', auth.authenticate, documentCategoryController.createDocumentCategory);
router.put('/:id', auth.authenticate, documentCategoryController.updateDocumentCategory);
router.delete('/:id', auth.authenticate, documentCategoryController.deleteDocumentCategory);

module.exports = router; 