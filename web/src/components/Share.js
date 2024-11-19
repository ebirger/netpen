import React from 'react'
import PropTypes from 'prop-types';
import { Button, message } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import PenLoader from './PenLoader.js';
import { CopyToPersonalPens } from './PersonalPens.js';
import { serializeObjList } from '../models/ObjModel.js';


function getFromString(id, cb) {
  cb(JSON.parse(atob(id)));
}

function encodeString(settings, items) {
  return btoa(JSON.stringify({settings: settings,
    items: serializeObjList(items)}));
}

export function SharedPenLoader() {
  return (
    <CopyToPersonalPens>
      <PenLoader getById={getFromString} originalPenType="shared pen"/>
    </CopyToPersonalPens>
  );
}

export default function Share(props) {
  function onCopy() {
    message.info('Link Copied to Clipboard');
  }

  function shareUrl() {
    const path = 'shared/' + encodeString(props.settings, props.items);
    const loc = document.location;
    const cur = URL.parse(loc);
    return cur.protocol + '//' + cur.host + '/' + path;
  }

  return (
    <CopyToClipboard text={shareUrl()} onCopy={onCopy}>
      <Button type="primary" icon={<LinkOutlined />}>
        Link
      </Button>
    </CopyToClipboard>
  );
}

Share.propTypes = {
  settings: PropTypes.object.isRequired,
  items: PropTypes.object.isRequired,
};
