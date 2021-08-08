import React from 'react'
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { notification } from 'antd'
import SiteLayout from './SiteLayout.js';
import ToolbarButtons from './ToolbarButtons.js';
import PenDescription from './PenDescription.js';
import Pen from './Pen.js';

export default function PenEditor(props) {
  const defObjList = props.defaults ? props.defaults.objlist : {};
  const defSettings = props.defaults ? props.defaults.settings : {};
  const [objlist, setObjList] = useState(defObjList);
  const [settings, setSettings] = useState(defSettings);
  const firstUpdate = useRef(true);

  function up() {
    if (!props.update) {
      if (!firstUpdate.current) {
        const orpt = props.originalPenType;

        notification.open({
          key: "read_only_notification",
          message: `Read only ${orpt}`,
          description: `Your changes are not saved, press 'Copy' to clone the ${orpt}`,
          placement: "bottomRight"
        });
      }
      firstUpdate.current = false;
      return;
    }

    props.update(settings, objlist);
  }

  useEffect(up, [settings, objlist]);

  const onTitleChange = !props.update ? null : (title) => {
    let copy = {...settings};
    copy.title = title;
    setSettings(copy);
  }

  return (
    <SiteLayout gridded onTitleChange={onTitleChange} title={settings.title}
      titleitems={
        <ToolbarButtons settings={settings} onCopy={props.onCopy}
          onSettingsChange={setSettings} objlist={objlist} />}>
      <Pen objlist={objlist} setObjList={setObjList} />
      {settings.description ?
        <PenDescription text={settings.description}/> : 
        []}
    </SiteLayout>
  );
}

PenEditor.propTypes = {
  defaults: PropTypes.object,
  update: PropTypes.func,
  onCopy: PropTypes.func,
  originalPenType: PropTypes.string,
};
