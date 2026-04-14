# Tailscale Share Stack

This stack creates a separate Tailscale sidecar and a small nginx proxy that forwards to the already-running Shost app on host port `3088`.

It does not modify the main `docker-compose.yml` stack.

## What it does

- creates a dedicated Tailscale node for sharing Shost
- lets you enable private `Serve` or public `Funnel` only when you want it
- proxies requests to the Docker host on port `3088`

## Prerequisites

- the main Shost app must already be reachable on host port `3088`
- the Docker bridge gateway must be `172.17.0.1`; if your host uses a different bridge gateway, update `tailscale-share/nginx.conf`
- `/dev/net/tun` must exist on the host
- you need a Tailscale auth key
- MagicDNS and HTTPS must be enabled in your tailnet
- Funnel must be allowed by your tailnet policy if you want a public link

## Start

```bash
export TS_AUTHKEY='tskey-...'
export TS_SHARE_HOSTNAME='shost-share'
docker compose -f docker-compose.tailscale-share.yml up -d
```

## Enable private tailnet access

```bash
docker exec shost-tailscale-share tailscale serve --bg 8080
docker exec shost-tailscale-share tailscale serve status
```

`serve` means the app is only reachable by devices or users authenticated to your tailnet.

## Enable public access with Funnel

```bash
docker exec shost-tailscale-share tailscale funnel --bg 8080
docker exec shost-tailscale-share tailscale funnel status
```

`funnel` means the app is reachable on the public internet through the node's `*.ts.net` name.

## Toggle modes with the helper script

```bash
bash scripts/tailscale-share-mode.sh serve
bash scripts/tailscale-share-mode.sh funnel
bash scripts/tailscale-share-mode.sh off
bash scripts/tailscale-share-mode.sh status
```

## Get the URL

```bash
docker exec shost-tailscale-share tailscale status
```

The share URL will be the node's `*.ts.net` name.

## Disable sharing without tearing down the sidecar

```bash
docker exec shost-tailscale-share tailscale funnel reset
docker exec shost-tailscale-share tailscale serve reset
```

## Stop

```bash
docker compose -f docker-compose.tailscale-share.yml down
```

To remove the saved Tailscale node state too:

```bash
rm -rf tailscale-share/state
```

## Notes

- this share stack only exposes the dashboard reachable on host port `3088`
- it does not directly expose your other Docker services
- the dashboard UI still contains inventory links pointing at your existing `mattmariani.com` services
- if you want a cleaner demo surface, create a share-specific inventory file or hide outbound links in the app
