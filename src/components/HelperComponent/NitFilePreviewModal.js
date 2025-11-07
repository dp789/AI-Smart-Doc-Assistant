// FilePreviewModal.jsx
import React from 'react';
import { Box, Modal, Typography } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  height: '80%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  overflow: 'auto',
  p: 2,
};

const FilePreviewModal = ({ open, file, onClose }) => {
  const renderPreview = (file) => {
    if (!file) return null;
    const ext = file.fileName.split('.').pop().toLowerCase();

    if (ext === 'pdf' || ext === 'html') {
      return <iframe src={file.url} width="100%" height="100%" title={file.fileName} />;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <img src={file.url} alt={file.fileName} style={{ maxWidth: '100%', maxHeight: '100%' }} />;
    } else {
      return (
        <Typography>
          Cannot preview this file type. <br />
          <a href={file.url} target="_blank" rel="noopener noreferrer">{file.fileName}</a>
        </Typography>
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>{file?.fileName}</Typography>
        {renderPreview(file)}
      </Box>
    </Modal>
  );
};

export default FilePreviewModal;
