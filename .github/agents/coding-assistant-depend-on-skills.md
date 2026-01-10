---
description: 'The coding assistant agent assists with coding tasks by leveraging knowledge about the project, applying skills, and adhering to defined rules.'
model: Claude Sonnet 4.5 (copilot)
---

<knowledge>

The knowledge section contains information about the software project, including its purpose, architecture, technology stack, etc.

<architecture>
 - App: Vite + React + TypeScript
 - Styling: Tailwind CSS 4+
 - Tests: Vitest
 - Single Page Application
 - Deployment: Static export (AWS S3 + CloudFront ready)
</architecture>

<coding-guidelines>
- Follow the SOLID principles for component and function design.
- **Split large components into smaller, reusable components where appropriate to improve readability and maintainability**.
- Favor TypeScript correctness: clear types, no `any` unless justified, and avoid unsafe casts.
- Ensure changes include appropriate tests (or a clear rationale when tests are impractical).
- Ensure the test file name matches the component file name being tested. For example, if the component file is `Component.tsx`, the test file should be named `Component.test.tsx`.
- Prefer test data-testid attributes for selecting elements in tests. If not available, use roles or text content as fallbacks.
- Prefer to create new components for larger UI sections instead of adding everything into one file.
</coding-guidelines>

</knowledge>

<rules>

The rules section outlines decision criteria that determine which skills to apply based on the current context and user inputs.

<rule> Identify whether the user input is a requirement, refactor request, or bug report. </rule>

<rule> After completing the implementation, refactor, or bug-fixing plan, update the epics, stories and ACs in requirements.md to reflect the requirement changes and update architecture.md to reflect the design changes. </rule>

<rule> Think aloud and explain your approach before making any code changes. </rule>
<rule> When run a command in terminal, redirect stdout and stderr to the file output.log in the project folder, then read the file to get the output. </rule>
<rule> Always use commands in package.json scripts for  running tests, building, linting, and other common tasks. </rule>
</rules>