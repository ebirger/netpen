import React from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Modal } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import Field from './Field.js';

export default function Settings(props) {
  const [open, setOpen] = React.useState(false);
  const [settings, setSettings] = React.useState(props.settings)

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function onDone() {
    props.onChange(settings);
    handleClose();
  }

  function onTitleChange(ev) {
    let copy = {...settings};
    copy.title = ev.target.value;
    setSettings(copy);
  }

  return (
    <>
      <Button type="primary" icon={<SettingOutlined />}
        onClick={handleClickOpen}>
        Settings
      </Button>
      <Modal title="Settings" visible={open} onOk={onDone}
        onCancel={handleClose}>
        <Field title="Title">
          <Input onChange={onTitleChange} value={settings.title} />
        </Field>
      </Modal>
    </>
  );
}

Settings.propTypes = {
  settings: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
