import React from 'react';
import { Typography, Space, Row, Col, Divider } from 'antd';
import PropTypes from 'prop-types';
import VethModel from '../models/VethModel.js'
import NetDevParams from './NetDevParams.js'
import Mtu from './Mtu.js'

const { Title } = Typography;

function VethDevSettings(props) {
  return (
    <>
      <Row>
        <Col span={24}>
          <Space style={{ float: 'left' }}>
            <Title level={5}>{props.title}</Title>
          </Space>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <NetDevParams {...props} />
        </Col>
      </Row>
    </>);
}

VethDevSettings.propTypes = {
  title: PropTypes.string.isRequired,
};

export default function Veth(props) {
  const {id, name, type, devparams1, devparams2} = props.item;
  const mtu = devparams1.mtu;

  function setDevParams1(newDevparams1) {
    newDevparams1.mtu = devparams2.mtu = mtu;
    const model = new VethModel(id, name, type, newDevparams1, devparams2);
    props.onChange(model);
  }

  function setDevParams2(newDevparams2) {
    devparams1.mtu = newDevparams2.mtu = mtu;
    const model = new VethModel(id, name, type, devparams1, newDevparams2);
    props.onChange(model);
  }

  function setMtu(newMtu) {
    devparams1.mtu = devparams2.mtu = newMtu;
    const model = new VethModel(id, name, type, devparams1, devparams2);
    props.onChange(model);
  }

  return (
    <>
      <VethDevSettings title='Device 1' onChange={setDevParams1} key="dev1"
        item={devparams1} hidemtu />
      <Divider />
      <VethDevSettings title='Device 2' onChange={setDevParams2} key="dev2"
        item={devparams2} hidemtu />
      <Divider />
      <Row gutter={10}>
        <Col flex='none'>
          <Mtu onChange={setMtu} value={mtu} />
        </Col>
      </Row>
    </>
  );
}

Veth.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
