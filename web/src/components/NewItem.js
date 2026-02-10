import React from 'react';
import { useState, } from 'react'
import PropTypes from 'prop-types';
import { Modal, Divider, Select, Input, Button, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Field from './Field.js'
import { Types } from '../Types.js';

export default function NewItem(props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState(Types[0].value);

  const handleClickOpen = () => {
    setName('');
    setOpen(true);
  };

  const onDone = () => {
    if (!name.trim())
      return;
    setOpen(false);
    props.onDone(type, name.trim());
  };

  const handleClose = () => {
    setOpen(false);
  };

  function onNameChange(ev) {
    setName(ev.target.value);
  }

  return (
    <div className={props.compact ? 'new-item new-item-compact' : 'new-item'}
      style={props.compact ? {} : { paddingRight: '20px' }}>
      <Button block={!props.compact} type={props.compact ? 'primary' : 'dashed'}
        shape={props.compact ? 'circle' : 'default'}
        size={props.compact ? 'small' : 'middle'}
        icon={<PlusOutlined />} onClick={handleClickOpen}
        style={props.compact ? {} : { marginLeft: 20 }} />
      <Modal title="New Item" open={open} onOk={onDone}
        okButtonProps={{ disabled: !name.trim() }}
        onCancel={handleClose}>
        <Row>
          <Col flex="auto">
            <Field title="Type">
              <Select style={{ width: "100%" }} options={Types}
                placeholder="Type" onChange={setType} value={type}/>
            </Field>
          </Col>
        </Row>
        <Divider />
        <Row>
          <Col flex="auto">
            <Field title="Name">
              <Input value={name} onChange={onNameChange} onPressEnter={onDone} />
            </Field>
          </Col>
        </Row>
      </Modal>
    </div>
  );
}

NewItem.propTypes = {
  onDone: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};
