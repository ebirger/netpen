import React from 'react'
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { loadObjList } from '../models/Loader.js';
import { serializeObjList } from '../models/ObjModel.js';
import PenEditor from './PenEditor.js';

export default function PenLoader(props) {
  const [defs, setDefs] = useState(null);
  const {id} = useParams();

  function gotFile(raw) {
    const d = {settings: raw.settings || {}, objlist: loadObjList(raw)};
    setDefs(d);
  }

  function getDefs() {
    props.getById(id, gotFile);
  }

  function update(settings, objlist) {
    if (!props.update)
      return;
    let o = {items: serializeObjList(objlist), settings: settings};
    props.update(id, o);
  }

  function onCopy(settings, objlist) {
    if (!props.onCopy)
      return;
    const items = serializeObjList(objlist);
    props.onCopy(settings, items);
  }

  useEffect(getDefs, [id]);

  return defs ? <PenEditor onCopy={props.onCopy ? onCopy : null}
    update={props.update ? update : null}
    defaults={defs} /> : [];
}

PenLoader.propTypes = {
  getById: PropTypes.func.isRequired,
  update: PropTypes.func,
  onCopy: PropTypes.func
};
