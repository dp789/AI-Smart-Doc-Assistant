const express = require('express');
const router = express.Router();
const {
    getUserWorkflows,
    getWorkflowById,
    saveWorkflow,
    executeWorkflow,
    getExecutionHistory,
    getWorkflowTemplates,
    deleteWorkflow,
    getWorkflowAnalytics,
    testAIAgent,
    saveResults,
    testAzureOpenAI
} = require('../controllers/aiWorkflowController');

// Middleware for basic auth (you might want to use your existing auth middleware)
const authMiddleware = (req, res, next) => {
    // For demo purposes, we'll create a mock user
    // In production, this should validate JWT tokens or session
    req.user = {
        id: 'demo-user-001',
        email: 'demo@example.com',
        name: 'Demo User'
    };
    next();
};

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/ai-workflow/workflows
 * @desc Get all workflows for the authenticated user
 * @access Private
 */
router.get('/workflows', getUserWorkflows);

/**
 * @route GET /api/ai-workflow/workflows/:id
 * @desc Get a specific workflow by ID
 * @access Private
 */
router.get('/workflows/:id', getWorkflowById);

/**
 * @route POST /api/ai-workflow/workflows
 * @desc Create/Save a new workflow
 * @access Private
 */
router.post('/workflows', saveWorkflow);

/**
 * @route PUT /api/ai-workflow/workflows/:id
 * @desc Update an existing workflow
 * @access Private
 */
router.put('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, nodes, edges, category, tags } = req.body;
        const userId = req.user?.id || 'demo-user';

        // Mock update operation
        const updatedWorkflow = {
            id,
            name,
            description: description || '',
            nodes,
            edges: edges || [],
            category: category || 'General',
            tags: tags || [],
            user_id: userId,
            updated_at: new Date().toISOString()
        };

        console.log('Updating workflow:', updatedWorkflow);

        res.json({
            success: true,
            data: updatedWorkflow,
            message: 'Workflow updated successfully'
        });
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update workflow',
            message: error.message
        });
    }
});

/**
 * @route DELETE /api/ai-workflow/workflows/:id
 * @desc Delete a workflow
 * @access Private
 */
router.delete('/workflows/:id', deleteWorkflow);

/**
 * @route POST /api/ai-workflow/workflows/:id/execute
 * @desc Execute a workflow
 * @access Private
 */
router.post('/workflows/:id/execute', executeWorkflow);

/**
 * @route GET /api/ai-workflow/workflows/:id/history
 * @desc Get execution history for a workflow
 * @access Private
 */
router.get('/workflows/:id/history', getExecutionHistory);

/**
 * @route GET /api/ai-workflow/workflows/:id/status
 * @desc Get current execution status for a workflow
 * @access Private
 */
router.get('/workflows/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Mock current execution status
        const status = {
            workflow_id: id,
            is_running: Math.random() > 0.7, // 30% chance of being running
            current_execution: {
                id: `exec-${Date.now()}`,
                started_at: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
                progress: Math.floor(Math.random() * 100),
                current_step: 'Processing AI Agent',
                estimated_completion: new Date(Date.now() + 60000).toISOString() // 1 minute from now
            },
            last_execution: {
                id: `exec-${Date.now() - 1000}`,
                status: 'completed',
                completed_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                duration: 2300,
                success: true
            },
            next_scheduled: null
        };

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error fetching workflow status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workflow status',
            message: error.message
        });
    }
});

/**
 * @route GET /api/ai-workflow/templates
 * @desc Get workflow templates
 * @access Private
 */
router.get('/templates', getWorkflowTemplates);

/**
 * @route POST /api/ai-workflow/templates/:id/create
 * @desc Create workflow from template
 * @access Private
 */
router.post('/templates/:id/create', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user?.id || 'demo-user';

        // Mock template to workflow conversion
        const newWorkflow = {
            id: `wf-${Date.now()}`,
            name: name || `Workflow from Template ${id}`,
            description: 'Created from template',
            template_id: id,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'draft',
            nodes: [], // Would be populated from template
            edges: []
        };

        res.json({
            success: true,
            data: newWorkflow,
            message: 'Workflow created from template successfully'
        });
    } catch (error) {
        console.error('Error creating workflow from template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create workflow from template',
            message: error.message
        });
    }
});

/**
 * @route GET /api/ai-workflow/analytics
 * @desc Get workflow analytics and insights
 * @access Private
 */
router.get('/analytics', getWorkflowAnalytics);

/**
 * @route GET /api/ai-workflow/nodes
 * @desc Get available node types and their configurations
 * @access Private
 */
router.get('/nodes', async (req, res) => {
    try {
        const availableNodes = {
            triggers: [
                {
                    id: 'webhook',
                    name: 'Webhook',
                    description: 'Trigger workflow via HTTP request',
                    category: 'triggers',
                    icon: 'webhook',
                    config_schema: {
                        endpoint: { type: 'string', required: true },
                        method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
                        authentication: { type: 'select', options: ['none', 'bearer', 'basic'] }
                    }
                },
                {
                    id: 'schedule',
                    name: 'Schedule',
                    description: 'Time-based workflow trigger',
                    category: 'triggers',
                    icon: 'schedule',
                    config_schema: {
                        cron_expression: { type: 'string', required: true },
                        timezone: { type: 'string', default: 'UTC' },
                        enabled: { type: 'boolean', default: true }
                    }
                },
                {
                    id: 'file_watcher',
                    name: 'File Watcher',
                    description: 'Monitor file system changes',
                    category: 'triggers',
                    icon: 'folder',
                    config_schema: {
                        watch_path: { type: 'string', required: true },
                        file_pattern: { type: 'string', default: '*' },
                        events: { type: 'multiselect', options: ['created', 'modified', 'deleted'] }
                    }
                }
            ],
            ai_agents: [
                {
                    id: 'gpt4',
                    name: 'GPT-4 Agent',
                    description: 'OpenAI GPT-4 language model',
                    category: 'ai_agents',
                    icon: 'psychology',
                    config_schema: {
                        api_key: { type: 'password', required: true },
                        model: { type: 'select', options: ['gpt-4', 'gpt-4-turbo'] },
                        temperature: { type: 'number', min: 0, max: 2, default: 0.7 },
                        max_tokens: { type: 'number', min: 1, max: 4096, default: 1000 },
                        system_prompt: { type: 'textarea', placeholder: 'System instructions...' }
                    }
                },
                {
                    id: 'claude',
                    name: 'Claude Agent',
                    description: 'Anthropic Claude AI assistant',
                    category: 'ai_agents',
                    icon: 'smart_toy',
                    config_schema: {
                        api_key: { type: 'password', required: true },
                        model: { type: 'select', options: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
                        max_tokens: { type: 'number', min: 1, max: 4096, default: 1000 },
                        temperature: { type: 'number', min: 0, max: 1, default: 0.7 }
                    }
                },
                {
                    id: 'gemini',
                    name: 'Gemini Agent',
                    description: 'Google Gemini AI model',
                    category: 'ai_agents',
                    icon: 'auto_awesome',
                    config_schema: {
                        api_key: { type: 'password', required: true },
                        model: { type: 'select', options: ['gemini-pro', 'gemini-pro-vision'] },
                        temperature: { type: 'number', min: 0, max: 1, default: 0.7 },
                        top_p: { type: 'number', min: 0, max: 1, default: 1 },
                        top_k: { type: 'number', min: 1, max: 40, default: 32 }
                    }
                }
            ],
            actions: [
                {
                    id: 'http_request',
                    name: 'HTTP Request',
                    description: 'Make HTTP API calls',
                    category: 'actions',
                    icon: 'api',
                    config_schema: {
                        url: { type: 'string', required: true },
                        method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
                        headers: { type: 'key_value', placeholder: 'Header name and value' },
                        body: { type: 'textarea', placeholder: 'Request body...' }
                    }
                },
                {
                    id: 'database_save',
                    name: 'Save to Database',
                    description: 'Store data in database',
                    category: 'actions',
                    icon: 'storage',
                    config_schema: {
                        connection_string: { type: 'password', required: true },
                        table: { type: 'string', required: true },
                        operation: { type: 'select', options: ['insert', 'update', 'upsert'] },
                        data_mapping: { type: 'key_value', placeholder: 'Field mapping' }
                    }
                },
                {
                    id: 'email_send',
                    name: 'Send Email',
                    description: 'Send email notifications',
                    category: 'actions',
                    icon: 'mail',
                    config_schema: {
                        smtp_host: { type: 'string', required: true },
                        smtp_port: { type: 'number', default: 587 },
                        username: { type: 'string', required: true },
                        password: { type: 'password', required: true },
                        to: { type: 'string', required: true },
                        subject: { type: 'string', required: true },
                        body: { type: 'textarea', required: true }
                    }
                }
            ],
            integrations: [
                {
                    id: 'slack',
                    name: 'Slack',
                    description: 'Send messages to Slack',
                    category: 'integrations',
                    icon: 'corporate_fare',
                    config_schema: {
                        webhook_url: { type: 'password', required: true },
                        channel: { type: 'string', required: true },
                        username: { type: 'string', default: 'Workflow Bot' },
                        icon_emoji: { type: 'string', default: ':robot_face:' }
                    }
                },
                {
                    id: 'google_sheets',
                    name: 'Google Sheets',
                    description: 'Read/write Google Sheets',
                    category: 'integrations',
                    icon: 'table_chart',
                    config_schema: {
                        credentials: { type: 'file', required: true },
                        spreadsheet_id: { type: 'string', required: true },
                        sheet_name: { type: 'string', required: true },
                        operation: { type: 'select', options: ['read', 'append', 'update'] }
                    }
                },
                {
                    id: 'notion',
                    name: 'Notion',
                    description: 'Interact with Notion workspace',
                    category: 'integrations',
                    icon: 'library_books',
                    config_schema: {
                        api_token: { type: 'password', required: true },
                        database_id: { type: 'string', required: true },
                        operation: { type: 'select', options: ['create_page', 'update_page', 'query_database'] }
                    }
                }
            ]
        };

        res.json({
            success: true,
            data: availableNodes
        });
    } catch (error) {
        console.error('Error fetching available nodes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch available nodes',
            message: error.message
        });
    }
});

/**
 * @route POST /api/ai-workflow/workflows/:id/validate
 * @desc Validate workflow configuration
 * @access Private
 */
router.post('/workflows/:id/validate', async (req, res) => {
    try {
        const { nodes, edges } = req.body;
        
        const validation = {
            is_valid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };

        // Basic validation checks
        if (!nodes || nodes.length === 0) {
            validation.is_valid = false;
            validation.errors.push('Workflow must have at least one node');
        }

        // Check for disconnected nodes
        const connectedNodes = new Set();
        edges.forEach(edge => {
            connectedNodes.add(edge.source);
            connectedNodes.add(edge.target);
        });

        const disconnectedNodes = nodes.filter(node => !connectedNodes.has(node.id));
        if (disconnectedNodes.length > 0 && nodes.length > 1) {
            validation.warnings.push(`${disconnectedNodes.length} disconnected nodes found`);
        }

        // Check for trigger nodes
        const triggerNodes = nodes.filter(node => node.type === 'trigger');
        if (triggerNodes.length === 0) {
            validation.warnings.push('No trigger nodes found - workflow cannot start automatically');
        }

        // Check for circular dependencies (simplified)
        const hasCircularDependency = edges.some(edge => edge.source === edge.target);
        if (hasCircularDependency) {
            validation.is_valid = false;
            validation.errors.push('Circular dependencies detected');
        }

        // Performance suggestions
        if (nodes.length > 10) {
            validation.suggestions.push('Consider breaking large workflows into smaller, reusable components');
        }

        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        console.error('Error validating workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate workflow',
            message: error.message
        });
    }
});

/**
 * @route POST /api/ai-workflow/test-ai-agent
 * @desc Test AI Agent configuration
 * @access Private
 */
router.post('/test-ai-agent', testAIAgent);

/**
 * @route POST /api/ai-workflow/results
 * @desc Save workflow execution results
 * @access Private
 */
router.post('/results', saveResults);

/**
 * @route GET /api/ai-workflow/test-azure-openai
 * @desc Test Azure OpenAI connection and configuration
 * @access Private
 */
router.get('/test-azure-openai', testAzureOpenAI);

module.exports = router;
