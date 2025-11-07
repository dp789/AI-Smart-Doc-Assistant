import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { getPublicPath } from "../envConfig";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Box,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  Tooltip,
  ButtonGroup,
  MenuList,
  Paper,
  Popper,
  ClickAwayListener,
  Grow,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Chat,
  Description,
  CloudUpload,
  Person,
  Work,
  Analytics,
  AccountCircle,
  ExitToApp,
  Warning,
  Folder,
  Logout,
  Settings,
  SmartToy,
  Psychology,
  AutoAwesome,
  Science,
  LibraryBooks,
  UploadFile,
  ManageSearch,
  KeyboardArrowDown,
  Notifications,
  Help,
  Security,
  Language,
  DarkMode,
  LightMode,
  AccountTree,
  Quiz,
} from "@mui/icons-material";
import "./Header.css";
import "./HeaderFix.css";
import useUserProfile from "../hooks/useUserProfile";
import EnhancedAvatar from "./EnhancedAvatar";
import { useNotifications } from "../hooks/useNotifications";
import NotificationPanel from "./NotificationPanel";

const Header = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const publicPath = getPublicPath();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);

  // Check if in bypass mode
  const bypassMode = sessionStorage.getItem("bypass_auth") === "true";

  // Enhanced user profile with photo support
  const userProfile = useUserProfile();

  // Database notification system
  const { unreadCount } = useNotifications();

  // Helper function to get user display name (now using userProfile)
  const getUserDisplayName = () => {
    return userProfile.name || "User";
  };

  // Helper function to get user email (now using userProfile)
  const getUserEmail = () => {
    return userProfile.email || "";
  };

  // Helper function to get user initials (now using userProfile)
  const getUserInitials = () => {
    return userProfile.initials || "U";
  };

  const handleLogin = () => {
    // Clear any existing session data that might be causing issues
    sessionStorage.removeItem("msal_login_error");
    localStorage.removeItem("msal.interaction.status");

    // Store origin for after login completed
    sessionStorage.setItem("loginRedirectOrigin", window.location.href);

    instance.loginRedirect(loginRequest).catch((error) => {
      console.error("Login error:", error);
      sessionStorage.setItem(
        "msal_login_error",
        JSON.stringify({
          message: error.message || "Login failed",
          timestamp: new Date().toISOString(),
        })
      );
    });
  };

  const handleLogout = () => {
    // Clear any application state here before logout
    sessionStorage.removeItem("msal_login_error");
    sessionStorage.removeItem("msal_return_url");

    const logoutRequest = {
      account: instance.getActiveAccount(),
      postLogoutRedirectUri: window.location.origin + publicPath,
      authority: instance.getConfiguration().auth.authority,
    };

    instance
      .logoutRedirect(logoutRequest)
      .catch((error) => console.error("Logout error:", error));
  };

  // Handle exiting bypass mode
  const handleExitBypass = () => {
    sessionStorage.removeItem("bypass_auth");
    console.log("Exiting bypass mode");
    navigate("/login", { replace: true });
  };

  // Check if the current path is one of the advanced AI tools paths
  const isAdvancedAIPath = [
    "/ai-workflow",
    "/mcp-chat",
    "/mcp-tools",
    "/mcp-analytics",
  ].includes(location.pathname);

  // Show navigation if authenticated normally OR in bypass mode
  const showNavigation = isAuthenticated || bypassMode;

  // AI-focused navigation structure
  const documentItems = [
    {
      path: "/documents",
      label: "Document Library",
      icon: <LibraryBooks />,
      description: "Browse & organize documents",
    },
    {
      path: "/Upload",
      label: "Upload Documents",
      icon: <UploadFile />,
      description: "Add new research materials",
    },
    {
      path: "/file-list",
      label: "Manage Files",
      icon: <ManageSearch />,
      description: "File management tools",
    },
  ];

  const aiAssistantItems = [
    {
      path: "/document-chat",
      label: "Research Chat",
      icon: <Psychology />,
      description: "AI-powered document analysis",
    },
    {
      path: "/chatbot",
      label: "AI Assistant",
      icon: <SmartToy />,
      description: "General AI assistance",
    },
  ];

  const advancedToolsItems = [
    {
      path: "/ai-workflow",
      label: "AI Workflow Builder",
      icon: <AccountTree />,
      description: "Create AI agent workflows",
    },
    {
      path: "/mcp-chat",
      label: "Advanced Research",
      icon: <Science />,
      description: "Deep research capabilities",
    },
    {
      path: "/mcp-tools",
      label: "Research Tools",
      icon: <AutoAwesome />,
      description: "Specialized AI tools",
    },
    {
      path: "/mcp-analytics",
      label: "Document Analytics",
      icon: <Analytics />,
      description: "Document insights & metrics",
    },
    {
      path: "/mcq-generator",
      label: "MCQ Generator",
      icon: <Quiz />,
      description: "Generate MCQs from web content",
    },
    // {
    //   path: "/test-chatbot",
    //   label: "Test ChatBot",
    //   icon: <Psychology />,
    //   description: "API testing interface",
    // },
  ];

  // All navigation items for mobile
  const allNavigationItems = [
    ...documentItems,
    ...aiAssistantItems,
    ...advancedToolsItems,
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAiToolsToggle = () => {
    setAiToolsOpen(!aiToolsOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const isActive = (path) => location.pathname === path;

  const renderNavigationItem = (item) => (
    <ListItemButton
      key={item.path}
      component={Link}
      to={item.path}
      selected={isActive(item.path)}
      onClick={() => setMobileOpen(false)}
      className="nav-item-material"
      sx={{
        borderRadius: 3,
        mx: 1,
        my: 0.5,
        minHeight: 56,
        color: isActive(item.path) ? "#1976d2" : "#616161",
        backgroundColor: isActive(item.path) ? "#e3f2fd" : "transparent",
        fontWeight: isActive(item.path) ? 600 : 500,
        fontSize: "0.875rem",
        "&:hover": {
          backgroundColor: "#f5f5f5",
          color: "#1976d2",
          transform: "translateX(4px)",
          "& .MuiListItemIcon-root": {
            color: "#1976d2",
          },
        },
        "&.Mui-selected": {
          backgroundColor: "#dbeafe",
          color: "#1d4ed8",
          "&:hover": {
            backgroundColor: "#bfdbfe",
          },
        },
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <ListItemIcon
        sx={{
          color: isActive(item.path) ? "#1976d2" : "#616161",
          minWidth: 44,
          "& .MuiSvgIcon-root": {
            fontSize: "1.3rem",
          },
          transition: "color 0.2s ease",
        }}
      >
        {item.icon}
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        secondary={item.description}
        primaryTypographyProps={{
          fontWeight: "inherit",
          fontSize: "0.875rem",
        }}
        secondaryTypographyProps={{
          fontSize: "0.75rem",
          color: isActive(item.path) ? "#1976d2" : "#9e9e9e",
        }}
      />
    </ListItemButton>
  );

  const renderDesktopNavigation = () => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexGrow: 1,
        gap: 2,
        ml: 4,
        maxWidth: "100%",
        overflow: "hidden",
        flexShrink: 1,
        minWidth: 0,
      }}
    >
      {/* Modern Card-Based Navigation */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          padding: "8px 12px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(10px)",
          maxWidth: "100%",
          overflow: "hidden",
          flexShrink: 1,
          minWidth: 0,
          className: "nav-card-container",
        }}
      >
        {/* Documents Card */}
        <Tooltip title="Manage your document library" arrow placement="bottom">
          <Box
            component={Link}
            to="/documents"
            className="nav-card-item"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              padding: "8px 16px",
              borderRadius: "16px",
              textDecoration: "none",
              background: isActive("/documents")
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
              color: isActive("/documents") ? "#ffffff" : "#64748b",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              flexShrink: 1,
              minWidth: 0,
              "&:hover": {
                background: isActive("/documents")
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                color: "#475569",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.25)",
              },
            }}
          >
            <LibraryBooks sx={{ fontSize: "1.2rem" }} />
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
              }}
            >
              Documents
            </Typography>
          </Box>
        </Tooltip>

        {/* Upload Card */}
        <Tooltip title="Upload new research materials" arrow placement="bottom">
          <Box
            component={Link}
            to="/Upload"
            className="nav-card-item"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              padding: "8px 16px",
              borderRadius: "16px",
              textDecoration: "none",
              background: isActive("/Upload")
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "transparent",
              color: isActive("/Upload") ? "#ffffff" : "#64748b",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              flexShrink: 1,
              minWidth: 0,
              "&:hover": {
                background: isActive("/Upload")
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                color: "#065f46",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
              },
            }}
          >
            <UploadFile sx={{ fontSize: "1.2rem" }} />
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
              }}
            >
              Upload
            </Typography>
          </Box>
        </Tooltip>

        {/* Files Card : Not used for now */}
        {/* <Tooltip title="Organize and manage files" arrow placement="bottom">
          <Box
            component={Link}
            to="/file-list"
            className="nav-card-item"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              padding: "8px 16px",
              borderRadius: "16px",
              textDecoration: "none",
              background: isActive("/file-list")
                ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                : "transparent",
              color: isActive("/file-list") ? "#ffffff" : "#64748b",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              flexShrink: 1,
              minWidth: 0,
              "&:hover": {
                background: isActive("/file-list")
                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                  : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                color: "#92400e",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
              },
            }}
          >
            <ManageSearch sx={{ fontSize: "1.2rem" }} />
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
              }}
            >
              Files
            </Typography>
          </Box>
        </Tooltip> */}
      </Box>

      {/* AI Assistant Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          padding: "8px 12px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(10px)",
          maxWidth: "100%",
          overflow: "hidden",
          flexShrink: 1,
          minWidth: 0,
          className: "nav-card-container",
        }}
      >
        {/* AI Chat Card */}
        <Tooltip title="AI-powered document analysis" arrow placement="bottom">
          <Box
            component={Link}
            to="/document-chat"
            className="nav-card-item"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              padding: "8px 16px",
              borderRadius: "16px",
              textDecoration: "none",
              background: isActive("/document-chat")
                ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                : "transparent",
              color: isActive("/document-chat") ? "#ffffff" : "#64748b",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              flexShrink: 1,
              minWidth: 0,
              "&:hover": {
                background: isActive("/document-chat")
                  ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                  : "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                color: "#6b21a8",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(139, 92, 246, 0.25)",
              },
            }}
          >
            <Psychology sx={{ fontSize: "1.2rem" }} />
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
              }}
            >
              Assistant
            </Typography>
          </Box>
        </Tooltip>

        {/* Assistant Card */}
        <Tooltip title="General AI assistance" arrow placement="bottom">
          <Box
            component={Link}
            to="/chatbot"
            className="nav-card-item"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              padding: "8px 16px",
              borderRadius: "16px",
              textDecoration: "none",
              background: isActive("/chatbot")
                ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                : "transparent",
              color: isActive("/chatbot") ? "#ffffff" : "#64748b",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              flexShrink: 1,
              minWidth: 0,
              "&:hover": {
                background: isActive("/chatbot")
                  ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                  : "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                color: "#0c4a6e",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(6, 182, 212, 0.25)",
              },
            }}
          >
            <SmartToy sx={{ fontSize: "1.2rem" }} />
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
              }}
            >
              Global Chat
            </Typography>
          </Box>
        </Tooltip>
      </Box>

      {/* Advanced AI Tools Dropdown - Keep existing submenu functionality */}
      <ClickAwayListener onClickAway={() => setAiToolsOpen(false)}>
        <Box sx={{ position: "relative" }}>
          <Box
            onClick={handleAiToolsToggle}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              padding: "8px 16px",
              backgroundColor: isAdvancedAIPath
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(255, 255, 255, 0.95)",
              borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(10px)",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: isAdvancedAIPath
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(248, 250, 252, 0.98)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.12)",
              },
            }}
            ref={(el) => {
              if (el) el.setAttribute("data-ai-tools-button", "true");
            }}
          >
            <AutoAwesome
              sx={{
                fontSize: "1.2rem",
                color: isAdvancedAIPath ? "#ef4444" : "#64748b",
              }}
            />
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.875rem",
                color: isAdvancedAIPath ? "#ef4444" : "#64748b",
                whiteSpace: "nowrap",
              }}
            >
              AI Tools
            </Typography>
            <KeyboardArrowDown
              sx={{
                fontSize: "1rem",
                color: isAdvancedAIPath ? "#ef4444" : "#64748b",
                transform: aiToolsOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </Box>
          <Popper
            open={aiToolsOpen}
            anchorEl={document.querySelector("[data-ai-tools-button]")}
            placement="bottom-start"
            transition
            sx={{ zIndex: 1300 }}
          >
            {({ TransitionProps }) => (
              <Grow {...TransitionProps} timeout={200}>
                <Paper
                  sx={{
                    mt: 1,
                    borderRadius: 3,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    border: "1px solid #e0e0e0",
                    overflow: "hidden",
                    minWidth: 280,
                  }}
                >
                  <MenuList>
                    {advancedToolsItems.map((item) => (
                      <MenuItem
                        key={item.path}
                        component={Link}
                        to={item.path}
                        onClick={() => setAiToolsOpen(false)}
                        selected={isActive(item.path)}
                        sx={{
                          borderRadius: 2,
                          mx: 1,
                          my: 0.5,
                          minHeight: 60,
                          "&.Mui-selected": {
                            backgroundColor: "#e3f2fd",
                            color: "#1976d2",
                          },
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                            color: "#1976d2",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: "inherit", minWidth: 44 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          secondary={item.description}
                          primaryTypographyProps={{
                            fontWeight: 500,
                            fontSize: "0.875rem",
                          }}
                          secondaryTypographyProps={{ fontSize: "0.75rem" }}
                        />
                      </MenuItem>
                    ))}
                  </MenuList>
                </Paper>
              </Grow>
            )}
          </Popper>
        </Box>
      </ClickAwayListener>
    </Box>
  );

  const renderMobileNavigation = () => (
    <Drawer
      variant="temporary"
      anchor="left"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      sx={{
        display: { xs: "block", lg: "none" },
        "& .MuiDrawer-paper": {
          boxSizing: "border-box",
          width: 320,
          backgroundColor: "#fafafa",
          borderRight: "1px solid #e0e0e0",
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
        }}
        className="bg-gradient-to-r from-primary-500 to-primary-700"
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#ffffff",
            fontSize: "1.3rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AutoAwesome />
          SmartDocs AI
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#bbdefb",
            fontSize: "0.8rem",
            mt: 0.5,
          }}
        >
          AI-Powered Research Assistant
        </Typography>
      </Box>

      <List sx={{ px: 2, py: 1 }}>
        {/* Document Management Section */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemText
            primary="Document Management"
            primaryTypographyProps={{
              variant: "subtitle2",
              color: "#666",
              fontWeight: 600,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          />
        </ListItem>
        {documentItems.map(renderNavigationItem)}

        <Divider sx={{ my: 2, borderColor: "#e0e0e0" }} />

        {/* AI Assistant Section */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemText
            primary="AI Assistant"
            primaryTypographyProps={{
              variant: "subtitle2",
              color: "#666",
              fontWeight: 600,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          />
        </ListItem>
        {aiAssistantItems.map(renderNavigationItem)}

        <Divider sx={{ my: 2, borderColor: "#e0e0e0" }} />

        {/* Advanced Tools Section */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemText
            primary="Advanced AI Tools"
            primaryTypographyProps={{
              variant: "subtitle2",
              color: "#666",
              fontWeight: 600,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          />
        </ListItem>
        {advancedToolsItems.map(renderNavigationItem)}
      </List>

      {/* Quick Actions at Bottom */}
      <Box sx={{ mt: "auto", p: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button
          component={Link}
          to="/Upload"
          fullWidth
          startIcon={<UploadFile />}
          variant="outlined"
          sx={{
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 500,
            borderColor: "#2196f3",
            color: "#2196f3",
            "&:hover": {
              backgroundColor: "#e3f2fd",
              borderColor: "#1976d2",
            },
          }}
        >
          Upload Documents
        </Button>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
          borderBottom: "1px solid #e0e0e0",
          color: "#212121",
          backdropFilter: "blur(20px)",
          minHeight: 72,
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          width: "100%",
          maxWidth: "100%",
          overflow: "visible",
        }}
        className="header-forced-styling bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-300"
      >
        <Toolbar
          sx={{
            minHeight: "72px !important",
            px: { xs: 2, md: 3 },
            width: "100%",
            maxWidth: "100%",
            overflow: "visible",
          }}
          className="px-4 md:px-6"
        >
          {/* Mobile Menu Button */}
          {showNavigation && isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                p: 1.5,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                  transform: "scale(1.05)",
                },
              }}
            >
              <MenuIcon sx={{ color: "#616161" }} className="text-gray-700" />
            </IconButton>
          )}

          {/* Logo and Brand */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
            className="flex items-center space-x-3"
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(33,150,243,0.25)",
              }}
              className="shadow-lg bg-gradient-to-br from-primary-500 to-primary-700"
            >
              <AutoAwesome sx={{ color: "white", fontSize: "1.2rem" }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: "#212121",
                  fontSize: { xs: "1.1rem", md: "1.3rem" },
                  lineHeight: 1.2,
                  letterSpacing: "-0.025em",
                }}
                className="header-text-forced text-gray-900 font-bold"
              >
                SmartDocs AI
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#616161",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  display: { xs: "none", sm: "block" },
                }}
                className="header-subtext-forced text-gray-700"
              >
                Research Assistant
              </Typography>
            </Box>

            {bypassMode && (
              <Chip
                icon={<Warning />}
                label="DEMO MODE"
                color="warning"
                size="small"
                sx={{
                  ml: 1,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
            )}
          </Box>

          {/* Desktop Navigation */}
          {showNavigation && !isMobile && renderDesktopNavigation()}

          {/* Right Side Actions */}
          <Box
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 4, 
              ml: "auto", 
              position: "relative", 
              zIndex: 1200,
              paddingRight: "16px",
              minWidth: "fit-content"
            }}
          >
            {(bypassMode || isAuthenticated) && (
              <>
                {/* Notifications */}
                <Tooltip title="Notifications" arrow>
                  <IconButton
                    onClick={handleNotificationsOpen}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      color: "#666",
                      marginRight: "8px",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                        color: "#1976d2",
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Badge
                      badgeContent={unreadCount}
                      color="error"
                      sx={{ 
                        "& .MuiBadge-badge": { 
                          fontSize: "0.7rem",
                          minWidth: "18px",
                          height: "18px",
                          right: "-6px",
                          top: "-2px"
                        } 
                      }}
                    >
                      <Notifications />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* User Profile */}
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1 }}
                >
                  <Box
                    sx={{
                      textAlign: "right",
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#333",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {getUserDisplayName()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#666",
                        fontSize: "0.75rem",
                      }}
                    >
                      {getUserEmail()}
                    </Typography>
                  </Box>
                  <EnhancedAvatar
                    userProfile={userProfile}
                    size="medium"
                    showStatus={true}
                    variant="header"
                    onClick={handleUserMenuOpen}
                    animate={true}
                    className="header-user-avatar"
                  />
                </Box>

                {/* Enhanced User Menu */}
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: 3,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      border: "1px solid #e0e0e0",
                      minWidth: 240,
                      overflow: "hidden",
                    },
                  }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <Box
                    sx={{
                      p: 3,
                      background:
                        "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
                      color: "white",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, fontSize: "1rem" }}
                    >
                      {getUserDisplayName()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#bbdefb", fontSize: "0.875rem" }}
                    >
                      {getUserEmail()}
                    </Typography>
                  </Box>

                  {bypassMode && (
                    <>
                      <MenuItem
                        onClick={() => {
                          handleUserMenuClose();
                          handleExitBypass();
                        }}
                        sx={{
                          borderRadius: 2,
                          mx: 2,
                          my: 1,
                          color: "#ff9800",
                          minHeight: 48,
                          "&:hover": {
                            backgroundColor: "#fff3e0",
                            color: "#f57c00",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                          <ExitToApp />
                        </ListItemIcon>
                        <ListItemText primary="Exit Demo Mode" />
                      </MenuItem>
                      <Divider sx={{ mx: 2 }} />
                    </>
                  )}

                  <MenuItem
                    onClick={handleUserMenuClose}
                    sx={{
                      borderRadius: 2,
                      mx: 2,
                      my: 1,
                      minHeight: 48,
                      "&:hover": { backgroundColor: "#f5f5f5" },
                    }}
                  >
                    <ListItemIcon sx={{ color: "#666", minWidth: 40 }}>
                      <Settings />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                  </MenuItem>

                  <MenuItem
                    onClick={handleUserMenuClose}
                    sx={{
                      borderRadius: 2,
                      mx: 2,
                      my: 1,
                      minHeight: 48,
                      "&:hover": { backgroundColor: "#f5f5f5" },
                    }}
                  >
                    <ListItemIcon sx={{ color: "#666", minWidth: 40 }}>
                      <Help />
                    </ListItemIcon>
                    <ListItemText primary="Help & Support" />
                  </MenuItem>

                  {!bypassMode && (
                    <>
                      <Divider sx={{ mx: 2, my: 1 }} />
                      <MenuItem
                        onClick={() => {
                          handleUserMenuClose();
                          handleLogout();
                        }}
                        sx={{
                          borderRadius: 2,
                          mx: 2,
                          my: 1,
                          color: "#d32f2f",
                          minHeight: 48,
                          "&:hover": {
                            backgroundColor: "#ffebee",
                            color: "#c62828",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                          <Logout />
                        </ListItemIcon>
                        <ListItemText primary="Sign Out" />
                      </MenuItem>
                    </>
                  )}
                </Menu>

                {/* Database-based Notifications Panel */}
                <NotificationPanel
                  anchorEl={notificationsAnchor}
                  open={Boolean(notificationsAnchor)}
                  onClose={handleNotificationsClose}
                />
              </>
            )}

            {/* Sign In Button for Non-Authenticated Users */}
            {!(bypassMode || isAuthenticated) && (
              <Button
                variant="contained"
                size="medium"
                onClick={handleLogin}
                startIcon={<AccountCircle />}
                sx={{
                  backgroundColor: "#2196f3",
                  color: "white",
                  fontWeight: 600,
                  borderRadius: 3,
                  height: 44,
                  minWidth: 120,
                  fontSize: "0.875rem",
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(33,150,243,0.3)",
                  "&:hover": {
                    backgroundColor: "#1976d2",
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 16px rgba(33,150,243,0.4)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {showNavigation && renderMobileNavigation()}
    </>
  );
};

export default Header;
