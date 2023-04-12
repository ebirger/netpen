import React from 'react';
import { useContext } from 'react'
import { Select } from 'antd';
import Context from '../Context.js'
import PropTypes from 'prop-types';
import Editor from "@monaco-editor/react";
import EbpfProgModel from '../models/EbpfProgModel.js'

export function EbpfProgList(props) {
  const ctx = useContext(Context);

  const opts = ctx.getObjsByType('ebpfprog').map((option) => (
    {label: option.displayName(), value: option.id}));

  /* make sure deleted items don't linger */
  let value = null;
  if (props.value && opts.find((o) => o.value == props.value))
    value = props.value;

  return (
    <Select onChange={props.onChange} options={opts} allowClear={true}
      placeholder="eBPF Program" style={{ width: '100%' }}
      value={value} />
  );
}

EbpfProgList.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default function EbpfProg(props) {
  const {id, name, type} = props.item;

  function setCode(newCode) {
    const model = new EbpfProgModel(id, name, type, newCode);
    props.onChange(model);
  }

  return (
    <Editor height="300px" defaultLanguage="c" value={props.item.code}
      onChange={setCode} />
  );
}

EbpfProg.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
