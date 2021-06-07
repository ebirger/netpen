import React from 'react';
import PropTypes from 'prop-types';
import { Divider } from 'antd';
import MacVlanModel from '../models/MacVlanModel.js';
import NetDevParams, {L2Devices} from './NetDevParams.js';

export default function MacVlan(props) {
  const {id, name, type, link, devparams} = props.item;

  function setLink(newLink) {
    const model = new MacVlanModel(id, name, type, newLink, devparams);
    props.onChange(model);
  }

  function setDevParams(newDevparams) {
    if (!link)
      return;
    const model = new MacVlanModel(id, name, type, link, newDevparams);
    props.onChange(model);
  }

  return (
    <>
      <L2Devices onChange={setLink} id="link" label="Link Device"
        value={link} />
      <Divider />
      <NetDevParams key="dev" onChange={setDevParams} item={devparams} />
    </>
  );
}

MacVlan.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
