import React from 'react'
import { Button, Divider } from 'antd'
import { PlusOutlined } from '@ant-design/icons';
import PenList from './PenList.js';

function getItems(cb) {
  cb([{title: '', items: [{name: 'foo', path: 'foo'}]}]);
}

export default function Examples() {
  return (
    <>
      <Button type="dashed" block icon={<PlusOutlined />}>
        New Personal Pen
      </Button>
      <Divider />
      <PenList title="Personal Pens" getItems={getItems} getItem={() => {}}
        linkpfx="private" />
    </>
  );
}
