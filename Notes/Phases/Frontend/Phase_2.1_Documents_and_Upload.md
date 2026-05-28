---
phase: "2.1"
area: frontend
title: "Documents Page & Upload"
status: done
depends_on: ["1.5", "1.6"]
created: 2026-05-27
updated: 2026-05-27
---

# Rowan Rose Client Portal — Phase 2.1: Documents Page & Upload Functionality

<context>
Phases 1.1 through 1.6 are complete. The app has a working design system, layout shell, full auth flow, session management, dashboard with claim cards, and claim detail view with progress stepper, timeline, financial summary, and action items. Mock data exists for 4–6 claims. The useFetch hook, statusMapping, formatDate, and formatCurrency utilities are all in place.

This is Phase 2.1. You are building the Documents page where clients can view their outstanding requirements, upload documents, and see a history of all previously uploaded documents. Documents are uploaded to AWS S3 (mocked in this phase) and linked to the client's CRM record. Outstanding requirements are tracked at the client level (not per-claim) — when a document upload satisfies a requirement, the corresponding tick-box is updated.

All API calls continue to be MOCKED. File uploads will simulate a delay and success response without actually uploading to S3.
</context>

<tasks>

## Task 1: Mock Data — Documents & Upload Responses

Extend the mock data layer with document-related data and API functions.

Create `src/api/mocks/documents.ts`:

```typescript
interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;              // MIME type: "application/pdf", "image/jpeg", etc.
  fileSize: number;              // In bytes
  documentType: DocumentType;
  uploadedAt: string;            // ISO date string
  status: 'received' | 'processing' | 'verified' | 'rejected';
  rejectionReason?: string;
  thumbnailUrl?: string;         // For image files, a placeholder thumbnail
}

type DocumentType = 'id' | 'proof_of_address' | 'bank_statement' | 'loan_agreement' | 'other';

interface UploadResponse {
  success: boolean;
  document: UploadedDocument;
  requirementUpdated: string | null;  // Which requirement was satisfied, if any
  message: string;
}
```

Mock uploaded documents (pre-existing for the test client):

1. Bank Statement — bank_statement_jan2026.pdf, 2.4MB, PDF, uploaded 10 days ago, status: verified
2. Loan Agreement — vanquis_agreement.pdf, 1.8MB, PDF, uploaded 8 days ago, status: verified
3. Questionnaire — questionnaire_completed.pdf, 540KB, PDF, uploaded 12 days ago, status: verified
4. Extra Lender Form — extra_lender_form.pdf, 320KB, PDF, uploaded 12 days ago, status: verified

These 4 documents correspond to the "ticked" requirements (questionnaire and extra lender form are ticked in the Phase 1.5 mock data). ID Verification and Proof of Address remain unticked — no documents uploaded for those yet.

Mock API functions:

```typescript
// GET /client/documents — returns all uploaded documents
function getClientDocuments(): Promise<UploadedDocument[]>
// Simulate 600ms delay, return the 4 mock documents

// POST /client/documents/upload — simulates uploading a file
function uploadDocument(file: File, documentType: DocumentType): Promise<UploadResponse>
// Simulate 2-3 second delay (progressive, for progress bar simulation)
// Always return success with a new UploadedDocument object
// If documentType is 'id' → set requirementUpdated to 'id_verification'
// If documentType is 'proof_of_address' → set requirementUpdated to 'proof_of_address'
// Otherwise requirementUpdated is null

// DELETE /client/documents/:id — remove a document (optional, for user correction)
function deleteDocument(documentId: string): Promise<{ success: boolean; message: string }>
// Simulate 500ms delay
```

Add corresponding functions to `src/api/documents.ts` that call the mocks.

## Task 2: Outstanding Requirements Section

This section sits at the top of the Documents page and shows each of the 4 client-level requirements with their current status.

Fetch requirements using the existing fetchRequirements() function from Phase 1.5.

Layout — a grid of 4 requirement cards:
- Desktop: 2 columns, 2 rows
- Tablet: 2 columns
- Mobile: 1 column stacked

Each requirement card:

**When unticked (action needed):**
- Left border: 4px solid amber/warning colour
- Icon: AlertCircle in amber
- Requirement label in bold, font-size-base (e.g. "ID Verification")
- Description text in font-size-sm, text-secondary:
  - ID Verification: "Upload a photo of your passport, driving licence, or national ID card."
  - Proof of Address: "Upload a recent utility bill, bank statement, or council tax letter (dated within the last 3 months)."
  - Questionnaire: "Please complete and upload the client questionnaire form."
  - Extra Lender Form: "Upload the additional lender information form if applicable."
- Action button: "Upload" (primary, small) — scrolls down to the upload section and pre-selects the relevant document type in the dropdown
- Background: subtle amber tint (5% opacity)

**When ticked (completed):**
- Left border: 4px solid brand-primary/green
- Icon: CheckCircle in brand-primary
- Requirement label with "Completed" badge next to it
- Description: "Received on {date}" using formatUKDate
- No action button
- Background: subtle green tint (5% opacity)
- Slightly lower visual emphasis than unticked cards (lower opacity or muted)

Summary line above the cards:
- If all ticked: "All requirements are complete. Thank you!" with a green CheckCircle icon
- If some unticked: "{count} of 4 requirements need your attention" with an amber AlertTriangle icon

## Task 3: Document Upload Component

Create a `DocumentUpload.tsx` component in `src/components/documents/` (new subfolder for document-related components).

### 3a. Document Type Selector

Dropdown (select or custom dropdown component) for choosing the document type before uploading:
- Options: "ID Document", "Proof of Address", "Bank Statement", "Loan Agreement", "Other"
- Maps to: 'id', 'proof_of_address', 'bank_statement', 'loan_agreement', 'other'
- Required — cannot upload without selecting a type
- Label: "What type of document is this?"
- If navigated here from a requirements card "Upload" button, pre-select the relevant type

### 3b. Drag-and-Drop Upload Zone

A large drop zone area for uploading files:

Visual design:
- Dashed border (2px dashed var(--border)), rounded corners (12px)
- Centred content: Upload cloud icon (UploadCloud from lucide-react), large
- Primary text: "Drag and drop your files here" in font-size-lg
- Secondary text: "or" in text-muted
- "Browse Files" button (secondary variant) that opens the native file picker
- Tertiary text: "Accepted formats: PDF, JPG, JPEG, PNG, HEIC — Max 10MB per file" in font-size-xs, text-muted
- Minimum height: 200px
- Background: transparent or very subtle var(--bg-tertiary)

Drag states:
- **Default**: dashed border in var(--border)
- **Drag over (valid files)**: dashed border changes to brand-primary, background becomes brand-primary at 5% opacity, text changes to "Drop your files here", icon animates (slight bounce or scale)
- **Drag over (invalid files)**: dashed border changes to red/brand-accent, background becomes red at 5% opacity, text changes to "File type not accepted"
- **Uploading**: border becomes solid brand-primary, upload progress shown inside

File validation (performed BEFORE upload):
- **File type check**: accept only PDF, JPG, JPEG, PNG, HEIC
  - Check both the file extension and the MIME type
  - HEIC MIME type: "image/heic" or "image/heif"
  - Rejected files: show error toast "'{filename}' is not an accepted file type. Please upload a PDF, JPG, PNG, or HEIC file."
- **File size check**: maximum 10MB (10,485,760 bytes) per file
  - Rejected files: show error toast "'{filename}' is too large ({size}MB). Maximum file size is 10MB."
- **File count check**: maximum 5 files per upload batch
  - If more than 5 files are dropped/selected: show error toast "You can upload a maximum of 5 files at once. You selected {count} files."

Multiple file support:
- Accept up to 5 files simultaneously (via drag-and-drop or file picker with multiple selection)
- Each file is validated independently
- Valid files proceed to upload, invalid files are rejected with individual error messages

### 3c. Upload Progress

After files are validated and upload begins, show progress for each file:

File upload queue — a list below the drop zone showing each file being uploaded:

Each file row:
- File icon (based on type: FileText for PDF, Image for images)
- File name (truncated with ellipsis if too long)
- File size (formatted: "2.4 MB", "540 KB")
- Progress bar: animated bar from 0% to 100%
  - Colour: brand-primary
  - Height: 8px
  - Rounded ends
  - Percentage label: "67%"
- Status:
  - Uploading: spinner + "Uploading..." text
  - Success: green CheckCircle + "Uploaded successfully"
  - Error: red XCircle + "Upload failed" + "Retry" link

Mock upload progress simulation:
- Use setInterval to increment progress from 0 to 100 over 2–3 seconds
- Increment by random amounts (10–25%) at random intervals (200–500ms) to feel realistic
- At 100%, call the mock API and show success/error state
- Add a small delay at 100% before showing "success" (simulating server processing)

Cancel upload:
- Each uploading file has a small X button to cancel the upload
- Cancelling stops the progress simulation and removes the file from the queue
- Show brief toast: "Upload cancelled"

### 3d. Post-Upload Behaviour

After a successful upload:
- Add the new document to the uploaded documents list (Task 4) immediately (optimistic update)
- If the upload satisfied a requirement (requirementUpdated is not null):
  - Show a success toast: "Document uploaded! Your {requirement name} has been marked as complete."
  - Update the requirements section: change the relevant card from unticked to ticked with animation
  - Update the requirements data in state (refetch or local update)
- If no requirement was updated:
  - Show a simple success toast: "Document uploaded successfully."
- Clear the completed file from the upload queue after 3 seconds
- Reset the drop zone to its default state

## Task 4: Uploaded Documents List

A table/list showing all previously uploaded documents, sorted by most recent first.

### Desktop Layout (table):

| Column | Width | Content |
|--------|-------|---------|
| Type Icon | 40px | File type icon (PDF icon, image icon) |
| Document Name | Flexible | File name, truncated if needed |
| Type | 150px | Document type label (e.g. "ID Document", "Bank Statement") |
| Date Uploaded | 150px | Formatted UK date (e.g. "18 May 2026") |
| Size | 100px | Formatted size (e.g. "2.4 MB") |
| Status | 120px | Status badge |

Status badges:
- Received: blue badge "Received"
- Processing: amber badge "Processing"
- Verified: green badge "Verified"
- Rejected: red badge "Rejected" — with an info tooltip showing the rejection reason on hover/focus

Table styling:
- Alternating row backgrounds (var(--bg-primary) and var(--bg-secondary))
- Hover state: var(--bg-tertiary)
- Header row: bold, text-secondary, uppercase font-size-xs, sticky on scroll
- Borders: subtle var(--border) between rows

### Mobile Layout (cards):

On mobile (below 768px), switch from table to stacked cards:
- Each document as a Card component
- File icon + name on the first line
- Type badge + date on the second line
- Size + status on the third line
- Gap: 12px between cards

### Empty State

If no documents have been uploaded yet:
- Centred message with a FileText icon
- "No documents uploaded yet"
- "Upload your first document using the area above."

### Sorting and Filtering

Above the table, add simple controls:
- Sort dropdown: "Most Recent" (default), "Oldest First", "Name A–Z"
- Filter by type dropdown: "All Types" (default), "ID Document", "Proof of Address", "Bank Statement", "Loan Agreement", "Other"
- Results count: "Showing {count} of {total} documents"

## Task 5: File Size Formatting Utility

Create or add to `src/utils/formatFile.ts`:

```typescript
// Formats bytes into human-readable size: "2.4 MB", "540 KB", "1.2 GB"
function formatFileSize(bytes: number): string

// Returns a user-friendly document type label from the type key
function formatDocumentType(type: DocumentType): string
// 'id' → "ID Document"
// 'proof_of_address' → "Proof of Address"
// 'bank_statement' → "Bank Statement"
// 'loan_agreement' → "Loan Agreement"
// 'other' → "Other"

// Returns the appropriate lucide-react icon name for a file MIME type
function getFileIcon(mimeType: string): string
// "application/pdf" → "FileText"
// "image/*" → "Image"
// default → "File"

// Validates a file against the upload rules, returns errors if any
function validateFile(file: File): { valid: boolean; error: string | null }
```

## Task 6: Documents Page Assembly

Route: /documents
File: Update `src/pages/Documents.tsx` (replace the placeholder)

Page structure (top to bottom):

1. **Page heading**: "Documents" in font-size-2xl with an Upload icon
2. **Outstanding Requirements section** (Task 2) — always visible at the top
3. **Divider line**
4. **Upload section heading**: "Upload Documents" in font-size-xl
5. **Document type selector** (Task 3a)
6. **Drag-and-drop upload zone** (Task 3b)
7. **Upload progress queue** (Task 3c) — visible only when files are uploading or recently uploaded
8. **Divider line**
9. **Uploaded documents heading**: "Your Documents" in font-size-xl with sort/filter controls
10. **Documents list/table** (Task 4)

Data fetching on mount:
- Fetch requirements via fetchRequirements()
- Fetch documents via fetchDocuments() (new)
- Use useFetch hook for both, run in parallel
- Show skeleton loaders while loading

Loading state:
- Skeleton cards for the requirements section
- Skeleton rows for the documents table
- Upload zone visible but with reduced opacity and "Loading..." text

Error state:
- If requirements fail to load: show error inline in that section with retry
- If documents fail to load: show error inline in documents section with retry
- Upload zone should still work even if the documents list fails to load

## Task 7: Integration with Dashboard & Claim Detail

Update the following to link correctly to the Documents page:

1. **Dashboard outstanding requirements banner** (Phase 1.5): "Upload" buttons should navigate to /documents and ideally scroll to/highlight the relevant requirement
2. **Claim Detail action items** (Phase 1.6): "Upload" buttons for outstanding requirements should navigate to /documents
3. **Dashboard quick action** (Phase 1.5): "Upload Document" button should navigate to /documents

Use URL query parameters or route state to communicate which requirement to highlight:
- e.g. /documents?highlight=id_verification
- On the Documents page, if a highlight parameter is present:
  - Scroll the relevant requirement card into view
  - Add a brief highlight animation (pulse or glow) on that card
  - Pre-select the relevant document type in the upload dropdown

## Task 8: Notification Integration

When a document is uploaded successfully:
- Trigger a mock "document_uploaded" notification
- If this would be a real system, an email confirmation would be sent
- For now, just show the toast notification (already covered in Task 3d)
- Update the notification count in the header if applicable (optional — notifications system is Phase 6.1)

</tasks>

<accepted_file_types>
Define these constants in a shared config file `src/config/upload.ts`:

```typescript
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'image/heif': ['.heic'],
};

export const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.heic'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB in bytes
export const MAX_FILES_PER_UPLOAD = 5;

export const DOCUMENT_TYPES = [
  { value: 'id', label: 'ID Document' },
  { value: 'proof_of_address', label: 'Proof of Address' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'loan_agreement', label: 'Loan Agreement' },
  { value: 'other', label: 'Other' },
] as const;
```
</accepted_file_types>

<accessibility_requirements>
- Drag-and-drop zone: role="button" with aria-label="Upload documents. Drag and drop files here or click to browse." Also keyboard accessible — Enter/Space opens file picker
- File input: visually hidden but accessible, labelled properly
- Upload progress: aria-live="polite" region announcing "Uploading {filename}, {percentage}% complete" and "Upload complete" / "Upload failed"
- Requirements cards: each card is an article element with aria-label describing the requirement and its status
- Documents table: proper table semantics with th scope="col", caption "Your uploaded documents"
- Sort and filter dropdowns: properly labelled with aria-label
- Status badges in table: include screen-reader text (not just colour — e.g. "Status: Verified")
- Rejected status tooltip: accessible via keyboard focus (not just hover)
- Cancel upload button: aria-label="Cancel upload of {filename}"
- Error messages: role="alert"
- Loading skeletons: aria-hidden="true"
- Entire page: main landmark with aria-label="Documents"
</accessibility_requirements>

<files_expected>
```
src/
├── api/
│   ├── documents.ts               (new — document API functions)
│   └── mocks/
│       └── documents.ts           (new — mock document data and functions)
├── components/
│   └── documents/
│       ├── DocumentUpload.tsx     (new — drag-drop upload zone + progress)
│       ├── DocumentTypeSelector.tsx (new — dropdown for document type)
│       ├── UploadProgress.tsx     (new — file upload queue with progress bars)
│       ├── RequirementsGrid.tsx   (new — outstanding requirements cards)
│       └── DocumentsList.tsx      (new — uploaded documents table/cards)
├── config/
│   └── upload.ts                  (new — upload constants and config)
├── pages/
│   └── Documents.tsx              (updated from placeholder)
├── utils/
│   └── formatFile.ts              (new — file size formatting, validation)
└── App.tsx                        (unchanged)
```
</files_expected>

<test_scenarios>
**Requirements Section:**
1. Requirements grid shows 4 cards — 2 unticked (ID, Proof of Address), 2 ticked (Questionnaire, Extra Lender Form)
2. Summary text shows "2 of 4 requirements need your attention"
3. Ticked cards show green border, "Completed" badge, and received date
4. Unticked cards show amber border, description, and "Upload" button
5. Clicking "Upload" on ID Verification card scrolls to upload section and pre-selects "ID Document" type

**Upload — Valid Files:**
6. Select document type → drag a PDF file into the zone → progress bar animates → "Uploaded successfully" shown
7. Click "Browse Files" → select a JPG → upload succeeds
8. Drop 3 files simultaneously → all 3 upload with individual progress bars
9. Upload an ID document → requirement card updates to "ticked" with animation → success toast mentions requirement completed
10. Upload a Proof of Address → second requirement updates → summary now shows "All requirements are complete"

**Upload — Validation Errors:**
11. Drop a .docx file → error toast: "not an accepted file type"
12. Drop a 15MB file → error toast: "too large"
13. Drop 7 files at once → error toast: "maximum of 5 files"
14. Try to upload without selecting document type → validation error on dropdown
15. Drop a file with wrong extension but valid MIME type → handled correctly

**Upload — Cancel and Retry:**
16. Start uploading → click cancel X → upload stops, file removed from queue, toast shown
17. If an upload were to fail (simulate by temporarily modifying mock) → "Upload failed" with "Retry" link → clicking retry re-uploads

**Documents List:**
18. Table shows 4 pre-existing documents sorted by most recent
19. Status badges show correct colours (Verified = green)
20. Sort by "Oldest First" → order reverses
21. Filter by "Bank Statement" → only 1 document shown, count updates
22. After uploading a new document → it appears at the top of the list immediately

**Empty State:**
23. If no documents exist (modify mock temporarily) → empty state message shown

**Integration:**
24. Navigate from dashboard requirements banner "Upload" → documents page with correct requirement highlighted
25. Navigate from claim detail action item → documents page
26. Navigate from dashboard "Upload Document" quick action → documents page

**Drag-and-Drop Visual States:**
27. Drag valid file over zone → green border, "Drop your files here" text
28. Drag invalid file over zone → red border, "File type not accepted" text
29. Drag leaves zone → returns to default state

**Responsive:**
30. Desktop: table layout for documents, 2-column requirements grid
31. Mobile (375px): card layout for documents, single-column requirements, upload zone fills width
32. Tablet: 2-column requirements, table layout

**Theming:**
33. Dark theme: drop zone borders visible, progress bars visible, table rows distinguishable
34. High contrast: all text readable, status badges have sufficient contrast
35. Extra Large font: all labels and table text scale, drop zone text readable
</test_scenarios>

<acceptance_criteria>
- [ ] npm run dev starts without errors
- [ ] Requirements section shows correct ticked/unticked status for all 4 requirements
- [ ] Unticked requirements show description and upload button
- [ ] Ticked requirements show "Completed" with date
- [ ] Clicking upload on a requirement pre-selects the document type and scrolls to upload area
- [ ] Document type dropdown is required before uploading
- [ ] Drag-and-drop zone accepts files with correct visual states (default, drag-over, invalid)
- [ ] "Browse Files" button opens native file picker
- [ ] File type validation rejects non-accepted formats with toast error
- [ ] File size validation rejects files over 10MB with toast error
- [ ] Maximum 5 files per upload enforced with toast error
- [ ] Upload progress bar animates realistically for each file
- [ ] Cancel button stops an in-progress upload
- [ ] Successful upload adds document to the list immediately
- [ ] Uploading an ID document or Proof of Address updates the corresponding requirement to ticked
- [ ] Success toast mentions requirement completion when applicable
- [ ] Documents list shows all uploaded documents with correct data
- [ ] Sort and filter controls work correctly
- [ ] Empty state shows when no documents exist
- [ ] Mobile view switches from table to card layout for documents
- [ ] Navigation from dashboard/claim detail highlights the correct requirement
- [ ] All 3 themes render correctly
- [ ] All 3 font sizes scale correctly
- [ ] Responsive at 375px, 768px, 1024px+
- [ ] All accessibility requirements met
- [ ] No TypeScript errors
- [ ] No console warnings or errors
</acceptance_criteria>

<notes_for_next_phase>
Phase 3.1 will build the Messages page — per-claim message threads with a chat-style interface, reply functionality, unread indicators, and claim selector. It will reuse the existing claims mock data and add message-specific mock data.
</notes_for_next_phase>

## Build notes — what actually happened (2026-05-27)

Built against the real **Modern Jurist** app (`frontend/app/`), adapting the spec's intent — the spec is a generic template whose paths/APIs/icons don't match the build. Key mappings:

- **Icons:** Material Symbols via `<Icon name="…"/>` (not lucide). cloud_upload / description / image / draft / check_circle / warning / error / close / cancel / upload_file / verified / inbox / hourglass_top.
- **Tokens:** M3 `--c-*` via Tailwind. Unticked/action = **tertiary** (amber ramp; left bar `bg-tertiary-fixed-dim`, matches `ActionItems`); completed = **primary**; rejected = **error**; received = **secondary**; processing = **tertiary**. Every status badge has icon + text + `sr-only` "Status: …".
- **Data:** `useMockQuery(getClient,"client")` seeds local React state (requirements + documents) for optimistic mutations — no separate fetchRequirements/fetchDocuments. `useFetch`/`statusMapping` don't exist here.
- **Files in `src/lib/format.ts`** (not `src/utils/`): added `formatFileSize`, `formatDocumentType`, `getFileIcon`, `validateFile`. Constants in `src/config/upload.ts` (10MB cap, 5-file batch, HEIC added).

**Requirements model (corrected by Brad after first pass):** upload requirements are the things a client **uploads a file** for — **ID Verification, Proof of Address, Bank Statement**. **ID + Proof of Address are client-level (one each); Bank Statement is LENDER-SPECIFIC — one requirement per lender/claim** (each tagged `lenderName` + `claimId`; title carries the lender, e.g. "Bank Statement — QuidMarket"). Mock: ID + Proof of Address outstanding, Bank Statement — QuidMarket outstanding, Bank Statement — Vanquis `done` → "3 of 4 need your attention". Added `receivedOn?`, `lenderName?`, `claimId?` to `Requirement` and `lenderName?` to `UploadedDoc`. Upload→requirement: `id`→`id`, `address`→`address`, `bank-statement`→`bank-statements`.

**Per-lender upload targeting:** because multiple bank-statement requirements share the kind `bank-statements`, an upload must know *which lender*. The page tracks `targetReqId`, set when launched from a specific requirement card or a `?highlight=<requirementId>` deep link (highlight is now a **requirement id**, not a kind — `WhatWeNeedCard`/`ActionItems` links + `RequirementsGrid` pulse updated accordingly). On upload: tick the targeted requirement if its kind matches, else the sole outstanding requirement of that kind (ID/Proof of Address are unique). The new doc inherits the satisfied requirement's `lenderName`, shown in the list as e.g. "Bank Statement · QuidMarket". `ActionItems` now claim-scopes requirements (`!claimId || claimId === claim.id`) so a claim page only shows ITS bank statement plus the client-level ones. Verified: deep-link `?highlight=r-bank-quid` → preselect Bank Statement + target QuidMarket → upload ticks **only** QuidMarket (Vanquis untouched), doc tagged QuidMarket.

> **Questionnaire, Extra Lender Form, Acceptance Form are NOT uploads** — they arrive as **CRM-generated links** and surface in the portal only once generated on the CRM side. The portal isn't wired to the CRM yet, so this is **deferred** (build with the CRM connection, ~phase 7.1). They are intentionally absent from the requirements grid and seed documents. (My first pass mis-modelled them as completed uploaded docs per the generic spec — corrected.)

**Type changes:** extended `UploadedDoc` (added `mime`, `fileSize` bytes, `documentType`, `status`, `rejectionReason?`; dropped `sizeLabel`); added `DocumentType`, `DocStatus`, `UploadResponse`. `DocumentType` = `id | address | bank-statement | loan-agreement | other` (questionnaire/extra-lender seed docs are typed `other`). Upload→requirement satisfaction: `id`→`id`, `address`→`address`.

**Files added:** `src/config/upload.ts`; `src/api/documents.ts` + `src/api/mocks/documents.ts` (USE_MOCKS pattern like auth; upload simulates client-side progress then calls the mock at 100%); `src/components/documents/{DocumentTypeSelector,DocumentUpload,UploadProgress,RequirementsGrid,DocumentsList}.tsx`. **Rewrote** `src/routes/Documents.tsx`. **Deleted** the superseded `src/components/upload/{UploadZone,RequirementRow}.tsx`. **Integration:** `WhatWeNeedCard` + `ActionItems` requirement links now carry `?highlight=<kind>`; Documents reads it via `useSearchParams` to scroll + pulse the card and pre-select the type. QuickActions "Upload Document" already pointed at `/documents`.

**Deviations from spec:** routes live in `src/routes/` not `src/pages/`; document components in `src/components/documents/`; single page-level load/retry rather than two independent fetches; native `<select>`s for type/sort/filter (most accessible at 200% zoom); table header not `position:sticky` (rounded `overflow-hidden` panel, short list — skipped to avoid broken clipping). Themes are Light/Dark/System (no separate "high contrast" theme in this build). Thumbnails for image docs not generated (no real files) — image icon used.

**Verified in-browser** (Chrome DevTools MCP, `client@test.com`): requirements grid 2/2 + "2 of 4"; pre-select from `?highlight=id`; PDF upload → progress → success → ID requirement ticks + toast; Proof of Address upload → "All requirements are complete"; new doc prepended with RECEIVED badge; `.docx` + 11MB + no-type-selected all rejected with correct toasts/`role=alert`; sort Oldest reverses; filter Bank Statement → "Showing 1 of 5"; desktop table ↔ mobile cards; Light theme + Extra Large text reflow intact; `aria-live` upload announcements; clean console; `npm run build` + `tsc` pass.

**Not exercised live (logic in place):** drag-over visual states + 7-file batch cap + cancel-mid-upload + retry-on-failure (mock always succeeds) + true zero-document empty state. Test fixtures used: a tiny PDF, a `.docx`, an 11MB `.pdf` (temp dir, since deleted).
