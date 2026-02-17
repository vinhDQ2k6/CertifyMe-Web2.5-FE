# UI Implementation Plan - FPT Certificate System

## Overview

This document outlines the step-by-step implementation plan for the FPT Certificate System UI based on the requirements in `SketchUI.md`. The system supports three user roles: **Student** (Sinh viên), **Teacher** (Giáo viên), and **Admin**.

### Technology Stack

- **Framework**: Vue 3 (Composition API)
- **UI Library**: PrimeVue with Aura theme
- **Styling**: Tailwind CSS + PrimeCSS
- **Routing**: Vue Router
- **State Management**: Composables (Vue 3 best practice)

---

## Architecture Overview

### Directory Structure

```
src/
├── views/                           # Page-level components (route views)
│   ├── auth/
│   │   └── LoginGoogle.vue         # Google OAuth login page
│   ├── student/
│   │   ├── StudentDashboard.vue    # Student landing page
│   │   ├── CourseDetail.vue        # Course/Class detail page
│   │   └── CertificateView.vue     # Certificate display page
│   ├── teacher/
│   │   ├── TeacherDashboard.vue    # Teacher landing page
│   │   ├── ClassDetail.vue         # Class management with tabs
│   │   └── QuizManagement.vue      # Quiz create/edit/list
│   └── admin/
│       ├── AdminDashboard.vue      # Admin landing page
│       └── CertificateManagement.vue # Certificate detail & revoke
├── components/
│   ├── student/                     # Student-specific reusable components
│   │   ├── CourseCard.vue
│   │   ├── QuizList.vue
│   │   ├── ProgressBar.vue
│   │   └── CertificateCard.vue
│   ├── teacher/                     # Teacher-specific components
│   │   ├── ClassTable.vue
│   │   ├── StudentTable.vue
│   │   ├── QuizForm.vue
│   │   └── QuestionForm.vue
│   ├── admin/                       # Admin-specific components
│   │   ├── CertificateTable.vue
│   │   ├── CertificateDetail.vue
│   │   └── RevokeDialog.vue
│   └── shared/                      # Shared reusable components
│       ├── StatsCard.vue            # Reusable stats card (from StatsWidget)
│       └── BlockchainInfo.vue       # Blockchain verification display
├── composables/                     # Business logic & state management
│   ├── useAuth.js                   # Authentication state
│   ├── useStudent.js                # Student data operations
│   ├── useTeacher.js                # Teacher data operations
│   └── useAdmin.js                  # Admin operations
├── services/                        # API & external integrations
│   ├── AuthService.js               # Google OAuth integration
│   ├── CourseService.js             # Course/Class API calls
│   ├── QuizService.js               # Quiz operations
│   └── CertificateService.js        # Certificate & blockchain operations
└── router/
    └── index.js                     # Route definitions with role guards
```

---

## Implementation Strategy

### Principle 1: Reuse Existing Templates

- **Login template**: `src/templates/pages/auth/Login.vue` → Customize for Google OAuth
- **Dashboard pattern**: `src/templates/Dashboard.vue` → Use for all dashboard pages
- **CRUD template**: `src/templates/pages/Crud.vue` → DataTable, Dialog, Toolbar patterns
- **Stats widget**: `src/components/dashboard/StatsWidget.vue` → Extract for `StatsCard.vue`
- **Layout system**: `AppLayout.vue` + `AppTopbar.vue` + `AppSidebar.vue` → Use for all authenticated pages

### Principle 2: Clean Code Architecture

- **Views**: Page-level containers (handle routing, layout)
- **Components**: Reusable, single-responsibility units (data display, forms)
- **Composables**: Business logic, state management, data operations
- **Services**: API calls, external integrations (Google OAuth, blockchain)

### Principle 3: Component Reusability

- Extract common patterns into shared components
- Use props for configuration, emits for parent communication
- Avoid duplicating code across roles

---

## Phase 1: Authentication

### 1.1 Create LoginGoogle.vue

**Path**: `src/views/auth/LoginGoogle.vue`

**Base Template**: Adapt `src/templates/pages/auth/Login.vue`

**Changes**:

- Remove email/password inputs
- Add Google OAuth button with Google logo (or text "Login with Google")
- Add info text: "Chỉ hỗ trọ email @fpt.edu.vn"
- Center FPT Certificate System logo
- Center card with gradient background

**PrimeVue Components Used**:

- `Card` - Main container
- `Button` - Login button

**Key Service**:

- `AuthService.js` - Handle Google OAuth integration, token storage, role detection

**Route**:

```javascript
{ path: '/auth/login', name: 'login', component: LoginGoogle }
```

---

## Phase 2: Student Interface

### 2.1 Student Dashboard

**Path**: `src/views/student/StudentDashboard.vue`

**Base Template**: `src/templates/Dashboard.vue` pattern

**Layout Structure**:

```
┌─────────────────────────────────────────┐
│ Header (AppTopbar)                      │
├─────────────────────────────────────────┤
│ Stats Section (2 cards)                 │
│ ┌─────────┐  ┌─────────┐                │
│ │ 📚 In   │  │ ✅ Comp │               │
│ │ Progress│  │ lete    │               │
│ └─────────┘  └─────────┘               │
├─────────────────────────────────────────┤
│ In Progress Courses (3-col grid)        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │Course 1 │ │Course 2 │ │Course 3 │  │
│ └─────────┘ └─────────┘ └─────────┘  │
├─────────────────────────────────────────┤
│ Completed Courses (2-col grid)          │
│ ┌─────────┐ ┌─────────┐               │
│ │Course 4 │ │Course 5 │               │
│ └─────────┘ └─────────┘               │
└─────────────────────────────────────────┘
```

**PrimeVue Components**:

- `Card` - Container
- `ProgressBar` - Course progress
- Button - "View Certificate"

**Child Components**:

- `StatsCard.vue` × 2 - Show in-progress and completed counts
- `CourseCard.vue` × many - Display each course

**Data Flow**:

1. `useStudent.js` composable fetches courses via `CourseService.js`
2. Filter courses into two arrays: in-progress, completed
3. Render using `CourseCard.vue` component

**Route**:

```javascript
{ path: '/student/dashboard', name: 'studentDashboard', component: StudentDashboard }
```

---

### 2.2 Course Detail Page (In Progress)

**Path**: `src/views/student/CourseDetail.vue`

**Layout Structure**:

```
┌─────────────────────────────────────┐
│ ← Back Button                       │
├─────────────────────────────────────┤
│ Course Header Section               │
│ ☕ Lập trình Java 6                 │
│ Lớp: SD18301 | GV: Thầy A           │
│ 📅 01/01/2026 - 01/04/2026          │
├─────────────────────────────────────┤
│ Progress Bar Section                │
│ 80% ████████░░░░░░░░ (4/5 quiz)    │
├─────────────────────────────────────┤
│ Quiz List (DataTable)               │
│ ✅ Lab 1: Title    8.5/10 [View]   │
│ ✅ Lab 2: Title    9.0/10 [View]   │
│ ✅ Lab 3: Title    7.5/10 [View]   │
│ ✅ Lab 4: Title    8.0/10 [View]   │
│ 🔓 Lab 5: Title    --/10 [Do]      │
├─────────────────────────────────────┤
│ Certificate Section (locked)        │
│ 🔒 Complete all quizzes for cert    │
│ Remaining: 1 quiz                   │
└─────────────────────────────────────┘
```

**PrimeVue Components**:

- `DataTable` - Quiz list with columns: Status, Name, Score, Action
- `ProgressBar` - Course progress
- `Tag` - Quiz status (completed, pending, locked)
- `Button` - Action buttons

**Child Components**:

- `QuizList.vue` - Reusable quiz list display

**Special Logic**:

- Show different UI based on `isCompleted` prop
- Lock quiz buttons if prerequisites not met
- Show certificate section only when all quizzes completed

**Route**:

```javascript
{ path: '/student/course/:id', name: 'courseDetail', component: CourseDetail }
```

---

### 2.3 Course Detail Page (Completed)

**Path**: Same as 2.2 but with `isCompleted = true`

**Additional Sections**:

- Quiz list readonly, all locked with 🔒 icon
- Certificate display section with:
    - Certificate card containing student info
    - 3 buttons: 📥 Download PDF, 🔗 Share, ✅ Verify on Chain

**Child Components**:

- `CertificateCard.vue` - Full certificate display
- `BlockchainInfo.vue` - Display blockchain verification details (if clicked)

**Route**: Same as above (auto-detect completion state)

---

### 2.4 CourseCard Component

**Path**: `src/components/student/CourseCard.vue`

**Props**:

```javascript
{
  courseId: String,
  courseIcon: String,      // Emoji or icon class
  courseName: String,       // "Lập trình Java 6"
  courseCode: String,       // "SD18301"
  teacherName: String,      // "Thầy Nguyễn Văn A"
  progress: Number,         // 0-100
  totalQuizzes: Number,     // 5
  completedQuizzes: Number, // 4
  isCompleted: Boolean,     // true/false
  averageScore: Number      // 8.5
}
```

**Template**:

- Icon + Course name
- Class code + Progress percentage
- Progress bar
- Teacher name
- Completion badge (✅ PASSED or progress %)
- View button (navigates to CourseDetail)

**Events**:

- `@click` - Navigate to course detail

**PrimeVue Components**:

- `Card` - Container
- `ProgressBar` - Progress visualization
- `Tag` or `Badge` - Status indicator
- `Button` - Click to view

---

### 2.5 QuizList Component

**Path**: `src/components/student/QuizList.vue`

**Props**:

```javascript
{
  quizzes: Array,           // List of quiz objects
  isCompleted: Boolean      // Whether course is completed
}
```

**Quiz Object Structure**:

```javascript
{
  id: String,
  name: String,             // "Lab 1: Biến và kiểu dữ liệu"
  score: Number,            // 8.5 or null
  maxScore: Number,         // 10
  status: String,           // 'completed', 'pending', 'locked'
  isAvailable: Boolean
}
```

**Template**:

- DataTable with columns:
    - Status icon (✅, 🔓, 🔒)
    - Quiz name
    - Score (if completed)
    - Action button ("Xem lại" or "Làm bài" or locked icon)

**Events**:

- `@actionClick` - Emit quiz ID and action type

**PrimeVue Components**:

- `DataTable` - Main list
- `Tag` - Status display
- `Button` - Action buttons

---

### 2.6 CertificateCard Component

**Path**: `src/components/student/CertificateCard.vue`

**Props**:

```javascript
{
  studentName: String,
  courseName: String,
  courseCode: String,
  grade: Number,
  completionDate: Date,
  verificationHash: String,
  blockchainInfo: Object    // { hash, block, txHash, contract }
}
```

**Template**:

- Display certificate with:
    - 🎓 CERTIFICATE header
    - "FPT Polytechnic certifies that..."
    - Student name
    - Course name
    - Grade and date
    - Verification hash (shortened)
- 3 buttons below: Download, Share, Verify on Chain

**Events**:

- `@download` - Trigger PDF download
- `@share` - Open share modal
- `@verify` - Show blockchain info

**PrimeVue Components**:

- `Card` - Container
- `Button` - Action buttons
- Styling with borders/shadows for certificate appearance

---

### 2.7 BlockchainInfo Component

**Path**: `src/components/shared/BlockchainInfo.vue`

**Props**:

```javascript
{
  verificationHash: String,
  blockNumber: String,
  transactionHash: String,
  contractAddress: String,
  status: String            // 'ISSUED', 'REVOKED', 'PENDING'
}
```

**Template**:
Display blockchain information in read-only format:

- 🔗 Hash: 0x7a8b9c1d2e3f...
- 📦 Block: 12345678
- 💳 Tx Hash: 0x999888777...
- 📍 Contract: 0xABC123...
- Status badge with verification indicator

**PrimeVue Components**:

- `Card` - Container
- `Tag` - Status badge
- Text display

---

## Phase 3: Teacher Interface

### 3.1 Teacher Dashboard

**Path**: `src/views/teacher/TeacherDashboard.vue`

**Base Template**: Similar to `Dashboard.vue`

**Layout Structure**:

```
┌──────────────────────────────────────┐
│ Stats Section (3 cards)              │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ 📚 3 │ │ 👥90 │ │ 📝15 │         │
│ └──────┘ └──────┘ └──────┘         │
├──────────────────────────────────────┤
│ Classes Table + [+ Tạo lớp] button   │
│ ┌─ Lớp ─ ┬─ Khóa ─ ┬─ SV ─ ┬─ ...  │
│ │SD18301 │ Java 6  │ 30   │ ...    │
│ │SD18302 │ React 3 │ 28   │ ...    │
│ │SD18201 │ Web 5   │ 32   │ ...    │
└──────────────────────────────────────┘
```

**PrimeVue Components**:

- `Card` - Container
- `DataTable` - Class list
- `Toolbar` - Create class button
- `Button` - Actions

**Child Components**:

- `StatsCard.vue` × 3 - Display metrics
- `ClassTable.vue` - Reusable class management table

**Data Flow**:

1. `useTeacher.js` composable fetches teacher's classes
2. Render using `ClassTable.vue`

**Route**:

```javascript
{ path: '/teacher/dashboard', name: 'teacherDashboard', component: TeacherDashboard }
```

---

### 3.2 Class Detail Page

**Path**: `src/views/teacher/ClassDetail.vue`

**Layout Structure** (3-column):

```
┌──────────────────────────────────────────┐
│ ← Back    📚 Lớp SD18301 - Java 6       │
├────────────┬───────────────────────────┤
│ 📌 Menu    │ Main Content              │
│            │                           │
│ ┌────────┐ │ [Tabs: SV | Quiz | TK]   │
│ │👥 SV   │ │                           │
│ ├────────┤ │ ┌──────────────────┐     │
│ │📝 Quiz │ │ │ DANH SÁCH SV (30)│     │
│ ├────────┤ │ ├──────────────────┤     │
│ │📊 TK   │ │ │ STT │ Name │ ... │     │
│ └────────┘ │ ├──────────────────┤     │
│            │ │ 1   │ Nguyễn A   │     │
│ (thống kê) │ │ 2   │ Trần B     │     │
│            │ │ 3   │ Lê C       │     │
│            │ │ ... │ ...        │     │
│            │ └──────────────────┘     │
│            │        [+ Thêm SV]       │
└────────────┴───────────────────────────┘
```

**PrimeVue Components**:

- `TabView` - Switch between tabs
- `DataTable` - Student/Quiz lists
- `Button` - Actions (add, edit, delete)
- `Sidebar` or `Card` for menu

**Child Components**:

- `StudentTable.vue` - Tab 1: Students list
- `QuizList.vue` (teacher version) - Tab 2: Quizzes
- Custom visualization - Tab 3: Statistics

**Data Flow**:

1. Route param: classId
2. `useTeacher.js` fetches class details
3. Render appropriate tab based on selected state

**Route**:

```javascript
{ path: '/teacher/class/:id', name: 'classDetail', component: ClassDetail }
```

---

### 3.3 Quiz Management Page

**Path**: `src/views/teacher/QuizManagement.vue`

**Layout Structure**:

```
┌──────────────────────────────────────┐
│ ← Lớp SD18301                        │
├──────────────────────────────────────┤
│ 📝 QUẢN LÝ QUIZ    [+ Tạo Quiz]    │
├──────────────────────────────────────┤
│ Quiz Table:                          │
│ ┌─ Name ─ ┬─ Q# ─ ┬─ Pass ─ ┬─ Sts  │
│ │Lab 1    │ 10   │ 5.0    │ 🟢Pub  │
│ │Lab 2    │ 10   │ 5.0    │ 🟢Pub  │
│ │Lab 5    │ 8    │ 5.0    │ 📝Drft │
├──────────────────────────────────────┤
│ 📝 TẠO/SỬA QUIZ                    │
│ ┌──────────────────────────────────┐ │
│ │ Tên quiz: [________________]      │ │
│ │ Thời gian: [60] phút             │ │
│ │ Điểm qua: [5.0]                  │ │
│ │                                  │ │
│ │ Câu hỏi 1:                       │ │
│ │ [Nội dung câu hỏi]               │ │
│ │ A: [_____________]  B: [_______] │ │
│ │ C: [_____________]  D: [_______] │ │
│ │                        [+ Thêm]  │ │
│ │                                  │ │
│ │    [Lưu Draft] [🚀 Publish]      │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Two Sections**:

1. **Quiz List Table**:
    - DataTable pattern from `Crud.vue`
    - Columns: Name, Questions count, Passing score, Status, Actions
    - Status badges: 🟢 Published / 📝 Draft
    - Action buttons: Edit ✏️, Delete 🗑️
    - Toolbar with "Create Quiz" button

2. **Quiz Form Section**:
    - Appears below or in dialog
    - Can be hidden/shown based on user action
    - Form fields:
        - Quiz name (InputText)
        - Duration in minutes (InputNumber)
        - Passing score (InputNumber)
        - Dynamic question list (use `QuestionForm.vue`)
    - Buttons: Save Draft, Publish

**PrimeVue Components**:

- `DataTable` - Quiz list
- `Dialog` - Quiz form (optional, can be inline)
- `InputText`, `InputNumber` - Form fields
- `Button` - Actions
- `Tag` - Status badges
- `Toolbar` - Header actions

**Child Components**:

- `QuizForm.vue` - Complete quiz form
- `QuestionForm.vue` - Individual question builder (reusable)

**Route**:

```javascript
{ path: '/teacher/quiz/:classId', name: 'quizManagement', component: QuizManagement }
```

---

### 3.4 ClassTable Component

**Path**: `src/components/teacher/ClassTable.vue`

**Props**:

```javascript
{
  classes: Array,
  loading: Boolean
}
```

**Class Object Structure**:

```javascript
{
  id: String,
  code: String,          // "SD18301"
  courseName: String,    // "Java 6"
  studentCount: Number,
  quizCount: Number,
  status: String,        // 'active', 'completed'
  createdDate: Date
}
```

**Template**:

- DataTable with columns:
    - Class code
    - Course name
    - Student count
    - Quiz count
    - Status (badge: 🟢 Active / ✅ Done)
    - Actions (Edit 📝, Settings ⚙️, View 👁️)

**Events**:

- `@edit` - Emit class ID
- `@settings` - Emit class ID
- `@view` - Navigate to class detail

**PrimeVue Components**:

- `DataTable` - Main table
- `Tag` or `Badge` - Status
- `Button` - Action buttons

---

### 3.5 StudentTable Component

**Path**: `src/components/teacher/StudentTable.vue`

**Props**:

```javascript
{
  students: Array,
  classId: String,
  loading: Boolean
}
```

**Student Object Structure**:

```javascript
{
  id: String,
  name: String,
  email: String,
  completedQuizzes: Number,  // 4
  totalQuizzes: Number,      // 5
  status: String             // 'passed', 'learning', 'incomplete'
}
```

**Template**:

- DataTable with columns:
    - STT (index)
    - Student name
    - Progress (x/y quizzes)
    - Status badge (✅ PASSED / 📖 Learning / ❌ Incomplete)

**PrimeVue Components**:

- `DataTable` - Main table
- `Tag` - Status badge
- `ProgressBar` - Optional, show progress visually

---

### 3.6 QuizForm Component

**Path**: `src/components/teacher/QuizForm.vue`

**Props**:

```javascript
{
  quizId: String,            // null for new quiz
  classId: String,
  initialData: Object        // null for new
}
```

**Template**:

- Container (Card or Dialog)
- Form section with fields:
    - `InputText` for quiz name
    - `InputNumber` for duration (minutes)
    - `InputNumber` for passing score
    - Questions section with dynamic `QuestionForm.vue` components
    - "[+ Thêm câu hỏi]" button to add new question
- Buttons:
    - "Lưu Draft" (creates draft)
    - "🚀 Publish" (publishes quiz)
    - "Cancel" (close form)

**Events**:

- `@save` - Emit quiz data and action (draft/publish)
- `@close` - Close form

**Data**:

```javascript
{
  name: String,
  duration: Number,
  passingScore: Number,
  questions: Array[QuestionForm data]
}
```

**PrimeVue Components**:

- `Card` - Container
- `InputText`, `InputNumber` - Form inputs
- `Button` - Actions

---

### 3.7 QuestionForm Component

**Path**: `src/components/teacher/QuestionForm.vue`

**Props**:

```javascript
{
  questionIndex: Number,
  initialData: Object        // null for new question
}
```

**Template**:

- Question text (InputText)
- 4 option inputs (A, B, C, D) with `InputText`
- Correct answer checkbox for each option
- Delete button for question
- Optional: Drag handle for reordering

**Events**:

- `@update` - Emit updated question data
- `@delete` - Emit question index to delete

**Data Structure**:

```javascript
{
  text: String,
  options: [
    { label: 'A', value: String, isCorrect: Boolean },
    { label: 'B', value: String, isCorrect: Boolean },
    { label: 'C', value: String, isCorrect: Boolean },
    { label: 'D', value: String, isCorrect: Boolean }
  ]
}
```

**PrimeVue Components**:

- `InputText` - Question and option inputs
- `Checkbox` - Select correct answer
- `Button` - Delete question

---

## Phase 4: Admin Interface

### 4.1 Admin Dashboard

**Path**: `src/views/admin/AdminDashboard.vue`

**Layout Structure**:

```
┌──────────────────────────────────────┐
│ Stats Section (3 cards)              │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ 🎓156│ │ ✅150│ │ ❌6  │         │
│ └──────┘ └──────┘ └──────┘         │
├──────────────────────────────────────┤
│ 🔍 Search Section                   │
│ [🔍 Nhập Cert ID hoặc email...] [Tìm]
├──────────────────────────────────────┤
│ 📋 DANH SÁCH BẰNG GẦN ĐÂY          │
│ ┌─ ID ─ ┬─ SV ─ ┬─ Lớp ─ ┬─ Date   │
│ │CERT-156│Nguyễn A│SD18301│15/02  │
│ │CERT-155│Trần B  │SD18301│15/02  │
│ │CERT-100│Phạm D  │SD18201│01/01  │
│ └───────┴────────┴────────┴─────── │
└──────────────────────────────────────┘
```

**PrimeVue Components**:

- `Card` - Container
- `InputText` - Search field with icon
- `Button` - Search button
- `DataTable` - Certificate list
- `Tag` - Status badges

**Child Components**:

- `StatsCard.vue` × 3 - Show metrics
- `CertificateTable.vue` - Reusable certificate list

**Data Flow**:

1. `useAdmin.js` composable fetches recent certificates
2. User can search by certificate ID or email
3. Click on certificate to view details

**Route**:

```javascript
{ path: '/admin/dashboard', name: 'adminDashboard', component: AdminDashboard }
```

---

### 4.2 Certificate Management Page

**Path**: `src/views/admin/CertificateManagement.vue`

**Layout Structure**:

```
┌──────────────────────────────────────┐
│ ← Quay lại                           │
├──────────────────────────────────────┤
│ 🎓 CHI TIẾT BẰNG: CERT-156          │
├──────────────────────────────────────┤
│ Certificate Details:                 │
│ 👤 Sinh viên: Nguyễn Văn A           │
│ 📧 Email: anv@fpt.edu.vn             │
│ 📚 Lớp: SD18301 - Java 6             │
│ 📅 Ngày cấp: 15/02/2026              │
│ 📊 Điểm TB: 8.5/10                   │
│                                      │
│ ─────────── BLOCKCHAIN ────────────  │
│ 🔗 Hash: 0x7a8b9c1d2e3f...           │
│ 📦 Block: 12345678                   │
│ 💳 Tx Hash: 0x999888777...           │
│ 📍 Contract: 0xABC123...             │
│ ✅ Status: ISSUED (Verified on-chain)│
├──────────────────────────────────────┤
│ ⚠️ THU HỒI BẰNG                    │
│ Lý do: [_____________________]       │
│ ⚠️ Hành động này không thể hoàn tác!  │
│                 [❌ Thu hồi bằng]   │
└──────────────────────────────────────┘
```

**Two Sections**:

1. **Certificate Details**:
    - Display read-only information
    - Use Card component
    - Show all fields: student, email, class, date, grade

2. **Blockchain Information**:
    - Use `BlockchainInfo.vue` component
    - Display hash, block, tx, contract, status

3. **Revoke Section** (conditional, only if status = ISSUED):
    - Textarea for revoke reason
    - Warning message about irreversible action
    - Revoke button (danger/red style)
    - Confirmation dialog before actual revocation

**PrimeVue Components**:

- `Card` - Sections
- `Textarea` - Revoke reason
- `Button` - Revoke action
- `Dialog` - Confirmation

**Child Components**:

- `CertificateDetail.vue` - Certificate info display
- `RevokeDialog.vue` - Revoke confirmation modal
- `BlockchainInfo.vue` - Blockchain details

**Route**:

```javascript
{ path: '/admin/certificate/:id', name: 'certificateDetail', component: CertificateManagement }
```

---

### 4.3 CertificateTable Component

**Path**: `src/components/admin/CertificateTable.vue`

**Props**:

```javascript
{
  certificates: Array,
  loading: Boolean,
  paginated: Boolean
}
```

**Certificate Object Structure**:

```javascript
{
  id: String,               // "CERT-156"
  studentName: String,
  studentEmail: String,
  className: String,        // "SD18301"
  courseCode: String,
  gradeAverage: Number,
  issueDate: Date,
  status: String,           // 'issued', 'revoked'
  blockchainHash: String
}
```

**Template**:

- DataTable with columns:
    - Cert ID
    - Student name
    - Class code
    - Issue date
    - Status (badge: ✅ Issued / ❌ Revoked)
    - Actions (View 👁️, Revoke 🚫 - disabled if revoked)

**Events**:

- `@view` - Navigate to certificate detail page
- `@revoke` - Emit certificate ID (optional, can also navigate)

**PrimeVue Components**:

- `DataTable` - Main table
- `Tag` - Status badge
- `Button` - Action buttons

---

### 4.4 CertificateDetail Component

**Path**: `src/components/admin/CertificateDetail.vue`

**Props**:

```javascript
{
  certificate: Object,
  loading: Boolean
}
```

**Template**:

- Display certificate information in Card:
    - Student name
    - Email
    - Class and course
    - Issue date
    - Average grade
- Read-only, formatted nicely with icons

**PrimeVue Components**:

- `Card` - Container
- Text/icons for information display

---

### 4.5 RevokeDialog Component

**Path**: `src/components/admin/RevokeDialog.vue`

**Props**:

```javascript
{
  visible: Boolean,
  certificateId: String,
  loading: Boolean
}
```

**Template**:

- Dialog header: "Xác nhận thu hồi bằng"
- Body:
    - Warning icon and message
    - Textarea for revoke reason (required)
    - ⚠️ Warning text: "Hành động này không thể hoàn tác!"
- Footer buttons:
    - "Hủy" (close dialog)
    - "❌ Thu hồi bằng" (red/danger style, submit)

**Events**:

- `@confirm` - Emit certificate ID and reason
- `@cancel` - Close dialog

**PrimeVue Components**:

- `Dialog` - Modal
- `Textarea` - Reason input
- `Button` - Actions
- `Message` or text for warning

---

## Phase 5: Shared Components & Services

### 5.1 StatsCard Component

**Path**: `src/components/shared/StatsCard.vue`

**Props**:

```javascript
{
  title: String,           // "Đang học", "Hoàn thành", etc.
  value: Number,
  icon: String,            // Icon class or emoji
  iconBgColor: String,     // 'blue', 'orange', 'cyan', 'purple'
  subtitle: String,        // Optional subtitle
  trend: Object            // { value: Number, label: String }
}
```

**Template**:

- Reusable card showing:
    - Title (label)
    - Large number value
    - Icon in colored background box
    - Subtitle with trend (optional)

**Extracted from**: `src/components/dashboard/StatsWidget.vue`

**PrimeVue Components**:

- `Card` - Container

---

### 5.2 AuthService

**Path**: `src/services/AuthService.js`

**Methods**:

- `initializeGoogleAuth()` - Setup Google OAuth
- `signInWithGoogle()` - Trigger OAuth flow
- `getAuthToken()` - Retrieve stored JWT
- `setAuthToken(token)` - Store JWT after auth
- `logout()` - Clear auth state
- `getCurrentUser()` - Get logged-in user info
- `getUserRole()` - Determine user role (student/teacher/admin)
- `refreshToken()` - Refresh expired token

**Storage**:

- Use `localStorage` to store JWT token and user info
- Use `sessionStorage` for temporary auth state

---

### 5.3 CourseService

**Path**: `src/services/CourseService.js`

**Methods**:

- `getStudentCourses(studentId)` - Fetch student's courses
- `getCourseDetail(courseId)` - Get course info
- `getTeacherClasses(teacherId)` - Fetch teacher's classes
- `getClassDetail(classId)` - Get class details
- `getStudentsInClass(classId)` - List students
- `createClass(data)` - Create new class
- `updateClass(classId, data)` - Update class info

**API Endpoints** (examples):

```
GET /api/student/courses
GET /api/courses/:id
GET /api/teacher/classes
GET /api/classes/:id
GET /api/classes/:id/students
POST /api/classes
PUT /api/classes/:id
```

---

### 5.4 QuizService

**Path**: `src/services/QuizService.js`

**Methods**:

- `getQuizzesForCourse(courseId)` - List quizzes for a course
- `getQuizDetail(quizId)` - Get quiz questions
- `submitQuizAnswers(quizId, answers)` - Submit quiz
- `createQuiz(classId, data)` - Teacher creates quiz
- `updateQuiz(quizId, data)` - Update quiz
- `publishQuiz(quizId)` - Change status to published
- `deleteQuiz(quizId)` - Delete quiz
- `getStudentQuizResults(studentId, courseId)` - Get results

**API Endpoints** (examples):

```
GET /api/courses/:courseId/quizzes
GET /api/quizzes/:id
POST /api/quizzes/:id/submit
POST /api/quizzes (teacher)
PUT /api/quizzes/:id (teacher)
DELETE /api/quizzes/:id (teacher)
GET /api/student/:studentId/results
```

---

### 5.5 CertificateService

**Path**: `src/services/CertificateService.js`

**Methods**:

- `getCertificatesForStudent(studentId)` - List student's certificates
- `getCertificateDetail(certId)` - Get certificate info with blockchain data
- `searchCertificates(query)` - Search by ID or email (admin)
- `getRecentCertificates(limit)` - Get recent certs (admin)
- `verifyCertificateOnChain(certId)` - Verify on blockchain
- `downloadCertificatePDF(certId)` - Generate/download PDF
- `revokeCertificate(certId, reason)` - Revoke certificate (admin)
- `getCertificateStats()` - Get admin stats (total, issued, revoked)

**API Endpoints** (examples):

```
GET /api/student/:studentId/certificates
GET /api/certificates/:id
GET /api/certificates/search?q=...
GET /api/certificates/recent?limit=10
POST /api/certificates/:id/verify
GET /api/certificates/:id/pdf
POST /api/certificates/:id/revoke
GET /api/admin/certificates/stats
```

---

### 5.6 Composables

#### useAuth.js

```javascript
// State
const user = ref(null);
const isAuthenticated = ref(false);
const userRole = ref(null); // 'student', 'teacher', 'admin'
const loading = ref(false);

// Methods
const login = async () => {
    /* ... */
};
const logout = async () => {
    /* ... */
};
const getCurrentUser = () => {
    /* ... */
};
const hasRole = (role) => {
    /* ... */
};
```

#### useStudent.js

```javascript
const courses = ref([]);
const inProgressCourses = ref([]);
const completedCourses = ref([]);
const loading = ref(false);

const fetchCourses = async () => {
    /* ... */
};
const getCourseDetail = async (id) => {
    /* ... */
};
const fetchCertificates = async () => {
    /* ... */
};
```

#### useTeacher.js

```javascript
const classes = ref([]);
const currentClass = ref(null);
const students = ref([]);
const quizzes = ref([]);
const loading = ref(false);

const fetchClasses = async () => {
    /* ... */
};
const fetchClassDetail = async (id) => {
    /* ... */
};
const createQuiz = async (data) => {
    /* ... */
};
const publishQuiz = async (quizId) => {
    /* ... */
};
```

#### useAdmin.js

```javascript
const certificates = ref([]);
const stats = ref({});
const loading = ref(false);

const fetchCertificates = async () => {
    /* ... */
};
const searchCertificates = async (query) => {
    /* ... */
};
const revokeCertificate = async (id, reason) => {
    /* ... */
};
const fetchStats = async () => {
    /* ... */
};
```

---

## Phase 6: Router Configuration

### Update src/router/index.js

Add the following routes grouped by user role:

```javascript
const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Auth routes (outside AppLayout)
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/auth/LoginGoogle.vue'),
            meta: { requiresAuth: false }
        },

        // Main app layout (with sidebar, topbar)
        {
            path: '/',
            component: AppLayout,
            children: [
                // Student routes
                {
                    path: '/student/dashboard',
                    name: 'studentDashboard',
                    component: () => import('@/views/student/StudentDashboard.vue'),
                    meta: { requiresAuth: true, roles: ['student'] }
                },
                {
                    path: '/student/course/:id',
                    name: 'courseDetail',
                    component: () => import('@/views/student/CourseDetail.vue'),
                    meta: { requiresAuth: true, roles: ['student'] }
                },

                // Teacher routes
                {
                    path: '/teacher/dashboard',
                    name: 'teacherDashboard',
                    component: () => import('@/views/teacher/TeacherDashboard.vue'),
                    meta: { requiresAuth: true, roles: ['teacher'] }
                },
                {
                    path: '/teacher/class/:id',
                    name: 'classDetail',
                    component: () => import('@/views/teacher/ClassDetail.vue'),
                    meta: { requiresAuth: true, roles: ['teacher'] }
                },
                {
                    path: '/teacher/quiz/:classId',
                    name: 'quizManagement',
                    component: () => import('@/views/teacher/QuizManagement.vue'),
                    meta: { requiresAuth: true, roles: ['teacher'] }
                },

                // Admin routes
                {
                    path: '/admin/dashboard',
                    name: 'adminDashboard',
                    component: () => import('@/views/admin/AdminDashboard.vue'),
                    meta: { requiresAuth: true, roles: ['admin'] }
                },
                {
                    path: '/admin/certificate/:id',
                    name: 'certificateDetail',
                    component: () => import('@/views/admin/CertificateManagement.vue'),
                    meta: { requiresAuth: true, roles: ['admin'] }
                }
            ]
        },

        // 404 route
        {
            path: '/:pathMatch(.*)*',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        }
    ]
});

// Route guards for authentication and role-based access
router.beforeEach((to, from, next) => {
    const auth = useAuth();
    const requiresAuth = to.meta.requiresAuth ?? false;
    const requiredRoles = to.meta.roles || [];

    if (requiresAuth) {
        if (!auth.isAuthenticated.value) {
            next({ name: 'login' });
            return;
        }
        if (requiredRoles.length && !requiredRoles.includes(auth.userRole.value)) {
            next({ name: 'accessDenied' });
            return;
        }
    }
    next();
});

export default router;
```

---

## Implementation Order

1. **Week 1: Foundation**
    - AuthService + LoginGoogle.vue
    - Router setup with guards
    - Base layout integration

2. **Week 2: Student Interface**
    - StudentDashboard, CourseDetail
    - CourseCard, QuizList, CertificateCard components
    - useStudent composable + CourseService

3. **Week 3: Teacher Interface**
    - TeacherDashboard, ClassDetail, QuizManagement
    - ClassTable, StudentTable, QuizForm components
    - useTeacher composable + QuizService

4. **Week 4: Admin Interface**
    - AdminDashboard, CertificateManagement
    - CertificateTable, RevokeDialog components
    - useAdmin composable + CertificateService

5. **Week 5: Polish & Testing**
    - Shared components refinement
    - BlockchainInfo integration
    - Error handling, loading states
    - Responsive design adjustments

---

## Key Design Patterns

### Pattern 1: Prop-Based Configuration

All reusable components use props for data and configuration. This allows flexibility and reuse across different contexts.

### Pattern 2: Event Emission

Components emit events back to parents for state changes and actions rather than managing state directly.

### Pattern 3: Composable-Driven Logic

Business logic lives in composables, keeping components focused on presentation. Each role has its own composable.

### Pattern 4: Service Layer Abstraction

All API calls go through services. This provides a clean API boundary and facilitates testing.

### Pattern 5: Role-Based Route Guards

Router guards check authentication and user role before allowing access to protected routes.

---

## Best Practices

1. **Component Naming**: Use descriptive names (e.g., `CourseCard`, not `Card`)
2. **Props Validation**: Always define prop types and defaults
3. **Event Naming**: Use clear event names (e.g., `@save`, `@delete`, not `@click`)
4. **Composition**: Favor composition over deep nesting
5. **Responsive**: Use Tailwind breakpoints for mobile-friendly design
6. **Accessibility**: Use semantic HTML and ARIA labels where needed
7. **Code Comments**: Document complex logic and non-obvious decisions
8. **DRY Principle**: Extract repeated patterns into reusable components
9. **Performance**: Use lazy loading for routes and heavy components
10. **Error Handling**: Implement proper error boundaries and user feedback

---

## Testing Strategy (Optional for Phase 2+)

- Unit tests for composables (useAuth, useStudent, etc.)
- Component tests for reusable components
- Integration tests for user flows (login → view courses → submit quiz)
- E2E tests for critical paths (authentication, certificate download)

---

## Notes

- This plan follows **clean code architecture** with separation of concerns
- All components are **reusable** and **configurable** via props
- **PrimeVue components** are leveraged for consistent, professional UI
- **Vue 3 Composition API** with composables for modern state management
- **Tailwind CSS** for responsive, utility-first styling
- Routes include **role-based access control** via meta guards

---

## Summary File Checklist

### Views (9 files)

- [ ] `src/views/auth/LoginGoogle.vue`
- [ ] `src/views/student/StudentDashboard.vue`
- [ ] `src/views/student/CourseDetail.vue`
- [ ] `src/views/teacher/TeacherDashboard.vue`
- [ ] `src/views/teacher/ClassDetail.vue`
- [ ] `src/views/teacher/QuizManagement.vue`
- [ ] `src/views/admin/AdminDashboard.vue`
- [ ] `src/views/admin/CertificateManagement.vue`

### Components (13 files)

- [ ] `src/components/student/CourseCard.vue`
- [ ] `src/components/student/QuizList.vue`
- [ ] `src/components/student/CertificateCard.vue`
- [ ] `src/components/teacher/ClassTable.vue`
- [ ] `src/components/teacher/StudentTable.vue`
- [ ] `src/components/teacher/QuizForm.vue`
- [ ] `src/components/teacher/QuestionForm.vue`
- [ ] `src/components/admin/CertificateTable.vue`
- [ ] `src/components/admin/CertificateDetail.vue`
- [ ] `src/components/admin/RevokeDialog.vue`
- [ ] `src/components/shared/StatsCard.vue`
- [ ] `src/components/shared/BlockchainInfo.vue`

### Services (4 files)

- [ ] `src/services/AuthService.js`
- [ ] `src/services/CourseService.js`
- [ ] `src/services/QuizService.js`
- [ ] `src/services/CertificateService.js`

### Composables (4 files)

- [ ] `src/composables/useAuth.js`
- [ ] `src/composables/useStudent.js`
- [ ] `src/composables/useTeacher.js`
- [ ] `src/composables/useAdmin.js`

### Router

- [ ] Update `src/router/index.js`

---

**Total: 30+ new files to create**

This comprehensive plan provides a clear roadmap for implementing the FPT Certificate System UI with clean architecture, reusable components, and proper separation of concerns.
