import React from 'react';
import { useContext, useState } from 'react'
import { Select, Modal, Row, Col, Button, Divider } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import Context from '../Context.js'
import PropTypes from 'prop-types';
import Editor from "@monaco-editor/react";
import EbpfProgModel from '../models/EbpfProgModel.js'
import Field from './Field.js'

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
  const {id, name, type, code, exampleType} = props.item;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const exampleTypes = [
    {label: "TC", value: "tc"},
    {label: "XDP", value: "xdp"}];

  function onEtChange(newType) {
    const model = new EbpfProgModel(id, name, type, code, newType);
    props.onChange(model);
  }

  function setCode(newCode) {
    const model = new EbpfProgModel(id, name, type, newCode, exampleType);
    props.onChange(model);
  }

  const et = exampleTypes.find((o) => o.value == exampleType);
  const etDisabled = !props.item.isExample();

  return (
    <>
      <Modal title={props.item.name} open={advancedOpen} footer={null}
        onCancel={() => setAdvancedOpen(false)} height="100vh" width="100vw">
        <>
          <Field title="Example Source">
            <Select options={exampleTypes} style={{ width: "100%" }}
              onChange={onEtChange} disabled={etDisabled} value={et} />
          </Field>
          <Divider />
          <Editor height="600px" width="100%" defaultLanguage="c"
            value={props.item.getCode()} onChange={setCode} />
        </>
      </Modal>
      <Row gutter={10}>
        <Col flex="auto">
          <Field title="Example Source">
            <Select options={exampleTypes} style={{ width: "100%" }}
              onChange={onEtChange} disabled={etDisabled} value={et} />
          </Field>
        </Col>
        <Col flex="none">
          <Button onClick={() => setAdvancedOpen(true)} icon={<FormOutlined />}
            type="link" />
        </Col>
      </Row>
      <Divider />
      <Editor height="300px" defaultLanguage="c" value={props.item.getCode()}
        onChange={setCode} />
    </>
  );
}

EbpfProg.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
