import React from 'react'
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SiteLayout from './SiteLayout.js';
import ToolbarButtons from './ToolbarButtons.js';
import Pen from './Pen.js';

export default function PenEditor(props) {
  const defObjList = props.defaults ? props.defaults.objlist : {};
  const defSettings = props.defaults ? props.defaults.settings : {};
  const [objlist, setObjList] = useState(defObjList);
  const [settings, setSettings] = useState(defSettings);

  function up() {
    if (!props.update)
      return;
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
      <Pen objlist={objlist} setObjList={setObjList}
        onUpdate={props.onUpdate} />
    </SiteLayout>
  );
}

PenEditor.propTypes = {
  defaults: PropTypes.object,
  update: PropTypes.func,
  onCopy: PropTypes.func,
  onUpdate: PropTypes.func
};
