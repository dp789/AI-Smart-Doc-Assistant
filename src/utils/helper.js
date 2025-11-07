export const insertFolder = (tree, parentId, newFolder) => {
  return tree.map((node) => {
    if (node.id === parentId) {
      const updatedChildren = node.children ? [...node.children, newFolder] : [newFolder];
      return { ...node, children: updatedChildren };
    }

    if (node.children) {
      return { ...node, children: insertFolder(node.children, parentId, newFolder) };
    }

    return node;
  });
};

export const getErrorMessage = (status) => {
  switch (status) {
      case 403:
          return "Access Forbidden: This website blocks automated access. Please try copying and pasting the content manually.";
      case 408:
          return "The website is taking too long to respond. Please try again later.";
      case 422:
          return "Cannot connect to this website. Please check the URL.";
      case 500:
          return "Unable to scrape this website. Please try again or contact support.";
      default:
          return "An error occurred. Please try again.";    
  }
}

// MIME type validation for SharePoint files
// Only allow: CSV, DOC, DOCX, PDF, SQL
export const ALLOWED_MIME_TYPES = [
  'application/pdf',           
  'application/msword',        
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'text/csv',                  
  'application/sql'            
];

export const isMimeTypeAllowed = (contentType) => {
  if (!contentType) return false;
  return ALLOWED_MIME_TYPES.includes(contentType);
};

export const ICONS = {
  EXPAND: '⮞',    
  COLLAPSE: '⮟',  
  LOADING: '⏳',
  SITE: '🌐',  
  FOLDER: '📂',
  FILE: {
    DEFAULT: '📄',
    PDF: '📕',
    EXCEL: '📗',
    WORD: '📘',
    POWERPOINT: '📙',
    IMAGE: '🖼️',
    ZIP: '📦',
    CODE: '📝'
  }
};

export const getFileIcon = (fileName) => {
  const extension = fileName?.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return ICONS.FILE.PDF;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return ICONS.FILE.EXCEL;
    case 'doc':
    case 'docx':
      return ICONS.FILE.WORD;
    case 'ppt':
    case 'pptx':
      return ICONS.FILE.POWERPOINT;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return ICONS.FILE.IMAGE;
    case 'zip':
    case 'rar':
    case '7z':
      return ICONS.FILE.ZIP;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
      return ICONS.FILE.CODE;
    default:
      return ICONS.FILE.DEFAULT;
  }
};

export const validateScrapingURL = (url) => {
  try {
    // Remove @ symbol if present at the beginning
    const cleanUrl = url && url.startsWith('@') ? url.substring(1) : url;

    // Check if URL is provided and is a string
    if (!cleanUrl || typeof cleanUrl !== 'string') {
      return {
        valid: false,
        reason: "URL is required and must be a string",
      };
    }

    // Parse URL using URL constructor
    let parsedUrl;
    try {
      parsedUrl = new URL(cleanUrl);
    } catch (urlError) {
      return {
        valid: false,
        reason: "Please provide a valid URL",
      };
    }

    // Check if URL has valid scheme
    if (!parsedUrl.protocol || !['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        valid: false,
        reason: "URL must start with http:// or https://",
      };
    }

    // Check if URL has valid domain
    if (!parsedUrl.hostname) {
      return {
        valid: false,
        reason: "Invalid domain name",
      };
    }

    // Get file extension from path
    const pathLower = parsedUrl.pathname.toLowerCase();

    // Check for file extensions that can't be scraped as web pages
    const unsupportedExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.tar', '.gz', '.7z',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
      '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv',
      '.mp3', '.wav', '.flac', '.aac', '.ogg',
      '.exe', '.msi', '.dmg', '.deb', '.rpm',
      '.json', '.xml', '.csv', '.txt'  // Raw data files
    ];

    for (const ext of unsupportedExtensions) {
      if (pathLower.endsWith(ext)) {
        const fileType = ext.toUpperCase().replace('.', '');
        return {
          valid: false,
          reason: `Cannot scrape ${fileType} files - URL points to a ${fileType} document, not a web page`,
        };
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\/download\//i,
      /\/file\//i,
      /\/attachment\//i,
      /\/media\//i,
      /\/static\//i,
      /\/assets\//i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(pathLower)) {
        return {
          valid: false,
          reason: "URL appears to point to a file download or static resource",
        };
      }
    }

    // URL appears valid for scraping
    return {
      valid: true,
      reason: "URL appears suitable for web scraping",
      cleanUrl: cleanUrl
    };

  } catch (error) {
    console.error('Error in validateScrapingURL:', error);
    return {
      valid: false,
      reason: `URL parsing error: ${error.message}`,
    };
  }
};

// Helper functions to transform API data
export const transformDocumentData = (apiDoc) => {
  return {
      id: apiDoc.id,
      name: apiDoc.fileName.replace(/\.[^/.]+$/, ''),
      fileName: apiDoc.fileName.replace(/\.[^/.]+$/, ''),
      size: (apiDoc.fileSize / 1024).toFixed(2) + ' KB',
      uploadDate: apiDoc.uploadTime,
      category: getCategoryName(apiDoc.documentCategory),
      status: mapStatus(apiDoc.ingestionStatus, apiDoc.uploadStatus),
      author: getAuthorFromSource(apiDoc.ingestionSourceId),
      summary: apiDoc.documentSummary,
      tags: parseTags(apiDoc.keywords),
      confidenceScore: generateConfidenceScore(apiDoc.ingestionStatus),
      keyInsights: generateKeyInsights(apiDoc.numberOfPages),
      citationCount: generateCitationCount()
  };
};

export const calculateFileSize = (pages) => {
  if (!pages) return "Unknown";
  const estimatedMB = (pages * 0.1).toFixed(1);
  return `${estimatedMB} MB`;
};

export const getCategoryName = (categoryId) => {
  const categories = {
      1: "Research Papers", 2: "Company Policy", 3: "Other",
      4: "Training Document", 5: "Call Transcript"
  };
  return categories[categoryId] || "General Documents";
};

export const mapStatus = (ingestionStatus, uploadStatus) => {
  if (ingestionStatus === 'completed') return 'Ingested';
  if (ingestionStatus === 'processing') return 'Processing';
  if (ingestionStatus === 'failed') return 'Error';
  if (uploadStatus === 'active') return 'Uploaded';
  return 'Uploaded';
};

export const getAuthorFromSource = (sourceId) => {
  const sources = { 1: "SharePoint User", 2: "Web Scraper", 3: "System User" };
  return sources[sourceId] || "Unknown Author";
};

export const generateSummary = (fileName, sourceId) => {
  const sourceName = sourceId === 1 ? "SharePoint" : sourceId === 2 ? "web scraping" : "local upload";
  return `Document "${fileName}" imported via ${sourceName}. Contains valuable information for analysis and research.`;
};

export const generateTags = (fileName, fileType, sourceId) => {
  const tags = [];
  if (fileType === 1) tags.push('PDF');
  if (fileType === 2) tags.push('Excel');
  if (fileType === 3) tags.push('Word');
  if (sourceId === 1) tags.push('SharePoint');
  if (sourceId === 2) tags.push('Web');
  if (sourceId === 3) tags.push('Upload');
  
  const fileName_lower = fileName.toLowerCase();
  if (fileName_lower.includes('research')) tags.push('research');
  if (fileName_lower.includes('report')) tags.push('report');
  
  return tags.slice(0, 4);
};

export const generateConfidenceScore = (ingestionStatus) => {
  if (ingestionStatus === 'completed') return Math.floor(Math.random() * 15) + 85;
  return Math.floor(Math.random() * 25) + 75;
};

export const generateKeyInsights = (pages) => {
  if (!pages) return Math.floor(Math.random() * 10) + 5;
  return Math.floor(pages / 2) + Math.floor(Math.random() * 5);
};

export const generateCitationCount = () => Math.floor(Math.random() * 50) + 1;

// Helper function to parse comma-separated tags into an array
export const parseTags = (tagsString) => {
  if (!tagsString) return [];
  if (Array.isArray(tagsString)) return tagsString;
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};
