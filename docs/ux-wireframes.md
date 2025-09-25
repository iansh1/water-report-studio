# UX Wireframes (Textual)

Below are screen blueprints to guide the Next.js rebuild. Each wireframe calls out major sections, layout hierarchy, and interaction notes. Dimensions assume desktop first (~1440px width) with responsive adjustments.

---

## 1. Landing / Upload (No PDF Loaded)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Top App Bar (height ~64px)                                                  │
│ ├─ Left: Logo / Title "Water Quality Reporter"                              │
│ ├─ Right: [Theme Toggle]  [ Upload Icon (disabled) ]                         │
└─────────────────────────────────────────────────────────────────────────────┘
┌───────────────────────┬──────────────────────────────────────────────────────┐
│ Left Column (350px)   │ Main Canvas                                          │
│ ├─ Glass Card         │ ├─ Centered Illustration/Icon                        │
│ │  • Cloud upload     │ ├─ Headline: "Upload Report"                         │
│ │  • CTA: "Select PDF"│ ├─ Body copy prompting drag & drop (future)          │
│ └─────────────────────┘ │                                                   │
│                         │ └─ Empty state note with arrow hint to left panel │
└─────────────────────────┴────────────────────────────────────────────────────┘
```
**Responsive:** On tablets/phones, collapse to single column; upload card sits on top, empty state below.

---

## 2. Processing State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ App Bar (same as landing)                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│ Main Body                                                                    │
│ ├─ Centered Card (max-width ~480px)                                          │
│ │  • Spinner                                                                │
│ │  • Headline: "Processing PDF…"                                            │
│ │  • Copy explaining steps                                                   │
│ │  • Vertical step list with progress indicators:                            │
│ │     1. Uploading PDF file (active)                                         │
│ │     2. Analyzing document structure (active/pending)                       │
│ │     3. Extracting contaminant data (active/pending)                        │
│ │     4. Generating form fields (pending)                                    │
│ └─ Background remains neutral                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```
**Animation cues:** Step bullets fill in sequence; allow subtle fade-in/out between steps.

---

## 3. Review & Edit (PDF + Form)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ App Bar                                                                     │
│ ├─ Right actions: [Upload New File (spinner if busy)] [Show/Hide PDF]        │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│ Horizontal Split Layout                                                     │
│ ├─ Left/Main (flex)                                                         │
│ │  • Header block with page title + subtle entrance animation                │
│ │  • Contaminant cards stack (scrollable)                                   │
│ │     - Card header: editable contaminant name + remove icon                │
│ │     - Two-column field grid (inputs + dropdowns)                          │
│ │     - Optional field sections appear when data available                  │
│ │  • Footer actions centered:                                                │
│ │     [Clear Form]   [Generate SQL]                                         │
│ ├─ Divider (drag handle ~8px)                                               │
│ ├─ Right PDF Panel (resizable 250–800px)                                    │
│ │  • Top toolbar: file icon + name, close button                            │
│ │  • Secondary toolbar: size text, zoom -, percentage, zoom +, reset,       │
│ │    fullscreen, open-in-new-tab                                             │
│ │  • PDF viewport (iframe/canvas)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```
**Responsive adjustments:**
- Tablet: stack PDF panel below form, toggle via tabs.
- Mobile: hide PDF preview; offer “Open PDF in new tab” link near top.

**Interactions:**
- Drag handle adjusts panel width with cursor feedback.
- Cards animate on entry/removal; checkbox or icon affords removal confirmation.

---

## 4. SQL Output Dialog
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Modal Header                                                                │
│ ├─ Left: Icon + "MariaDB SQL Script Generated"                               │
│ ├─ Right: Close button                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Stats Bar                                                                   │
│ ├─ Chip: Table name                                                         │
│ ├─ Chip: Record count                                                       │
│ └─ Chip: Timestamp ("Generated: Now")                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Action Row                                                                  │
│ ├─ [Copy to Clipboard]  (with success state)                                │
│ └─ [Download .sql]                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Tab Navigation (SQL Script | Preview | Deploy Guide)                        │
│ ├─ Tab content area (fills remaining height)                                │
│ │  • SQL Script: dark code panel with scroll                               │
│ │  • Preview: cards summarizing schema & inserts                            │
│ │  • Deploy Guide: stepper cards with copy buttons                          │
└─────────────────────────────────────────────────────────────────────────────┘
```
**Animation:** Modal fades in with slight scale; tab indicator slides smoothly; copy button transitions to check icon momentarily.

---

## 5. Error State (Processing Failure)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ App Bar                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│ Centered Error Card                                                         │
│ ├─ Icon (warning)                                                           │
│ ├─ Headline: "Processing Error"                                            │
│ ├─ Message: error text from backend                                         │
│ └─ CTA: [Try Again] (clears state, returns to upload prompt)                │
└─────────────────────────────────────────────────────────────────────────────┘
```
**Feedback:** Snackbar also surfaces brief failure message; returning to upload restores initial layout.

---

## Interaction & Motion Guidelines
- Use Framer Motion or CSS transitions for:
  - Contaminant card entrance (staggered slide/fade).
  - Divider drag feedback (subtle highlight).
  - Theme toggle (sun/moon morph, background crossfade).
  - Modal open/close (fade + scale).
- Maintain 12–16px base spacing grid; leverage glassmorphism accents from original design with Tailwind/utility classes or custom styles.

---

## Accessibility Considerations
- Ensure focus states on all interactive elements (buttons, tabs, drag handle).
- Provide aria labels for icons (upload, copy, zoom controls).
- Support keyboard shortcuts where sensible (Esc closes modal, Enter on primary CTA).
- Respect prefers-reduced-motion for animations.

