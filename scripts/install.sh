#!/usr/bin/env bash
set -euo pipefail

REPO="${INFRAVU_REPO:-bkrajendra/infravu}"
VERSION="${INFRAVU_VERSION:-latest}"
BINARY_NAME="infravu-agent"
SERVICE_NAME="${INFRAVU_SERVICE_NAME:-infravu-agent}"

log() {
  printf '[infravu] %s\n' "$*"
}

fail() {
  printf '[infravu] error: %s\n' "$*" >&2
  exit 1
}

command -v curl >/dev/null 2>&1 || fail "curl is required"

os="$(uname -s)"
arch="$(uname -m)"
asset=""
install_dir=""

case "$os:$arch" in
  Linux:x86_64|Linux:amd64)
    asset="linux-x86_64"
    install_dir="${INFRAVU_INSTALL_DIR:-/usr/local/bin}"
    ;;
  Darwin:arm64|Darwin:aarch64)
    asset="macos-arm64"
    install_dir="${INFRAVU_INSTALL_DIR:-/usr/local/bin}"
    ;;
  *)
    fail "unsupported platform: $os/$arch. Available assets: linux-x86_64 and macos-arm64"
    ;;
esac

if [ "$VERSION" = "latest" ]; then
  download_url="https://github.com/${REPO}/releases/latest/download/${asset}"
else
  download_url="https://github.com/${REPO}/releases/download/${VERSION}/${asset}"
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

tmp_binary="${tmp_dir}/${BINARY_NAME}"
log "downloading ${asset} from ${REPO} (${VERSION})"
curl --fail --location --show-error --silent "$download_url" --output "$tmp_binary"
chmod 0755 "$tmp_binary"

install_binary() {
  if [ -w "$install_dir" ] || [ -w "$(dirname "$install_dir")" ]; then
    mkdir -p "$install_dir"
    cp "$tmp_binary" "${install_dir}/${BINARY_NAME}"
  else
    command -v sudo >/dev/null 2>&1 || fail "${install_dir} is not writable and sudo is unavailable"
    sudo mkdir -p "$install_dir"
    sudo cp "$tmp_binary" "${install_dir}/${BINARY_NAME}"
    sudo chmod 0755 "${install_dir}/${BINARY_NAME}"
  fi
}

install_binary
binary_path="${install_dir}/${BINARY_NAME}"

if [ "$os" = "Linux" ] && command -v systemctl >/dev/null 2>&1; then
  service_file="/etc/systemd/system/${SERVICE_NAME}.service"
  service_contents="[Unit]
Description=InfraVu resource monitoring agent
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
ExecStart=${binary_path}
Restart=on-failure
RestartSec=5
Environment=MONITOR_HOST=0.0.0.0
Environment=MONITOR_PORT=9100

[Install]
WantedBy=multi-user.target
"

  if [ -w /etc/systemd/system ]; then
    printf '%s' "$service_contents" > "$service_file"
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    if systemctl is-active --quiet "$SERVICE_NAME"; then
      systemctl restart "$SERVICE_NAME"
    else
      systemctl start "$SERVICE_NAME"
    fi
  else
    command -v sudo >/dev/null 2>&1 || fail "systemd service installation requires sudo"
    printf '%s' "$service_contents" | sudo tee "$service_file" >/dev/null
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
      sudo systemctl restart "$SERVICE_NAME"
    else
      sudo systemctl start "$SERVICE_NAME"
    fi
  fi

  log "installed ${binary_path}"
  log "systemd service ${SERVICE_NAME} is enabled, restarted, and running"
else
  log "installed ${binary_path}"
  log "macOS does not register the agent as a service; restart ${binary_path} if it was already running"
fi

log "agent endpoint: http://127.0.0.1:9100/api/resources"
