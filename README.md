# Netpen

[![System Tests](https://github.com/ebirger/netpen/actions/workflows/system-tests.yml/badge.svg)](https://github.com/ebirger/netpen/actions/workflows/system-tests.yml)
[![Validation Tests](https://github.com/ebirger/netpen/actions/workflows/validation-tests.yml/badge.svg)](https://github.com/ebirger/netpen/actions/workflows/validation-tests.yml)
[![Web Tests](https://github.com/ebirger/netpen/actions/workflows/web-tests.yml/badge.svg)](https://github.com/ebirger/netpen/actions/workflows/web-tests.yml) [![Join the chat at https://gitter.im/netpen-io/community](https://badges.gitter.im/netpen-io/community.svg)](https://gitter.im/netpen-io/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Visual editor and API for network environments script generation

Creating network environment scripts for new feature testing
or bug reproduction can be cumbersome - defining network namespaces,
setting up different network interfaces types, assigning addresses,
configuring routes, vrfs, etc..

Using this project one can visually define network netspaces, veth devices,
different tunneling devices, etc. and generates bash scripts usable on fresh
VMs which include the necessary configuration including address assignments
and routes.

:warning: These scripts are **NOT** intended for a production environments.

## Current Item Types
- Network Namespace
- VETH
- Bridge
- VLAN
- MACVLAN
- Team
- XFRM transport
- Tunnels:
  - XFRM
  - IPIP
  - VXLAN
  - GRE
  - WireGuard
  - L2TP
- Virtual Routing and Forwarding (VRF)
- eBPF Program

## Examples

### Simple Router

![Simple Router](/examples/router.png?raw=true)

The resulting script will create three network namespaces - "a", "b", and "router".

Running on a fresh VM:

```bash
root@(none):/# ./netpen.sh
 ____                 _
|  _ \   ___   _   _ | |_   ___  _ __
| |_) | / _ \ | | | || __| / _ \| '__|
|  _ < | (_) || |_| || |_ |  __/| |
|_| \_\ \___/  \__,_| \__| \___||_|


+-----------+------------------------------------+
| Namespace | IPv4                               |
+-----------+------------------------------------+
|     a     | 198.51.100.130/25 (atorouter.dev1) |
+-----------+------------------------------------+
|     b     | 198.51.100.2/25 (btorouter.dev1)   |
+-----------+------------------------------------+
|   router  | 198.51.100.129/25 (atorouter.dev2) |
|           | 198.51.100.1/25 (btorouter.dev2)   |
+-----------+------------------------------------+
net.ipv4.route.mtu_expires = 15
net.ipv4.conf.all.forwarding = 1
net.ipv6.conf.all.forwarding = 2
net.ipv4.conf.all.forwarding = 1
net.ipv6.conf.all.forwarding = 2
net.ipv4.conf.all.forwarding = 1
net.ipv6.conf.all.forwarding = 2
[   10.578767] ip (1451) used greatest stack depth: 12224 bytes left
[   10.769523] random: crng init done
[   10.777003] IPv6: ADDRCONF(NETDEV_CHANGE): atorouter.dev1: link becomes ready
[   10.923704] ip (1460) used greatest stack depth: 12096 bytes left
[   11.121881] IPv6: ADDRCONF(NETDEV_CHANGE): btorouter.dev1: link becomes ready
root@(none):/# [   11.578224] IPv6: ADDRCONF(NETDEV_CHANGE): atorouter.dev2: link becomes ready

root@(none):/# ip netns exec a ping 198.51.100.2
PING 198.51.100.1 (198.51.100.2) 56(84) bytes of data.
64 bytes from 198.51.100.2: icmp_seq=1 ttl=63 time=7.00 ms
64 bytes from 198.51.100.2: icmp_seq=2 ttl=63 time=0.956 ms
```

## Run Locally

Clone the project

```bash
  git clone https://github.com/ebirger/netpen.git
```

Go to the project directory

```bash
  cd netpen
```

Start the servers

```bash
  make dev
```

This will bring up a local docker-compose based environment. You can then browse to http://localhost:8199/

(Optional) Rebuild the Docker images after modifying if needed

```bash
  make build-dev
```

## Running Tests

### Validation Tests

These test perform basic validation such as code linting.
To run them, use the following command:

```bash
  make validation-tests
```

### System Tests

These tests perform functional validation of the backend logic.

To run them, use the following command:

```bash
  make system-tests
```

## API Reference

#### Generate BASH script

```http
  POST /v1/bash
```

| Parameter | Type     | Description                                             |
| :-------- | :------- | :------------------------------------------------------ |
| `body`    | `string` | **Required**. YAML file describing the network topology |

You can try this using cURL:

```bash
curl --data-binary "@examples/router.yml" https://api.netpen.io/v1/bash
```

Or HTTPie:

```bash
cat ./examples/router.yml | http POST https://api.netpen.io/v1/bash
```

#### Generate Graphviz DOT document

```http
  POST /v1/dot
```

| Parameter | Type     | Description                                             |
| :-------- | :------- | :------------------------------------------------------ |
| `body`    | `string` | **Required**. YAML file describing the network topology |

You can pipe this via Graphviz, for example:

```bash
curl --data-binary "@examples/router.yml" https://api.netpen.io/v1/dot | dot -Tpng | display
```

## Tech Stack

**Frontend:** React, antd

**Backend:** Python, Flask (local) / AWS API GW & Lambda (deployed)

## Logo

Logo design by [Amir Rave](https://github.com/amirave)

## License

[MIT](https://choosealicense.com/licenses/mit/)
