import React from 'react'
import PropTypes from 'prop-types';
import { Button, Modal, Alert, Row, Col, Divider } from 'antd';
import GitHubButton from 'react-github-btn';
import netpen_light from '../netpen_light.png';
import { PenTourReset } from './PenTour.js';

export default function AboutButton(props) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const restartTour = () => {
    setOpen(false);
    PenTourReset();
  };

  return (
    <>
      <Button type="primary" onClick={handleClickOpen}>About</Button>
      <Modal title="netpen.io" open={open} onCancel={handleClose}
        footer={null} width={600}>
        <Row gutter={[10, 20]}>
          <Col span={8} />
          <Col span={8}>
            <img src={netpen_light} className="about-img" />
          </Col>
          <Col span={8} />
          <Col span={24}>
            Visual editor and API for network environments script generation.
            <br />
            Define your network components and
            download a BASH script creating your setup.
          </Col>
          <Col>Project Page:</Col>
          <Col>
            <a href="https://github.com/ebirger/netpen.git" target="_blank"
              rel="noreferrer">
              https://github.com/ebirger/netpen.git
            </a>
          </Col>
          <Col>
            <GitHubButton href="https://github.com/ebirger/netpen/issues"
              data-icon="octicon-issue-opened"
              aria-label="Issue ebirger/netpen on GitHub">
              Issue
            </GitHubButton>
          </Col>
          <Col>
            <GitHubButton href="https://github.com/ebirger/netpen"
              data-icon="octicon-star"
              aria-label="Star ebirger/netpen on GitHub">
              Star
            </GitHubButton>
          </Col>
          {props.showRestartTour ?
            <>
              <Divider />
              <Button onClick={restartTour}>Restart Tour</Button>
            </> :
            []
          }
          <Col span={24}>
            <Alert type="warning"
              message="This is alpha software. Things may break." />
          </Col>
        </Row>
      </Modal>
    </>
  );
}

AboutButton.propTypes = {
  showRestartTour: PropTypes.bool,
};
