import socket
import ipaddress


def net_family(net):
    if isinstance(ipaddress.ip_network(net, strict=False),
                  ipaddress.IPv6Network):
        return socket.AF_INET6
    return socket.AF_INET


def flag6(net):
    return '-6' if net_family(net) == socket.AF_INET6 else ''
