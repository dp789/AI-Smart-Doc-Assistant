const express = require('express');
const { poolPromise } = require('../db');

/**
 * AI Workflow Controller
 * Handles workflow creation, execution, and management
 */

// Get all workflows for a user
const getUserWorkflows = async (req, res) => {
    try {
        const userId = req.user?.id || 'demo-user'; // Fallback for demo mode
        
        // In a real implementation, fetch from database
        // For now, return mock data with sophisticated workflow examples
        const mockWorkflows = [
            {
                id: 'wf-001',
                name: 'Document Analysis Pipeline',
                description: 'Automated document processing with AI analysis',
                created_at: new Date('2024-01-15').toISOString(),
                updated_at: new Date('2024-01-20').toISOString(),
                user_id: userId,
                status: 'active',
                execution_count: 45,
                success_rate: 96.7,
                avg_execution_time: 2300, // milliseconds
                category: 'Document Processing',
                tags: ['AI', 'NLP', 'Automation'],
                nodes: [
                    {
                        id: 'trigger-1',
                        type: 'trigger',
                        position: { x: 100, y: 100 },
                        data: {
                            label: 'Document Upload',
                            description: 'Triggers when document is uploaded',
                            config: { watchFolder: '/uploads', fileTypes: ['pdf', 'docx'] }
                        }
                    },
                    {
                        id: 'ai-1',
                        type: 'aiAgent',
                        position: { x: 300, y: 100 },
                        data: {
                            label: 'GPT-4 Analyzer',
                            description: 'Analyze document content',
                            config: { model: 'gpt-4', task: 'document_analysis' }
                        }
                    }
                ],
                edges: [
                    {
                        id: 'e1-2',
                        source: 'trigger-1',
                        target: 'ai-1',
                        type: 'smoothstep'
                    }
                ]
            },
            {
                id: 'wf-002',
                name: 'Customer Support AI',
                description: 'Intelligent customer query resolution system',
                created_at: new Date('2024-01-10').toISOString(),
                updated_at: new Date('2024-01-18').toISOString(),
                user_id: userId,
                status: 'active',
                execution_count: 127,
                success_rate: 94.2,
                avg_execution_time: 1800,
                category: 'Customer Service',
                tags: ['Support', 'Automation', 'AI'],
                nodes: [],
                edges: []
            },
            {
                id: 'wf-003',
                name: 'Data Enrichment Flow',
                description: 'Enhance customer data with AI insights',
                created_at: new Date('2024-01-05').toISOString(),
                updated_at: new Date('2024-01-22').toISOString(),
                user_id: userId,
                status: 'draft',
                execution_count: 12,
                success_rate: 100,
                avg_execution_time: 3200,
                category: 'Data Processing',
                tags: ['Data', 'Enrichment', 'Analytics'],
                nodes: [],
                edges: []
            }
        ];

        res.json({
            success: true,
            data: mockWorkflows,
            total: mockWorkflows.length
        });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workflows',
            message: error.message
        });
    }
};

// Get a specific workflow by ID
const getWorkflowById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || 'demo-user';

        // Mock detailed workflow data
        const mockWorkflow = {
            id: id,
            name: 'Advanced Document Analysis',
            description: 'Complete document processing with multiple AI agents',
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-20').toISOString(),
            user_id: userId,
            status: 'active',
            execution_count: 45,
            success_rate: 96.7,
            avg_execution_time: 2300,
            category: 'Document Processing',
            tags: ['AI', 'NLP', 'Automation'],
            nodes: [
                {
                    id: 'trigger-webhook',
                    type: 'trigger',
                    position: { x: 50, y: 150 },
                    data: {
                        label: 'Webhook Trigger',
                        description: 'Receive document via API',
                        icon: 'webhook',
                        config: { 
                            endpoint: '/api/documents/upload',
                            method: 'POST',
                            authentication: 'bearer'
                        }
                    }
                },
                {
                    id: 'ai-gpt4',
                    type: 'aiAgent',
                    position: { x: 300, y: 100 },
                    data: {
                        label: 'GPT-4 Processor',
                        description: 'Extract and analyze content',
                        icon: 'psychology',
                        config: {
                            model: 'gpt-4',
                            temperature: 0.1,
                            maxTokens: 2000,
                            prompt: 'Analyze the document and extract key insights'
                        }
                    }
                },
                {
                    id: 'ai-claude',
                    type: 'aiAgent',
                    position: { x: 300, y: 200 },
                    data: {
                        label: 'Claude Summarizer',
                        description: 'Generate document summary',
                        icon: 'smartToy',
                        config: {
                            model: 'claude-3',
                            temperature: 0.2,
                            task: 'summarization'
                        }
                    }
                },
                {
                    id: 'action-save',
                    type: 'action',
                    position: { x: 550, y: 150 },
                    data: {
                        label: 'Save Results',
                        description: 'Store analysis in database',
                        icon: 'storage',
                        config: {
                            database: 'postgresql',
                            table: 'document_analysis',
                            fields: ['content', 'summary', 'insights']
                        }
                    }
                },
                {
                    id: 'action-notify',
                    type: 'action',
                    position: { x: 800, y: 150 },
                    data: {
                        label: 'Send Notification',
                        description: 'Notify user of completion',
                        icon: 'callMade',
                        config: {
                            type: 'email',
                            template: 'analysis_complete',
                            recipients: ['user@example.com']
                        }
                    }
                }
            ],
            edges: [
                {
                    id: 'e1-2',
                    source: 'trigger-webhook',
                    target: 'ai-gpt4',
                    type: 'smoothstep',
                    markerEnd: { type: 'arrowclosed' }
                },
                {
                    id: 'e1-3',
                    source: 'trigger-webhook',
                    target: 'ai-claude',
                    type: 'smoothstep',
                    markerEnd: { type: 'arrowclosed' }
                },
                {
                    id: 'e2-4',
                    source: 'ai-gpt4',
                    target: 'action-save',
                    type: 'smoothstep',
                    markerEnd: { type: 'arrowclosed' }
                },
                {
                    id: 'e3-4',
                    source: 'ai-claude',
                    target: 'action-save',
                    type: 'smoothstep',
                    markerEnd: { type: 'arrowclosed' }
                },
                {
                    id: 'e4-5',
                    source: 'action-save',
                    target: 'action-notify',
                    type: 'smoothstep',
                    markerEnd: { type: 'arrowclosed' }
                }
            ]
        };

        res.json({
            success: true,
            data: mockWorkflow
        });
    } catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workflow',
            message: error.message
        });
    }
};

// Save/Create workflow
const saveWorkflow = async (req, res) => {
    try {
        const { name, description, nodes, edges, category, tags } = req.body;
        const userId = req.user?.id || 'demo-user';

        // Validate required fields
        if (!name || !nodes) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Workflow name and nodes are required'
            });
        }

        // Generate workflow ID
        const workflowId = `wf-${Date.now()}`;

        // Mock saving to database
        const savedWorkflow = {
            id: workflowId,
            name,
            description: description || '',
            nodes,
            edges: edges || [],
            category: category || 'General',
            tags: tags || [],
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'draft',
            execution_count: 0,
            success_rate: 0,
            avg_execution_time: 0
        };

        // In real implementation, save to database
        console.log('Saving workflow:', savedWorkflow);

        res.json({
            success: true,
            data: savedWorkflow,
            message: 'Workflow saved successfully'
        });
    } catch (error) {
        console.error('Error saving workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save workflow',
            message: error.message
        });
    }
};

// Execute workflow
const executeWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const { inputData } = req.body;
        const userId = req.user?.id || 'demo-user';

        // Mock execution process
        const executionId = `exec-${Date.now()}`;
        
        // Simulate workflow execution with progress updates
        const execution = {
            id: executionId,
            workflow_id: id,
            user_id: userId,
            status: 'running',
            started_at: new Date().toISOString(),
            progress: 0,
            input_data: inputData || {},
            steps: [
                { id: 'step-1', name: 'Initialize', status: 'completed', duration: 100 },
                { id: 'step-2', name: 'Process Trigger', status: 'running', duration: null },
                { id: 'step-3', name: 'Execute AI Agents', status: 'pending', duration: null },
                { id: 'step-4', name: 'Run Actions', status: 'pending', duration: null },
                { id: 'step-5', name: 'Finalize', status: 'pending', duration: null }
            ]
        };

        // In real implementation, start async execution process
        setTimeout(() => {
            // Simulate completion after 3 seconds
            console.log(`Workflow ${id} execution completed: ${executionId}`);
        }, 3000);

        res.json({
            success: true,
            data: execution,
            message: 'Workflow execution started'
        });
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute workflow',
            message: error.message
        });
    }
};

// Get execution history
const getExecutionHistory = async (req, res) => {
    try {
        const { id } = req.params; // workflow id
        const userId = req.user?.id || 'demo-user';

        // Mock execution history
        const mockHistory = [
            {
                id: 'exec-001',
                workflow_id: id,
                status: 'completed',
                started_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                completed_at: new Date(Date.now() - 3598000).toISOString(),
                duration: 2000,
                success: true,
                input_size: '2.1 MB',
                output_size: '450 KB',
                steps_completed: 5,
                steps_total: 5
            },
            {
                id: 'exec-002',
                workflow_id: id,
                status: 'completed',
                started_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                completed_at: new Date(Date.now() - 7196000).toISOString(),
                duration: 4000,
                success: true,
                input_size: '1.8 MB',
                output_size: '380 KB',
                steps_completed: 5,
                steps_total: 5
            },
            {
                id: 'exec-003',
                workflow_id: id,
                status: 'failed',
                started_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
                completed_at: new Date(Date.now() - 10790000).toISOString(),
                duration: 1000,
                success: false,
                error: 'AI agent timeout',
                input_size: '3.2 MB',
                output_size: '0 KB',
                steps_completed: 2,
                steps_total: 5
            }
        ];

        res.json({
            success: true,
            data: mockHistory,
            total: mockHistory.length
        });
    } catch (error) {
        console.error('Error fetching execution history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch execution history',
            message: error.message
        });
    }
};

// Get workflow templates
const getWorkflowTemplates = async (req, res) => {
    try {
        const templates = [
            {
                id: 'template-001',
                name: 'Document Analysis Pipeline',
                description: 'Automated document processing with AI analysis',
                category: 'Document Processing',
                difficulty: 'Beginner',
                nodes: 5,
                estimated_time: '2-3 minutes',
                use_cases: ['Content Analysis', 'Document Summarization', 'Data Extraction'],
                preview_image: '/api/templates/document-analysis/preview.png',
                template_data: {
                    nodes: [
                        {
                            id: 'template-trigger',
                            type: 'trigger',
                            position: { x: 100, y: 100 },
                            data: {
                                label: 'Document Upload',
                                description: 'Triggers when document is uploaded'
                            }
                        }
                    ],
                    edges: []
                }
            },
            {
                id: 'template-002',
                name: 'Customer Support Bot',
                description: 'AI-powered customer query resolution',
                category: 'Customer Service',
                difficulty: 'Intermediate',
                nodes: 8,
                estimated_time: '5-7 minutes',
                use_cases: ['Query Classification', 'Automated Responses', 'Escalation Management'],
                preview_image: '/api/templates/customer-support/preview.png',
                template_data: {
                    nodes: [],
                    edges: []
                }
            },
            {
                id: 'template-003',
                name: 'Data Enrichment Pipeline',
                description: 'Enhance data with AI-powered insights',
                category: 'Data Processing',
                difficulty: 'Advanced',
                nodes: 12,
                estimated_time: '10-15 minutes',
                use_cases: ['Data Cleaning', 'Entity Recognition', 'Sentiment Analysis'],
                preview_image: '/api/templates/data-enrichment/preview.png',
                template_data: {
                    nodes: [],
                    edges: []
                }
            }
        ];

        res.json({
            success: true,
            data: templates,
            total: templates.length
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch templates',
            message: error.message
        });
    }
};

// Delete workflow
const deleteWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || 'demo-user';

        // In real implementation, delete from database
        console.log(`Deleting workflow ${id} for user ${userId}`);

        res.json({
            success: true,
            message: 'Workflow deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete workflow',
            message: error.message
        });
    }
};

// Get workflow analytics
const getWorkflowAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id || 'demo-user';

        const analytics = {
            overview: {
                total_workflows: 15,
                active_workflows: 12,
                total_executions: 1247,
                success_rate: 94.2,
                avg_execution_time: 2300,
                data_processed: '45.2 GB',
                cost_saved: '$2,450'
            },
            execution_trends: [
                { date: '2024-01-01', executions: 45, success_rate: 92.1 },
                { date: '2024-01-02', executions: 52, success_rate: 94.3 },
                { date: '2024-01-03', executions: 61, success_rate: 96.7 },
                { date: '2024-01-04', executions: 48, success_rate: 93.8 },
                { date: '2024-01-05', executions: 55, success_rate: 95.2 }
            ],
            popular_nodes: [
                { name: 'GPT-4 Agent', usage_count: 234, success_rate: 97.1 },
                { name: 'Document Parser', usage_count: 189, success_rate: 94.7 },
                { name: 'Data Transformer', usage_count: 156, success_rate: 98.2 },
                { name: 'Email Sender', usage_count: 143, success_rate: 99.1 },
                { name: 'Claude Agent', usage_count: 98, success_rate: 95.8 }
            ],
            category_distribution: [
                { category: 'Document Processing', count: 6, percentage: 40 },
                { category: 'Customer Service', count: 4, percentage: 26.7 },
                { category: 'Data Processing', count: 3, percentage: 20 },
                { category: 'Marketing', count: 2, percentage: 13.3 }
            ]
        };

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics',
            message: error.message
        });
    }
};

// Test AI Agent configuration
const testAIAgent = async (req, res) => {
    try {
        const { modelType, systemPrompt, userPrompt, temperature, maxTokens } = req.body;
        
        // Import the Azure OpenAI service
        const azureOpenAIService = require('../services/azureOpenAIService');
        
        // Test the configuration with actual Azure OpenAI
        const testPrompt = userPrompt?.replace('{DOCUMENT_CONTENT}', 'This is a test document for configuration validation.') || 
                          'Hello, this is a test to validate the AI agent configuration. Please respond with a confirmation.';
        
        const testResult = await azureOpenAIService.processDocument({
            documentContent: 'This is a test document content for validation.',
            fileName: 'test-document.txt',
            systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
            userPrompt: testPrompt,
            model: modelType || 'gpt4',
            temperature: temperature || 0.7,
            maxTokens: Math.min(maxTokens || 500, 500), // Limit test to 500 tokens
            outputFormat: 'text'
        });
        
        res.status(200).json({
            message: 'AI Agent configuration test completed successfully',
            result: {
                success: testResult.success,
                model: modelType || 'gpt4',
                response: testResult.data,
                metadata: {
                    ...testResult.metadata,
                    temperature: temperature || 0.7,
                    maxTokens: maxTokens || 500,
                    testedAt: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('AI Agent test error:', error);
        res.status(500).json({
            message: 'AI Agent test failed',
            error: error.message,
            details: error.response?.data || 'No additional details available'
        });
    }
};

// Save workflow execution results
const saveResults = (req, res) => {
    try {
        const { workflowId, results, metadata } = req.body;
        
        const savedResult = {
            id: `result-${Date.now()}`,
            workflowId,
            results,
            metadata: {
                ...metadata,
                savedAt: new Date().toISOString()
            }
        };
        
        // In a real implementation, save to database
        // For now, just return success
        
        res.status(201).json({
            message: 'Results saved successfully',
            resultId: savedResult.id
        });
    } catch (error) {
        console.error('Save results error:', error);
        res.status(500).json({
            message: 'Failed to save results',
            error: error.message
        });
    }
};

// Test Azure OpenAI connection
const testAzureOpenAI = async (req, res) => {
    try {
        const azureOpenAIService = require('../services/azureOpenAIService');
        
        // Test the connection
        const connectionTest = await azureOpenAIService.testConnection();
        
        if (connectionTest.success) {
            res.status(200).json({
                message: 'Azure OpenAI connection successful',
                result: connectionTest,
                config: azureOpenAIService.validateConfig()
            });
        } else {
            res.status(500).json({
                message: 'Azure OpenAI connection failed',
                error: connectionTest.message,
                details: connectionTest.error
            });
        }
    } catch (error) {
        console.error('Azure OpenAI connection test error:', error);
        res.status(500).json({
            message: 'Azure OpenAI connection test failed',
            error: error.message
        });
    }
};

module.exports = {
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
};
