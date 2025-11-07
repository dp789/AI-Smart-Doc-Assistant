-- Create notifications table for file upload notifications
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notifications' AND xtype='U')
BEGIN
    CREATE TABLE dbo.notifications (
        id varchar(255) NOT NULL DEFAULT NEWID(),
        user_id varchar(255) NOT NULL,
        title nvarchar(255) NOT NULL,
        message nvarchar(500) NOT NULL,
        document_id varchar(255) NULL,
        is_read bit NOT NULL DEFAULT 0,
        created_at datetime NOT NULL DEFAULT GETDATE(),
        ingestion_source int NOT NULL,
        notification_type varchar(50) NOT NULL DEFAULT 'upload',
        
        CONSTRAINT PK_notifications PRIMARY KEY (id)
    );

    -- Create indexes for performance
    CREATE INDEX idx_notifications_user_id ON dbo.notifications(user_id);
    CREATE INDEX idx_notifications_created_at ON dbo.notifications(created_at DESC);
    CREATE INDEX idx_notifications_is_read ON dbo.notifications(is_read);
    CREATE INDEX idx_notifications_user_unread ON dbo.notifications(user_id, is_read) WHERE is_read = 0;
    
    PRINT 'Notifications table created successfully with indexes.';
END
ELSE
BEGIN
    PRINT 'Notifications table already exists.';
END

-- Verify the table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'notifications'
ORDER BY ORDINAL_POSITION; 