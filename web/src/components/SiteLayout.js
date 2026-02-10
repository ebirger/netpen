import React from 'react'
import { Layout, Typography } from 'antd';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Button } from 'antd';
import netpen from '../netpen.png';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function SiteLayout(props) {
  const titleitems = props.titleitems || <span />;
  const titleEditable = props.onTitleChange ? {onChange: props.onTitleChange} :
    false;

  let contentClass = "site-layout-content" + (props.gridded ? " gridded" : "") +
    (props.fullHeight ? " full-height" : "");

  return (
    <Layout className="layout">
      <Header className="site-layout-header"
        style={{ position: 'fixed', zIndex: 1000, width: '100%'}}>
        <Link style={{ color: 'inherit' }} to={'/main/'}>
          <Button type="ghost" className="logo"
            icon={<img src={netpen} className="logo-icon" />} />
        </Link>
        <Title level={3} style={{ color: '#fff', float: 'left',
          marginTop: '16px' }} editable={titleEditable}>
          {props.title}
        </Title>
        {titleitems}
      </Header>
      <Layout style={{ padding: '10px 0' }}>
        <Content style={{ padding: '0 50px', marginTop: 64 }}>
          <div className={contentClass}>
            {React.Children.map(props.children, (c) => (c))}
          </div>
        </Content>
      </Layout>
    </Layout>);
}

SiteLayout.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  titleitems: PropTypes.object,
  onTitleChange: PropTypes.func,
  gridded: PropTypes.bool,
  fullHeight: PropTypes.bool,
};
