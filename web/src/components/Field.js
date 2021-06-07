import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from 'antd';
import { Row, Col } from 'antd';

const { Text } = Typography;

export default function Field(props) {
  return (
    <Row align="middle" gutter={10}>
      <Col flex="none">
        <Text>{props.title}:</Text>
      </Col>
      <Col flex="auto">
        {React.Children.only(props.children)}
      </Col>
    </Row>
  );
}

Field.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired
};
