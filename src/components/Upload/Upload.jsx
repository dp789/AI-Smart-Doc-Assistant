import React, { useState, useCallback } from 'react';
import ResizablePanels from '../ResizablePanels';
import './Upload.css';
import RightPanelContent from './RightPannel';
import LeftPanelContent from './LeftPannel';

const Upload = () => {
    // State to trigger refresh of document list
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Callback to trigger refresh of left panel
    const handleUploadSuccess = useCallback(() => {
        console.log('🔄 Triggering document list refresh after successful upload');
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
            <ResizablePanels
                leftPanel={<LeftPanelContent refreshTrigger={refreshTrigger} />}
                rightPanel={<RightPanelContent onUploadSuccess={handleUploadSuccess} />}
                initialLeftWidth={55}
                minLeftWidth={10}
                maxLeftWidth={90}
                className="upload-container"
            />
        </div>
    );
};

export default Upload;