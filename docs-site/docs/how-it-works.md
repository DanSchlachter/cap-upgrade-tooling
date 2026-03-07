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
        B[Browse existing entries\nList View]
        B --> C{New change\nor edit?}
        C -->|New| D[Create entry\nEdit Form]
        C -->|Edit| E[Update entry\nEdit Form]
        D --> F[Save to in-memory store]
        E --> F
    end

    F --> G[Download changes.json]

    subgraph GH ["GitHub · DanSchlachter/cap-upgrade-tooling"]
        G --> H[Open Pull Request\nreplace changes.json]
        H --> I{Review & Merge}
        I -->|merged to main| J[GitHub Actions\ndeploy-docs.yml]
        J --> K[npm run build\nVitePress + sync data]
        K --> L[Deploy to GitHub Pages]
    end

    L --> M([Docs site live\ndanschlachter.github.io/cap-upgrade-tooling])
```

---

## Persona 2 — Project Developer / Admin (Upgrading a CAP Project)

A project team prepares to upgrade their CAP application. They use the docs site to understand what applies to them, scan their project to find affected areas, and act on the results.

```mermaid
flowchart TD
    A([Project Developer\nor Admin]) --> B

    subgraph DOCS ["Docs Site · danschlachter.github.io/cap-upgrade-tooling"]
        B[Open Migration Tool]
        B --> C[Set filters\nversion · runtime · severity · category]
        C --> D{Want to scan\nlocal project?}

        D -->|Yes| E[Step 1 — Download scan script\nbash or PowerShell]
        E --> F[Step 2 — Run script\nin project root]
        F --> G[Script tests each\napplicable detection command]
        G --> H[Script prints matching IDs as JSON]
        H --> I[Step 3 — Paste output\ninto Migration Tool]
        I --> J[Apply as filter\nonly matching entries shown]

        D -->|No| J

        J --> K{Which output\ndo you need?}
        K -->|Plain language| L[Admin Guide\ngrouped steps for Basis/Admins]
        K -->|Technical detail| M[Developer Guide\ncode · globs · auto-fix scripts]
    end

    subgraph PROJECT ["CAP Project · local or CI/CD"]
        L --> N[Admin follows\nstep-by-step instructions]
        M --> O{Auto-fix\navailable?}
        O -->|Yes| P[Copy auto-fix script\nrun in project]
        O -->|No| Q[Follow manual\ndeveloper steps]
        P --> R[Verify · test · deploy]
        Q --> R
        N --> R
    end

    R --> S([Project successfully\nupgraded to target CAP version])
```

---

## System Overview

```mermaid
flowchart LR
    subgraph DATA ["Single source of truth"]
        J[(changes.json\nin GitHub repo)]
    end

    subgraph TOOLS ["Tooling"]
        ADM[Admin UI\nCF · maintain entries]
        DOCS[Docs Site\nGH Pages · consume entries]
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
