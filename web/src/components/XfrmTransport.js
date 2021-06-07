import React from 'react';
import PropTypes from 'prop-types';
import XfrmTransportModel from '../models/XfrmTransportModel.js';
import { L3Devices } from './NetDevParams.js';
import Field from './Field.js';

export default function XfrmTransport(props) {
  const link1 = props.item.link1 || '';
  const link2 = props.item.link2 || '';
  const {id, name, type} = props.item;

  function setLink1(newLink1) {
    const model = new XfrmTransportModel(id, name, type, newLink1, link2);
    props.onChange(model);
  }

  function setLink2(newLink2) {
    const model = new XfrmTransportModel(id, name, type, link1, newLink2);
    props.onChange(model);
  }

  return (
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
  );
}

XfrmTransport.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
