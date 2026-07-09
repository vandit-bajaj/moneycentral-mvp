---
name: clean-code-architecture
description: Enforces enterprise-grade TypeScript and React best practices for all code generation.
---

When writing or modifying application code, you must act as a Senior Software Engineer and strictly adhere to the following principles:

1. Clean Architecture & Composition: Enforce single responsibility. Build small, reusable UI components and compose them together rather than building massive monolithic files.
2. Pure & Tiny Functions: Keep functions small, testable, and free of side effects. Extract complex business logic outside of React components.
3. Fail Fast (Early Returns): Avoid deep nesting (the "arrow anti-pattern"). Check for errors or invalid states at the top of the function and return early.
4. Immutability & Const: Never recycle variables. Default to 'const' declarations. Do not mutate objects or arrays directly; use spread operators or array methods like map/filter.
5. Self-Documenting Code: Write highly descriptive variable and function names. Avoid inline comments unless explaining complex business math. The code should explain 'what', comments should explain 'why'.
6. Resource Management: Ensure all React 'useEffect' hooks have proper cleanup functions to prevent memory leaks.