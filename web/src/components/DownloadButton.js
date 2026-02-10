import React from 'react'
import PropTypes from 'prop-types';
import { Dropdown, Space, Button } from 'antd';
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
      .then(o => {
        const fname = makeFilename(data.settings.title, '.sh');
        downloadText(o, fname);
      });
  }

  function getBash() {
    props.getData(gotData);
  }

  function makeFilename(title, suffix) {
    let fname;
    if (title === undefined || title.length == 0) {
      fname = 'netpen';
    }
    else {
      fname = title.replaceAll(' ', '_').replaceAll('/', '').toLowerCase();
    }
    return fname + suffix;
  }

  function handleMenuClick(e) {
    switch (e.key) {
    case 'bash':
      getBash();
      break;
    case 'yaml':
      props.getData((o) => {
        const txt = YAML.stringify(o, {indent: 2});
        const fname = makeFilename(o.settings.title, '.yaml');
        downloadText(txt, fname);
      });
      break;
    }
  }

  const menuItems = [
    { key: 'bash', label: 'BASH' },
    { key: 'yaml', label: 'YAML' },
  ];

  return (
    <Space.Compact id="bashdownload">
      <Button onClick={getBash} type={props.type || "default"} size={props.size}>
        <Space>
          <DownloadOutlined />
          Download
        </Space>
      </Button>
      <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']}>
        <Button type={props.type || "default"} size={props.size}>
          <DownloadOutlined />
        </Button>
      </Dropdown>
    </Space.Compact>
  );
}

DownloadButton.propTypes = {
  getData: PropTypes.func.isRequired,
  type: PropTypes.string,
  size: PropTypes.string,
};
