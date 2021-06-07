import React from 'react';
import PropTypes from 'prop-types';
import DummyModel from '../models/DummyModel.js';
import NetDevParams from './NetDevParams.js';

export default function Dummy(props) {
  const {id, name, type, devparams} = props.item;

  function setDevParams(newDevparams) {
    if (!newDevparams.netns)
      return;
    const model = new DummyModel(id, name, type, newDevparams);
    props.onChange(model);
  }

  return (
    <NetDevParams key="dev" onChange={setDevParams} item={devparams} />
  );
}

Dummy.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
