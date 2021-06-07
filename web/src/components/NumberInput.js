import React from 'react';
import PropTypes from 'prop-types';
import { InputNumber } from 'antd';

export default function NumberInput(props) {
  return (
    <div>
      <InputNumber onChange={props.onChange} defaultValue={props.value}
        min={props.min} max={props.max} />
    </div>
  );
}

NumberInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};
