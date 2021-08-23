import React from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'antd';
import { CheckOutlined, ExclamationOutlined } from '@ant-design/icons';
import { createCIDR } from 'ip6addr';
import Field from './Field.js';

export default function Cidr(props) {
  const [value, setValue] = useState(props.value);
  const [err, setErr] = useState(false);
  const suffix = err ? <ExclamationOutlined /> : <CheckOutlined />;

  function onCidrChange(ev) {
    const cidr = ev.target.value;

    setValue(cidr);
    let invalid = false;
    try {
      createCIDR(cidr.toString());
    } catch (e) {
      invalid = true;
    }
    setErr(invalid);

    if (!invalid)
      props.onChange(cidr);
  }

  return (
    <Field title="CIDR">
      <Input onChange={onCidrChange} value={value} suffix={suffix} />
    </Field>
  );
}

Cidr.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
