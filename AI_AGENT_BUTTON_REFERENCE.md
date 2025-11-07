# AI Agent Button Visual Reference

## Button Appearance in SharePoint Header

### Desktop Layout (Full Width)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  SharePoint Actions Header                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  🔍 [Search files and folders...        ] │ [📄 Transcript Agent] [👤 CV Screening] │ [Upload] [Clear] │
│                                            │  (Blue gradient)     (Purple gradient)  │                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Button Visual Design

#### 1. Transcript Agent Button (Blue/Teal)
```
┌──────────────────────────┐
│  📄  Transcript Agent    │  ← Gradient: #0ea5e9 → #06b6d4
└──────────────────────────┘
     ↑          ↑
   Icon    Button Text
(Document)

Hover State:
┌──────────────────────────┐
│  📄✨ Transcript Agent   │  ← Darker gradient + Shadow + Lift
└──────────────────────────┘
     ↑ Icon scales 1.15x + rotates 5°

Processing State:
┌──────────────────────────┐
│  📄💫 Processing...      │  ← Gray gradient + Pulse animation
└──────────────────────────┘
```

#### 2. CV Screening Button (Purple/Violet)
```
┌──────────────────────────┐
│  👤  CV Screening        │  ← Gradient: #8b5cf6 → #a855f7
└──────────────────────────┘
     ↑          ↑
   Icon    Button Text
(Profile)

Hover State:
┌──────────────────────────┐
│  👤✨ CV Screening       │  ← Darker gradient + Shadow + Lift
└──────────────────────────┘
     ↑ Icon scales 1.15x + rotates 5°

Processing State:
┌──────────────────────────┐
│  👤💫 Processing...      │  ← Gray gradient + Pulse animation
└──────────────────────────┘
```

---

## Button States with Colors

### Enabled State (Ready to Use)
```
Transcript Agent:        CV Screening:
┌───────────────────┐   ┌───────────────────┐
│ 🔵🔵🔵🔵🔵🔵🔵 │   │ 🟣🟣🟣🟣🟣🟣🟣 │
│ Blue → Teal      │   │ Purple → Violet   │
│ Cursor: pointer  │   │ Cursor: pointer   │
└───────────────────┘   └───────────────────┘
```

### Hover State (Interactive)
```
Transcript Agent:        CV Screening:
┌───────────────────┐   ┌───────────────────┐
│ 🔷🔷🔷🔷🔷🔷🔷 │   │ 🟪🟪🟪🟪🟪🟪🟪 │
│ Darker Blue      │   │ Darker Purple     │
│ Shadow: ↑ Lift   │   │ Shadow: ↑ Lift    │
│ Icon: 🔄 Rotate  │   │ Icon: 🔄 Rotate   │
└───────────────────┘   └───────────────────┘
```

### Processing State (Working)
```
Both Buttons:
┌───────────────────┐
│ ⚫⚫⚫⚫⚫⚫⚫ │
│ Gray Gradient     │
│ Icon: 💫 Pulse    │
│ Text: Processing  │
│ Disabled: Yes     │
└───────────────────┘
```

### Disabled State (Can't Use)
```
Both Buttons:
┌───────────────────┐
│ ⚫⚫⚫⚫⚫⚫⚫ │
│ Gray + Opacity    │
│ Cursor: not-allow │
│ No interactions   │
└───────────────────┘
```

---

## Complete UI Layout

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    SmartDocs Upload Interface                         ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  [ Local Device ]  [ SharePoint ]  [ Web URL ]                       ║
║                         ↑ ACTIVE                                      ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  🔍 Search: [___________________] 🅧                                  ║
║                                                                       ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │  AI AGENT BUTTONS (NEW)          │  ORIGINAL BUTTONS        │    ║
║  ├─────────────────────────────────────────────────────────────┤    ║
║  │  [📄 Transcript Agent]           │  [📤 Upload]             │    ║
║  │  [👤 CV Screening]               │  [🗑️  Clear]             │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                                                                       ║
║  📂 SharePoint Sites                                                  ║
║  ├── 📂 Site 1                                                        ║
║  │   ├── 📂 Folder A                                                 ║
║  │   │   ├── ☑️ 📄 transcript.docx (SELECTED)                        ║
║  │   │   └── ☑️ 📄 resume1.pdf (SELECTED)                            ║
║  │   └── 📂 Folder B                                                 ║
║  └── 📂 Site 2                                                        ║
║                                                                       ║
║  Selected: 2 files                                                    ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Animation Sequence

### Hover Animation (0.3s transition)
```
Step 1: Button at rest
┌────────────────┐
│  📄 Transcript │  ← Normal state
└────────────────┘

Step 2: Mouse enters (0.1s)
┌────────────────┐
│  📄 Transcript │  ← Color darkens
└────↑──────────┘     Shadow appears
    -1px

Step 3: Full hover (0.3s)
┌────────────────┐
│  📄✨Transcript│  ← Icon rotates 5°
└────↑↑─────────┘     Icon scales 1.15x
   -1px lifted        Shimmer passes

Step 4: Mouse leaves (0.3s)
┌────────────────┐
│  📄 Transcript │  ← Back to normal
└────────────────┘
```

### Processing Animation (1.5s loop)
```
Frame 1 (0s):         Frame 2 (0.75s):      Frame 3 (1.5s):
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 📄 Processing│     │ 📄 Processing│     │ 📄 Processing│
│ Icon: 100%   │ →   │ Icon: 70%    │ →   │ Icon: 100%   │
│ Scale: 1.0   │     │ Scale: 1.1   │     │ Scale: 1.0   │
└──────────────┘     └──────────────┘     └──────────────┘
   (Repeat infinitely)
```

---

## Button Interaction Flow

### Transcript Agent Flow:
```
User Action                 System Response              UI Feedback
───────────────────────────────────────────────────────────────────
1. Select 0 files          Check selection              ⚫ Button disabled
2. Select 1 file           Check selection              🔵 Button enabled
3. Hover button            Detect hover                 🔷 Darker + lift
4. Click button            Call handler                 ⚫ "Processing..."
5. Validate                Single file? ✓               💫 Pulse animation
6. Log to console          Print payload                📊 Console output
7. Show success            Toast notification           ✅ "Agent Started"
8. Complete                Reset state                  🔵 Button enabled
```

### CV Screening Flow:
```
User Action                 System Response              UI Feedback
───────────────────────────────────────────────────────────────────
1. Select 0 files          Check selection              ⚫ Button disabled
2. Select 3 files          Check selection              🟣 Button enabled
3. Hover button            Detect hover                 🟪 Darker + lift
4. Click button            Call handler                 ⚫ "Processing..."
5. Validate                Has files? ✓                 💫 Pulse animation
6. Log to console          Print payload array          📊 Console output
7. Show success            Toast notification           ✅ "Processing 3 files"
8. Complete                Reset state                  🟣 Button enabled
```

---

## Error State Examples

### Error 1: No Files Selected
```
User clicks button with 0 files selected:

┌──────────────────────────────────────────┐
│  ⚠️  No Files Selected                   │
│                                          │
│  Please select at least one file         │
│  to process with the AI Agent.           │
│                                          │
│  [OK]                                    │
└──────────────────────────────────────────┘
   ↑ Toast notification (Warning)
```

### Error 2: Multiple Files for Transcript
```
User clicks Transcript Agent with 3 files selected:

┌──────────────────────────────────────────┐
│  ⚠️  Multiple Files Selected             │
│                                          │
│  Transcript Agent can only process       │
│  one file at a time. Please select       │
│  only one file.                          │
│                                          │
│  [OK]                                    │
└──────────────────────────────────────────┘
   ↑ Toast notification (Warning)
```

### Success: Processing Started
```
Agent successfully triggered:

┌──────────────────────────────────────────┐
│  ✅ Agent Processing Started             │
│                                          │
│  CV Screening workflow initiated         │
│  for 3 files                             │
│                                          │
│  [OK]                                    │
└──────────────────────────────────────────┘
   ↑ Toast notification (Success)
```

---

## Console Output Examples

### Transcript Agent Console Log:
```javascript
============================================================
🤖 TRANSCRIPT AGENT - N8N Workflow Payload
============================================================
Agent Type: transcript_agent
File ID: 01ABCDEF123456789
Site ID: contoso.sharepoint.com,abc-123-def
File Name: meeting-transcript-2025-10-08.docx
Timestamp: 2025-10-08T10:30:45.123Z

📦 Complete Payload:
{
  "agentType": "transcript_agent",
  "fileId": "01ABCDEF123456789",
  "siteId": "contoso.sharepoint.com,abc-123-def",
  "fileName": "meeting-transcript-2025-10-08.docx",
  "timestamp": "2025-10-08T10:30:45.123Z",
  "source": "SmartDocs-SharePoint"
}
============================================================
```

### CV Screening Console Log:
```javascript
============================================================
🎯 CV SCREENING AGENT - N8N Workflow Payload
============================================================
Agent Type: cv_screening_agent
File Count: 3
File IDs: [
  "01ABCDEF123456789",
  "01GHIJKL987654321",
  "01MNOPQR246813579"
]
Site IDs: [
  "contoso.sharepoint.com,abc-123-def",
  "contoso.sharepoint.com,abc-123-def",
  "contoso.sharepoint.com,abc-123-def"
]
File Names: [
  "john-doe-resume.pdf",
  "jane-smith-cv.pdf",
  "bob-johnson-resume.docx"
]
Timestamp: 2025-10-08T10:30:45.123Z

📦 Complete Payload:
{
  "agentType": "cv_screening_agent",
  "fileIds": ["01ABCDEF123456789", "01GHIJKL987654321", ...],
  "siteIds": ["contoso.sharepoint.com,abc-123-def", ...],
  "fileNames": ["john-doe-resume.pdf", "jane-smith-cv.pdf", ...],
  "fileCount": 3,
  "timestamp": "2025-10-08T10:30:45.123Z",
  "source": "SmartDocs-SharePoint",
  "files": [
    {
      "id": "01ABCDEF123456789",
      "siteId": "contoso.sharepoint.com,abc-123-def",
      "name": "john-doe-resume.pdf"
    },
    ...
  ]
}
============================================================
```

---

## Button Dimensions

### Desktop (> 768px)
```
Transcript Agent:           CV Screening:
Width: auto (fits content)  Width: auto (fits content)
Height: 32px                Height: 32px
Padding: 7px 14px           Padding: 7px 14px
Gap: 6px (icon-text)        Gap: 6px (icon-text)
Border-radius: 6px          Border-radius: 6px
Font-size: 13px             Font-size: 13px
Font-weight: 600            Font-weight: 600
Icon-size: 18px             Icon-size: 18px
```

### Tablet (768px)
```
Width: 45% flex             Width: 45% flex
Min-width: 140px            Min-width: 140px
Other: Same as desktop      Other: Same as desktop
```

### Mobile (480px)
```
Width: 100%                 Width: 100%
Other: Same as desktop      Other: Same as desktop
Font-size: 12px (text)      Font-size: 12px (text)
```

---

## Color Palette

### Transcript Agent (Blue/Teal)
```
Normal:
  Start: #0ea5e9 (Sky Blue)
  End:   #06b6d4 (Cyan)

Hover:
  Start: #0284c7 (Darker Sky Blue)
  End:   #0891b2 (Darker Cyan)

Shadow (Hover):
  rgba(14, 165, 233, 0.4)

Border:
  rgba(255, 255, 255, 0.2)
```

### CV Screening (Purple/Violet)
```
Normal:
  Start: #8b5cf6 (Violet)
  End:   #a855f7 (Purple)

Hover:
  Start: #7c3aed (Darker Violet)
  End:   #9333ea (Darker Purple)

Shadow (Hover):
  rgba(139, 92, 246, 0.4)

Border:
  rgba(255, 255, 255, 0.2)
```

### Disabled (Both)
```
Start: #9ca3af (Gray)
End:   #6b7280 (Darker Gray)
Opacity: 0.6
Shadow: none
```

---

## Accessibility Features

### ARIA Labels & Tooltips
```html
<!-- Transcript Agent -->
<button 
  title="Process single transcript file with AI Agent"
  aria-label="Transcript Agent - Process single file"
  disabled={...}
>
  📄 Transcript Agent
</button>

<!-- CV Screening -->
<button 
  title="Screen multiple CV/Resume files with AI Agent"
  aria-label="CV Screening - Process multiple files"
  disabled={...}
>
  👤 CV Screening
</button>
```

### Keyboard Navigation
```
Tab:       Focus next button
Shift+Tab: Focus previous button
Enter:     Activate focused button
Space:     Activate focused button
Esc:       Close any open tooltips
```

### Screen Reader Announcements
```
"Transcript Agent button, Process single transcript file, disabled"
"CV Screening button, Screen multiple CV files, enabled"
"Button activated, Processing transcript file"
"Success, Agent processing started"
```

---

## Browser Compatibility

✅ Chrome/Edge: Full support (all animations)
✅ Firefox: Full support (all animations)
✅ Safari: Full support (all animations)
✅ Mobile Safari: Full support (touch-optimized)
✅ Chrome Mobile: Full support (touch-optimized)

---

**Visual Reference Version**: 1.0.0  
**Last Updated**: October 8, 2025  
**Status**: Ready for Production

