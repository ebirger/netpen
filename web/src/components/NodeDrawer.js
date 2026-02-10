import React from 'react';
import PropTypes from 'prop-types';
import { Drawer, Input, Button, Space, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { GetTypeName } from '../Types.js';
import { itemComponentTypes } from './ItemsContainer.js';

const { Text } = Typography;

export default function NodeDrawer(props) {
  const { item, onClose, onChange, onDelete } = props;
  const ItemComponent = item ? itemComponentTypes[item.type] : null;

  function onNameChange(ev) {
    if (!item)
      return;
    item.name = ev.target.value;
    onChange(item);
  }

  function onDeleteClick() {
    if (!item)
      return;
    onDelete(item);
    onClose();
  }

  return (
    <Drawer
      className="node-drawer"
      width={640}
      title={item ? `Configure ${GetTypeName(item.type)}` : 'Configure Node'}
      open={!!item}
      onClose={onClose}
      destroyOnClose={false}
    >
      {!item ? <span /> : (
        <>
          <Space orientation="vertical" style={{ width: '100%' }} size={6}>
            <Text type="secondary">Name</Text>
            <Input value={item.name} onChange={onNameChange} />
          </Space>
          <Space style={{ marginTop: 12, marginBottom: 20 }}>
            <Button icon={<DeleteOutlined />} onClick={onDeleteClick}>Delete</Button>
          </Space>
          {ItemComponent ? <ItemComponent item={item} onChange={onChange} /> : <span />}
        </>
      )}
    </Drawer>
  );
}

NodeDrawer.propTypes = {
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
