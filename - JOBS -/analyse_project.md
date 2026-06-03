# Universal Project Analysis Job Definition

**Purpose:**  
Perform an on-demand or scheduled deep-dive structured analysis for each top-level subfolder in this workspace, dynamically detecting project languages/frameworks, and providing expert-level, best-practice suggestions and code review.

---

**Actions:**

- For each subfolder (except any with ARCHIVE in the name):
  - Treat the folder as a separate project.
  - Dynamically detect major languages and frameworks in use (by scanning for signature files and file extensions, e.g., package.json, requirements.txt, pyproject.toml, go.mod, Cargo.toml, pom.xml, etc.).
  - For each detected language/framework, trigger domain-expert level analysis, including:
    1. High-level project structure and organization critique; propose optimal scalable folder/file layouts for the detected stack.
    2. Idiomatic usage: Identify anti-patterns, recommend adoption of modern stack conventions (e.g., Pythonic patterns, idiomatic Go, modular Rust, best Java project layout, etc.).
    3. Code quality review: duplication, naming, formatting, dead code, security issues, maintainability, project metadata hygiene.
    4. Dependency and build process analysis: check for outdated/unused dependencies, security advisories, build scripts health.
    5. Test and CI/CD review: look for missing/insufficient tests, suggest reliable frameworks and CI patterns.
    6. Linting and formatting audit: recommend/verify use of industry-standard tools and configs.
    7. Performance, error handling, and extensibility recommendations specific to the stack.
    8. For web stacks: separate notes for frontend/backend; for CMS/block-editors, propose modern, scalable component/block patterns (but only if detected).
    9. Documentation: audit for presence and clarity; suggest improvements.
    10. Output Markdown report as Analysis.md in the project folder, archiving prior versions as before.
- Always skip ARCHIVE folders and their contents.
- Focus analysis only on source code, not dependencies or build outputs.
- Number each suggestion for direct follow-up/automation.

---

**Output:**

- For every project: Markdown report with
  - Detected languages/frameworks and relevant project structure tree (with improved proposal if needed)
  - Actionable, numbered recommendations targeting the project’s actual stack(s)
  - Code or config examples where feasible
  - Explanations and summary, referencing best practices and standards for detected language/framework
  - Preserves compatibility with existing automation and archiving of reports

---

**Notes:**

- No stack is hardcoded; all detection and analysis must adapt to the project’s actual language/frameworks.
- For polyglot projects (e.g., Python backend + JS frontend), generate recommendations for each main tech.
- If unknown/unsupported stacks found, generate a best-effort static/code quality review and suggest how to extend detection/analysis.
- Never analyze or output anything for folders named ARCHIVE or - ARCHIVE -.
- Each recommendation should be clear, actionable, and mapped to code/files where possible.

---

_Updated by OpenClaw at Thu 2026-05-21 (rev 2)._
