import React from 'react';
import { useContext } from 'react'
import PropTypes from 'prop-types';
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

export default function Subnet(props) {
  const cidr = props.item.cidr || '';
  const {id, name, type} = props.item;

  function setCidr(newCidr) {
    const model = new SubnetModel(id, name, type, newCidr);
    props.onChange(model);
  }

  return (
    <Cidr key="col" value={cidr} onChange={setCidr} />
  );
}

Subnet.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
