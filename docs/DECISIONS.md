# Technical Decisions

1. **Database Strategy**: SQLite is used for a zero-setup prototype. The Prisma schema is kept fully portable to PostgreSQL for production environments.
2. **Types & Enums**: Enums are implemented as string constants with Zod validation. This is a deliberate choice because SQLite does not natively support enums, maintaining schema portability.
3. **Currency Handling**: Money is strictly stored and calculated as integer **paise** to completely avoid floating-point arithmetic errors.
4. **Real-time Updates**: Polling via TanStack Query is used instead of WebSockets. This minimizes infrastructure overhead while still providing acceptable near-real-time user experiences for queues and flows.
5. **Authentication**: `bcryptjs` (pure JavaScript implementation) is preferred over `bcrypt` to prevent native C++ build issues across different deployment environments and platforms.
6. **NoSQL within SQL**: JSON fields are stored as text strings in SQLite with typed helpers in TypeScript. This simplifies the database layer while providing schema flexibility for complex metadata.
7. **Daily Resets**: Token numbers are configured to reset daily per department to ensure manageable numbers for patients.
8. **Clinical Integrity**: Clinical notes follow an append-only pattern once a consultation is marked as completed, ensuring auditability and medical record integrity.
9. **Financial Configuration**: Tax rates are not hardcoded. They are configurable per invoice item category, allowing for flexible billing rule application.
10. **Audit & Compliance**: Break-glass access for administrators requires a strongly-typed reason to be recorded, ensuring full traceability of sensitive operations.
