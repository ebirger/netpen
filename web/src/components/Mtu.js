import React from 'react';
import PropTypes from 'prop-types';
import NumberInput from './NumberInput.js'
import Field from './Field.js'

export default function Mtu(props) {
  return (
    <Field title="MTU">
      <NumberInput value={props.value} onChange={props.onChange}
        label="MTU" min={576} max={9000} />
    </Field>);
}

Mtu.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};
