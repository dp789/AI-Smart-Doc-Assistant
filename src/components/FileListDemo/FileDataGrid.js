import {useState} from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, IconButton, Select, MenuItem, FormControl } from '@mui/material';
import { FirstPage, KeyboardArrowLeft, KeyboardArrowRight, LastPage } from '@mui/icons-material';
import FilePreviewModal from '../HelperComponent/NitFilePreviewModal';
import FileActionButtons from '../HelperComponent/NitFileActionButtons';
import CircleIcon from '@mui/icons-material/Circle';
import { useSelector } from 'react-redux';


const rows = [
  { id: 1, fileName: 'samplepdf', uploadSource: 'Wheat', tags: "add", uploadStatus:  "", uploadDate: '2021-01-01', url: 'file:///C:/Users/Anand.Vishwakarma/OneDrive%20-%20Nitor%20Infotech%20Pvt.%20Ltd/Desktop/sample-local-pdf.pdf' },
  { id: 2, fileName: 'Rice', uploadSource: 'Rice', tags: "Add", uploadStatus: "" , uploadDate: '2021-01-01' },
  { id: 3, fileName: 'Corn', uploadSource: 'Corn', tags: "Add", uploadStatus: "" , uploadDate: '2021-01-01' },
  // Add more rows as needed
];

const FileDataGrid = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedFile, setSelectedFile] = useState(null);
  const [open, setOpen] = useState(false);
  const files = useSelector((state) => state.folder.files);
  const status = useSelector((state) => state.folder.status);
  

  const handleView = (file) => {
    setSelectedFile(file);
    setOpen(true);
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.setAttribute('download', file.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


 const dataGridColumns = [
    {
      field: 'download', 
      headerName: '',  
      renderCell: (params) => (
        <FileActionButtons
          file={params.row}
          onView={handleView}
          onDownload={handleDownload}
        />
      ), 
      resizable: true, 
      flex :1,
      sortable: false,
      filterable: false
    },
    { 
      field: 'fileName', 
      headerName: 'File Name',
      resizable: true, 
      flex :1,
    },
    { 
      field: 'uploadSource', 
      headerName: 'Upload Source',  
      resizable: true, 
      flex :1,
    },
    { 
      field: 'tags', 
      headerName: 'Tags', 
      type: 'number', 
      renderCell : (params) =><button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-full">
      Add
    </button>,
      resizable: true, 
      flex :1,
    },
    { 
      field: 'uploadStatus', 
      headerName: 'Upload Status', 
      resizable: true, 
      renderCell : (params) => <CircleIcon/>,
      flex :1,
    },
    { 
      field: 'uploadDate', 
      headerName: 'Upload Date', 
      resizable: true, 
      flex :1,
    }
  ];


  const handleFirstPageButtonClick = () => {
    setPage(0);
  };

  const handleBackButtonClick = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  const handleNextButtonClick = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handleLastPageButtonClick = () => {
    setPage(Math.max(0, Math.ceil(files.length / pageSize) - 1));
  };

  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalPages = Math.ceil(files.length / pageSize);
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, files.length);

  return (
    <Box sx={{ height: 450, width: '100%' }}>
      <DataGrid 
       showToolbar
        checkboxSelection 
        rows={files} 
        loading={status === "loading" ?  <p>Loading files...</p> : ""}
        columns={dataGridColumns} 
        disableRowSelectionOnClick
        columnResizeMode="onChange"
        getRowHeight={() => 'auto'}
        density="comfortable"
        pageSizeOptions={[5, 10, 25]}
        pagination
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(model) => {
          setPage(model.page);
          setPageSize(model.pageSize);
        }}
        pageSize={pageSize}
        rowCount={files.length}
        sx={{
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f1f5f9',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
          },
          '& .MuiDataGrid-columnSeparator': {
            color: '#e2e8f0',
          },
          '& .MuiDataGrid-columnSeparator--resizing': {
            color: '#3b82f6',
          },
          '& .MuiDataGrid-columnHeader--resizing': {
            backgroundColor: '#eff6ff',
          },
          // Hide default footer
          '& .MuiDataGrid-footerContainer': {
            display: 'none',
          },
          '& .MuiDataGrid-columnSeparator': {
    visibility: 'visible', // force visibility
    width: '2px', // ensure it's not hidden due to width
    cursor: 'col-resize',
    color: '#e2e8f0',
  },
  '& .MuiDataGrid-columnHeaders:hover .MuiDataGrid-columnSeparator': {
    visibility: 'visible',
  },
        }}
      />
      
      {/* Custom Footer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          borderLeft: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          borderRadius: '0 0 8px 8px',
        }}
      >
        {/* Left side - Row count */}
        <Typography variant="body2" color="text.secondary">
          {`${startItem}-${endItem} of ${files.length} rows`}
        </Typography>

        {/* Right side - Pagination controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Page size selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Rows per page:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 60 }}>
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
                sx={{
                  '& .MuiSelect-select': {
                    padding: '4px 8px',
                    fontSize: '0.875rem',
                  },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleFirstPageButtonClick}
              disabled={page === 0}
              size="small"
              sx={{ color: page === 0 ? '#cbd5e1' : '#64748b' }}
            >
              <FirstPage />
            </IconButton>
            <IconButton
              onClick={handleBackButtonClick}
              disabled={page === 0}
              size="small"
              sx={{ color: page === 0 ? '#cbd5e1' : '#64748b' }}
            >
              <KeyboardArrowLeft />
            </IconButton>
            
            <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
              {`Page ${page + 1} of ${totalPages}`}
            </Typography>
            
            <IconButton
              onClick={handleNextButtonClick}
              disabled={page >= totalPages - 1}
              size="small"
              sx={{ color: page >= totalPages - 1 ? '#cbd5e1' : '#64748b' }}
            >
              <KeyboardArrowRight />
            </IconButton>
            <IconButton
              onClick={handleLastPageButtonClick}
              disabled={page >= totalPages - 1}
              size="small"
              sx={{ color: page >= totalPages - 1 ? '#cbd5e1' : '#64748b' }}
            >
              <LastPage />
            </IconButton>
          </Box>
        </Box>
      </Box>
      <Box>
      <FilePreviewModal open={open} file={selectedFile} onClose={() => setOpen(false)} />
      </Box>
    </Box>
  );
}

export default FileDataGrid;
