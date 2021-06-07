import React from 'react';
import { useContext } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Select } from 'antd';
import Context from '../Context.js';
import Field from './Field.js'
import NetNsModel from '../models/NetNsModel.js';

export function NsList(props) {
  const ctx = useContext(Context);

  const opts = ctx.getObjsByType('netns').map((option) => (
    {label: option.displayName(), value: option.id}));

  /* make sure deleted items don't linger */
  let value = null;
  if (props.value && opts.find((o) => o.value == props.value))
    value = props.value;

  return (
    <Field title="Namespace">
      <Select onChange={props.onChange} options={opts}
        placeholder="Network Namespace" style={{ width: '100%' }}
        value={value} disabled={props.disabled} />
    </Field>
  );
}

NsList.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default function NetNs(props) {
  const netserver = props.item.netserver || false;
  const forwarding = props.item.forwarding === false ? false : true;
  const {id, name, type} = props.item;

  function setNetServer(ev) {
    const newNetServer = ev.target.checked;
    const model = new NetNsModel(id, name, type, newNetServer, forwarding);
    props.onChange(model);
  }

  function setForwarding(ev) {
    const newForwarding = ev.target.checked;
    const model = new NetNsModel(id, name, type, netserver, newForwarding);
    props.onChange(model);
  }

  return (
    <>
      <Checkbox checked={forwarding} onChange={setForwarding}>
        Forwarding
      </Checkbox>
      <Checkbox checked={netserver} onChange={setNetServer}>
        Run netserver
      </Checkbox>
    </>
  );
}

NetNs.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
