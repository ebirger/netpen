import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'antd';
import TeamModel from '../models/TeamModel.js';
import Field from './Field.js';
import NetDevParams, { NetDevSet } from './NetDevParams.js';

const modeTypes = [
  {label: 'Round Robin', value: 'roundrobin'},
  {label: 'Broadcast', value: 'broadcast'},
  {label: 'Random', value: 'random'},
];

function Mode(props) {
  return (
    <Field title="Mode">
      <Select value={props.value} options={modeTypes} onChange={props.onChange}
        defaultValue={modeTypes[0].value} style={{ width: '100%' }} />
    </Field>
  );
}

Mode.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default function Team(props) {
  const ports = props.item.ports || [];
  const mode = props.item.mode || '';
  const {id, name, type, devparams} = props.item;

  function setPorts(newPorts) {
    const model = new TeamModel(id, name, type, newPorts, mode, devparams);
    props.onChange(model);
  }

  function setMode(newMode) {
    const model = new TeamModel(id, name, type, ports, newMode, devparams);
    props.onChange(model);
  }

  function setDevParams(newDevparams) {
    const model = new TeamModel(id, name, type, ports, mode, newDevparams);
    props.onChange(model);
  }

  const disableNsChange = ports.length > 0;

  return (
    <>
      <NetDevParams key="netdev" onChange={setDevParams} item={devparams}
        disableNsChange={disableNsChange} />
      <NetDevSet title="Ports" key="portlist" onChange={setPorts}
        value={ports} pred={(d) => d.netns == devparams.netns} />
      <Mode value={mode} onChange={setMode} />
    </>
  );
}

Team.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
