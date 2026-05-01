# FinTrack - Personal Finance Tool

A modular, full-stack expense tracker built with production-quality considerations.

## Features
- **Create Expenses**: Record amount, category, description, and date.
- **Idempotency**: Robust handling of retries and network issues using unique request keys.
- **Filtering**: View expenses by category.
- **Sorting**: Newest first by default, with custom sort options.
- **Real-time Total**: Live calculation of total spending based on active filters.
- **Modern UI**: Premium dark mode design with glassmorphism and smooth animations.

## Tech Stack
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite.
- **Frontend**: React (Vite), Axios, Lucide Icons, Date-fns.
- **Database**: SQLite (chosen for simplicity and local persistence without external dependencies).

## Design Decisions & Trade-offs
1. **Idempotency**: Implemented an `idempotency_key` mechanism on the `POST /expenses` endpoint. This ensures that even if a user clicks "Submit" multiple times or the network fails and retries, only one expense is recorded.
2. **Money Handling**: Used `Numeric(10, 2)` in the database and `Decimal` in Pydantic schemas to avoid floating-point precision issues common with financial data.
3. **Vanilla CSS**: Following instructions to avoid Tailwind, I've used a custom-built design system in `index.css` using HSL colors, CSS variables, and modern glassmorphism techniques.
4. **SQLite**: Chosen because it's a "real" database that supports ACID properties (unlike a JSON file), while remaining lightweight for this assignment.
5. **Timebox Constraints**:
   - **Authentication**: Intentionally omitted to focus on core expense features.
   - **Deletions/Edits**: Omitted to keep the feature set minimal as per requirements.
   - **Advanced Testing**: Basic logic is covered, but full E2E testing was skipped in favor of robust UI/UX and idempotency logic.

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js & npm

### Backend Setup
1. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
2. Run the backend:
   ```powershell
   python -m uvicorn backend.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Run the development server:
   ```powershell
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

## Behavior under Realistic Conditions
- **Network Retries**: The `idempotency_key` prevents duplicate entries.
- **Slow Networks**: The UI includes loading states and disables buttons during submission.
- **Page Refreshes**: State is managed such that a refresh correctly pulls the latest data from the persistent SQLite store.
