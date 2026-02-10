import React from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'antd';
import { CheckOutlined, ExclamationOutlined } from '@ant-design/icons';

function isValidIPv4(address) {
  const parts = address.split('.');
  if (parts.length !== 4)
    return false;
  return parts.every((part) => {
    if (!/^\d+$/.test(part))
      return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

function countIPv6Group(group) {
  if (group.includes('.'))
    return isValidIPv4(group) ? 2 : -1;
  if (!/^[0-9a-fA-F]{1,4}$/.test(group))
    return -1;
  return 1;
}

function isValidIPv6(address) {
  const parts = address.split('::');
  if (parts.length > 2)
    return false;

  const [left = '', right = ''] = parts;
  const leftGroups = left === '' ? [] : left.split(':');
  const rightGroups = right === '' ? [] : right.split(':');
  if (leftGroups.some((g) => g === '') || rightGroups.some((g) => g === ''))
    return false;

  let groupCount = 0;
  for (const g of leftGroups) {
    const c = countIPv6Group(g);
    if (c < 0)
      return false;
    groupCount += c;
  }
  for (const g of rightGroups) {
    const c = countIPv6Group(g);
    if (c < 0)
      return false;
    groupCount += c;
  }

  if (parts.length === 1)
    return groupCount === 8;
  return groupCount < 8;
}

function isValidCIDR(cidr) {
  const parts = cidr.split('/');
  if (parts.length !== 2)
    return false;
  const [address, prefixRaw] = parts;
  if (!/^\d+$/.test(prefixRaw))
    return false;
  const prefix = Number(prefixRaw);

  if (address.includes(':'))
    return isValidIPv6(address) && prefix >= 0 && prefix <= 128;
  return isValidIPv4(address) && prefix >= 0 && prefix <= 32;
}

export default function Cidr(props) {
  const [value, setValue] = useState(props.value);
  const [err, setErr] = useState(false);
  const suffix = err ? <ExclamationOutlined /> : <CheckOutlined />;

  function onCidrChange(ev) {
    const cidr = ev.target.value;

    setValue(cidr);
    const invalid = !isValidCIDR(cidr.toString());
    setErr(invalid);

    if (!invalid)
      props.onChange(cidr);
  }

  return (
    <Input onChange={onCidrChange} value={value} suffix={suffix} />
  );
}

Cidr.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
