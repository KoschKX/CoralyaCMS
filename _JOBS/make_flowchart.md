# Job: Generate a Mermaid Flowchart from Project

**Date Created:** 2026-05-20 07:30 UTC

## Task
Create a flowchart using [Mermaid](https://mermaid-js.github.io/) for the following project:

**Project Name:** [Project Name Here]

**Project Overview:**  
[Short description of what the project does.]

**Major Steps / Components:**  
- [Step 1]
- [Step 2]
- [Step 3]

## Expected Output
Write the generated Mermaid flowchart to a file named **`flowchart.mmd`** in the **project root folder** (i.e. the workspace root, not this `- JOBS -` folder).

The file must contain only the raw Mermaid diagram syntax — no markdown fences, no extra text:

```
flowchart TD
    Step1 --> Step2
    Step2 --> Step3
    %% Add/adjust nodes and edges as needed
```

Do **not** wrap the output in triple-backtick code fences. The file should be valid `.mmd` content ready for direct consumption by Mermaid CLI or any Mermaid-compatible renderer.

## Reference
- [Mermaid Docs](https://mermaid-js.github.io/mermaid/#/)
