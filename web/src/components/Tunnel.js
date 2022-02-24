import React from 'react';
import { useState, useContext } from 'react'
import PropTypes from 'prop-types';
import { Select, Divider, Button, Modal, Row, Col, Space, Typography } from 'antd';
import TunnelModel, { TunnelTypes, XfrmTunnelModes, TunnelParams, TunnelDeviceParams } from '../models/TunnelModel.js';
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
  const devParams = props.devParams ? props.devParams : {};

  function onChange(change) {
    const p = new TunnelDeviceParams({...devParams, ...change});
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
            <XfrmTunnelMode title="Mode" mode={devParams.mode} />
              onChange={(mode)=>onChange({mode: mode})}
          </Col>
        </Row> :
        []
      }
      <Row>
        <Col span={24}>
          <NsList id='netns' value={devParams.netns}
            onChange={(netns)=>onChange({netns: netns})} />
        </Col>
      </Row>
      <Mtu onChange={(mtu)=>onChange({mtu: mtu})} value={devParams.mtu} />
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
  const tunnelParams = new TunnelParams(props.item);
  const {id, name, type} = props.item;

  function onChange(change) {
    const params = {...tunnelParams, ...change};
    const model = new TunnelModel(id, name, type, params, ctx.getItemById);
    props.onChange(model);
  }

  return (
    <>
      <>
        <Row>
          <Col flex="auto">
            <TunnelMode onChange={(mode)=>onChange({mode: mode})}
              mode={tunnelParams.mode} />
          </Col>
          <Col flex="none">
            <TunnelAdvanced
              onDev1ParamsChange={
                (dev1Params)=>onChange({dev1Params: dev1Params})
              }
              onDev2ParamsChange={
                (dev2Params)=>onChange({dev2Params: dev2Params})
              }
              dev1Params={tunnelParams.dev1Params}
              dev2Params={tunnelParams.dev2Params}
              mode={tunnelParams.mode} />
          </Col>
        </Row>
        <SubnetList onChange={(subnets)=>onChange({subnets: subnets})}
          id="subnets" value={tunnelParams.subnets} />
      </>
      <Divider />
      <>
        <Field title="Link1">
          <L3Devices onChange={(l1)=>onChange({link1: l1})} id="link1"
            label="Underlay Device 1" value={tunnelParams.link1} />
        </Field>
        <Field title="Link2">
          <L3Devices onChange={(l2)=>onChange({link2: l2})} id="link2"
            label="Underlay Device 2" value={tunnelParams.link2} />
        </Field>
      </>
    </>
  );
}

Tunnel.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
