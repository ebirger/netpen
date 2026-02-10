import React from 'react';
import { useState, useContext } from 'react'
import PropTypes from 'prop-types';
import { Select, Row, Col, Button, Modal, Divider } from 'antd';
import Context from '../Context.js';
import NetDevParamsModel from '../models/NetDevParamsModel.js';
import EthtoolModel from '../models/EthtoolModel.js';
import ChipList from './ChipList.js';
import {NsList} from './NetNs.js';
import {SubnetList} from './Subnet.js';
import Mtu from './Mtu.js';
import Ethtool from './Ethtool.js';
import Field from './Field.js'
import {EbpfProgList} from './EbpfProg.js'

function DeviceList(props) {
  const filt = props.pred || (() => true);
  const opts = props.devlist.filter(filt).map((option) => (
    {label: option.displayName(), value: option.id}
  ));

  /* make sure deleted items don't linger */
  let value = null;
  if (props.value && opts.find((o) => o.value == props.value))
    value = props.value;

  return (
    <Select onChange={props.onChange} options={opts}
      placeholder={props.label} style={{ width: '100%' }}
      value={value} />
  );
}

const devListPropTypesCommon = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  pred: PropTypes.func,
};

DeviceList.propTypes = {
  devlist: PropTypes.array.isRequired,
  ...devListPropTypesCommon
};

export function L3Devices(props) {
  const ctx = useContext(Context);
  return <DeviceList devlist={ctx.getL3Devs()} {...props} />;
}

L3Devices.propTypes = devListPropTypesCommon;

export function L2Devices(props) {
  const ctx = useContext(Context);
  return <DeviceList devlist={ctx.getL2Devs()} {...props} />;
}

L2Devices.propTypes = devListPropTypesCommon;

export function NetDevSet(props) {
  const ctx = useContext(Context);

  return (
    <ChipList title={props.title} selections={ctx.getL2Devs()}
      value={props.value} onChange={props.onChange}
      pred={props.pred} />);
}

NetDevSet.propTypes = {
  title: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.array,
  pred: PropTypes.func,
};

export default function NetDevParams(props) {
  const netns = props.item.netns || '';
  const xdp = props.item.xdp || '';
  const tc = props.item.tc || {};
  const ethtool = props.item.ethtool || new EthtoolModel({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const {id, name, type, subnets, mtu} = props.item;

  function setSubnets(newSubnets) {
    const model = new NetDevParamsModel(id, name, type, netns, newSubnets, mtu,
      ethtool, xdp, tc);
    props.onChange(model);
  }

  function setNetNs(newNetNs) {
    const model = new NetDevParamsModel(id, name, type, newNetNs, subnets, mtu,
      ethtool, xdp, tc);
    props.onChange(model);
  }

  function setXdp(newXdp) {
    const model = new NetDevParamsModel(id, name, type, netns, subnets, mtu,
      ethtool, newXdp, tc);
    props.onChange(model);
  }

  function setTcIngress(newTcIng) {
    let newTc = { ...tc, tcIngress: newTcIng };
    const model = new NetDevParamsModel(id, name, type, netns, subnets, mtu,
      ethtool, xdp, newTc);
    props.onChange(model);
  }

  function setTcEgress(newTcEg) {
    let newTc = { ...tc, tcEgress: newTcEg };
    const model = new NetDevParamsModel(id, name, type, netns, subnets, mtu,
      ethtool, xdp, newTc);
    props.onChange(model);
  }

  function setEthtool(newEthtool) {
    const model = new NetDevParamsModel(id, name, type, netns, subnets, mtu,
      newEthtool, xdp, tc);
    props.onChange(model);
  }

  function setMtu(newMtu) {
    const model = new NetDevParamsModel(id, name, type, netns, subnets,
      newMtu, ethtool, xdp, tc);
    props.onChange(model);
  }

  return (
    <>
      <Modal title={props.item.name} open={advancedOpen} footer={null}
        onCancel={() => setAdvancedOpen(false)}>
        {props.hidemtu ? [] : <Col flex="none">
          <Mtu onChange={setMtu} value={mtu} />
          <Divider />
        </Col>}
        <Ethtool value={ethtool} onChange={setEthtool} />
        <Divider />
        <Field title="XDP">
          <EbpfProgList id='xdp' value={xdp} onChange={setXdp} />
        </Field>
        <Field title="TC Ingress">
          <EbpfProgList id='tc_ing' value={tc.tcIngress}
            onChange={setTcIngress} />
        </Field>
        <Field title="TC Egress">
          <EbpfProgList id='tc_eg' value={tc.tcEgress}
            onChange={setTcEgress} />
        </Field>
      </Modal>
      <Row gutter={10}>
        <Col flex="auto">
          <NsList id='netns' value={netns} onChange={setNetNs}
            disabled={props.disableNsChange} />
        </Col>
        <Col flex="none">
          <Button onClick={() => setAdvancedOpen(true)} type="link">
            Advanced
          </Button>
        </Col>
      </Row>
      <Row>
        <Col flex="auto">
          <SubnetList onChange={setSubnets} id='subnets' value={subnets} />
        </Col>
      </Row>
    </>);
}

NetDevParams.propTypes = {
  onChange: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired,
  hidemtu: PropTypes.bool,
  disableNsChange: PropTypes.bool,
};
