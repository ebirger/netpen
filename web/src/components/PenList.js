import React from 'react'
import PropTypes from 'prop-types';
import { Button, Row, Col, Card, Typography, Divider } from 'antd';
import { EditOutlined, EyeOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DownloadButton from './DownloadButton.js';
import Preview from './Preview.js';

const { Title } = Typography;

function PenCard(props) {
  const navigate = useNavigate();

  function onDelete() {
    props.onDelete(props.path);
  }

  function onCopy() {
    props.getById(props.path, (o) => props.onCopy(o.settings, o.items));
  }

  function onOpen() {
    navigate('/' + props.linkpfx + '/' + props.path);
  }

  let vieweditAction;
  let vieweditIcon;

  if (props.onDelete) {
    vieweditAction = 'Edit';
    vieweditIcon = <EditOutlined />;
  } else {
    vieweditAction = 'View';
    vieweditIcon = <EyeOutlined />;
  }

  return (
    <Card hoverable title={props.name} onClick={onOpen}>
      <Button icon={vieweditIcon} onClick={(e) => { e.stopPropagation(); onOpen(); }}>
        {vieweditAction}
      </Button>
      {props.onCopy ?
        <Button onClick={(e) => { e.stopPropagation(); onCopy(); }} icon={<CopyOutlined />}>
          Copy
        </Button> : <span />}
      <span onClick={(e) => e.stopPropagation()}>
        <Preview getData={(cb) => { props.getById(props.path, cb); }} />
      </span>
      <span onClick={(e) => e.stopPropagation()}>
        <DownloadButton getData={(cb) => { props.getById(props.path, cb); }} />
      </span>
      {props.onDelete ?
        <Button onClick={(e) => { e.stopPropagation(); onDelete(); }} icon={<DeleteOutlined />}>
          Delete
        </Button> : <span />}
    </Card>
  );
}

PenCard.propTypes = {
  name: PropTypes.string.isRequired,
  linkpfx: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  getById: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func,
};

function PenItems(props) {
  return props.penlist.map((v) => (
    <div key={v.title}>
      <Divider />
      <Title level={4}>{v.title}</Title>
      <Row gutter={[15, 15]}>
        {v.items.map((e) => (
          <Col key={e.path} span={12}>
            <PenCard key={e.path} name={e.name} path={e.path}
              getById={props.getById} linkpfx={props.linkpfx}
              onDelete={props.onDelete} onCopy={props.onCopy} />
          </Col>
        ))}
      </Row>
    </div>
  ));
}

PenItems.propTypes = {
  linkpfx: PropTypes.string.isRequired,
  penlist: PropTypes.array.isRequired,
  getById: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func
};

export default function PenList(props) {
  const content = (
    <>
      <Title level={3}>{props.title}</Title>
      <PenItems penlist={props.items} linkpfx={props.linkpfx}
        getById={props.getById} onDelete={props.onDelete}
        onCopy={props.onCopy} />
      <Divider />
    </>
  );

  function hasItems() {
    return props.items.length > 0 && props.items[0].items.length > 0;
  }
  return hasItems() ? content : <span />;
}

PenList.propTypes = {
  title: PropTypes.string.isRequired,
  linkpfx: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  getById: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func
};
