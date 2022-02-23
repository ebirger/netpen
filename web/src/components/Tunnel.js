import React from 'react';
import { useState, useContext } from 'react'
import PropTypes from 'prop-types';
import { Select, Divider, Button, Modal, Row, Col, Space, Typography } from 'antd';
import TunnelModel, { TunnelTypes, XfrmTunnelModes, TunnelDeviceParams } from '../models/TunnelModel.js';
import { SubnetList } from './Subnet.js';
import { L3Devices } from './NetDevParams.js';
import { NsList } from './NetNs.js';
import Mtu from './Mtu.js';
import Field from './Field.js';
import Context from '../Context.js';

const { Title } = Typography;

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

function TunnelDeviceAdvanced(props) {
  const mode = props.devParams ? props.devParams.mode : null;
  const netns = props.devParams ? props.devParams.netns : null;
  const mtu = props.devParams ? props.devParams.mtu : null;

  function onTunnelModeChange(newTunnelMode) {
    const p = new TunnelDeviceParams(newTunnelMode, netns, mtu);
    props.onDevParamsChange(p);
  }

  function onNetnsChange(newNetns) {
    const p = new TunnelDeviceParams(mode, newNetns, mtu);
    props.onDevParamsChange(p);
  }

  function onMtuChange(newMtu) {
    const p = new TunnelDeviceParams(mode, netns, newMtu);
    props.onDevParamsChange(p);
  }

  return (
    <>
      <Row>
        <Col span={24}>
          <Space style={{ float: 'left' }}>
            <Title level={5}>{props.title}</Title>
          </Space>
        </Col>
      </Row>
      {props.tunnelMode === "xfrm" ?
        <Row>
          <Col span={24}>
            <XfrmTunnelMode title="Mode" onChange={onTunnelModeChange}
              mode={mode} />
          </Col>
        </Row> :
        []
      }
      <Row>
        <Col span={24}>
          <NsList id='netns' value={netns} onChange={onNetnsChange} />
        </Col>
      </Row>
      <Mtu onChange={onMtuChange} value={mtu} />
    </>
  );
}

TunnelDeviceAdvanced.propTypes = {
  title: PropTypes.string.isRequired,
  devParams: PropTypes.object.isRequired,
  tunnelMode: PropTypes.string.isRequired,
  onDevParamsChange: PropTypes.func.isRequired,
};


function TunnelAdvanced(props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <>
      <Modal title="Advanced" visible={advancedOpen} footer={null}
        onCancel={() => setAdvancedOpen(false)}>
        <TunnelDeviceAdvanced title="Device 1"
          tunnelMode={props.mode} devParams={props.dev1Params}
          onDevParamsChange={props.onDev1ParamsChange} />
        <Divider />
        <TunnelDeviceAdvanced title="Device 2"
          tunnelMode={props.mode} devParams={props.dev2Params}
          onDevParamsChange={props.onDev2ParamsChange} />
      </Modal>
      <Button onClick={() => setAdvancedOpen(true)} type="link">
        Advanced
      </Button>
    </>
  );
}

TunnelAdvanced.propTypes = {
  mode: PropTypes.string.isRequired,
  dev1Params: PropTypes.object.isRequired,
  dev2Params: PropTypes.object.isRequired,
  onDev1ParamsChange: PropTypes.func.isRequired,
  onDev2ParamsChange: PropTypes.func.isRequired,
};

export default function Tunnel(props) {
  const ctx = useContext(Context);
  const subnets = props.item.subnets || [];
  const link1 = props.item.link1 || '';
  const link2 = props.item.link2 || '';
  const dev1Params = props.item.dev1Params || null;
  const dev2Params = props.item.dev2Params || null;
  const {id, name, type, mode} = props.item;

  function setMode(newMode) {
    const model = new TunnelModel(id, name, type, newMode, subnets,
      link1, link2, dev1Params, dev2Params, ctx.getItemById);
    props.onChange(model);
  }

  function setSubnets(newSubnets) {
    const model = new TunnelModel(id, name, type, mode, newSubnets,
      link1, link2, dev1Params, dev2Params, ctx.getItemById);
    props.onChange(model);
  }

  function setLink1(newLink1) {
    const model = new TunnelModel(id, name, type, mode, subnets,
      newLink1, link2, dev1Params, dev2Params, ctx.getItemById);
    props.onChange(model);
  }

  function setLink2(newLink2) {
    const model = new TunnelModel(id, name, type, mode, subnets,
      link1, newLink2, dev1Params, dev2Params, ctx.getItemById);
    props.onChange(model);
  }

  function setDev1Params(newDev1Params) {
    const model = new TunnelModel(id, name, type, mode, subnets,
      link1, link2, newDev1Params, dev2Params, ctx.getItemById);
    props.onChange(model);
  }

  function setDev2Params(newDev2Params) {
    const model = new TunnelModel(id, name, type, mode, subnets,
      link1, link2, dev1Params, newDev2Params, ctx.getItemById);
    props.onChange(model);
  }

  return (
    <>
      <>
        <Row>
          <Col flex="auto">
            <TunnelMode onChange={setMode} mode={mode} />
          </Col>
          <Col flex="none">
            <TunnelAdvanced onDev1ParamsChange={setDev1Params}
              onDev2ParamsChange={setDev2Params}
              dev1Params={dev1Params} dev2Params={dev2Params}
              mode={mode} />
          </Col>
        </Row>
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
      </>
    </>
  );
}

Tunnel.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
