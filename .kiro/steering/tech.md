---
inclusion: always
---

# Tech Stack

## Frontend
- Framework: Next.js with App Router
- Language: TypeScript (strict mode, no `any`)
- Styling: Tailwind CSS only. No inline styles. No CSS modules.
- Components use named exports only. No default exports.

## File Structure
- Components go in /components
- Pages and routes go in /app
- Utility functions go in /lib

## Code Conventions
- Use async/await. Never use .then() chains.
- Always handle loading and error states in UI components.
- Write self-documenting code. Avoid comments that just describe what the code does.