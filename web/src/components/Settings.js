import React from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Modal, Checkbox, Divider } from 'antd';
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

  function onFailOnErrChange(ev) {
    let copy = {...settings};
    copy.fail_on_error = ev.target.checked;
    setSettings(copy);
  }

  function onVerboseChange(ev) {
    let copy = {...settings};
    copy.verbose = ev.target.checked;
    setSettings(copy);
  }

  function failOnErr() {
    return settings.fail_on_error === undefined ? true : settings.fail_on_error;
  }

  return (
    <>
      <Button type="primary" icon={<SettingOutlined />}
        onClick={handleClickOpen}>
        Settings
      </Button>
      <Modal title="Settings" open={open} onOk={onDone}
        onCancel={handleClose}>
        <Field title="Title">
          <Input onChange={onTitleChange} value={settings.title} />
        </Field>
        <Divider />
        <Checkbox checked={failOnErr()} onChange={onFailOnErrChange}>
          Fail on Error
        </Checkbox>
        <Checkbox checked={settings.verbose} onChange={onVerboseChange}>
          Verbose
        </Checkbox>
      </Modal>
    </>
  );
}

Settings.propTypes = {
  settings: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
