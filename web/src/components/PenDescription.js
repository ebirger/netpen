import React from 'react'
import PropTypes from 'prop-types';
import { Card, Input, Row, Col } from 'antd'

const { TextArea } = Input;

export default function PenDescription(props) {
  return (
    <Row gutter={[10]}>
      <Col span={9}>
      </Col>
      <Col span={15}>
        <Card>
          <TextArea rows={10} value={props.text}/>
        </Card>
      </Col>
    </Row>
  );
}

PenDescription.propTypes = {
  text: PropTypes.string,
}
