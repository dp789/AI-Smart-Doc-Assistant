    /**
     * Get documents by workspace ID - FIXED VERSION (strict workspace filtering)
     * @param {Object} user - User object with workspace ID
     * @returns {Promise<Object>} Documents list
     */
    async getDocumentsList(user) {
        try {
            // Force a fresh connection to avoid cached data issues
            const pool = await poolPromise;
            
            // Create a new request with explicit transaction isolation to ensure fresh data
            const request = pool.request();
            
            // Set read uncommitted to get the latest data (including recent inserts)
            // This prevents issues with connection pooling cached data
            await request.query('SET TRANSACTION ISOLATION LEVEL READ_UNCOMMITTED');
            
            request.input('WorkspaceId', sql.VarChar(255), user.id);
            
            console.log(`🔍 Fetching documents ONLY for workspace: ${user.id}`);
            
            // STRICT workspace filtering - only return documents for this specific workspace
            const result = await request.query(`
                SELECT 
                    id,
                    document_guid,
                    file_name,
                    ingestion_source_id,
                    number_of_pages,
                    is_active,
                    date_published,
                    raw_content,
                    file_type,
                    document_category,
                    workspace_id,
                    ingestion_status,
                    ingestion_date
                FROM document_meta_data WITH (NOLOCK)
                WHERE is_active = 1
                AND workspace_id = @WorkspaceId
                ORDER BY date_published DESC
            `);
            
            console.log(`📊 Found ${result.recordset.length} documents for workspace: ${user.id}`);
            
            // Log workspace filtering for debugging
            if (result.recordset.length > 0) {
                // Verify all returned documents belong to the correct workspace
                const workspaceIds = [...new Set(result.recordset.map(doc => doc.workspace_id))];
                console.log(`📋 Workspace IDs in results: ${workspaceIds.join(', ')}`);
                
                if (workspaceIds.length > 1 || workspaceIds[0] !== user.id) {
                    console.error(`🚨 WORKSPACE FILTERING FAILED - Expected only ${user.id}, got: ${workspaceIds.join(', ')}`);
                } else {
                    console.log(`✅ Workspace filtering verified - all documents belong to workspace: ${user.id}`);
                }
            } else {
                console.log(`ℹ️  No documents found for workspace: ${user.id}`);
            }
            
            return {
                success: true,
                data: result.recordset,
                totalCount: result.recordset.length,
                workspaceId: user.id,
                workspaceFiltered: true
            };
            
        } catch (error) {
            console.error('❌ Error getting documents by workspace:', error);
            throw new Error(`Failed to get documents by workspace: ${error.message}`);
        }
    }
