import React from 'react'
import { useState } from 'react';
import PropTypes from 'prop-types';
import Tour from 'reactour'

const existingPenSteps = [
  {
    selector: '#copybutton',
    content: 'Copy this pen to your local inventory if you want to make changes',
  },
  {
    selector: '.node-card',
    content: 'Click a node to configure it in the right drawer',
  },
];

const commonSteps = [
  {
    selector: '.new-item',
    content: 'Add new items by pressing this button',
  },
  {
    selector: '#bashdownload',
    content: 'When you are ready, press here to download a BASH script for your scenario'
  },
];

export let PenTourReset = undefined;

export default function PenTour(props) {
  const lsKey = `pen_tour_existing_${props.isExistingPen}_done`;
  const tourDone = localStorage.getItem(lsKey);
  const [isTourOpen, setIsTourOpen] = useState(!tourDone);

  function _PenTourReset() {
    localStorage.removeItem(lsKey);
    setIsTourOpen(true);
  }
  PenTourReset = _PenTourReset;

  function onTourClose() {
    setIsTourOpen(false);
    localStorage.setItem(lsKey, true);
  }

  const steps = (props.isExistingPen ? existingPenSteps : []).concat(commonSteps);

  return (
    <Tour startAt={0} steps={steps} isOpen={isTourOpen}
      onRequestClose={onTourClose} />
  );
}

PenTour.propTypes = {
  isExistingPen: PropTypes.bool,
};
