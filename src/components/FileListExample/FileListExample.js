import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import FileListHeader from '../FileListHeader';
import ResizablePanels from '../ResizablePanels';
import './FileListExample.css';

const FileListExample = () => {
  const [fileCount, setFileCount] = useState(0);
  const [viewMode, setViewMode] = useState('list');

  const handleSearch = (query) => {
    console.log('Search query:', query);
    // Implement search logic here
  };

  const handleAddFile = () => {
    console.log('Add file clicked');
    setFileCount(prev => prev + 1);
    // Implement file upload logic here
  };

  const handleRefresh = () => {
    console.log('Refresh clicked');
    // Implement refresh logic here
  };

  const handleSort = (sortOption) => {
    console.log('Sort by:', sortOption);
    // Implement sort logic here
  };

  const handleFilter = (filterOption) => {
    console.log('Filter by:', filterOption);
    // Implement filter logic here
  };

  const handleViewModeChange = (mode) => {
    console.log('View mode changed to:', mode);
    setViewMode(mode);
  };

  const leftPanel = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <FileListHeader
        title="My Files"
        fileCount={fileCount}
        onSearch={handleSearch}
        onAddFile={handleAddFile}
        onRefresh={handleRefresh}
        onSort={handleSort}
        onFilter={handleFilter}
        onViewModeChange={handleViewModeChange}
        viewMode={viewMode}
      />
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Paper sx={{ height: '100%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            File list content will appear here
          </Typography>
        </Paper>
      </Box>
    </Box>
  );

  const rightPanel = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        File Details Panel
      </Typography>
      <Paper sx={{ p: 2, flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary">
          This is the right panel that can be resized using the divider.
          <br /><br />
          You can drag the divider between the panels to adjust their widths.
          <br /><br />
          The FileListHeader component provides:
          <br />• Search functionality
          <br />• Add file button
          <br />• Sort options
          <br />• Filter options
          <br />• View mode toggle (List/Grid)
          <br />• Refresh button
          <br />• File count display
        </Typography>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', width: '100%' }}>
      <ResizablePanels
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        initialLeftWidth={60}
        minLeftWidth={30}
        maxLeftWidth={80}
      />
    </Box>
  );
};

export default FileListExample; 