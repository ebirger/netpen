import React from 'react';
import { useContext } from 'react'
import PropTypes from 'prop-types';
import { Select, Divider } from 'antd';
import TunnelModel, { TunnelTypes, XfrmTunnelModes } from '../models/TunnelModel.js';
import { SubnetList } from './Subnet.js';
import { L3Devices } from './NetDevParams.js';
import Field from './Field.js';
import Context from '../Context.js';

function XfrmTunnelMode(props) {
  return (
    <Field title={props.title}>
      <Select onChange={props.onChange} options={XfrmTunnelModes}
        placeholder={props.title} style={{ width: '100%' }}
        defaultValue={props.mode} />
    </Field>
  );
}

XfrmTunnelMode.propTypes = {
  title: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  mode: PropTypes.string,
};

function TunnelMode(props) {
  return (
    <Field title="Type">
      <Select onChange={props.onChange} options={TunnelTypes}
        placeholder="Tunnel Type" style={{ width: '100%' }}
        defaultValue={props.mode} />
    </Field>
  );
}

TunnelMode.propTypes = {
  onChange: PropTypes.func.isRequired,
  mode: PropTypes.string,
};

export default function Tunnel(props) {
  const ctx = useContext(Context);
  const subnets = props.item.subnets || [];
  const link1 = props.item.link1 || '';
  const link2 = props.item.link2 || '';
  const {id, name, type, mode, dev1Mode, dev2Mode} = props.item;

  function setMode(newMode) {
    const model = new TunnelModel(id, name, type, newMode, subnets,
      link1, link2, dev1Mode, dev2Mode, ctx.getItemById);
    props.onChange(model);
  }

  function setSubnets(newSubnets) {
    const model = new TunnelModel(id, name, type, mode, newSubnets,
      link1, link2, dev1Mode, dev2Mode, ctx.getItemById);
    props.onChange(model);
  }

  function setLink1(newLink1) {
    const model = new TunnelModel(id, name, type, mode, subnets,
      newLink1, link2, dev1Mode, dev2Mode, ctx.getItemById);
    props.onChange(model);
  }

  function setLink2(newLink2) {
    const model = new TunnelModel(id, name, type, mode, subnets,
      link1, newLink2, dev1Mode, dev2Mode, ctx.getItemById);
    props.onChange(model);
  }

  function setDev1Mode(newDev1Mode) {
    const model = new TunnelModel(id, name, type, mode, subnets,
      link1, link2, newDev1Mode, dev2Mode, ctx.getItemById);
    props.onChange(model);
  }

  function setDev2Mode(newDev2Mode) {
    const model = new TunnelModel(id, name, type, mode, subnets,
      link1, link2, dev1Mode, newDev2Mode, ctx.getItemById);
    props.onChange(model);
  }

  const XfrmModes = (
    <>
      <Divider />
      <>
        <XfrmTunnelMode title="Device 1 Mode" onChange={setDev1Mode}
          mode={dev1Mode} />
        <XfrmTunnelMode title="Device 2 Mode" onChange={setDev2Mode}
          mode={dev2Mode} />
      </>
    </>);

  return (
    <>
      <>
        <TunnelMode onChange={setMode} mode={mode} />
        <SubnetList onChange={setSubnets} id="subnets" value={subnets} />
      </>
      <Divider />
      <>
        <Field title="Link1">
          <L3Devices onChange={setLink1} id="link1" label="Underlay Device 1"
            value={link1} />
        </Field>
        <Field title="Link2">
          <L3Devices onChange={setLink2} id="link2" label="Underlay Device 2"
            value={link2} />
        </Field>
        {mode === "xfrm" ? XfrmModes : <span />}
      </>
    </>
  );
}

Tunnel.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
