# InfraVu

InfraVu is an open source infrastructure inventory manager and resource monitor for data centers, hosts, and virtual machines.

The project has two cooperating parts:

- **Web app**: a React and Tailwind CSS interface that maintains inventory locally in the browser.
- **Agent**: a Rust service installed on servers and VMs that exposes host and virtual machine resource details through APIs.

Phase 1 establishes the monorepo and the local inventory UI. Phase 2 will connect the UI to the agent APIs.

## Repository layout

```text
.
├── apps/
│   └── web/              # React + Vite + Tailwind frontend
├── services/
│   └── agent/            # Rust resource monitoring agent
├── docs/                 # Product and design notes
├── Cargo.toml            # Cargo workspace definition
├── package.json          # Root JavaScript scripts
├── pnpm-workspace.yaml   # pnpm workspace definition
└── .github/workflows/    # Build, release, and deployment automation
```

## Prerequisites

- Node.js 22 or newer
- pnpm 11.25.0 or newer
- Rust stable and Cargo

## Getting started

Install frontend dependencies from the repository root:

```bash
pnpm install
```

Start the frontend development server:

```bash
pnpm dev
```

The app is normally available at `http://localhost:5173`.

## Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the frontend development server |
| `pnpm build` | Build the frontend for production |
| `pnpm preview` | Preview the production frontend build |
| `pnpm agent:check` | Type-check the Rust agent |
| `pnpm agent:build` | Build the Rust agent |
| `pnpm agent:test` | Run Rust agent tests |
| `pnpm check` | Build the frontend and check the Rust agent |
| `cargo build --release -p linux-resource-monitor` | Build a release agent binary |

Commands can also be run inside `apps/web` or `services/agent` when package-specific workflows are more convenient.

## Product model

InfraVu organizes infrastructure in this hierarchy:

```text
Data center
└── Host
    ├── Host resources
    └── Virtual machines
        └── VM resources
```

The frontend currently stores the inventory list locally and includes the UI surfaces needed to manage hosts and view resource information. Agent API integration, live synchronization, authentication, and persistence beyond the browser are planned for Phase 2.

## Development principles

- Keep the web app and agent independently buildable and deployable.
- Prefer explicit API contracts between the agent and frontend.
- Keep local inventory data usable when agents are unavailable.
- Add focused tests as shared behavior and API contracts are introduced.

## Contributing

Create a focused branch, make the smallest coherent change, and run `pnpm check` before opening a pull request. Changes to the web app should include the relevant UI or browser-state validation; changes to the agent should include Rust tests where behavior changes.

## License

A project license will be selected before the first public release.
