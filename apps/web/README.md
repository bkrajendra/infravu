# Server Resource Monitor

A single-page React dashboard for the Rust host resource agent. The UI is based on the attached host response shape and the supplied dashboard reference, with a **white sidebar** and a lightweight operational-monitoring aesthetic.

## Features

- Add hosts by IPv4/IPv6, hostname or domain.
- Configurable protocol, port and `/api/resources` path.
- Host list persisted in browser `localStorage`.
- Auto-refresh every 5 seconds.
- CPU, memory, disk, network, process and temperature views.
- Chart.js time-series charts for CPU, memory and network throughput.
- Virtual machine inventory from the agent's `virtualization` response block.
- Detects KVM/libvirt signals from `qemu-system-*` processes and `vnet*` interfaces when VM details are not yet exposed.
- Demo mode with a cleaned fixture derived from the attached `arundhati` host response.

## Start

```bash
pnpm install
pnpm dev
```

Then open the Vite URL, normally `http://localhost:5173`.

## Build

```bash
pnpm build
pnpm preview
```

## Agent URL resolution

For a host entry like:

```json
{
  "name": "arundhati",
  "host": "192.168.1.11",
  "port": 9100,
  "resourcePath": "/api/resources"
}
```

the browser requests:

```text
http://192.168.1.11:9100/api/resources
```

A full `http://` or `https://` hostname/domain is also accepted in the Add Server dialog.

## CORS requirement

Because the browser calls the agent directly on each host, the Rust Axum service needs CORS enabled. Add `tower-http` and a CORS layer to the agent, for example:

```rust
use tower_http::cors::{Any, CorsLayer};

let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods(Any)
    .allow_headers(Any);

let app = Router::new()
    // routes...
    .layer(cors)
    .with_state(state);
```

For a production installation, restrict `allow_origin` to the dashboard origin instead of allowing all origins.

## HTTPS

If the dashboard itself is served over HTTPS, browsers will block direct `http://host:9100` requests as mixed content. In that deployment, either serve the agent over HTTPS or put a same-origin reverse proxy in front of the agent.

## Response contract

The UI consumes these top-level fields when available:

```text
 timestamp_unix
 system
 cpu
 memory
 swap
 disks[]
 networks[]
 processes[]
 temperatures[]
 cgroup_limits
 virtualization    # from the VM-enabled agent version
```

On Linux, the agent discovers libvirt domains through `virsh list --all`. The agent service user must have access to the libvirt connection, commonly through the `libvirt` group. The VM table consumes the `virtualization.vms[]` response shape.
