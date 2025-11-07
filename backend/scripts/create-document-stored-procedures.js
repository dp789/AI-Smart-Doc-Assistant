#!/usr/bin/env node

const { poolPromise, sql } = require('../db');
const fs = require('fs');
const path = require('path');

async function createDocumentStoredProcedures() {
    console.log('🔧 Creating Document Metadata Stored Procedures');
    console.log('===============================================\n');
    
    try {
        // Wait for database connection
        const pool = await poolPromise;
        console.log('✅ Database connection established');
        
        // Document metadata stored procedures
        const procedures = [
            {
                name: 'sp_InsertDocumentMetadata',
                sql: `
                    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_InsertDocumentMetadata]') AND type in (N'P', N'PC'))
                    BEGIN
                        EXEC dbo.sp_executesql @statement = N'
                        CREATE PROCEDURE [dbo].[sp_InsertDocumentMetadata]
                            @Id VARCHAR(255),
                            @DocumentGuid VARCHAR(255),
                            @FileName VARCHAR(255),
                            @IngestionSourceId INT,
                            @NumberOfPages INT = NULL,
                            @IsActive BIT = 1,
                            @DatePublished DATETIME = NULL,
                            @rawContent VARCHAR(255),
                            @DocumentCategory INT = NULL,
                            @WorkspaceId VARCHAR(255) = NULL
                        AS
                        BEGIN
                            SET NOCOUNT ON;
                            
                            -- Set default date if not provided
                            IF @DatePublished IS NULL
                                SET @DatePublished = GETUTCDATE();
                            
                            INSERT INTO document_meta_data (
                                id,
                                document_guid,
                                file_name,
                                ingestion_source_id,
                                number_of_pages,
                                is_active,
                                date_published,
                                raw_content,
                                document_category,
                                workspace_id
                            ) VALUES (
                                @Id,
                                @DocumentGuid,
                                @FileName,
                                @IngestionSourceId,
                                @NumberOfPages,
                                @IsActive,
                                @DatePublished,
                                @rawContent,
                                @DocumentCategory,
                                @WorkspaceId
                            );
                            
                            -- Return the inserted record
                            SELECT 
                                id,
                                document_guid,
                                file_name,
                                ingestion_source_id,
                                number_of_pages,
                                is_active,
                                date_published,
                                raw_content,
                                document_category,
                                workspace_id,
                                Success = 1,
                                Message = ''Document metadata inserted successfully''
                            FROM document_meta_data 
                            WHERE id = @Id;
                        END'
                    END
                `
            },
            {
                name: 'sp_GetDocumentMetadata',
                sql: `
                    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetDocumentMetadata]') AND type in (N'P', N'PC'))
                    BEGIN
                        EXEC dbo.sp_executesql @statement = N'
                        CREATE PROCEDURE [dbo].[sp_GetDocumentMetadata]
                            @DocumentGuid VARCHAR(255)
                        AS
                        BEGIN
                            SET NOCOUNT ON;
                            
                            SELECT 
                                id,
                                document_guid,
                                file_name,
                                ingestion_source_id,
                                number_of_pages,
                                is_active,
                                date_published,
                                raw_content
                            FROM document_meta_data 
                            WHERE document_guid = @DocumentGuid AND is_active = 1;
                        END'
                    END
                `
            },
            {
                name: 'sp_UpdateDocumentMetadata',
                sql: `
                    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateDocumentMetadata]') AND type in (N'P', N'PC'))
                    BEGIN
                        EXEC dbo.sp_executesql @statement = N'
                        CREATE PROCEDURE [dbo].[sp_UpdateDocumentMetadata]
                            @Id VARCHAR(255),
                            @NumberOfPages INT = NULL,
                            @IsActive BIT = NULL,
                            @DatePublished DATETIME = NULL,
                            @rawContent VARCHAR(255)
                        AS
                        BEGIN
                            SET NOCOUNT ON;
                            
                            UPDATE document_meta_data 
                            SET 
                                number_of_pages = COALESCE(@NumberOfPages, number_of_pages),
                                is_active = COALESCE(@IsActive, is_active),
                                date_published = COALESCE(@DatePublished, date_published),
                                raw_content = COALESCE(@rawContent, raw_content)
                            WHERE id = @Id;
                            
                            -- Return the updated record
                            SELECT 
                                id,
                                document_guid,
                                file_name,
                                ingestion_source_id,
                                number_of_pages,
                                is_active,
                                date_published,
                                Success = 1,
                                Message = ''Document metadata updated successfully''
                            FROM document_meta_data 
                            WHERE id = @Id;
                        END'
                    END
                `
            }
        ];
        
        // Execute each procedure creation
        for (const procedure of procedures) {
            try {
                console.log(`🔄 Creating ${procedure.name}...`);
                await pool.request().query(procedure.sql);
                console.log(`✅ ${procedure.name} created successfully`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`ℹ️  ${procedure.name} already exists, skipping...`);
                } else {
                    console.error(`❌ Error creating ${procedure.name}:`, error.message);
                    throw error;
                }
            }
        }
        
        // Test the stored procedures
        console.log('\n🧪 Testing document metadata stored procedures...');
        
        // Test sp_InsertDocumentMetadata
        try {
            const testId = 'test-' + Date.now();
            const testGuid = 'test-guid-' + Date.now();
            
            const testResult = await pool.request()
                .input('Id', sql.VarChar(255), testId)
                .input('DocumentGuid', sql.VarChar(255), testGuid)
                .input('FileName', sql.VarChar(255), 'test-file.pdf')
                .input('IngestionSourceId', sql.Int, 3)
                .input('NumberOfPages', sql.Int, 5)
                .input('IsActive', sql.Bit, 1)
                .input('rawContent', sql.VarChar(255), 'test-blob-url')
                .input('DocumentCategory', sql.Int, null)
                .input('WorkspaceId', sql.VarChar(255), 'test-workspace-id')
                .execute('sp_InsertDocumentMetadata');
            
            if (testResult.recordset && testResult.recordset.length > 0) {
                console.log('✅ sp_InsertDocumentMetadata test successful:', testResult.recordset[0]);
            }
            
            // Clean up test data
            await pool.request().query(`DELETE FROM document_meta_data WHERE id = '${testId}'`);
            console.log('🧹 Test data cleaned up');
            
        } catch (error) {
            console.error('❌ sp_InsertDocumentMetadata test failed:', error.message);
        }
        
        console.log('\n🎉 ✅ Document metadata stored procedures created and tested successfully!');
        
        await pool.close();
        return true;
        
    } catch (error) {
        console.error('\n💥 Failed to create document stored procedures:', error.message);
        console.error('Full error:', error);
        return false;
    }
}

if (require.main === module) {
    createDocumentStoredProcedures()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = createDocumentStoredProcedures; 