# PetHub MVP - Production-Ready UI/UX Design System

**Product Type**: Pet Care & Wellness Service  
**Target Audience**: Pet owners (18-65, mobile-first, wellness-conscious)  
**Design Philosophy**: Trust + Care + Clarity + Delightful Interactions  
**Platform**: React Native (iOS/Android)

---

## 🎨 Design System Overview

### Visual Style: **Modern Wellness + Caring**

A **clean, accessible design** that conveys:
- ✅ **Trust** — Professional, health-focused, secure
- ✅ **Care** — Warm, approachable, pet-centric
- ✅ **Clarity** — Intuitive navigation, readable content
- ✅ **Delight** — Subtle animations, smooth interactions

---

## 🎭 Complete Design System

### 1. Color Palette

#### Primary Colors (Trust + Wellness)
```
Primary Blue: #1E7A8A (warm teal-blue)
  → UI: Buttons, CTAs, active states, links
  → Conveys: Medical trust, care, wellness
  → Usage: Primary CTAs, active tabs, hero highlights

Secondary Teal: #0F9B8E (vibrant teal-green)
  → UI: Accents, highlights, success states
  → Conveys: Growth, health, vitality
  → Usage: Checkmarks, confirmations, pet wellness indicators

Caring Warm: #D97706 (amber-orange)
  → UI: Warnings, important alerts, secondary actions
  → Conveys: Warmth, urgency (care-focused)
  → Usage: Important reminders, pet grooming alerts, appointment reminders
```

#### Neutral & Support Colors
```
Dark Slate: #0F172A (near-black for text, backgrounds)
  → Body text, headlines, high-contrast backgrounds
  → Ensure 4.5:1 contrast on all light surfaces

Light Slate: #F8FAFC (off-white for cards, surfaces)
  → Card backgrounds, section dividers
  → Maintains warmth, prevents harsh white fatigue

Gray Scale:
  - Slate-50:  #F9FAFB (lightest, subtle bg)
  - Slate-100: #F3F4F6 (subtle dividers)
  - Slate-200: #E5E7EB (medium dividers)
  - Slate-300: #D1D5DB (border, muted text)
  - Slate-500: #6B7280 (secondary text)
  - Slate-700: #374151 (primary text)
  - Slate-900: #111827 (headlines, dark bg)
```

#### Semantic Status Colors
```
Success (Wellness): #10B981 (emerald-green)
  → Pet health good, appointment confirmed, prescription filled

Warning (Attention): #F59E0B (amber)
  → Upcoming appointment, medication reminder, needs action

Error (Health Alert): #EF4444 (red)
  → Health concern, failed payment, critical alert

Info (Educational): #3B82F6 (blue)
  → Tip, information, guidance on pet care
```

#### Dark Mode Palette
```
Dark Background: #0F172A (nearly black)
Dark Surface: #1E293B (card background)
Dark Text Primary: #F1F5F9 (high contrast white)
Dark Text Secondary: #CBD5E1 (dimmer white)
Dark Border: #334155 (subtle divider)

→ Maintains 4.5:1+ contrast in both modes
→ Reduced blue light for evening use
```

---

### 2. Typography System

#### Font Family
```
Headings (Display, Headlines, Titles):
  → Font: Inter (sans-serif) or SF Pro (iOS) / Roboto (Android)
  → Personality: Modern, professional, trustworthy
  → Weight: 600 (SemiBold) for headings, 700 (Bold) for main headlines

Body & UI:
  → Font: Inter or SF Pro / Roboto
  → Personality: Neutral, readable, accessible
  → Weight: 400 (Regular) body, 500 (Medium) labels

Monospace (Data, Code, Logs):
  → Font: SF Mono (iOS) / Roboto Mono (Android)
  → Usage: Appointment codes, medication IDs, timestamps
```

#### Type Scale
```
Display (H0):    32pt / 40pt  (Headlines: "Book Vet", "Pet Health")
Headline (H1):   28pt / 36pt  (Page titles)
Subtitle (H2):   24pt / 32pt  (Section headers)
Title (H3):      20pt / 28pt  (Card titles, sub-headers)
Label (H4):      16pt / 24pt  (Button text, form labels)
Body (Regular):  16pt / 24pt  (Main content, descriptions)
Small:           14pt / 20pt  (Secondary info, timestamps)
Caption:         12pt / 18pt  (Hints, disabled text)
```

#### Line Heights & Spacing
```
Headlines:  1.2x (tight, confident)
Body:       1.5x (readable, comfortable)
Captions:   1.4x (legible despite size)

Letter Spacing:
  Headlines:  -0.5% (normal)
  Body:       0% (normal)
  All caps:   1% (improved readability)
```

---

### 3. Component Design Standards

#### Buttons
```
PRIMARY BUTTON (CTA)
┌─────────────────────────────────┐
│ Book Appointment                │  ← 16pt SemiBold white text
└─────────────────────────────────┘
  Background:       #1E7A8A (Primary Blue)
  Padding:          16pt vertical, 24pt horizontal (44pt min height)
  Border radius:    8pt
  Shadow:           0 2pt 4pt rgba(0,0,0,0.1)

PRESSED STATE:
  Opacity:          0.9 + slight scale (0.98)
  Duration:         150ms ease-out

DISABLED STATE:
  Opacity:          0.5
  Cursor:           not-allowed
  No tap response

SECONDARY BUTTON (Alt Action)
┌─────────────────────────────────┐
│ Cancel                          │  ← #1E7A8A text on white
└─────────────────────────────────┘
  Background:       #F8FAFC (light)
  Border:           1pt #D1D5DB
  Padding:          16pt / 24pt
  Text color:       #1E7A8A

GHOST BUTTON (Low Priority)
  Background:       Transparent
  Border:           1pt #D1D5DB
  Text color:       #1E7A8A
  Hover/Press:      bg: #F9FAFB

DANGER BUTTON (Delete, Cancel Appt)
  Background:       #EF4444 (red)
  Text:             white
  Padding:          16pt / 24pt
  Shadow:           0 2pt 4pt rgba(239,68,68,0.2)
```

#### Cards & Surfaces
```
STANDARD CARD (Pet, Appointment, Medicine)
┌──────────────────────────────────┐
│ [Image/Icon] Title              │  ← 20pt SemiBold
│                                  │
│ Description or meta info         │  ← 14pt slate-500
│                                  │
│ Price / Status / Action          │  ← 16pt, semantic color
└──────────────────────────────────┘

  Background:       #F8FAFC (light mode), #1E293B (dark mode)
  Padding:          16pt
  Border radius:    12pt
  Border:           1pt #E5E7EB
  Shadow:           0 1pt 3pt rgba(0,0,0,0.08)
  Pressed shadow:   0 4pt 6pt rgba(0,0,0,0.12)

ELEVATED CARD (Highlights, Featured)
  Shadow:           0 4pt 6pt rgba(0,0,0,0.1), 0 2pt 4pt rgba(0,0,0,0.06)

IMAGE OVERLAY (Pet card with status badge)
  Image:            Aspect ratio 1:1 or 16:9
  Status badge:     Positioned top-right, 32x32pt
  Gradient overlay: From transparent to 60% black at bottom
  Text (over image): White, 16pt SemiBold, centered
```

#### Form Controls
```
TEXT INPUT (Appointment notes, search, messages)
┌─────────────────────────────────┐
│ Label                           │  ← 12pt SemiBold, #0F172A
│ ┌───────────────────────────┐   │
│ │ Enter text here...        │   │  ← 16pt body, #6B7280 placeholder
│ └───────────────────────────┘   │
│ Helper text or error            │  ← 12pt, #10B981 (success) / #EF4444 (error)
└─────────────────────────────────┘

  Background:       white / #1E293B dark
  Border:           1pt #D1D5DB (default)
  Border (focus):   2pt #1E7A8A (primary blue)
  Border radius:    8pt
  Padding:          12pt (inside)
  Height:           44pt minimum
  Focus feedback:   Instant (no delay)
  Error border:     1pt #EF4444, bg: #FEF2F2 (light red bg)

LABEL REQUIREMENTS:
  ✓ Visible label (not placeholder-only)
  ✓ Semantic <label htmlFor="id"> association
  ✓ Helper text below input (not inside)
  ✓ Required indicator (*) if mandatory
  ✓ Error message adjacent to field (below)

SELECTOR / PICKER (Appointment time, pet type)
  Same as text input but with dropdown indicator
  Options: Scroll-friendly, min 44pt tap target per option

TOGGLE SWITCH (Enable notifications, accept terms)
  Size:             48pt wide × 28pt tall (touch-friendly)
  Off:              #D1D5DB, indicator white
  On:               #1E7A8A, indicator white
  Transition:       150ms ease-out (no jump)

CHECKBOX (Accept terms, select multiple pets)
  Size:             24pt × 24pt
  Unchecked:        1pt border #D1D5DB, white bg
  Checked:          bg #1E7A8A, white checkmark ✓
  Disabled:         0.5 opacity
  Focus:            Blue outline on press
```

#### Modals & Sheets (Appointment details, pet edit, confirm delete)
```
BOTTOM SHEET (iOS Standard)
┌─────────────────────────────┐  ← Phone top (safe area)
│                             │
│ [Content fills viewport]    │  ← Scrollable if content > screen
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [Sticky footer CTA]         │
└─────────────────────────────┘

  Background:       #F8FAFC (light), #1E293B (dark)
  Padding:          16pt (sides), 8pt (top), 0 (bottom)
  Border radius:    16pt top only
  Backdrop scrim:   50% black (#000000, 0.5 opacity)
  Gesture dismiss:  Swipe down to close (visual hint: drag handle at top)

HANDLE (Visual hint for swipe-to-dismiss)
  ▬ (centered, 4pt × 32pt, #D1D5DB, 8pt from top)

MODAL (Centered, less common on mobile)
  Use bottom sheet unless modal is <60% of screen

CONFIRMATION DIALOG (Delete pet, cancel appointment)
┌─────────────────────────────┐
│ Are you sure?               │  ← Headline, centered
│                             │
│ This action cannot be       │  ← Body text explanation
│ undone.                     │
│                             │
│ ┌────────────┬────────────┐ │
│ │ Cancel     │ Delete     │ │  ← Secondary | Danger button
│ └────────────┴────────────┘ │
└─────────────────────────────┘

  Buttons:          Both visible, equal width
  Destructive:      Red (right side)
  Safe action:      Gray/secondary (left side)
```

#### Navigation (Bottom Tab Bar)
```
┌──────────────────────────────────┐
│ Icon     Icon     Icon     Icon   │  ← 24pt icons
│ Home     Pets     Chat    Account │  ← 10pt labels
│                                  │
│ ░░░░     [····]   ····     ····  │  ← Active indicator (colored icon + label)
└──────────────────────────────────┘

  Items:            4-5 maximum (recommend 4 for app)
  Height:           56pt (safe for thumb reach)
  Icon size:        24pt
  Label size:       10pt SemiBold
  Label color:      #6B7280 (inactive), #1E7A8A (active)
  Icon color:       Same as label
  Background:       White / #1E293B dark
  Border top:       1pt #E5E7EB (subtle)
  Safe area:        Add padding for home indicator

ACTIVE STATE:
  Icon:             Filled or color change to #1E7A8A
  Label:            Color #1E7A8A
  Indicator:        Optional subtle bg highlight
  Transition:       150ms ease-out

INACTIVE STATE:
  Icon:             Outline or gray
  Label:            Color #6B7280
```

#### Status Badges (Appointment confirmed, pet health good, order shipped)
```
BADGE (Small indicator)
  Shape:            Rounded pill (border-radius: 9999px)
  Size:             Fit text, min 24pt height
  Padding:          4pt vertical, 8pt horizontal
  Font:             10pt SemiBold

STATUS COLORS:
  Success (green):  bg #D1FAE5, text #065F46
  Warning (amber):  bg #FEF3C7, text #78350F
  Error (red):      bg #FEE2E2, text #991B1B
  Info (blue):      bg #DBEAFE, text #1E40AF
  Default (gray):   bg #F3F4F6, text #374151

BADGE WITH ICON (Health status, priority indicator)
  Icon:             12pt, adjacent to text
  Layout:           [Icon] [Text]
  Spacing:          4pt between icon and text
```

#### Dividers & Separators
```
THIN DIVIDER (Section separator)
  Height:           1pt
  Color:            #E5E7EB (light), #334155 (dark)
  Margin:           16pt (vertical spacing)

SECTION HEADER with divider (Appointments, Medicines)
┌──────────────────────────────┐
│ UPCOMING (14pt SemiBold)     │  ← All-caps, slate-700
├──────────────────────────────┤
│ [Cards below]                │
│ [Cards below]                │
└──────────────────────────────┘

  Divider:          1pt #E5E7EB
  Padding:          8pt above, 12pt below
  Background:       Optional very light gray (#F9FAFB) section
```

---

## 🎬 Animation & Interaction Standards

### Timing
```
Micro-interactions (press, tap):    150ms (instant feedback)
UI transitions (modal open):         200ms (smooth but quick)
Navigation (screen change):          300ms (allows visual continuity)
Complex animations (list entry):     200-300ms staggered
IMPORTANT: Respect prefers-reduced-motion → disable or 0ms
```

### Easing
```
Enter animation (element coming in):       ease-out (cubic-bezier 0.25, 0.46, 0.45, 0.94)
Exit animation (element going away):       ease-in (cubic-bezier 0.95, 0.05, 0.795, 0.035)
Interactive feedback (press, click):       ease-out with slight bounce
Spring/physics (natural movement):         spring(damping: 0.7, stiffness: 100)
```

### Example Animations

```javascript
// Button pressed (React Native)
Animated.sequence([
  Animated.timing(scale, { toValue: 0.97, duration: 100, easing: Easing.out(Easing.quad) }),
  Animated.timing(scale, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad) })
])

// Modal enter
Animated.parallel([
  Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad) }),
  Animated.timing(translateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic) })
])

// List item stagger (entrance)
items.forEach((item, index) => {
  Animated.timing(item.opacity, {
    toValue: 1,
    duration: 300,
    delay: index * 50,  // 50ms stagger
    easing: Easing.out(Easing.quad)
  }).start()
})
```

### Haptic Feedback (iOS/Android)
```
Light tap (feedback on input):       On focus/select
Medium impact (success):              On appointment confirmed
Heavy impact (alert):                 On critical health alert (rare)
Selection feedback (scroll picker):   On value change

Usage: Enhance physical feedback for important interactions
```

### Loading States
```
<300ms:     No indicator (instant to human perception)
300-1000ms: Skeleton screen or shimmer (never blank)
>1000ms:    Spinner or progress bar with percentage

Skeleton (preferred):
  ▬▬▬▬▬▬▬▬▬▬▬▬  ← Pulsing gray placeholder matching content shape
  ▬▬▬▬▬  ← Secondary line
  ▬▬▬▬▬▬▬▬  ← Description line
```

---

## 📐 Spacing & Layout

### Grid System
```
Base unit: 8pt (dp on Android, pt on iOS)

Spacing Scale:
  4pt  (micro-spacing, tight)
  8pt  (padding/margin default)
  12pt (spacing between small elements)
  16pt (standard padding, card content)
  24pt (section spacing)
  32pt (major section break)
  48pt (large section break, hero spacing)
```

### Safe Areas (Mobile)
```
Top:     StatusBar (20pt iOS) + NavigationBar (safe area)
Bottom:  Home indicator (34pt iPhone), Gesture bar (Android)
Sides:   Safe area insets (iPhone notch, etc.)

REQUIREMENTS:
  ✓ Fixed headers: Add safe-area top padding
  ✓ Fixed footers/tab bars: Add safe-area bottom padding
  ✓ Content: insetMargin >= 16pt from edges
  ✓ Touch targets: 44pt min, placed outside safe area overlap
```

### Responsive Breakpoints
```
Mobile (375px - 599px):
  Container: Full width, 16pt gutters
  Columns: 1 column
  Cards: Full width or stacked
  Text measure: 35-60 characters

Large Mobile (600px - 839px):
  Container: 90% width, max 540px
  Columns: 1-2 columns (stacked by default)
  Cards: 2-column grid possible
  Text measure: 60-75 characters

Tablet (840px+):
  Container: 85% width, max 800px
  Columns: 2-3 columns
  Cards: 3-column grid
  Sidebar: Possible on larger screens
```

---

## ♿ Accessibility (Critical for Health App)

### Contrast Requirements
```
WCAG AA (minimum):
  Normal text:         4.5:1 contrast ratio
  Large text (18pt+):  3:1 contrast ratio
  Icons/UI controls:   3:1 contrast ratio
  Disabled elements:   1.5:1 (visibly disabled)

Test in both light and dark mode before shipping
Tool: WebAIM Contrast Checker or Accessible Colors
```

### Touch Targets
```
Minimum size:        44pt × 44pt (Apple HIG), 48dp × 48dp (Material)
Minimum spacing:     8pt gap between targets
Expanded hit area:   Use hitSlop in React Native if visual < 44pt
Button labels:       Never icon-only without accessible label

EXAMPLE - Small icon with expanded hit area:
  Visual size:       24pt × 24pt
  Hit area:          44pt × 44pt (using hitSlop: { top: 10, bottom: 10, left: 10, right: 10 })
  Accessible label:  accessibilityLabel="Add pet"
```

### Labels & Descriptions
```
FORM INPUTS:
  ✓ Visible label paired with input
  ✓ accessibility label in React Native
  ✓ accessibility hint for complex fields
  ✗ No placeholder-only labels

ICON-ONLY BUTTONS:
  ✓ accessibilityLabel="Add appointment"
  ✓ accessibilityRole="button"
  ✗ Icon without label (confusing for blind users)

IMAGES:
  ✓ Meaningful images: descriptive alt text
  ✓ Decorative images: accessibilityRole="image" (skip in screen reader)
  ✗ Empty alt text for meaningful images

SEMANTIC HTML/React Native:
  ✓ Use native Button, Pressable, Touchable
  ✓ accessibilityRole, accessibilityState
  ✓ accessibilityLiveRegion for dynamic updates (form errors, success toast)
```

### Keyboard Navigation
```
Tab order:          Should match visual reading order
Back gesture:       System swipe-back must work (iOS)
Escape key:         Must close modals/sheets (web equivalent)
Enter/Return:       Should activate buttons and links

SCREEN READERS (iOS VoiceOver, Android TalkBack):
  ✓ Logical reading order
  ✓ Descriptive labels (not just icon names)
  ✓ State announcements (selected, disabled, expanded)
  ✗ Meaningless generic names ("Button 1")
  ✗ Skipped focusable elements
```

### Dynamic Type & Text Scaling
```
iOS: Respect Dynamic Type size (user can scale 75%-200%)
  → Use text scaling in your typography system
  → Test at largest size (+200%) for truncation/overflow
  → Never use fixed widths that crop text

Android: Respect system font scale (50%-200%)
  → Similar to iOS Dynamic Type
  → Test with system font size maximized

IMPLEMENTATION:
  ✓ Use proportional font sizes (never hardcode px)
  ✓ Avoid text truncation; use line wrapping
  ✓ Reserve space for text expansion
```

### Reduced Motion
```
User preference: prefers-reduced-motion (iOS/Android)

IMPLEMENT:
  ✓ Disable animations when user has enabled reduced motion
  ✓ No parallax, no auto-play animations
  ✓ Keep UI instant and clear (no animation ≠ broken)

REACT NATIVE:
  import { useAccessibilityInfo } from 'react-native';
  const { reduceMotionEnabled } = useAccessibilityInfo();
  
  if (!reduceMotionEnabled) {
    // Run entrance animation
  }
```

---

## 🎯 Screen-Specific Design Guidance

### 1. **Login Screen**
```
Design Pattern: Minimal, focused, secure
─────────────────────────────────────────

[PetHub Logo] (icon + text)

Email Input
  Label: "Email"
  Placeholder: "your@email.com"
  Keyboard type: email

Password Input
  Label: "Password"
  Show/Hide toggle button
  Keyboard type: default (secure input)

[Sign In Button] (primary blue, full width)

"Forgot password?" (link)
────────────────────────────────────────
"Don't have an account? Sign Up" (secondary action)

COLOR:
  Background: White / Dark slate
  Primary action: #1E7A8A
  Link: #1E7A8A

SPACING:
  Logo margin-bottom: 48pt
  Input margin-bottom: 16pt
  Button margin-top: 24pt
  Links margin-top: 16pt

INTERACTION:
  ✓ Focus state: Blue outline on inputs
  ✓ Button press: Opacity + slight scale (0.97)
  ✓ Error: Red border + error message below field
  ✓ Loading: Button becomes disabled, shows spinner inside
  ✓ Success: Toast notification or navigate to home
```

### 2. **Home Dashboard (Pet Owner)**
```
Design Pattern: Personalized cards, quick actions
─────────────────────────────────────────────────

[Header: "Hi, John!"] (greeting, time-aware)
[Search bar] (search appointments, medicines, AI chat)

UPCOMING APPOINTMENTS SECTION
  [Appointment Card 1] (with time, vet name, action)
  [Appointment Card 2]
  [View All >] (secondary link)

QUICK ACTIONS (horizontal scroll)
  ┌─────────┬─────────┬─────────┬─────────┐
  │ Book    │ Chat    │ Order   │ Manage  │
  │  Appt   │  AI     │Medicine │ Pets    │
  └─────────┴─────────┴─────────┴─────────┘

PET HEALTH SUMMARY (grid 2x2)
  ┌───────────┬───────────┐
  │ Vaccines  │ Medicine  │
  │ due: 3wks │ refill: 5d│
  ├───────────┼───────────┤
  │ Weight    │ Next vet  │
  │ 35kg ↑2kg │ May 15    │
  └───────────┴───────────┘

EMPTY STATE (no upcoming appointments):
  [Happy pet icon]
  "No upcoming appointments"
  [Book Appointment Button]

BOTTOM TAB:
  Home (active) | Pets | Chat | Account
```

### 3. **Pet List & Add Pet**
```
PET LIST SCREEN
─────────────────────────────────────

[Header: "My Pets"] [+ Add Pet Button]

[Pet Card 1]
  [Image] (1:1 square)
  [Name: "Buddy"]
  [Breed: Golden Retriever, 3 yrs]
  [Status: All healthy ✓]

[Pet Card 2]
  ...

[Empty state if no pets]
  [Empty pet icon]
  "No pets yet"
  [Add Your First Pet Button]

ADD PET SCREEN
─────────────────────────────────────

[Back Button] [Title: "Add Pet"]

[Pet Image/Avatar] (tap to upload photo)

Form Fields (stack vertically):
  Pet Name: [input]
  Species: [picker] (Dog / Cat / Rabbit...)
  Breed: [input]
  Date of Birth: [date picker]
  Weight: [number input] (kg/lbs)
  Microchip ID: [optional input]
  Allergies: [text input]

[Save Button] (primary, full width)
[Cancel Button] (secondary)

INTERACTION:
  ✓ Image upload: Opens photo picker
  ✓ Date picker: Native date selector
  ✓ Validation: Real-time (red border + error message)
  ✓ Save: Disabled until name + species filled
  ✓ Loading: Button spinner on save
```

### 4. **AI Chat Screen**
```
Design Pattern: Conversational, readable messages
──────────────────────────────────────────────────

[Header: "Pet Care Assistant"] [Close / Back]

[Chat History (scrollable)]
  ┌─────────────────────────────┐
  │ You:                        │
  │ How often should I         │
  │ vaccinate my dog?          │
  └─────────────────────────────┘
              ↓
  ┌─────────────────────────────┐
  │ Assistant:                  │
  │ Based on your Golden       │
  │ Retriever's age...         │
  │ [Source: PetCare Guide]    │
  │ [Confidence: 92%]          │
  └─────────────────────────────┘

[Input area - sticky at bottom]
  ┌──────────────────────────┬───────┐
  │ Ask about your pet... │ ▶ Send   │
  └──────────────────────────┴───────┘

COLORS:
  User message:      Teal bg (#0F9B8E), white text, right-aligned
  Assistant message: Light gray bg (#F3F4F6), dark text, left-aligned
  Sources/confidence: Gray text (14pt), helps verify answer quality

LOADING STATE:
  [Typing indicator: ●●●] (animating dots)

EMPTY STATE:
  [Chat icon]
  "Ask about pet care"
  [Quick suggestion buttons]
    "Vaccinations" | "Grooming" | "Nutrition"
```

### 5. **Vet Search & Appointment Booking**
```
VET SEARCH SCREEN
───────────────────────────────────

[Search bar] (name, specialty, distance)

FILTERS (horizontal scroll or dropdown)
  ├─ Specialty: [All ▼]
  ├─ Rating: [4★+ ▼]
  └─ Distance: [10km ▼]

VET CARD (2-column grid on large)
  ┌────────────────────────────────┐
  │ [Avatar/Photo]                 │
  │ Dr. Sarah Johnson              │
  │ ⭐ 4.9 (120 reviews)            │
  │ Specialty: Orthopedics         │
  │ Available: Today 2-4pm         │
  │ [Book Appointment Button]      │
  └────────────────────────────────┘

EMPTY STATE:
  [No vets icon]
  "No vets found nearby"
  [Expand search radius button]

APPOINTMENT BOOKING
───────────────────────────────────

[Step indicator: 1/3 - Select Pet]
[Pet selector] (carousel or list)
  ✓ [Pet 1 - Buddy] ← selected

[Step 2/3 - Choose Date & Time]
[Calendar widget]
[Time slots (30min intervals)]
  [10:00 AM] [10:30 AM] [11:00 AM]
  ✓ [2:00 PM] ← selected

[Step 3/3 - Confirm Details]
  Dr. Sarah Johnson
  Buddy (Golden Retriever)
  May 15, 2026 · 2:00 PM
  Video Call (30 min)
  $50

[Confirm Appointment Button]
[Appointment confirmed toast/modal]
```

### 6. **Video Call Screen (Teleconsultation)**
```
Design Pattern: Full-screen, minimal UI
────────────────────────────────────────

[Remote video (large)]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│                              │
│   [Vet's video stream]       │
│                              │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Local video (picture-in-picture, bottom-right)]
  ┌─────────────┐
  │  Your video │
  └─────────────┘

BOTTOM CONTROLS (appears on tap, auto-hides 5s)
  [Camera toggle] [Mic toggle] [Speaker] [More ⋮] [End call]
  
  More menu:
    - Chat (share notes)
    - Screenshot
    - Report issue

TIMER:
  [00:15:32] (top-right)

STATES:
  Connecting: [Spinner] "Connecting..."
  Connected: Full video
  Audio only: [Avatar icon] + name + "Audio only"
  Reconnecting: [Alert] "Connection unstable..."
  Ended: [Back button] + "Call ended, Dr. Sarah's notes below"

ACCESSIBILITY:
  ✓ captions/subtitles option
  ✓ magnification support
  ✓ haptic feedback on connection status
```

### 7. **Pharmacy Screen**
```
MEDICINE LIST
──────────────────────────────────

[Search bar] (medicine name, prescription)

FILTERS (category, price range, in stock)
  ┌─────────────┐
  │ Category ▼  │
  └─────────────┘

MEDICINE CARD
  ┌────────────────────────────┐
  │ [Icon/Image]               │
  │ Amoxicillin 250mg         │
  │ Antibiotic capsules       │
  │ ₹399 / 10 capsules        │
  │ ⭐ 4.7 (85) | In stock ✓  │
  │ [View Details / Add to    │
  │  Cart Button]             │
  └────────────────────────────┘

CART BUTTON (sticky bottom)
  ┌──────────────────────────────┐
  │ [Cart icon] 2 items · ₹1,200 │
  │ [Proceed to Checkout]        │
  └──────────────────────────────┘

CHECKOUT SCREEN
──────────────────────────────────

ITEMS REVIEW
  [Item 1] Amoxicillin 250mg × 1 ........... ₹399
  [Item 2] Vitamin supplement × 2 ....... ₹600
  ─────────────────────────────────────────────
  Subtotal ................................. ₹999
  Delivery ................................. ₹150
  Tax ..................................... ₹180
  ─────────────────────────────────────────────
  Total ................................... ₹1,329

DELIVERY ADDRESS
  ┌──────────────────────────────┐
  │ 123 Pet Street              │
  │ New Delhi, 110001           │
  │ [Edit address]              │
  └──────────────────────────────┘

PAYMENT METHOD
  ☐ Credit/Debit Card
  ☐ UPI
  ☑ Wallet

[Place Order Button] (primary blue)
```

### 8. **Admin Dashboard**
```
Design Pattern: Data-driven, insights-focused
──────────────────────────────────────────────

DASHBOARD HEADER
  "Admin Dashboard"
  [Date range picker] [Refresh]

STAT CARDS (horizontal scroll)
  ┌──────────────┐ ┌──────────────┐
  │ Total Users  │ │ Approved Vets │
  │ 2,340 ↑12%  │ │ 45 ↑3        │
  └──────────────┘ └──────────────┘
  ┌──────────────┐ ┌──────────────┐
  │ Appointments │ │ Total Orders  │
  │ 1,230 ↑8%   │ │ 890 ↓2%      │
  └──────────────┘ └──────────────┘

PENDING VET APPROVALS
  [Vet Card 1]
    Dr. John Doe
    Speciality: Surgery
    Applications: 12
    [Approve] [Reject] [View details]
  [Vet Card 2]
    ...

VET MANAGEMENT
  [Vet list table] (sortable, filterable)
  ┌──────────────────────────────────┐
  │ Name | Specialty | Status | Edit │
  ├──────────────────────────────────┤
  │ Dr. S | Surgery | Active | ✎    │
  └──────────────────────────────────┘

PHARMACY INVENTORY
  [Low stock items]
    Amoxicillin: 5 units left
    [Reorder button]
```

---

## 🚀 Implementation Checklist

### Before Shipping
- [ ] All text ≥16pt body text (readable without zoom)
- [ ] All buttons ≥44pt × 44pt touch targets
- [ ] Contrast ≥4.5:1 (WCAG AA) in both light & dark modes
- [ ] All images optimized (WebP/AVIF, proper dimensions)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Bottom tab bar has safe-area padding
- [ ] Form errors display inline below field
- [ ] Loading states show skeleton or spinner (not blank)
- [ ] Icons from consistent set (not emoji)
- [ ] Focus states visible on interactive elements
- [ ] Accessibility labels on icon-only buttons
- [ ] Dark mode tested separately (not just inverted colors)
- [ ] Screen reader tested (VoiceOver / TalkBack)
- [ ] Video call works on both WiFi and 4G
- [ ] Offline state gracefully handled

---

## 📱 React Native Implementation Notes

### Libraries
```
Navigation:
  @react-navigation/native
  @react-navigation/bottom-tabs
  @react-navigation/stack

UI Components:
  react-native-vector-icons (for icons - Feather or Ionicons set)
  react-native-svg (for custom vector graphics)
  
Animation:
  react-native's Animated API
  react-native-reanimated (if complex animations needed)

Forms:
  react-hook-form (lightweight form management)
  
Accessibility:
  react-native AccessibilityInfo API
  accessibilityLabel on all interactive elements
```

### Sample Button Component
```javascript
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const PrimaryButton = ({ label, onPress, loading, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.button,
      pressed && styles.pressed,
      (disabled || loading) && styles.disabled,
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessible={true}
  >
    {loading ? (
      <ActivityIndicator size="small" color="white" />
    ) : (
      <Text style={styles.text}>{label}</Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1E7A8A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrimaryButton;
```

---

## 🎉 Summary: Modern, Professional PetHub UI

✅ **Color Palette**: Teal-blue primary (#1E7A8A) + warm accents  
✅ **Typography**: Inter/Roboto, 16pt body, clear hierarchy  
✅ **Spacing**: 8pt grid system, safe-area aware  
✅ **Components**: Cards, buttons, forms with clear states  
✅ **Animations**: 150-300ms, respectful of reduced-motion  
✅ **Accessibility**: 4.5:1 contrast, 44pt targets, semantic labels  
✅ **Dark Mode**: Separate color tokens, equal contrast  
✅ **Mobile-First**: Responsive, touch-friendly, safe-area compliant  
✅ **Production Ready**: Follows WCAG AA, Apple HIG, Material Design  

This design system will transform PetHub MVP into a **polished, professional, accessible pet care platform** that users trust and enjoy using.

**Start with**: Implement the color palette, typography, and button components. Then apply to all screens incrementally.
