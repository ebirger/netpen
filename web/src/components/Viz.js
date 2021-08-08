import React from 'react';
import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import Viz from 'viz.js';
import { Module, render } from 'viz.js/full.render.js';
import { MapInteractionCSS } from 'react-map-interaction';

function Graph(props) {
  const {svg, registerGraphElements, setSelected} = props;
  const svgWrapperRef = useRef();

  function addSvgEvents() {
    function onSelect(ownerType, ownerName, ev) {
      setSelected({type: ownerType, name: ownerName, eventType: ev});
    }

    function addEvents(elem, parseTitle) {
      const titleElem = elem.getElementsByTagName('title')[0];
      const title = titleElem.innerHTML;
      const [ownerType, ownerName] = parseTitle(title);
      const poly = elem.getElementsByTagName('polygon')[0];

      elem.addEventListener('mouseenter', () => {
        poly.classList.add('selected-node');
        onSelect(ownerType, ownerName, 'enter');
      });
      elem.addEventListener('mouseleave', () => {
        poly.classList.remove('selected-node');
        onSelect(ownerType, ownerName, 'leave');
      });
      elem.addEventListener('click', () => {
        onSelect(ownerType, ownerName, 'click')});
      return {type: ownerType, name: ownerName, elem: poly};
    }

    if (!svg || svg.nodeName !== 'svg')
      return;
    const rsvg = svgWrapperRef.current;
    rsvg.innerHTML = svg.outerHTML;
    let elems = [];
    const nodes = rsvg.querySelectorAll('g.node');
    const nodeParseTitle = (title) => ((title.split('-')[1]).split('_'));
    nodes.forEach((n) => {elems = elems.concat(addEvents(n, nodeParseTitle));});
    const clusterParseTitle = (title) => (title.split('_').splice(1));
    const nss = rsvg.querySelectorAll('g.cluster');
    nss.forEach((n) => {
      elems = elems.concat(addEvents(n, clusterParseTitle));
    });
    /* Remove all titles to kill tooltips */
    const titleElems = rsvg.querySelectorAll('title');
    titleElems.forEach((e) => e.remove());
    registerGraphElements(elems);
  }

  useEffect(addSvgEvents, [svg]);
  const h = svg.getAttribute('height');
  const w = svg.getAttribute('width');
  return (
    <MapInteractionCSS>
      <div style={{height: h, width: w, minHeight: '60vh' }}
        ref={svgWrapperRef} />
    </MapInteractionCSS>
  );
}

Graph.propTypes = {
  svg: PropTypes.object.isRequired,
  setSelected: PropTypes.func.isRequired,
  registerGraphElements: PropTypes.func.isRequired,
};

export default function GViz(props) {
  const [loading, setLoading] = useState(false);
  const [graph, setGraph] = useState(false);
  const {dot, registerGraphElements, setSelected} = props;

  function getGraph() {
    setLoading(true);
    let v = new Viz({Module, render})

    v.renderSVGElement(dot).then(element => {
      setGraph(<Graph svg={element} setSelected={setSelected}
        registerGraphElements={registerGraphElements} />);
      setLoading(false);
    }).catch(() => {});
  }

  useEffect(getGraph, [dot]);

  return !loading && graph ? graph : <Spin />;
}

GViz.propTypes = {
  dot: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
  registerGraphElements: PropTypes.func.isRequired,
};
