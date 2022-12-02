import React from 'react'
import PropTypes from 'prop-types';
import { Button, Row, Col, Card, Typography, Divider } from 'antd';
import { EditOutlined, EyeOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import DownloadButton from './DownloadButton.js';
import Preview from './Preview.js';

const { Title } = Typography;

function PenCard(props) {
  function onDelete() {
    props.onDelete(props.path);
  }

  function onCopy() {
    props.getById(props.path, (o) => props.onCopy(o.settings, o.items));
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
    <Card hoverable title={props.name}>
      <Link style={{ color: 'inherit' }}
        to={'/' + props.linkpfx + '/' + props.path}>
        <Button icon={vieweditIcon}>
          {vieweditAction}
        </Button>
      </Link>
      {props.onCopy ?
        <Button onClick={onCopy} icon={<CopyOutlined />}>
          Copy
        </Button> : <span />}
      <Preview getData={(cb) => { props.getById(props.path, cb); }} />
      <DownloadButton getData={(cb) => { props.getById(props.path, cb); }} />
      {props.onDelete ?
        <Button onClick={onDelete} icon={<DeleteOutlined />}>
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
