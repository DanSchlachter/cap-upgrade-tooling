---
title: How It Works
---

# How It Works

Two separate personas interact with the tooling. The diagrams below show each flow end to end.

---

## Persona 1 — SAP CAP Developer (Maintaining the Knowledge Base)

A CAP expert discovers and documents breaking changes between CAP versions, keeps the knowledge base current, and publishes it so project teams can consume it.

```mermaid
flowchart TD
    A([SAP CAP Developer]) --> B

    subgraph ADMIN ["Admin UI · cap-upgrade-admin-ui.cfapps.eu12.hana.ondemand.com"]
        B[Browse existing entries<br/>List View]
        B --> C{New change<br/>or edit?}
        C -->|New| D[Create entry<br/>Edit Form]
        C -->|Edit| E[Update entry<br/>Edit Form]
        D --> F[Save to in-memory store]
        E --> F
    end

    F --> G[Download changes.json]

    subgraph GH ["GitHub · DanSchlachter/cap-upgrade-tooling"]
        G --> H[Open Pull Request<br/>replace changes.json]
        H --> I{Review & Merge}
        I -->|merged to main| L[Deploy to GitHub Pages]
    end

    L --> M([Docs site live<br/>danschlachter.github.io/cap-upgrade-tooling])
```

---

## Persona 2 — Project Developer / Admin (Upgrading a CAP Project)

A project team prepares to upgrade their CAP application. They use the docs site to understand what applies to them, scan their project to find affected areas, and act on the results.

```mermaid
flowchart TD
    A([Project Developer<br/>or Admin]) --> B

    subgraph DOCS ["Docs Site · danschlachter.github.io/cap-upgrade-tooling"]
        B[Open Migration Tool]
        B --> C[Set filters<br/>version · runtime · severity · category]
        C --> D{Want to scan<br/>local project?}

        D -->|Yes| E[Step 1 — Download scan script<br/>bash or PowerShell]
        E --> F[Step 2 — Run script<br/>in project root]
        F --> G[Script tests each<br/>applicable detection command]
        G --> H[Script prints matching IDs as JSON]
        H --> I[Step 3 — Paste output<br/>into Migration Tool]
        I --> J[Apply as filter<br/>only matching entries shown]

        D -->|No| J

        J --> K{Which output<br/>do you need?}
        K -->|Plain language| L[Admin Guide<br/>grouped steps for Basis/Admins]
        K -->|Technical detail| M[Developer Guide<br/>code · globs · auto-fix scripts]
    end

    subgraph PROJECT ["CAP Project · local or CI/CD"]
        L --> N[Admin follows<br/>step-by-step instructions]
        M --> O{Auto-fix<br/>available?}
        O -->|Yes| P[Copy auto-fix script<br/>run in project]
        O -->|No| Q[Follow manual<br/>developer steps]
        P --> R[Verify · test · deploy]
        Q --> R
        N --> R
    end

    R --> S([Project successfully<br/>upgraded to target CAP version])
```

---

## System Overview

```mermaid
flowchart LR
    subgraph DATA ["Single source of truth"]
        J[(changes.json<br/>in GitHub repo)]
    end

    subgraph TOOLS ["Tooling"]
        ADM[Admin UI<br/>CF · maintain entries]
        DOCS[Docs Site<br/>GH Pages · consume entries]
    end

    subgraph PERSONAS ["Personas"]
        CAP([SAP CAP Developer])
        DEV([Project Developer])
        ADM2([Project Admin])
    end

    CAP -- edits via --> ADM
    ADM -- downloads JSON → PR → merge --> J
    J -- synced on build --> DOCS
    DEV -- uses --> DOCS
    ADM2 -- uses --> DOCS
```
