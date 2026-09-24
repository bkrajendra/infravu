use axum::{
    extract::State,
    http::{header, Method},
    routing::get,
    Json,
    Router,
};

use serde::Serialize;

use std::{
    env,
    net::SocketAddr,
    path::Path,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};

#[cfg(target_os = "linux")]
use std::process::Command;

use sysinfo::{
    Components,
    Disks,
    Networks,
    System,
};

use tokio::{
    net::TcpListener,
    sync::RwLock,
    time::{interval, Duration},
};

use tower_http::cors::{Any, CorsLayer};

//
// ============================================================================
// Application State
// ============================================================================
//

#[derive(Clone)]
struct AppState {
    snapshot: Arc<RwLock<ResourceSnapshot>>,
}

//
// ============================================================================
// Root Resource Snapshot
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct ResourceSnapshot {

    /// Unix timestamp when this snapshot was collected.
    timestamp_unix: u64,

    /// Operating system / host information.
    system: SystemInfo,

    /// CPU and load information.
    cpu: CpuInfo,

    /// RAM information.
    memory: MemoryInfo,

    /// Swap information.
    swap: SwapInfo,

    /// Disk information.
    disks: Vec<DiskInfo>,

    /// Network interfaces.
    networks: Vec<NetworkInfo>,

    /// Running processes.
    processes: Vec<ProcessInfo>,

    /// Temperature sensors.
    temperatures: Vec<TemperatureInfo>,

    /// Linux cgroup information, when available.
    cgroup_limits: Option<CgroupLimitsInfo>,

    /// Virtual machines managed by the local libvirt daemon, when available.
    virtualization: Option<VirtualizationInfo>,
}

//
// ============================================================================
// System Information
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct SystemInfo {
    hostname: Option<String>,

    os_name: Option<String>,
    os_version: Option<String>,

    kernel_version: Option<String>,

    // sysinfo returns String for this method.
    kernel_long_version: String,

    uptime_seconds: u64,

    boot_time_unix: u64,

    physical_core_count: Option<usize>,

    logical_cpu_count: usize,
}

//
// ============================================================================
// CPU
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct CpuInfo {
    /// Overall CPU utilization.
    global_usage_percent: f32,

    /// Linux/macOS load average.
    load_average: LoadAverageInfo,

    /// Per logical CPU information.
    cpus: Vec<CpuCoreInfo>,
}

#[derive(Debug, Clone, Serialize)]
struct CpuCoreInfo {
    index: usize,

    name: String,
    brand: String,
    vendor_id: String,

    frequency_mhz: u64,

    usage_percent: f32,
}

#[derive(Debug, Clone, Serialize)]
struct LoadAverageInfo {
    one_minute: f64,
    five_minutes: f64,
    fifteen_minutes: f64,
}

//
// ============================================================================
// Memory
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct MemoryInfo {
    total_bytes: u64,

    used_bytes: u64,

    available_bytes: u64,

    free_bytes: u64,

    used_percent: f64,
}

//
// ============================================================================
// Swap
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct SwapInfo {
    total_bytes: u64,

    used_bytes: u64,

    free_bytes: u64,

    used_percent: f64,
}

//
// ============================================================================
// Disk
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct DiskInfo {
    name: String,

    mount_point: String,

    filesystem: String,

    kind: String,

    total_bytes: u64,

    available_bytes: u64,

    used_bytes: u64,

    used_percent: f64,

    read_only: bool,

    removable: bool,

    /// Cumulative disk read bytes.
    read_bytes: u64,

    /// Cumulative disk write bytes.
    written_bytes: u64,
}

//
// ============================================================================
// Network
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct NetworkInfo {
    interface: String,

    mac_address: String,

    mtu: u64,

    operational_state: String,

    ip_addresses: Vec<String>,

    received_bytes: u64,

    transmitted_bytes: u64,

    received_packets: u64,

    transmitted_packets: u64,

    received_errors: u64,

    transmitted_errors: u64,
}

//
// ============================================================================
// Process
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct ProcessInfo {
    pid: u32,

    parent_pid: Option<u32>,

    name: String,

    executable: Option<String>,

    command: String,

    cwd: Option<String>,

    cpu_percent: f32,

    memory_bytes: u64,

    virtual_memory_bytes: u64,

    status: String,

    user_id: Option<String>,

    start_time_unix: u64,

    run_time_seconds: u64,

    read_bytes: u64,

    written_bytes: u64,
}

//
// ============================================================================
// Temperature
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct TemperatureInfo {
    label: String,

    temperature_celsius: Option<f32>,

    max_celsius: Option<f32>,

    critical_celsius: Option<f32>,
}

//
// ============================================================================
// Linux cgroup
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct CgroupLimitsInfo {
    total_memory_bytes: u64,

    free_memory_bytes: u64,

    free_swap_bytes: u64,

    rss_bytes: u64,
}

//
// ============================================================================
// Virtualization
// ============================================================================
//

#[derive(Debug, Clone, Serialize)]
struct VirtualizationInfo {
    hypervisor: String,

    vm_count: usize,

    vms: Vec<VirtualMachineInfo>,
}

#[derive(Debug, Clone, Serialize)]
struct VirtualMachineInfo {
    name: String,

    uuid: Option<String>,

    state: String,

    allocation: VirtualMachineAllocation,

    usage: VirtualMachineUsage,

    disks: Vec<VirtualDiskInfo>,
}

#[derive(Debug, Clone, Serialize)]
struct VirtualMachineAllocation {
    vcpus: Option<u64>,

    memory_max_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
struct VirtualMachineUsage {
    cpu_usage_percent: Option<f64>,

    memory_usage_percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
struct VirtualDiskInfo {
    capacity_bytes: u64,
}

//
// ============================================================================
// Utility Functions
// ============================================================================
//

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn os_str_to_string(value: &std::ffi::OsStr) -> String {
    value.to_string_lossy().into_owned()
}

fn percent(used: u64, total: u64) -> f64 {
    if total == 0 {
        0.0
    } else {
        (used as f64 / total as f64) * 100.0
    }
}

#[cfg(target_os = "linux")]
fn virsh(args: &[&str]) -> Option<String> {
    let output = Command::new("virsh")
        .args(args)
        .env("LC_ALL", "C")
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    String::from_utf8(output.stdout).ok()
}

#[cfg(target_os = "linux")]
fn labeled_value<'a>(text: &'a str, label: &str) -> Option<&'a str> {
    text.lines()
        .find_map(|line| line.trim().strip_prefix(label).map(str::trim))
}

#[cfg(target_os = "linux")]
fn parse_quantity(value: &str) -> Option<u64> {
    let mut parts = value.split_whitespace();
    let number = parts.next()?.parse::<f64>().ok()?;
    let multiplier = match parts.next().unwrap_or("bytes").to_ascii_lowercase().as_str() {
        "kib" | "kb" => 1024.0,
        "mib" | "mb" => 1024.0 * 1024.0,
        "gib" | "gb" => 1024.0 * 1024.0 * 1024.0,
        "tib" | "tb" => 1024.0 * 1024.0 * 1024.0 * 1024.0,
        _ => 1.0,
    };

    Some((number * multiplier) as u64)
}

#[cfg(target_os = "linux")]
fn collect_virtual_machine(name: &str) -> VirtualMachineInfo {
    let uuid = virsh(&["domuuid", name]).and_then(|value| {
        let value = value.trim().to_owned();
        (!value.is_empty()).then_some(value)
    });

    let info = virsh(&["dominfo", name]).unwrap_or_default();
    let state = labeled_value(&info, "State:")
        .unwrap_or("unknown")
        .to_ascii_lowercase();
    let vcpus = labeled_value(&info, "CPU(s):").and_then(|value| value.parse().ok());
    let memory_max_bytes = labeled_value(&info, "Max memory:").and_then(parse_quantity);

    let memory_usage_percent = virsh(&["dommemstat", name]).and_then(|value| {
        let actual = labeled_value(&value, "actual")?.parse::<u64>().ok()?;
        let unused = labeled_value(&value, "unused")?.parse::<u64>().ok()?;
        Some(percent(actual.saturating_sub(unused), actual))
    });

    let disks = virsh(&["domblkinfo", name])
        .map(|value| {
            value
                .lines()
                .filter_map(|line| line.trim().strip_prefix("Capacity").and_then(parse_quantity))
                .filter(|capacity| *capacity > 0)
                .map(|capacity_bytes| VirtualDiskInfo { capacity_bytes })
                .collect()
        })
        .unwrap_or_default();

    VirtualMachineInfo {
        name: name.to_owned(),
        uuid,
        state,
        allocation: VirtualMachineAllocation {
            vcpus,
            memory_max_bytes,
        },
        usage: VirtualMachineUsage {
            cpu_usage_percent: None,
            memory_usage_percent,
        },
        disks,
    }
}

#[cfg(target_os = "linux")]
fn collect_virtualization() -> Option<VirtualizationInfo> {
    let names = virsh(&["list", "--all", "--name"])?;
    let vms = names
        .lines()
        .map(str::trim)
        .filter(|name| !name.is_empty())
        .map(collect_virtual_machine)
        .collect::<Vec<_>>();

    Some(VirtualizationInfo {
        hypervisor: "libvirt".to_owned(),
        vm_count: vms.len(),
        vms,
    })
}

#[cfg(not(target_os = "linux"))]
fn collect_virtualization() -> Option<VirtualizationInfo> {
    None
}

//
// ============================================================================
// Snapshot Collection
// ============================================================================
//

fn collect_snapshot(
    system: &mut System,
    disks: &mut Disks,
    networks: &mut Networks,
    components: &mut Components,
) -> ResourceSnapshot {

    //
    // Refresh system information.
    //
    system.refresh_all();

    //
    // Refresh disks.
    //
    disks.refresh(true);

    //
    // Refresh network interfaces.
    //
    networks.refresh(true);

    //
    // Refresh temperature sensors.
    //
    components.refresh(true);

    //
    // ------------------------------------------------------------------------
    // Load Average
    // ------------------------------------------------------------------------
    //

    let load = System::load_average();

    //
    // ------------------------------------------------------------------------
    // CPU
    // ------------------------------------------------------------------------
    //

    let cpus = system
        .cpus()
        .iter()
        .enumerate()
        .map(|(index, cpu)| {

            CpuCoreInfo {
                index,

                name: cpu.name().to_owned(),

                brand: cpu.brand().to_owned(),

                vendor_id: cpu.vendor_id().to_owned(),

                frequency_mhz: cpu.frequency(),

                usage_percent: cpu.cpu_usage(),
            }
        })
        .collect::<Vec<_>>();

    //
    // ------------------------------------------------------------------------
    // Memory
    // ------------------------------------------------------------------------
    //

    let total_memory =
        system.total_memory();

    let used_memory =
        system.used_memory();

    //
    // ------------------------------------------------------------------------
    // Swap
    // ------------------------------------------------------------------------
    //

    let total_swap =
        system.total_swap();

    let used_swap =
        system.used_swap();

    //
    // ------------------------------------------------------------------------
    // Disks
    // ------------------------------------------------------------------------
    //

    let disks_info = disks
        .list()
        .iter()
        .map(|disk| {

            let total =
                disk.total_space();

            let available =
                disk.available_space();

            let used =
                total.saturating_sub(available);

            let usage =
                disk.usage();

            DiskInfo {

                name:
                    os_str_to_string(
                        disk.name()
                    ),

                mount_point:
                    path_to_string(
                        disk.mount_point()
                    ),

                filesystem:
                    os_str_to_string(
                        disk.file_system()
                    ),

                kind:
                    format!(
                        "{:?}",
                        disk.kind()
                    ),

                total_bytes:
                    total,

                available_bytes:
                    available,

                used_bytes:
                    used,

                used_percent:
                    percent(
                        used,
                        total
                    ),

                read_only:
                    disk.is_read_only(),

                removable:
                    disk.is_removable(),

                read_bytes:
                    usage.read_bytes,

                written_bytes:
                    usage.written_bytes,
            }
        })
        .collect::<Vec<_>>();

    //
    // ------------------------------------------------------------------------
    // Networks
    // ------------------------------------------------------------------------
    //

    let networks_info = networks
        .iter()
        .map(|(name, network)| {

            NetworkInfo {

                interface:
                    name.clone(),

                mac_address:
                    network
                        .mac_address()
                        .to_string(),

                mtu:
                    network.mtu(),

                operational_state:
                    format!(
                        "{:?}",
                        network.operational_state()
                    ),

                ip_addresses:
                    network
                        .ip_networks()
                        .iter()
                        .map(|ip| {
                            ip.addr.to_string()
                        })
                        .collect(),

                received_bytes:
                    network.total_received(),

                transmitted_bytes:
                    network.total_transmitted(),

                received_packets:
                    network
                        .total_packets_received(),

                transmitted_packets:
                    network
                        .total_packets_transmitted(),

                received_errors:
                    network
                        .total_errors_on_received(),

                transmitted_errors:
                    network
                        .total_errors_on_transmitted(),
            }
        })
        .collect::<Vec<_>>();

    //
    // ------------------------------------------------------------------------
    // Processes
    // ------------------------------------------------------------------------
    //

    let processes_info = system
        .processes()
        .iter()
        .map(|(pid, process)| {

            let disk_usage =
                process.disk_usage();

            ProcessInfo {

                pid:
                    pid.as_u32(),

                parent_pid:
                    process
                        .parent()
                        .map(|parent| {
                            parent.as_u32()
                        }),

                name:
                    process
                        .name()
                        .to_string_lossy()
                        .into_owned(),

                executable:
                    process
                        .exe()
                        .map(path_to_string),

                command:
                    process
                        .cmd()
                        .iter()
                        .map(|arg| {
                            arg.to_string_lossy()
                                .into_owned()
                        })
                        .collect::<Vec<_>>()
                        .join(" "),

                cwd:
                    process
                        .cwd()
                        .map(path_to_string),

                cpu_percent:
                    process.cpu_usage(),

                memory_bytes:
                    process.memory(),

                virtual_memory_bytes:
                    process.virtual_memory(),

                status:
                    format!(
                        "{:?}",
                        process.status()
                    ),

                user_id:
                    process
                        .user_id()
                        .map(|uid| uid.to_string()),

                start_time_unix:
                    process.start_time(),

                run_time_seconds:
                    process.run_time(),

                read_bytes:
                    disk_usage.total_read_bytes,

                written_bytes:
                    disk_usage
                        .total_written_bytes,
            }
        })
        .collect::<Vec<_>>();

    //
    // ------------------------------------------------------------------------
    // Temperatures
    // ------------------------------------------------------------------------
    //

    let temperatures = components
        .iter()
        .map(|component| {

            TemperatureInfo {

                label:
                    component
                        .label()
                        .to_owned(),

                temperature_celsius:
                    component.temperature(),

                max_celsius:
                    component.max(),

                critical_celsius:
                    component.critical(),
            }
        })
        .collect::<Vec<_>>();

    //
    // ------------------------------------------------------------------------
    // cgroup Limits
    // ------------------------------------------------------------------------
    //

    let cgroup_limits =
        system
            .cgroup_limits()
            .map(|limits| {

                CgroupLimitsInfo {

                    total_memory_bytes:
                        limits.total_memory,

                    free_memory_bytes:
                        limits.free_memory,

                    free_swap_bytes:
                        limits.free_swap,

                    rss_bytes:
                        limits.rss,
                }
            });

    let virtualization =
        collect_virtualization();

    //
    // ------------------------------------------------------------------------
    // Final Snapshot
    // ------------------------------------------------------------------------
    //

    ResourceSnapshot {

        timestamp_unix:
            now_unix(),

        //
        // System
        //
        system: SystemInfo {

            hostname:
                System::host_name(),

            os_name:
                System::name(),

            os_version:
                System::os_version(),

            kernel_version:
                System::kernel_version(),

            kernel_long_version:
                System::kernel_long_version(),

            uptime_seconds:
                System::uptime(),

            boot_time_unix:
                System::boot_time(),

            physical_core_count:
                System::physical_core_count(),

            logical_cpu_count:
                system.cpus().len(),
        },

        //
        // CPU
        //
        cpu: CpuInfo {

            global_usage_percent:
                system.global_cpu_usage(),

            load_average:
                LoadAverageInfo {

                    one_minute:
                        load.one,

                    five_minutes:
                        load.five,

                    fifteen_minutes:
                        load.fifteen,
                },

            cpus,
        },

        //
        // Memory
        //
        memory: MemoryInfo {

            total_bytes:
                total_memory,

            used_bytes:
                used_memory,

            available_bytes:
                system.available_memory(),

            free_bytes:
                system.free_memory(),

            used_percent:
                percent(
                    used_memory,
                    total_memory
                ),
        },

        //
        // Swap
        //
        swap: SwapInfo {

            total_bytes:
                total_swap,

            used_bytes:
                used_swap,

            free_bytes:
                system.free_swap(),

            used_percent:
                percent(
                    used_swap,
                    total_swap
                ),
        },

        //
        // Other resources
        //
        disks:
            disks_info,

        networks:
            networks_info,

        processes:
            processes_info,

        temperatures,

        cgroup_limits,

        virtualization,
    }
}

//
// ============================================================================
// HTTP Handlers
// ============================================================================
//

async fn health() -> &'static str {
    "OK"
}

//
// -----------------------------------------------------------------------------
// Complete resource snapshot
// -----------------------------------------------------------------------------

async fn resources(
    State(state): State<AppState>,
) -> Json<ResourceSnapshot> {

    let snapshot =
        state.snapshot.read().await;

    Json(snapshot.clone())
}

//
// -----------------------------------------------------------------------------
// System
// -----------------------------------------------------------------------------

async fn get_system(
    State(state): State<AppState>,
) -> Json<SystemInfo> {

    let snapshot =
        state.snapshot.read().await;

    Json(snapshot.system.clone())
}

//
// -----------------------------------------------------------------------------
// CPU
// -----------------------------------------------------------------------------

async fn get_cpu(
    State(state): State<AppState>,
) -> Json<CpuInfo> {

    let snapshot =
        state.snapshot.read().await;

    Json(snapshot.cpu.clone())
}

//
// -----------------------------------------------------------------------------
// Memory
// -----------------------------------------------------------------------------

async fn get_memory(
    State(state): State<AppState>,
) -> Json<MemoryInfo> {

    let snapshot =
        state.snapshot.read().await;

    Json(snapshot.memory.clone())
}

//
// -----------------------------------------------------------------------------
// Swap
// -----------------------------------------------------------------------------

async fn get_swap(
    State(state): State<AppState>,
) -> Json<SwapInfo> {

    let snapshot =
        state.snapshot.read().await;

    Json(snapshot.swap.clone())
}

//
// -----------------------------------------------------------------------------
// Disks
// -----------------------------------------------------------------------------

async fn get_disks(
    State(state): State<AppState>,
) -> Json<Vec<DiskInfo>> {

    let snapshot =
        state.snapshot.read().await;

    Json(snapshot.disks.clone())
}

//
// -----------------------------------------------------------------------------
// Networks
// -----------------------------------------------------------------------------

async fn get_networks(
    State(state): State<AppState>,
) -> Json<Vec<NetworkInfo>> {

    let snapshot =
        state.snapshot.read().await;

    Json(snapshot.networks.clone())
}

//
// -----------------------------------------------------------------------------
// Processes
// -----------------------------------------------------------------------------

async fn get_processes(
    State(state): State<AppState>,
) -> Json<Vec<ProcessInfo>> {

    let snapshot =
        state.snapshot.read().await;

    Json(snapshot.processes.clone())
}

//
// ============================================================================
// Main
// ============================================================================
//

#[tokio::main]
async fn main()
    -> Result<(), Box<dyn std::error::Error>>
{
    //
    // ------------------------------------------------------------------------
    // Configuration
    // ------------------------------------------------------------------------
    //

    let host =
        env::var("MONITOR_HOST")
            .unwrap_or_else(|_| {
                "0.0.0.0".to_string()
            });

    let port =
        env::var("MONITOR_PORT")
            .ok()
            .and_then(|value| {
                value.parse::<u16>().ok()
            })
            .unwrap_or(9100);

    let interval_seconds =
        env::var(
            "MONITOR_INTERVAL_SECONDS"
        )
        .ok()
        .and_then(|value| {
            value.parse::<u64>().ok()
        })
        .unwrap_or(2)
        .max(1);

    println!(
        "Initializing Linux Resource Monitor"
    );

    //
    // ------------------------------------------------------------------------
    // sysinfo collectors
    // ------------------------------------------------------------------------
    //

    let mut system =
        System::new_all();

    let mut disks =
        Disks::new_with_refreshed_list();

    let mut networks =
        Networks::new_with_refreshed_list();

    let mut components =
        Components::new_with_refreshed_list();

    //
    // ------------------------------------------------------------------------
    // Initial snapshot
    // ------------------------------------------------------------------------
    //

    let initial_snapshot =
        collect_snapshot(
            &mut system,
            &mut disks,
            &mut networks,
            &mut components,
        );

    //
    // ------------------------------------------------------------------------
    // Shared application state
    // ------------------------------------------------------------------------
    //

    let state =
        AppState {

            snapshot:
                Arc::new(
                    RwLock::new(
                        initial_snapshot
                    )
                ),
        };

    //
    // ------------------------------------------------------------------------
    // Background sampler
    // ------------------------------------------------------------------------
    //

    let sampler_state =
        state.clone();

    tokio::spawn(async move {

        let mut timer =
            interval(
                Duration::from_secs(
                    interval_seconds
                )
            );

        loop {

            timer.tick().await;

            let snapshot =
                collect_snapshot(
                    &mut system,
                    &mut disks,
                    &mut networks,
                    &mut components,
                );

            let mut current =
                sampler_state
                    .snapshot
                    .write()
                    .await;

            *current =
                snapshot;
        }
    });

    //
    // ------------------------------------------------------------------------
    // HTTP routes
    // ------------------------------------------------------------------------
    //

    let app =
        Router::new()

            //
            // Health
            //
            .route(
                "/",
                get(health)
            )

            .route(
                "/health",
                get(health)
            )

            //
            // Complete resource snapshot
            //
            .route(
                "/api/resources",
                get(resources)
            )

            //
            // Individual resources
            //
            .route(
                "/api/system",
                get(get_system)
            )

            .route(
                "/api/cpu",
                get(get_cpu)
            )

            .route(
                "/api/memory",
                get(get_memory)
            )

            .route(
                "/api/swap",
                get(get_swap)
            )

            .route(
                "/api/disks",
                get(get_disks)
            )

            .route(
                "/api/networks",
                get(get_networks)
            )

            .route(
                "/api/processes",
                get(get_processes)
            )

            //
            // State
            //
            .with_state(state)

            // The dashboard calls the agent directly from a browser.
            .layer(
                CorsLayer::new()
                    .allow_origin(Any)
                    .allow_methods([Method::GET, Method::OPTIONS])
                    .allow_headers([header::ACCEPT]),
            );

    //
    // ------------------------------------------------------------------------
    // HTTP server
    // ------------------------------------------------------------------------
    //

    let address:
        SocketAddr =
            format!(
                "{}:{}",
                host,
                port
            )
            .parse()?;

    let listener =
        TcpListener::bind(address)
            .await?;

    println!(
        "Linux Resource Monitor listening on http://{}",
        address
    );

    println!(
        "Collection interval: {} seconds",
        interval_seconds
    );

    //
    // ------------------------------------------------------------------------
    // Serve
    // ------------------------------------------------------------------------
    //

    axum::serve(
        listener,
        app
    )
    .with_graceful_shutdown(
        shutdown_signal()
    )
    .await?;

    Ok(())
}

//
// ============================================================================
// Graceful Shutdown
// ============================================================================
//

async fn shutdown_signal() {

    let ctrl_c =
        async {

            tokio::signal::ctrl_c()
                .await
                .expect(
                    "failed to install Ctrl+C handler"
                );
        };

    #[cfg(unix)]
    let terminate =
        async {

            tokio::signal::unix::signal(
                tokio::signal::unix::SignalKind::terminate()
            )
            .expect(
                "failed to install SIGTERM handler"
            )
            .recv()
            .await;
        };

    #[cfg(not(unix))]
    let terminate =
        std::future::pending::<()>();

    tokio::select! {

        _ = ctrl_c => {},

        _ = terminate => {},
    }
}