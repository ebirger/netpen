import React from 'react'
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import YAML from 'yaml';
import { Navigate } from 'react-router-dom';
import { Button, Divider } from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { serializeObjList } from '../models/ObjModel.js';
import { defaultSubnet } from '../models/SubnetModel.js';
import PenLoader from './PenLoader.js';
import PenList from './PenList.js';

const PEN_KEY_BASE = 'personal_pens/';
const LSKEY = 'personal_pens';

function savePen(id, o) {
  localStorage.setItem(PEN_KEY_BASE + id, JSON.stringify(o));
}

function saveItems(items) {
  localStorage.setItem(LSKEY, JSON.stringify(items));
}

function loadItems() {
  const s = localStorage.getItem(LSKEY) || '{}';
  return JSON.parse(s);
}

function getById(path, cb) {
  const def = {settings: { title: path }, items: []};
  const So = localStorage.getItem(PEN_KEY_BASE + path);
  cb(So ? JSON.parse(So) : def);
}

export function CopyToPersonalPens(props) {
  const [redirect, setRedirect] = useState(null);

  function onCopy(settings, items) {
    const title = settings.title + ' Copy';
    setRedirect(newPersonalPen(title, items));
  }

  if (redirect)
    return <Navigate to={redirect} replace />;

  const elem = React.Children.only(props.children);
  return React.cloneElement(elem, {onCopy: onCopy});
}

CopyToPersonalPens.propTypes = {
  children: PropTypes.node.isRequired
};

export function PersonalPenLoader() {
  function update(id, o) {
    let items = loadItems();

    savePen(id, o);
    if (o.settings.title) {
      items[id] = {name: o.settings.title, path: id};
      saveItems(items);
    }
  }
  return <PenLoader update={update} getById={getById} />;
}

function newPersonalPen(title, items) {
  const id = Date.now().toString();
  const def = {settings: { title: title }, items: items};
  savePen(id, def);
  return "/personal/" + id;
}

export function UploadPenButton() {
  const [redirect, setRedirect] = useState(null);
  const inputEl = useRef(null);

  function openFile(evt) {
    const fileObj = evt.target.files[0]; // single file
    const reader = new FileReader();

    let fileloaded = (e) => {
      const o = YAML.parse(e.target.result);
      const title = o.settings ? o.settings.title : fileObj.name;

      setRedirect(newPersonalPen(title, o.items));
    }

    reader.onload = fileloaded;
    reader.readAsText(fileObj);
  }

  function onUpload() {
    inputEl.current.click()
  }

  if (redirect)
    return <Navigate to={redirect} replace />;

  return (
    <>
      <Button type="primary" icon={<UploadOutlined />} onClick={onUpload}>
        Upload
      </Button>
      <input type="file" className="hidden" multiple={false}
        accept=".json,.yaml,application/json,application/yaml"
        onChange={openFile} ref={inputEl} />
    </>
  );
}

export function NewPenButton() {
  const [redirect, setRedirect] = useState(null);

  function onAdd() {
    const title = 'Great Plan';
    const objList = {};
    objList[defaultSubnet.id] = defaultSubnet;
    setRedirect(newPersonalPen(title, serializeObjList(objList)));
  }

  if (redirect)
    return <Navigate to={redirect} replace />;

  return (
    <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
      New
    </Button>
  );
}

export default function PersonalPens() {
  const defItems = loadItems();
  const [items, setItems] = useState(defItems);

  function up() {
    saveItems(items);
  }

  function onDelete(id) {
    let copy = {...items};
    delete copy[id];
    localStorage.removeItem(PEN_KEY_BASE + id);
    setItems(copy);
  }

  useEffect(up, [items]);

  return (
    <>
      <Divider />
      <PenList title="Personal Pens"
        items={[{title: '', items: Object.values(items)}]}
        getById={getById} linkpfx="personal" onDelete={onDelete} />
    </>
  );
}
