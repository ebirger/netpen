import React from 'react'
import PropTypes from 'prop-types';
import { Select } from 'antd';
import Field from './Field.js'

export default function ChipList(props) {
  function onSelect(value) {
    props.onChange(value);
  }

  const filt = props.pred || (() => true);
  const opts = props.selections.filter(filt).map((option) => (
    {label: option.displayName(), value: option.id}));

  /* make sure deleted items don't linger */
  let value = [];
  if (props.value) {
    const allowedVals = opts.map((o) => o.value);
    value = props.value.filter((v) => allowedVals.includes(v)) || [];
  }

  return (
    <Field title={props.title}>
      <Select mode="multiple" allowClear style={{ width: '100%' }}
        placeholder={props.title} value={value}
        onChange={onSelect} options={opts}>
      </Select>
    </Field>
  );
}

ChipList.propTypes = {
  title: PropTypes.string.isRequired,
  selections: PropTypes.array.isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  pred: PropTypes.func,
};
