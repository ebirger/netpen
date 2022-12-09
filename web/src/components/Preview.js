import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import Editor from "@monaco-editor/react";
import { API_BASE } from '../consts.js';

const bashUrl = API_BASE + 'v1/bash';

export default function Preview(props) {
  const [open, setOpen] = React.useState(false);
  const [lastVal, setLastVal] = React.useState(undefined);
  const editorRef = React.useRef(null);
  const editorOpts = {readOnly: true, minimap: {enabled: false},
    lineNumbers: false, renderWhitespace: "none", folding: false,
    stickyTabStops: false};

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    if (lastVal)
      editorRef.current.setValue(lastVal);
  }

  function getBash(data) {
    const requestMetadata = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    };

    fetch(bashUrl, requestMetadata).then(res => res.text())
      .then(o => {
        if (editorRef && editorRef.current) {
          editorRef.current.setValue(o);
          setLastVal(undefined);
        } else {
          setLastVal(o);
        }
      });
  }

  const handleClickOpen = () => {
    setOpen(true);
    props.getData(getBash);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button type={props.type} icon={<EyeOutlined />}
        onClick={handleClickOpen}>
        Preview
      </Button>
      <Modal title="Preview" visible={open} onCancel={handleClose}
        width="1000px" footer={[
          <Button key="ok" type="primary" onClick={handleClose}>Ok</Button>]}>
        <Editor height="700px" width="900px" defaultLanguage="bash"
          options={editorOpts} onMount={handleEditorDidMount} />
      </Modal>
    </>
  );
}

Preview.propTypes = {
  getData: PropTypes.func.isRequired,
  type: PropTypes.string,
};
