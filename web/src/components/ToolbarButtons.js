import React from 'react'
import PropTypes from 'prop-types';
import { Space, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import Settings from './Settings.js';
import Share from './Share.js'
import DownloadButton from './DownloadButton.js';
import AboutButton from './AboutButton.js';
import { serializeObjList } from '../models/ObjModel.js';

export default function ToolbarButtons(props) {
  function getData(cb) {
    cb({items: serializeObjList(props.objlist), settings: props.settings});
  }

  function onCopy() {
    props.onCopy(props.settings, props.objlist);
  }

  const copyButton = props.onCopy ? (
    <Button type="primary" icon={<CopyOutlined />} onClick={onCopy}>
      Copy
    </Button>) : <span />;
  return (
    <Space className="right">
      {copyButton}
      <Share settings={props.settings} items={props.objlist} />
      <Settings onChange={props.onSettingsChange} settings={props.settings} />
      <DownloadButton type="primary" getData={getData} />
      <AboutButton />
    </Space>);
}

ToolbarButtons.propTypes = {
  objlist: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
  onSettingsChange: PropTypes.func.isRequired,
  onCopy: PropTypes.func
};
