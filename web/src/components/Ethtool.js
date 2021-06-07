import React from 'react';
import PropTypes from 'prop-types';
import { Select, Collapse } from 'antd';
import Field from './Field.js';
import EthtoolModel, { EthtoolOptions } from '../models/EthtoolModel.js';

const { Panel } = Collapse;

const EthtoolValues = [
  {label: "Default", value: null},
  {label: "On", value: 'on'},
  {label: "Off", value: 'off'},
];

export default function Ethtool(props) {
  function optionChanged(option, value) {
    let copy = {...props.value.options};

    copy[option] = value;
    props.onChange(new EthtoolModel(copy));
  }

  return (
    <Collapse>
      <Panel header="Features">
        {EthtoolOptions.map((o) => (
          <Field key={o.key} title={o.title}>
            <Select options={EthtoolValues} style={{width: '100%'}}
              onChange={(v) => optionChanged(o.key, v)}
              value={props.value.options[o.key]}
              defaultValue={props.value.options[o.key] || null} />
          </Field>))}
      </Panel>
    </Collapse>
  );
}

Ethtool.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
