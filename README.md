# InfraVu

InfraVu is an open source infrastructure inventory manager and resource monitor for data centers, hosts, and virtual machines.

The project has two cooperating parts:

- **Web app**: a React and Tailwind CSS interface that maintains inventory locally in the browser.
- **Agent**: a Rust service installed on servers and VMs that exposes host and virtual machine resource details through APIs.

![Rust builds](https://github.com/bkrajendra/infravu/actions/workflows/rust.yml/badge.svg)
![Web deployment](https://github.com/bkrajendra/infravu/actions/workflows/deploy.yml/badge.svg)

## Get started

InfraVu has a web dashboard and a lightweight agent. Install the agent on a host, start the dashboard, and register the host using its agent endpoint.

### 1. Install the agent

On Linux or macOS:

```bash
curl --fail --location https://raw.githubusercontent.com/bkrajendra/infravu/main/scripts/install.sh | bash
```

On Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/bkrajendra/infravu/main/scripts/install.ps1 | iex
```

Linux registers or updates the `infravu-agent` systemd service on port `9100`. macOS and Windows install the binary without registering a service.

### 2. Start the dashboard

From the repository root:

```bash
pnpm install
pnpm dev
```

Open the Vite URL shown in the terminal, select **Add server**, and enter the host address, port `9100`, and resource path `/api/resources`.

### Updating an existing agent

Run the same installer again. It replaces the binary and restarts an existing Linux systemd service. On macOS, restart the manually running process after installation. On Windows, the installer stops an existing `infravu-agent` process before replacing the executable.

If you need to stop the agent manually before updating:

```bash
# Linux
sudo systemctl stop infravu-agent

# macOS or a manually started Linux process
pkill -x infravu-agent
```

```powershell
Stop-Process -Name infravu-agent -Force
```

## User guide

The dashboard stores the inventory list locally in the browser. Use the Servers table to search, filter, refresh health, export inventory, or open a server dashboard. The server dashboard provides host resource details and a Virtual Machines view when libvirt data is available.


## Repository layout

```text
.
├── apps/
│   └── web/              # React + Vite + Tailwind frontend
├── services/
│   └── agent/            # Rust resource monitoring agent
├── docs/                 # Product and design notes
├── scripts/              # Agent installation scripts
├── Cargo.toml            # Cargo workspace definition
├── package.json          # Root JavaScript scripts
├── pnpm-workspace.yaml   # pnpm workspace definition
└── .github/workflows/    # Build, release, and deployment automation
```

## Developer setup

### Prerequisites

- Node.js 22 or newer
- pnpm 11.25.0 or newer
- Rust stable and Cargo
- `curl` and Bash for the Unix installer

Install frontend dependencies from the repository root with `pnpm install`, then use `pnpm dev` to start the web app locally.

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
