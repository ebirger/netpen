import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Divider } from 'antd';
import VlanModel from '../models/VlanModel.js';
import NumberInput from './NumberInput.js'
import Field from './Field.js';
import NetDevParams, {L2Devices} from './NetDevParams.js';

function VlanParams(props) {
  const pred = (d) => (d.type !== 'vlan');
  return (
    <Row gutter={10}>
      <Col flex="auto">
        <L2Devices onChange={props.onLinkChange} id="link"
          label="Link Device" value={props.link} pred={pred} />
      </Col>
      <Col>
        <Field title="Tag">
          <NumberInput value={props.tag} onChange={props.onTagChange}
            label="Tag" min={0} max={4096} />
        </Field>
      </Col>
    </Row>);
}

VlanParams.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  tag: PropTypes.number.isRequired,
  onLinkChange: PropTypes.func.isRequired,
  onTagChange: PropTypes.func.isRequired,
};

export default function Vlan(props) {
  const {id, name, type, link, tag, devparams} = props.item;

  function setLink(newLink) {
    if (!tag)
      return;

    const model = new VlanModel(id, name, type, newLink, tag, devparams);
    props.onChange(model);
  }

  function setTag(newTag) {
    if (!link)
      return;

    const model = new VlanModel(id, name, type, link, newTag, devparams);
    props.onChange(model);
  }

  function setDevParams(newDevparams) {
    if (!link || !tag)
      return;

    const model = new VlanModel(id, name, type, link, tag, newDevparams);
    props.onChange(model);
  }

  return (
    <>
      <VlanParams key="col" onLinkChange={setLink} link={link}
        tag={tag} onTagChange={setTag} id={devparams.id} />
      <Divider />
      <NetDevParams key="dev" onChange={setDevParams} item={devparams} />
    </>
  );
}

Vlan.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
