import React from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'antd';
import { CheckOutlined, ExclamationOutlined } from '@ant-design/icons';
import { createCIDR } from 'ip6addr';
import Field from './Field.js';

export default function Cidr(props) {
  const [err, setErr] = useState(false);
  const suffix = err ? <ExclamationOutlined /> : <CheckOutlined />;

  function onCidrChange(ev) {
    const cidr = ev.target.value;

    props.onChange(cidr);
    let invalid = false;
    try {
      createCIDR(cidr.toString());
    } catch (e) {
      invalid = true;
    }
    setErr(invalid);
  }

  return (
    <Field title="CIDR">
      <Input onChange={onCidrChange} value={props.value} suffix={suffix} />
    </Field>
  );
}

Cidr.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
