import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Folder,
  Search,
  Add,
  Sort,
  FilterList,
  ViewList,
  ViewModule,
  MoreVert,
  Refresh,
  CloudUpload,
  DeleteOutline,
  Archive
} from '@mui/icons-material';
import './FileListHeader.css';

const FileListHeader = ({ 
  title = "File List",
  onSearch,
  onAddFile,
  onRefresh,
  onSort,
  onFilter,
  onViewModeChange,
  viewMode = 'list',
  fileCount = 0,
  className = '',
  containerStyle = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSortMenuOpen = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortAnchorEl(null);
  };

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleViewModeChange = (mode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Name (Z-A)', value: 'name-desc' },
    { label: 'Date Modified (Newest)', value: 'date-desc' },
    { label: 'Date Modified (Oldest)', value: 'date-asc' },
    { label: 'Size (Largest)', value: 'size-desc' },
    { label: 'Size (Smallest)', value: 'size-asc' },
  ];

  const filterOptions = [
    { label: 'All Files', value: 'all' },
    { label: 'Documents', value: 'documents' },
    { label: 'Images', value: 'images' },
    { label: 'Videos', value: 'videos' },
    { label: 'Audio', value: 'audio' },
    { label: 'Archives', value: 'archives' },
  ];

  const renderDesktopHeader = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2 }}>
      {/* Search Bar */}
      <TextField
        placeholder="Search files..."
        value={searchQuery}
        onChange={handleSearchChange}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: '#64748b' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          minWidth: 300,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#f8fafc',
            '&:hover': {
              backgroundColor: '#f1f5f9',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
            },
          },
        }}
      />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={onAddFile}
          sx={{
            borderColor: '#cbd5e1',
            color: '#64748b',
            fontWeight: 500,
            borderRadius: 2,
            fontSize: '0.875rem',
            '&:hover': {
              borderColor: '#94a3b8',
              backgroundColor: '#f8fafc',
              color: '#1e293b',
            }
          }}
        >
          Add File
        </Button>

        <Button
          variant="outlined"
          size="small"
          startIcon={<Sort />}
          onClick={handleSortMenuOpen}
          sx={{
            borderColor: '#cbd5e1',
            color: '#64748b',
            fontWeight: 500,
            borderRadius: 2,
            fontSize: '0.875rem',
            '&:hover': {
              borderColor: '#94a3b8',
              backgroundColor: '#f8fafc',
              color: '#1e293b',
            }
          }}
        >
          Sort
        </Button>

        <Button
          variant="outlined"
          size="small"
          startIcon={<FilterList />}
          onClick={handleFilterMenuOpen}
          sx={{
            borderColor: '#cbd5e1',
            color: '#64748b',
            fontWeight: 500,
            borderRadius: 2,
            fontSize: '0.875rem',
            '&:hover': {
              borderColor: '#94a3b8',
              backgroundColor: '#f8fafc',
              color: '#1e293b',
            }
          }}
        >
          Filter
        </Button>

        <IconButton
          onClick={onRefresh}
          sx={{
            color: '#64748b',
            '&:hover': {
              backgroundColor: '#f8fafc',
              color: '#1e293b',
            }
          }}
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* View Mode Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={() => handleViewModeChange('list')}
          sx={{
            color: viewMode === 'list' ? '#1e293b' : '#64748b',
            backgroundColor: viewMode === 'list' ? '#f1f5f9' : 'transparent',
            '&:hover': {
              backgroundColor: '#f8fafc',
              color: '#1e293b',
            }
          }}
        >
          <ViewList />
        </IconButton>
        <IconButton
          onClick={() => handleViewModeChange('grid')}
          sx={{
            color: viewMode === 'grid' ? '#1e293b' : '#64748b',
            backgroundColor: viewMode === 'grid' ? '#f1f5f9' : 'transparent',
            '&:hover': {
              backgroundColor: '#f8fafc',
              color: '#1e293b',
            }
          }}
        >
          <ViewModule />
        </IconButton>
      </Box>
    </Box>
  );

  const renderMobileHeader = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        placeholder="Search..."
        value={searchQuery}
        onChange={handleSearchChange}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: '#64748b' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          flexGrow: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#f8fafc',
            '&:hover': {
              backgroundColor: '#f1f5f9',
            },
          },
        }}
      />
      
      <IconButton
        onClick={handleMenuOpen}
        sx={{
          color: '#64748b',
          '&:hover': {
            backgroundColor: '#f8fafc',
            color: '#1e293b',
          }
        }}
      >
        <MoreVert />
      </IconButton>
    </Box>
  );

  return (
    <AppBar 
      position="static" 
      elevation={0}
      className={`file-list-header ${className}`}
      style={containerStyle}
      sx={{ 
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        color: 'text.primary',
        borderRadius: 0,
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', padding: '0 16px !important' }}>
        {/* Title and File Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              color: '#1e293b',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Folder sx={{ color: '#3b82f6' }} />
            {title}
          </Typography>
          
          <Chip
            label={`${fileCount} files`}
            size="small"
            sx={{
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && renderDesktopHeader()}

        {/* Mobile Navigation */}
        {isMobile && renderMobileHeader()}
      </Toolbar>

      {/* Menus */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <MenuItem onClick={onAddFile}>
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText>Add File</ListItemText>
        </MenuItem>
        <MenuItem onClick={onRefresh}>
          <ListItemIcon>
            <Refresh />
          </ListItemIcon>
          <ListItemText>Refresh</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSortMenuOpen}>
          <ListItemIcon>
            <Sort />
          </ListItemIcon>
          <ListItemText>Sort</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleFilterMenuOpen}>
          <ListItemIcon>
            <FilterList />
          </ListItemIcon>
          <ListItemText>Filter</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleViewModeChange('list')}>
          <ListItemIcon>
            <ViewList />
          </ListItemIcon>
          <ListItemText>List View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleViewModeChange('grid')}>
          <ListItemIcon>
            <ViewModule />
          </ListItemIcon>
          <ListItemText>Grid View</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              if (onSort) onSort(option.value);
              handleSortMenuClose();
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        {filterOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              if (onFilter) onFilter(option.value);
              handleFilterMenuClose();
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </AppBar>
  );
};

export default FileListHeader; 