import React from 'react';
import { useState, } from 'react'
import PropTypes from 'prop-types';
import { Modal, Divider, Select, Input, Button, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Field from './Field.js'
import { Types } from '../Types.js';

export default function NewItem(props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(false);
  const [type, setType] = useState(Types[0].value);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const onDone = () => {
    if (!name || name === '')
      return;
    setOpen(false);
    props.onDone(type, name);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function onNameChange(ev) {
    setName(ev.target.value);
  }

  return (
    <div style={{ paddingRight: '20px' }} className="new-item">
      <Button block type="dashed" icon={<PlusOutlined />}
        onClick={handleClickOpen}
        style={{ marginLeft: 20 }} />
      <Modal title="New Item" visible={open} onOk={onDone}
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
              <Input onChange={onNameChange} />
            </Field>
          </Col>
        </Row>
      </Modal>
    </div>
  );
}

NewItem.propTypes = {
  onDone: PropTypes.func.isRequired,
};
