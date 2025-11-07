/**
 * Chat Download Service
 * Provides functionality to export chat conversations in various formats
 */

import jsPDF from 'jspdf';

class ChatDownloadService {
    /**
     * Download conversation as HTML file
     * @param {Object} conversation - The conversation object
     * @param {string} format - Export format ('html', 'pdf', 'txt')
     */
    static async downloadConversation(conversation, format = 'pdf') {
        try {
            const filename = this.generateFilename(conversation.chat_title, format);
            
            switch (format) {
                case 'html':
                    return this.downloadAsHTML(conversation, filename);
                case 'pdf':
                    return this.downloadAsPDF(conversation, filename);
                case 'txt':
                    return this.downloadAsText(conversation, filename);
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        } catch (error) {
            console.error('Error downloading conversation:', error);
            throw error;
        }
    }

    /**
     * Generate filename for download
     */
    static generateFilename(title, format) {
        const sanitizedTitle = title
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);
        
        const timestamp = new Date().toISOString().split('T')[0];
        return `${sanitizedTitle}_${timestamp}.${format}`;
    }

    /**
     * Download conversation as HTML
     */
    static downloadAsHTML(conversation, filename) {
        const htmlContent = this.generateHTMLContent(conversation);
        this.downloadFile(htmlContent, filename, 'text/html');
    }

    /**
     * Download conversation as PDF
     */
    static async downloadAsPDF(conversation, filename) {
        try {
            await this.downloadAsPDFWithJsPDF(conversation, filename);
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }

    /**
     * Download conversation as PDF using jsPDF
     */
    static async downloadAsPDFWithJsPDF(conversation, filename) {
        const doc = new jsPDF();
        
        // Set up document
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(conversation.chat_title, 20, 25);
        
        // Add metadata
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Created: ${new Date(conversation.created_at).toLocaleString()}`, 20, 35);
        doc.text(`Updated: ${new Date(conversation.updated_at).toLocaleString()}`, 20, 40);
        doc.text(`Messages: ${conversation.chat_json?.length || 0}`, 20, 45);
        doc.text(`Status: ${conversation.is_active ? 'Active' : 'Archived'}`, 20, 50);
        
        // Add separator line
        doc.setLineWidth(0.5);
        doc.line(20, 55, doc.internal.pageSize.width - 20, 55);
        
        let yPosition = 65;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const maxWidth = doc.internal.pageSize.width - (margin * 2);
        
        // Add messages
        conversation.chat_json?.forEach((message, index) => {
            // Check if we need a new page
            if (yPosition > pageHeight - 40) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Message header with background
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            const role = message.role === 'user' ? 'Question' : 'Answer';
            const roleColor = message.role === 'user' ? [59, 130, 246] : [16, 185, 129]; // Blue for question, Green for answer
            
            // Add background rectangle for message header
            doc.setFillColor(roleColor[0], roleColor[1], roleColor[2]);
            doc.rect(margin, yPosition - 5, maxWidth, 8, 'F');
            
            // Add role text in white
            doc.setTextColor(255, 255, 255);
            doc.text(`${role}:`, margin + 3, yPosition);
            
            // Reset text color
            doc.setTextColor(0, 0, 0);
            yPosition += 12;
            
                    // Message content
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    const content = this.cleanTextForPDF(message.content);
                    
                    // Split content into lines and handle formatting
                    const lines = content.split('\n');
                    
                    lines.forEach(line => {
                        if (line.trim() === '') {
                            yPosition += 3; // Add space for empty lines
                            return;
                        }
                        
                        // Check if line is a header (starts with newline and is short)
                        if (line.trim().length < 50 && line.trim().length > 0) {
                            // Check if we need a new page
                            if (yPosition > pageHeight - 30) {
                                doc.addPage();
                                yPosition = 20;
                            }
                            
                            // Format as header
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'bold');
                            const headerLines = doc.splitTextToSize(line.trim(), maxWidth);
                            headerLines.forEach(headerLine => {
                                if (yPosition > pageHeight - 20) {
                                    doc.addPage();
                                    yPosition = 20;
                                }
                                doc.text(headerLine, margin, yPosition);
                                yPosition += 5;
                            });
                            doc.setFontSize(9);
                            doc.setFont('helvetica', 'normal');
                            yPosition += 2; // Extra space after header
                        } else {
                            // Regular content
                            const wrappedLines = doc.splitTextToSize(line, maxWidth);
                            wrappedLines.forEach(wrappedLine => {
                                if (yPosition > pageHeight - 20) {
                                    doc.addPage();
                                    yPosition = 20;
                                }
                                doc.text(wrappedLine, margin, yPosition);
                                yPosition += 4;
                            });
                        }
                    });
            
            // Add timestamp if available
            if (message.timestamp) {
                yPosition += 2;
                doc.setFontSize(7);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 100, 100);
                const timestamp = new Date(message.timestamp).toLocaleString();
                doc.text(timestamp, margin, yPosition);
                doc.setTextColor(0, 0, 0);
                yPosition += 8;
            } else {
                yPosition += 6;
            }
            
            // Add separator line between messages
            if (index < conversation.chat_json.length - 1) {
                yPosition += 3;
                doc.setLineWidth(0.1);
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, yPosition, doc.internal.pageSize.width - margin, yPosition);
                yPosition += 8;
            }
        });
        
        // Add footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text(
                `Page ${i} of ${totalPages} - Generated by NIT AI Document Assistant`,
                margin,
                pageHeight - 10
            );
            doc.text(
                `Exported on: ${new Date().toLocaleString()}`,
                doc.internal.pageSize.width - margin - 60,
                pageHeight - 10
            );
        }
        
        // Save the PDF
        doc.save(filename);
    }

    /**
     * Download conversation as HTML with print styles for PDF conversion
     */
    static downloadAsHTMLWithPrintStyles(conversation, filename) {
        const htmlContent = this.generateHTMLContent(conversation, true);
        this.downloadFile(htmlContent, filename.replace('.pdf', '.html'), 'text/html');
    }

    /**
     * Download conversation as plain text
     */
    static downloadAsText(conversation, filename) {
        const textContent = this.generateTextContent(conversation);
        this.downloadFile(textContent, filename, 'text/plain');
    }

    /**
     * Generate HTML content for the conversation
     */
    static generateHTMLContent(conversation, forPrint = false) {
        const printStyles = forPrint ? `
            <style>
                @media print {
                    body { margin: 0; padding: 20px; }
                    .conversation-header { page-break-after: avoid; }
                    .message { page-break-inside: avoid; margin-bottom: 20px; }
                    .message-content { white-space: pre-wrap; }
                }
                @page { margin: 1in; }
            </style>
        ` : '';

        const messages = conversation.chat_json?.map(message => {
            const role = message.role === 'user' ? 'Question' : 'Answer';
            const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
            const content = this.escapeHtml(message.content);
            
            return `
                <div class="message ${message.role}">
                    <div class="message-header">
                        <strong>${role}</strong>
                        ${timestamp ? `<span class="timestamp">${timestamp}</span>` : ''}
                    </div>
                    <div class="message-content">${content}</div>
                </div>
            `;
        }).join('') || '';

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${this.escapeHtml(conversation.chat_title)}</title>
                ${printStyles}
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background: #fff;
                    }
                    .conversation-header {
                        border-bottom: 2px solid #e5e7eb;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .conversation-title {
                        font-size: 2rem;
                        font-weight: bold;
                        color: #1f2937;
                        margin: 0 0 10px 0;
                    }
                    .conversation-meta {
                        color: #6b7280;
                        font-size: 0.9rem;
                        display: flex;
                        gap: 20px;
                        flex-wrap: wrap;
                    }
                    .message {
                        margin-bottom: 25px;
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #e5e7eb;
                    }
                    .message.user {
                        background: #f8fafc;
                        border-left-color: #3b82f6;
                    }
                    .message.assistant {
                        background: #f0f9ff;
                        border-left-color: #10b981;
                    }
                    .message-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                        font-weight: 600;
                        color: #374151;
                    }
                    .timestamp {
                        font-size: 0.8rem;
                        color: #9ca3af;
                        font-weight: normal;
                    }
                    .message-content {
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        color: #1f2937;
                    }
                    .message-content code {
                        background: #f3f4f6;
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: 'Monaco', 'Menlo', monospace;
                        font-size: 0.9em;
                    }
                    .message-content pre {
                        background: #f3f4f6;
                        padding: 12px;
                        border-radius: 6px;
                        overflow-x: auto;
                        border: 1px solid #e5e7eb;
                    }
                    .message-content pre code {
                        background: none;
                        padding: 0;
                    }
                    .message-content ul, .message-content ol {
                        margin: 10px 0;
                        padding-left: 20px;
                    }
                    .message-content li {
                        margin: 5px 0;
                    }
                    .message-content blockquote {
                        border-left: 3px solid #d1d5db;
                        padding-left: 15px;
                        margin: 10px 0;
                        color: #6b7280;
                        font-style: italic;
                    }
                    .message-content h1, .message-content h2, .message-content h3 {
                        margin: 15px 0 10px 0;
                        color: #1f2937;
                    }
                    .message-content h1 { font-size: 1.5rem; }
                    .message-content h2 { font-size: 1.3rem; }
                    .message-content h3 { font-size: 1.1rem; }
                    .message-content p {
                        margin: 10px 0;
                    }
                    .message-content strong {
                        font-weight: 600;
                    }
                    .message-content em {
                        font-style: italic;
                    }
                    .export-info {
                        margin-top: 30px;
                        padding: 15px;
                        background: #f9fafb;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        font-size: 0.9rem;
                        color: #6b7280;
                    }
                </style>
            </head>
            <body>
                <div class="conversation-header">
                    <h1 class="conversation-title">${this.escapeHtml(conversation.chat_title)}</h1>
                    <div class="conversation-meta">
                        <span>Created: ${new Date(conversation.created_at).toLocaleString()}</span>
                        <span>Updated: ${new Date(conversation.updated_at).toLocaleString()}</span>
                        <span>Messages: ${conversation.chat_json?.length || 0}</span>
                        <span>Status: ${conversation.is_active ? 'Active' : 'Archived'}</span>
                    </div>
                </div>
                
                <div class="messages-container">
                    ${messages}
                </div>
                
                <div class="export-info">
                    <strong>Export Information:</strong><br>
                    Exported on: ${new Date().toLocaleString()}<br>
                    Format: HTML Document<br>
                    Generated by: NIT AI Document Assistant
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Generate plain text content for the conversation
     */
    static generateTextContent(conversation) {
        const header = `
${conversation.chat_title}
${'='.repeat(conversation.chat_title.length)}

Created: ${new Date(conversation.created_at).toLocaleString()}
Updated: ${new Date(conversation.updated_at).toLocaleString()}
Messages: ${conversation.chat_json?.length || 0}
Status: ${conversation.is_active ? 'Active' : 'Archived'}

${'='.repeat(50)}

`;

        const messages = conversation.chat_json?.map((message, index) => {
            const role = message.role === 'user' ? 'QUESTION' : 'ANSWER';
            const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
            const content = this.cleanTextForExport(message.content);
            
            return `
[${index + 1}] ${role}${timestamp ? ` (${timestamp})` : ''}
${'-'.repeat(20)}
${content}

`;
        }).join('') || '';

        const footer = `
${'='.repeat(50)}

Export Information:
- Exported on: ${new Date().toLocaleString()}
- Format: Plain Text
- Generated by: NIT AI Document Assistant
`;

        return header + messages + footer;
    }

    /**
     * Clean text for PDF export
     */
    static cleanTextForPDF(text) {
        if (!text) return '';
        
        return text
            // Convert HTML line breaks to newlines
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            // Convert list items
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<\/li>/gi, '\n')
            // Convert headers to bold text
            .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n')
            // Convert bold and strong tags
            .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '$2')
            // Convert emphasis tags
            .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '$2')
            // Remove all remaining HTML tags
            .replace(/<[^>]*>/g, '')
            // Decode HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            // Clean up excessive whitespace
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .replace(/[ \t]+/g, ' ')
            .trim();
    }

    /**
     * Clean text for export
     */
    static cleanTextForExport(text) {
        return text
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<div[^>]*>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
            .trim();
    }

    /**
     * Escape HTML characters
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Download file using blob
     */
    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        URL.revokeObjectURL(url);
    }

    /**
     * Get available export formats
     */
    static getAvailableFormats() {
        return [
            { value: 'html', label: 'HTML Document', description: 'Rich formatted document with styling' },
            { value: 'pdf', label: 'PDF Document', description: 'Print-ready PDF document' },
            { value: 'txt', label: 'Plain Text', description: 'Simple text format' }
        ];
    }
}

export default ChatDownloadService;
