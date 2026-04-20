# Requirements Document — HabitSheet to BudgetSheet Conversion

## Introduction

BudgetSheet is a personal expense tracking and budgeting application built on Google Apps Script and Google Spreadsheet as the backend, with a glassmorphism design system frontend. The application enables users to track income, expenses, manage multiple wallets, set budgets, and view financial reports in a single-page application (SPA) that is responsive and mobile-friendly. BudgetSheet leverages proven logic from MoneySheet while implementing a light, airy glassmorphism visual design featuring frosted glass effects, soft pastel gradients, and translucent UI elements.

---

## Glossary

- **System**: The BudgetSheet application as a whole (Google Apps Script + glassmorphism frontend)
- **Backend**: Google Apps Script layer managing data in Google Spreadsheet
- **Frontend**: User interface based on glassmorphism design running as SPA
- **Spreadsheet**: Google Spreadsheet used as the primary database
- **Drive**: Google Drive used to store transaction images/attachments
- **Transaction**: Financial record of income, expense, or transfer between wallets
- **Wallet**: User's financial account (e.g., cash, bank account, e-wallet)
- **Category**: Transaction grouping by type (e.g., Food, Transportation)
- **Budget**: Spending limit set by user per category per period
- **Subscription**: Recurring transaction managed manually by user
- **Report**: Financial summary based on specific time range
- **SPA**: Single Page Application — navigation without full page reload
- **Toast**: Brief notification that appears automatically and closes after 5 seconds
- **Modal**: Dialog window that appears above the main page
- **Glassmorphism**: Design philosophy emphasizing frosted glass aesthetics with semi-transparent backgrounds, backdrop blur effects, soft pastel gradients, and subtle translucent borders
- **Frosted Glass**: UI element style using `backdrop-filter: blur` with semi-transparent backgrounds to simulate a frosted glass appearance

---

## Requirements

### Requirement 1: Automatic Initialization

**User Story:** As a new user, I want the application to automatically set up all infrastructure on first run, so that I don't need manual configuration.

#### Acceptance Criteria

1. WHEN the user first runs the installation script, THE Backend SHALL create a new Google Spreadsheet with all required sheets (Transactions, Wallets, Categories, Budgets, Subscriptions).
2. WHEN the user first runs the installation script, THE Backend SHALL create a dedicated Google Drive folder to store transaction image attachments.
3. WHEN the Spreadsheet has been created, THE Backend SHALL save the Spreadsheet ID and Drive folder ID to PropertiesService for future access.
4. IF the Spreadsheet or Drive folder already exists, THEN THE Backend SHALL use the existing data without creating duplicates.

---

### Requirement 2: Transaction Management

**User Story:** As a user, I want to record income, expenses, and transfers between wallets, so that I can accurately track my financial flow.

#### Acceptance Criteria

1. WHEN the user fills out the transaction form and presses save, THE Backend SHALL save the transaction to the Transactions sheet in the Spreadsheet with columns: ID, Date, Type (Income/Expense/Transfer), Amount, Category, Source Wallet, Destination Wallet, Notes, Attachment URL.
2. WHEN the transaction type is Transfer, THE Backend SHALL atomically decrease the Source Wallet balance and increase the Destination Wallet balance.
3. WHEN the transaction type is Income, THE Backend SHALL increase the selected wallet balance by the transaction amount.
4. WHEN the transaction type is Expense, THE Backend SHALL decrease the selected wallet balance by the transaction amount.
5. WHEN the user uploads an image in the transaction form, THE Backend SHALL save the image to the Drive folder and store its URL with the transaction data.
6. WHEN the user updates an existing transaction, THE Backend SHALL update the related wallet balances by calculating the difference between old and new values.
7. WHEN the user deletes a transaction, THE Backend SHALL reverse the transaction's effect on related wallet balances before deleting the record.
8. IF the entered transaction amount is not a positive number, THEN THE Backend SHALL return a descriptive error message without saving data.
9. IF the selected wallet is not found, THEN THE Backend SHALL return an error message without processing the transaction.

---

### Requirement 3: Multi-Wallet Management

**User Story:** As a user, I want to manage multiple wallets with different icons and colors, so that I can separate and monitor balances from various funding sources.

#### Acceptance Criteria

1. THE Backend SHALL store each wallet with attributes: ID, Name, Initial Balance, Current Balance, Icon (Tabler Icon), Color (hex code), Date Created.
2. WHEN the user creates a new wallet, THE Backend SHALL set Current Balance equal to the entered Initial Balance.
3. WHEN the user updates a wallet's name or visual attributes, THE Backend SHALL update the data without changing the existing balance.
4. IF the user attempts to delete a wallet that still has related transactions, THEN THE Backend SHALL return an error message and cancel the deletion.
5. THE Frontend SHALL display the wallet list in a grid layout with available balance information, icon, and color using glassmorphism frosted glass card components.

---

### Requirement 4: Category Management

**User Story:** As a user, I want to create and manage transaction categories with icons and colors, so that I can visually classify expenses and income.

#### Acceptance Criteria

1. THE Backend SHALL store each category with attributes: ID, Name, Type (Income/Expense/Both), Icon (Tabler Icon), Color (hex code).
2. WHEN the user creates a new category, THE Backend SHALL save the category to the Categories sheet and return the newly created category data.
3. WHEN the user updates a category, THE Backend SHALL update all changed attributes without affecting existing transactions.
4. IF the user attempts to delete a category still used by active transactions, THEN THE Backend SHALL return an error message and cancel the deletion.
5. THE Frontend SHALL display the category list in a grid layout with icon, color, and progress comparison with allocated budget using glassmorphism visual style.

---

### Requirement 5: Budget Management

**User Story:** As a user, I want to set budget limits per category per period, so that I can monitor and control my spending.

#### Acceptance Criteria

1. THE Backend SHALL store each budget with attributes: ID, Category, Budget Amount, Period (Monthly/Weekly/Yearly), Applicable Month/Year.
2. WHEN the user creates a new budget, THE Backend SHALL validate that the selected category exists and the budget amount is a positive number.
3. WHEN the Frontend loads the Budget page, THE Backend SHALL calculate total actual expenses per category for the relevant period and return it with budget data.
4. THE Frontend SHALL display a progress indicator for each budget comparing actual expenses with the set budget amount using glassmorphism visual elements.
5. IF actual expenses for a category exceed 80% of the set budget, THEN THE Frontend SHALL display a visual warning indicator on that budget card.
6. IF actual expenses for a category exceed 100% of the set budget, THEN THE Frontend SHALL display a critical visual indicator on that budget card.

---

### Requirement 6: Subscription Management (Recurring Transactions)

**User Story:** As a user, I want to record and monitor recurring transactions like monthly bills, so that I can plan my routine expenses.

#### Acceptance Criteria

1. THE Backend SHALL store each subscription with attributes: ID, Name, Amount, Category, Wallet, Frequency (Daily/Weekly/Monthly/Yearly), Next Due Date, Notes, Status (Active/Inactive).
2. WHEN the user creates a new subscription entry, THE Backend SHALL save the data to the Subscriptions sheet without creating an automatic transaction.
3. WHEN the user marks a subscription as "paid", THE Backend SHALL create a new expense transaction based on subscription data and update the Next Due Date according to frequency.
4. THE Frontend SHALL display the list of active subscriptions on the Dashboard with name, amount, and next due date information.
5. IF a subscription's due date is less than or equal to 3 days from today, THEN THE Frontend SHALL display a visual warning indicator on that subscription item.

---

### Requirement 7: Dashboard

**User Story:** As a user, I want to see my financial summary on one page, so that I can understand my financial condition at a glance.

#### Acceptance Criteria

1. WHEN the user opens the Dashboard page, THE Frontend SHALL display the total combined balance of all active wallets in currency format with thousand separators.
2. WHEN the user opens the Dashboard page, THE Frontend SHALL display total income and total expenses for the current month.
3. THE Frontend SHALL display a pie chart of expenses per category for the current month using data from the Backend.
4. THE Frontend SHALL display a line chart of weekly expenses for the last 4 weeks.
5. THE Frontend SHALL display a list of recent transactions in a grid layout, limited to a maximum of 6 items, with a link to view all transactions.
6. THE Frontend SHALL display a list of active subscriptions due within the next 7 days.
7. THE Frontend SHALL provide quick navigation links to Transaction, Budget, and Wallet pages.

---

### Requirement 8: Transaction Page

**User Story:** As a user, I want to view, search, and filter all my transactions, so that I can easily find and analyze specific financial records.

#### Acceptance Criteria

1. THE Frontend SHALL display the transaction list in a grid layout with a maximum of 15 items per page and a "Load More" button to load subsequent items.
2. THE Frontend SHALL provide a text search field that filters transactions based on notes or category name in real-time on the client side.
3. THE Frontend SHALL provide filters based on date range, category, wallet, and transaction type (Income/Expense/Transfer).
4. WHEN the user applies filters, THE Backend SHALL return only transactions matching the given filter criteria.
5. THE Frontend SHALL provide a button to create a new transaction that opens a Modal transaction form.
6. WHEN the user clicks a transaction item, THE Frontend SHALL open a Modal transaction detail with options to edit or delete.

---

### Requirement 9: Report Page

**User Story:** As a user, I want to view financial reports based on specific time periods, so that I can analyze my spending and income patterns.

#### Acceptance Criteria

1. THE Frontend SHALL provide report filters based on period: Daily, Weekly, Monthly, and Yearly.
2. WHEN the user selects a report period, THE Backend SHALL calculate and return total income, total expenses, and net balance for that period.
3. THE Frontend SHALL display a bar chart comparing income and expenses per selected period.
4. THE Frontend SHALL display a detailed table of expenses per category along with percentage of total expenses for the selected period.
5. THE Frontend SHALL display a comparison between set budgets and actual expenses per category for monthly periods.
6. THE Frontend SHALL provide a custom date range filter allowing users to freely specify start and end dates.

---

### Requirement 10: Glassmorphism User Interface and SPA

**User Story:** As a user, I want smooth navigation without page reloads and clear visual feedback for every action, so that the application experience feels fast and responsive with a light, airy glassmorphism aesthetic.

#### Acceptance Criteria

1. THE Frontend SHALL implement SPA navigation using hash-based routing so that page transitions do not reload the entire page.
2. WHEN a CRUD operation is being processed, THE Frontend SHALL display a loading indicator (spinner) on the relevant element until the operation completes.
3. WHEN a CRUD operation succeeds, THE Frontend SHALL display a success Toast notification that automatically closes after 5 seconds.
4. WHEN a CRUD operation fails, THE Frontend SHALL display an error Toast notification that automatically closes after 5 seconds.
5. WHEN a CRUD operation succeeds, THE Frontend SHALL automatically close the active Modal.
6. WHEN a CRUD operation succeeds, THE Frontend SHALL automatically update the relevant data display without a full page reload.
7. THE Frontend SHALL use glassmorphism design principles including: frosted glass cards and panels with `backdrop-filter: blur` and semi-transparent backgrounds, soft pastel gradient background (pastel blue #A8D8EA/#B8D4E8, light lavender #C9B8E8/#D4C5F0, and mint green #B8E8D4/#C5F0E0), rounded corners (12–16px border-radius), subtle translucent borders, smooth soft shadows, and clean sans-serif typography.
8. THE Frontend SHALL use Tabler Icons for all interface icons.
9. THE Frontend SHALL display all currency values in format with thousand separators (e.g., $1,500.00 or Rp 1.500.000).
10. THE Frontend SHALL be fully responsive and usable on desktop, tablet, and mobile devices.

---

### Requirement 11: Security and Data Validation

**User Story:** As a user, I want my financial data to be secure and protected from invalid input, so that my data integrity is maintained.

#### Acceptance Criteria

1. THE Backend SHALL validate all input received from the Frontend before saving to the Spreadsheet.
2. IF input contains potentially dangerous characters (such as spreadsheet formulas starting with `=`, `+`, `-`, `@`), THEN THE Backend SHALL sanitize the input before saving.
3. THE Backend SHALL use Google Apps Script's built-in authentication mechanism so that only authenticated users can access data.
4. IF an unexpected error occurs in the Backend, THEN THE Backend SHALL log the error to Apps Script logs and return a generic error message that does not expose internal details to the Frontend.

---

### Requirement 12: Performance and Scalability

**User Story:** As a user, I want the application to respond quickly even when I have a lot of data, so that the usage experience remains comfortable.

#### Acceptance Criteria

1. WHEN the Frontend requests data from the Backend, THE Backend SHALL read data from the Spreadsheet using batch operations (getValues) rather than per-cell operations to minimize API calls.
2. THE Backend SHALL return responses in structured JSON format for all endpoints.
3. WHEN the number of transactions exceeds 1000 rows, THE Backend SHALL support pagination by returning data in chunks based on offset and limit parameters provided by the Frontend.
4. THE Frontend SHALL store rarely-changing data (such as category and wallet lists) in session memory to reduce repeated calls to the Backend.

---

### Requirement 13: Design System Transition

**User Story:** As a user, I want a visually distinctive glassmorphism interface that is light, airy, and modern, so that the application feels polished and approachable while remaining highly usable.

#### Acceptance Criteria

1. THE Frontend SHALL implement the glassmorphism design system with the following characteristics: clean sans-serif fonts (minimum 16px base size), soft pastel gradient background featuring pastel blue (#A8D8EA / #B8D4E8), light lavender (#C9B8E8 / #D4C5F0), and mint green (#B8E8D4 / #C5F0E0), frosted glass cards using `backdrop-filter: blur` with semi-transparent backgrounds, rounded corners (12–16px border-radius), subtle translucent borders, and soft diffused shadows.
2. THE Frontend SHALL use a pastel-based color palette with semi-transparent overlays as primary surface colors, and accent colors used for status indicators (success: soft green, warning: soft amber, error: soft red).
3. THE Frontend SHALL use a clean typography hierarchy: headings at minimum 24px with medium-to-semibold weight, body text at 16px regular weight, and small text at 14px — avoiding heavy or bold weights that conflict with the light aesthetic.
4. THE Frontend SHALL implement glassmorphism form elements: softly bordered input fields with translucent backgrounds, rounded buttons with subtle gradient fills, and clear focus states with soft glow outlines.
5. THE Frontend SHALL use frosted glass card components: semi-transparent backgrounds, `backdrop-filter: blur`, subtle border (1px semi-transparent white or light color), rounded corners (12–16px), and soft box shadows without harsh edges.
6. THE Frontend SHALL implement glassmorphism navigation: translucent nav bar with frosted glass effect, soft active state highlights, and clear visual hierarchy using color and weight rather than thick borders.

---

### Requirement 14: Migration from HabitSheet

**User Story:** As a developer, I want to systematically convert HabitSheet codebase to BudgetSheet, so that the transition is clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL reuse HabitSheet's authentication system (AuthService.gs) with minimal modifications for BudgetSheet context.
2. THE System SHALL reuse HabitSheet's caching mechanism (CacheService.gs) for optimizing data access patterns.
3. THE System SHALL replace HabitSheet's habit-tracking data model with BudgetSheet's financial data model (transactions, wallets, categories, budgets, subscriptions).
4. THE System SHALL port MoneySheet's backend service logic (TransaksiService, DompetService, KategoriService, AnggaranService, LanggananService) to BudgetSheet with appropriate naming conventions.
5. THE System SHALL replace HabitSheet's Tabler UI frontend with the glassmorphism design system while maintaining SPA architecture and hash-based routing.
6. THE System SHALL maintain HabitSheet's Google Apps Script deployment configuration (.clasp.json) with updated project references.
7. THE System SHALL update all user-facing text and labels to reflect financial tracking context instead of habit tracking context.
