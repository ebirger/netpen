import React from 'react'
import PropTypes from 'prop-types';
import { Dropdown, Menu, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import YAML from 'yaml';
import { API_BASE } from '../consts.js';

const bashUrl = API_BASE + 'v1/bash';
console.log('using API_BASE: ' + API_BASE)

export default function DownloadButton(props) {
  function downloadText(txt, fname) {
    const element = document.createElement("a");
    const file = new Blob([txt], {type: 'application/octet-stream'});
    element.href = URL.createObjectURL(file);
    element.download = fname;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  function gotData(data) {
    const requestMetadata = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    };

    fetch(bashUrl, requestMetadata).then(res => res.text())
      .then(o => {downloadText(o, 'netpen.sh');});
  }

  function getBash() {
    props.getData(gotData);
  }

  function handleMenuClick(e) {
    switch (e.key) {
    case 'bash':
      getBash();
      break;
    case 'yaml':
      props.getData((o) => {
        const txt = YAML.stringify(o, {indent: 2});
        downloadText(txt, 'netpen.yaml');
      });
      break;
    }
  }

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="bash">
        BASH
      </Menu.Item>
      <Menu.Item key="yaml">
        YAML
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown.Button id="bashdownload" onClick={getBash}
      type={props.type || "default"} overlay={menu}>
      <Space>
        <DownloadOutlined />
        Download
      </Space>
    </Dropdown.Button>
  );
}

DownloadButton.propTypes = {
  getData: PropTypes.func.isRequired,
  type: PropTypes.string,
  size: PropTypes.string,
};
