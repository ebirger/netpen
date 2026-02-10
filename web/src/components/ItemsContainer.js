import React from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Collapse, Typography, Space } from 'antd';
import { Popover, Input } from 'antd';
import { DeleteOutlined, AimOutlined, EditOutlined } from '@ant-design/icons';
import { InfoOutlined } from '@ant-design/icons';
import { GetTypeName } from '../Types.js';
import NetNs from './NetNs.js';
import Veth from './Veth.js';
import Tunnel from './Tunnel.js';
import Subnet from './Subnet.js';
import Vlan from './Vlan.js';
import Bridge from './Bridge.js';
import Team from './Team.js';
import MacVlan from './MacVlan.js';
import Dummy from './Dummy.js';
import Vrf from './Vrf.js';
import XfrmTransport from './XfrmTransport.js';
import EbpfProg from './EbpfProg.js';

const { Text } = Typography;
const { Panel } = Collapse;

export const itemComponentTypes = {
  netns: NetNs,
  veth: Veth,
  vlan: Vlan,
  subnet: Subnet,
  ebpfprog: EbpfProg,
  bridge: Bridge,
  team: Team,
  tunnel: Tunnel,
  macvlan: MacVlan,
  dummy: Dummy,
  vrf: Vrf,
  xfrm_transport: XfrmTransport,
};

function ItemHeader(props) {
  const Aim = props.isSelected ? (
    <AimOutlined className="selected-item-icon" />) : <span />;
  const displayName = props.item.displayName();
  const title = GetTypeName(props.item.type);
  return (
    <>
      <Space style={{ float: 'left' }}>
        <Text>{title}</Text>
        <Text type="secondary">{displayName}</Text>
        {Aim}
      </Space>
    </>
  );
}

ItemHeader.propTypes = {
  isSelected: PropTypes.bool.isRequired,
  item: PropTypes.object.isRequired,
};

function ControlledCollapse(props) {
  let p = {...props}

  if (props.open)
    p.activeKey = 1

  return (
    <Collapse {...p}>
      {React.Children.only(props.children)}
    </Collapse>
  );
}

ControlledCollapse.propTypes = {
  open: PropTypes.bool.isRequired,
  children: PropTypes.node
};

function ItemNameEdit(props) {
  function onChange(ev) {
    props.onChange(ev.target.value);
  }

  return (
    <Input onChange={onChange} defaultValue={props.item.name}
      onPressEnter={props.onPressEnter} />
  );
}

ItemNameEdit.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onPressEnter: PropTypes.func.isRequired,
};

function ItemNameEditButton(props) {
  const [editVisible, setEditVisible] = useState(false);

  function onRename(newName) {
    props.item.name = newName;
    props.onChange(props.item);
  }

  return (
    <div onClick={e => { e.stopPropagation(); }}>
      <Popover content={<ItemNameEdit item={props.item} onChange={onRename}
        onPressEnter={()=>{setEditVisible(false);}}/>} trigger="click"
      visible={editVisible} onVisibleChange={setEditVisible}>
        <Button icon={<EditOutlined />} />
      </Popover>
    </div>
  );
}

ItemNameEditButton.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

function ItemInfoButton(props) {
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <div onClick={e => { e.stopPropagation(); }}>
      <Popover content={props.item.desc} trigger="click" visible={infoVisible}
        onVisibleChange={setInfoVisible}>
        <Button icon={<InfoOutlined />} />
      </Popover>
    </div>
  );
}

ItemInfoButton.propTypes = {
  item: PropTypes.object.isRequired,
};

function ItemContainer(props) {
  const key = `${props.item.type}.${props.item.name}`;

  function onDelete() {
    props.onDelete(props.item);
  }

  const selectedState = props.selected[key];

  const isOpen = selectedState & 0x2 ? true : false;
  const isSelected = selectedState & 0x1 ? true : false;
  const extra_class = isSelected ? 'highlighted' : '';

  function onMouseEvent(isEnter) {
    const elems = props.graphElements[key];

    if (!elems)
      return;

    if (isEnter)
      elems.forEach((e) => e.classList.add('selected-node'));
    else
      elems.forEach((e) => e.classList.remove('selected-node'));
  }

  const Actions = (
    <div className="right">
      {props.item.desc ? <ItemInfoButton item={props.item} /> : ""}
      <ItemNameEditButton item={props.item} onChange={props.onChange} />
      <Button icon={<DeleteOutlined />} onClick={onDelete} />
    </div>
  );

  function setOpenState(selectedPanel) {
    props.onPanelChange(key, selectedPanel[0] === "1");
  }

  return (
    <div onMouseEnter={()=>onMouseEvent(true)}
      onMouseLeave={()=>onMouseEvent(false)}>
      <Collapse activeKey={(isOpen) ? 1 : 0} onChange={setOpenState}
        className={extra_class} style={{marginTop:5, marginLeft: 20}}>
        <Panel key={1}
          header={<ItemHeader item={props.item} isSelected={isSelected} />}
          extra={Actions}>
          {React.Children.only(props.children)}
        </Panel>
      </Collapse>
    </div>
  );
}

ItemContainer.propTypes = {
  onDelete: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onPanelChange: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  item: PropTypes.object.isRequired,
  graphElements: PropTypes.object.isRequired,
  selected: PropTypes.object
};

function GenItem(props) {
  const ItemComponent = itemComponentTypes[props.item.type];

  return (
    <ItemContainer onDelete={props.onDelete} selected={props.selected}
      item={props.item} onChange={props.onChange}
      onPanelChange={props.onPanelChange}
      graphElements={props.graphElements}>
      <ItemComponent item={props.item} onChange={props.onChange} />
    </ItemContainer>
  );
}

GenItem.propTypes = {
  item: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  graphElements: PropTypes.object.isRequired,
  onPanelChange: PropTypes.func.isRequired,
  selected: PropTypes.object
};

export default function ItemsContainer(props) {
  return (
    <div className="items-container">
      {Object.values(props.itemlist).map((item) => (
        <GenItem key={item.id} item={item} {...props} />
      ))}
    </div>);
}

ItemsContainer.propTypes = {
  ...GenItem.proptypes,
  itemlist: PropTypes.object.isRequired,
};
