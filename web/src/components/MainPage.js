import React from 'react';
import { Row, Col, Space } from 'antd';
import SiteLayout from './SiteLayout.js';
import Examples from './Examples.js';
import AboutButton from './AboutButton.js';
import PersonalPens, { NewPenButton, UploadPenButton}  from './PersonalPens.js';

export default function MainPage() {
  return (
    <SiteLayout title="netpen"
      titleitems={
        <Space className="right">
          <NewPenButton />
          <UploadPenButton />
          <AboutButton />
        </Space>}>
      <Row>
        <Col span={4} />
        <Col span={16}>
          <PersonalPens />
          <Examples />
        </Col>
        <Col span={4} />
      </Row>
    </SiteLayout>
  );
}
