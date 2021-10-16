import React from 'react';
import { useContext } from 'react'
import PropTypes from 'prop-types';
import { Radio } from 'antd';
import Context from '../Context.js'
import SubnetModel from '../models/SubnetModel.js'
import Cidr from './Cidr.js'
import ChipList from './ChipList.js';

export function SubnetList(props) {
  const ctx = useContext(Context);

  return (
    <ChipList title="Subnets" selections={ctx.getObjsByType('subnet')}
      value={props.value} onChange={props.onChange} />);
}

SubnetList.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
};

const CIDRS = ["198.51.100.0/24", "10.0.0.0/24", "192.168.1.0/24"];

export const defaultSubnet = new SubnetModel(null, "default", "subnet",
  CIDRS[0]);

export default function Subnet(props) {
  const cidr = props.item.cidr || CIDRS[0];
  const {id, name, type} = props.item;

  function setCidr(newCidr) {
    const model = new SubnetModel(id, name, type, newCidr);
    props.onChange(model);
  }

  function onValueChange(e) {
    const v = e.target.value;
    setCidr(v);
  }

  const isCustom = !CIDRS.includes(cidr);

  return (
    <Radio.Group onChange={onValueChange} value={cidr}>
      {CIDRS.map((c)=>(<Radio.Button key={c} value={c}>{c}</Radio.Button>))}
      <Radio.Button value={isCustom ? cidr : "172.16.0.0/24"}>
        Custom...
        {isCustom ? <Cidr key="cidr" value={cidr}
          onChange={setCidr} /> : null}
      </Radio.Button>
    </Radio.Group>
  );
}

Subnet.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
