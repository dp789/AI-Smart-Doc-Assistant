// FileActionButtons.jsx
import React from 'react';
import { IconButton, Box } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';

const FileActionButtons = ({ file, onView, onDownload }) => {
  return (
    <Box sx={{display : "flex"}}>
      <IconButton onClick={() => onView(file)} title="View">
        <VisibilityIcon />
      </IconButton>
      <IconButton onClick={() => onDownload(file)} title="Download">
        <DownloadIcon />
      </IconButton>
    </Box>
  );
};

export default FileActionButtons;
