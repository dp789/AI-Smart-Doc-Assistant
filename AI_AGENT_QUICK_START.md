# AI Agent Quick Start Guide 🚀

## What Was Added?

Two new AI Agent buttons in the SharePoint file browser:

### 1. **Transcript Agent** (Blue Button with Document Icon)
- Processes **single transcript file only**
- Use for: Meeting notes, lectures, interviews
- Payload: Single file ID

### 2. **CV Screening** (Purple Button with Profile Icon)
- Processes **one or multiple files**
- Use for: Resume screening, CV analysis
- Payload: Array of file IDs

## How to Use

### Step 1: Select Files
1. Navigate to SharePoint tab in Upload section
2. Browse folders and check files you want to process
3. Selected files show with blue background

### Step 2: Click AI Agent Button
- **For Transcripts**: Select 1 file, click "Transcript Agent"
- **For CVs**: Select 1+ files, click "CV Screening"

### Step 3: Check Console
Open browser console (F12) to see the payload:
```javascript
// Transcript Agent
{
  agentType: "transcript_agent",
  fileId: "abc123",
  siteId: "site456",
  fileName: "transcript.docx"
}

// CV Screening Agent
{
  agentType: "cv_screening_agent",
  fileIds: ["id1", "id2"],
  fileCount: 2,
  files: [...]
}
```

## Validation Rules

### Transcript Agent ✅
- ✅ 1 file selected → Works
- ❌ 0 files selected → Warning: "Please select a file"
- ❌ 2+ files selected → Warning: "Select only one file"

### CV Screening ✅
- ✅ 1 file selected → Works
- ✅ Multiple files selected → Works
- ❌ 0 files selected → Warning: "Please select at least one file"

## N8N Integration (TODO)

### Enable Webhooks
Edit `src/components/SharePointTreeView/SharePointTreeView.jsx`:

**Line ~268 (Transcript Agent):**
```javascript
// Uncomment and add your webhook URL:
const response = await fetch('https://your-n8n-url/webhook/transcript-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

**Line ~330 (CV Screening):**
```javascript
// Uncomment and add your webhook URL:
const response = await fetch('https://your-n8n-url/webhook/cv-screening', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

### N8N Workflow Setup

#### Transcript Agent Workflow:
```
1. Webhook Trigger
   ↓
2. SharePoint Download Node
   - Use: payload.fileId, payload.siteId
   ↓
3. AI/LLM Node
   - Process transcript
   ↓
4. Return Response
```

#### CV Screening Workflow:
```
1. Webhook Trigger
   ↓
2. Loop Node
   - Iterate: payload.fileIds
   ↓
3. SharePoint Download Node (in loop)
   - Use: currentItem.id, currentItem.siteId
   ↓
4. AI/LLM Node (in loop)
   - Extract CV data
   ↓
5. Aggregate Results
   ↓
6. Return Response
```

## Button States

| State | Appearance | When |
|-------|-----------|------|
| Enabled | Bright gradient | Files selected, not processing |
| Disabled | Gray gradient | No files OR processing |
| Processing | Animated icon | Agent is working |
| Hover | Shadow + lift | Mouse over enabled button |

## File Changes Summary

### Modified Files:
1. ✅ `src/components/SharePointTreeView/SharePointTreeView.jsx`
   - Added AI Agent handlers
   - Added buttons to UI
   
2. ✅ `src/components/SharePointTreeView/SharePointTreeView.css`
   - Professional gradient button styles
   - Responsive design
   - Animations

### No Impact On:
- ✅ Existing Upload functionality
- ✅ Clear button functionality
- ✅ File selection/deselection
- ✅ Search functionality
- ✅ Tree navigation
- ✅ Any other app features

## Testing

### Quick Test:
1. Start the app: `npm start`
2. Login and navigate to Upload → SharePoint
3. Connect to SharePoint
4. Select a file
5. Click "Transcript Agent"
6. Open console (F12) - see payload logged
7. Select multiple files
8. Click "CV Screening"
9. Check console - see array payload

### Expected Console Output:
```
============================================================
🤖 TRANSCRIPT AGENT - N8N Workflow Payload
============================================================
Agent Type: transcript_agent
File ID: xxx
...
```

## Troubleshooting

### Issue: Buttons not visible
**Fix**: Clear browser cache, refresh page

### Issue: Buttons always disabled
**Check**: 
- Are files selected?
- Is another operation running?
- Check console for errors

### Issue: No console output
**Fix**: Open browser DevTools (F12), check Console tab

### Issue: Wrong validation message
**Verify**:
- Transcript Agent: Only 1 file selected?
- CV Screening: At least 1 file selected?

## Next Steps

1. ✅ **Current**: Console logging working
2. ⏳ **Next**: Add N8N webhook URLs
3. ⏳ **Future**: Handle webhook responses
4. ⏳ **Future**: Show results to user

## Support

- Full documentation: `AI_AGENT_SHAREPOINT_INTEGRATION.md`
- Code location: `src/components/SharePointTreeView/`
- Styling: `SharePointTreeView.css` (lines 189-344)

---

**Version**: 1.0.0  
**Date**: October 8, 2025  
**Status**: ✅ Ready for Testing

