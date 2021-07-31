import React from 'react'
import { useState, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';
import GViz from './Viz.js';
import NewItem from './NewItem.js';
import ItemsContainer from './ItemsContainer.js';
import { Provider } from '../Context.js';
import { serializeObjList } from '../models/ObjModel.js';
import { getObjsByType, getL3Devs } from '../models/ObjModel.js';
import { getL2Devs, getItemById } from '../models/ObjModel.js';
import { objModels } from '../models/Loader.js';
import { API_BASE } from '../consts.js';

const dotUrl = API_BASE + 'v1/dot';

export default function Pen(props) {
  const [dot, setDot] = useState('');
  const [graphElements, setGraphElements] = useState({})

  function up() {
    const postBody = {items: serializeObjList(props.objlist)};
    const requestMetadata = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(postBody)
    };

    if (props.onUpdate)
      props.onUpdate()

    fetch(dotUrl, requestMetadata).then(res => res.text())
      .then(o => {setDot(o);});
  }

  function updateItem(item) {
    let copy = {...props.objlist};
    copy[item.id] = item;
    props.setObjList(copy);
  }

  function delItem(item) {
    let copy = {...props.objlist};

    delete copy[item.id];
    props.setObjList(copy);
  }

  function registerGraphElements(elems) {
    const g = {};

    elems.forEach((e) => {
      const key = `${e.type}.${e.name}`;
      if (!g[key])
        g[key] = [];
      g[key] = g[key].concat(e.elem);
    });
    setGraphElements(g);
  }

  useEffect(up, [props.objlist]);

  const ctx = {
    getObjsByType: (t) => getObjsByType(props.objlist, t),
    getL2Devs: () => getL2Devs(props.objlist),
    getL3Devs: () => getL3Devs(props.objlist),
    getItemById: (id) => getItemById(props.objlist, id),
  };

  function onNewItem(type, name) {
    const ctor = objModels[type];
    updateItem(new ctor(null, name, type));
  }

  function selectedReducer(state, action) {
    let s = state[action.key] || 0;
    switch (action.type) {
    case 'enter':
      s |= 0x1;
      break;
    case 'leave':
      s &= ~0x1;
      break;
    case 'click':
      s ^= 0x2;
      break;
    case 'open':
      s |= 0x2;
      break;
    case 'close':
      s &= ~0x2;
      break;
    default:
      throw new Error();
    }
    let ret = {...state};
    ret[action.key] = s;
    return ret;
  }

  const [selected, dispatchSelected] = useReducer(selectedReducer, {});

  function graphItemSelected(gi) {
    const key = `${gi.type}.${gi.name}`;
    dispatchSelected({type: gi.eventType, key: key});
  }

  function onPanelChange(key, isOpen) {
    const type = isOpen ? 'open' : 'close';
    dispatchSelected({type: type, key: key});
  }

  return (
    <Provider value={ctx}>
      <Row gutter={[10]}>
        <Col span={9}>
          <NewItem onDone={onNewItem}/>
          <ItemsContainer selected={selected} itemlist={props.objlist}
            onPanelChange={onPanelChange}
            onDelete={delItem} onChange={updateItem}
            graphElements={graphElements}/>
        </Col>
        <Col span={15}>
          <GViz dot={dot} setSelected={graphItemSelected}
            registerGraphElements={registerGraphElements}/>
        </Col>
      </Row>
    </Provider>
  );
}

Pen.propTypes = {
  objlist: PropTypes.object.isRequired,
  setObjList: PropTypes.func.isRequired,
  onUpdate: PropTypes.func
};
