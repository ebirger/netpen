import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'antd';
import VrfModel from '../models/VrfModel.js';
import NetDevParams, { NetDevSet } from './NetDevParams.js';

export default function Vrf(props) {
  const ports = props.item.ports || [];
  const defUnreach = props.item.default_unreach === false ? false : true;
  const {id, name, type, devparams} = props.item;

  function setPorts(newPorts) {
    const model = new VrfModel(id, name, type, newPorts, defUnreach, devparams);
    props.onChange(model);
  }

  function setDevParams(newDevparams) {
    if (!ports)
      return;
    const model = new VrfModel(id, name, type, ports, defUnreach, newDevparams);
    props.onChange(model);
  }

  function setDefUnreach(ev) {
    if (!ports)
      return;
    const newDefUnreach = ev.target.checked;
    const model = new VrfModel(id, name, type, ports, newDefUnreach, devparams);
    props.onChange(model);
  }

  const disableNsChange = ports.length > 0;

  return (
    <>
      <NetDevParams key="netdev" onChange={setDevParams} item={devparams}
        disableNsChange={disableNsChange} />
      <NetDevSet title="Members" key="portlist" onChange={setPorts}
        value={ports} pred={(d) => d.netns == devparams.netns} />
      <Checkbox checked={defUnreach} onChange={setDefUnreach}>
        Add Default Unreachable Route
      </Checkbox>
    </>
  );
}

Vrf.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
