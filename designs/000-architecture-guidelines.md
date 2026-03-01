---
description: "Frontend architecture and coding standards for Amiglot UI."
whenToUse: "Read when designing UI structure, component boundaries, forms/state handling, styling, or i18n."
---

# Amiglot UI — Architecture & Coding Guidelines

## 0. Scope
This document is the single source of truth for UI architecture and coding standards. All UI guidelines live here.

## 1. Technical Standards
- Next.js 16.1.6, React 19.2.3, TypeScript 5.x
- ESLint + Prettier with strict lint/typecheck/build in CI

---

## 2. Architectural Philosophy
* **Separation of Concerns:** Never mix data fetching, state management, validation logic, and UI rendering in a single file.
* **Architectural Depth:** Prioritize explicit state management and clear component boundaries over writing monolithic "God Components."
* **Server-First:** Leverage the Next.js App Router by defaulting to Server Components. Only use `"use client"` when interactivity or browser APIs are strictly required.

---

## 3. Component Structure & Boundaries
A complex page (like a Profile or Settings form) must be split into distinct responsibilities:

* **`page.tsx` (Server Component):**
  * **Role:** Route entry point, Server-side data fetching, and auth boundary checks.
  * **Rule:** Do not use `useState` or `useEffect` here. Fetch the initial data and pass it downward as an `initialData` prop.
* **`[feature]-form.tsx` (Client Component):**
  * **Role:** The interactive container.
  * **Rule:** Must include the `"use client"` directive. It receives `initialData`, initializes the form state, and handles the `onSubmit` mutation.
* **`schema.ts` (Data Definition):**
  * **Role:** The source of truth for validation.
  * **Rule:** Export Zod schemas here. Do not inline validation logic inside components.
* **Sub-components:**
  * **Rule:** If a component's `return` statement exceeds 100 lines, extract the logical UI blocks (e.g., individual Tabs or complex fields) into sibling components (e.g., `profile-tab.tsx`).

---

## 4. Form & State Management
Manual validation and excessive local state hooks are strictly prohibited for form handling.

* **Standard:** Use **React Hook Form** coupled with **Zod** (`@hookform/resolvers/zod`).
* **Implementation:**
  * Define the expected shape and error messages in the Zod schema.
  * Pass the resolver to `useForm`.
  * Do not use dozens of individual `useState` hooks for form fields. Use the form's register/control context.
* **Arrays:** For dynamic lists (e.g., adding multiple languages or time slots), you must use React Hook Form's `useFieldArray`.

---

## 5. UI & Styling
* **Standard:** **Tailwind CSS** and **shadcn/ui**.
* **Implementation:**
  * Use the `cn()` utility for conditional class merging.
  * Do not write custom CSS or inline styles unless absolutely necessary. Use Tailwind utility classes.
  * For `<select>` elements with more than 10 options, always use the shadcn/ui Combobox (Command) pattern rather than a native HTML dropdown to ensure searchability.

---

## 6. Internationalization (i18n)
* **Standard:** **next-intl**.
* **Implementation:**
  * No hardcoded user-facing strings in the UI components.
  * Always use the `useTranslations()` hook.
  * Keys should be semantic (e.g., `t('auth.login.submitButton')`).
  * When referencing global datasets (like ISO language codes or timezones), prefer the browser's native `Intl` APIs combined with fallback data, rather than maintaining massive hardcoded arrays.
