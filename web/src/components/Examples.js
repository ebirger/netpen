import React from 'react'
import { useState, useEffect } from 'react';
import PenList from './PenList.js';
import PenLoader from './PenLoader.js';
import { CopyToPersonalPens } from './PersonalPens.js';
import { getExampleFile } from '../models/Examples.js';

export function ExamplesPenLoader() {
  return (
    <CopyToPersonalPens originalPenType="example">
      <PenLoader getById={getExampleFile} />
    </CopyToPersonalPens>
  );
}

export default function Examples() {
  const [examples, setExamples] = useState([]);

  function getItems() {
    getExampleFile('example_list.yml', setExamples);
  }

  useEffect(getItems, []);

  return (
    <CopyToPersonalPens originalPenType="example">
      <PenList title="Examples" items={examples} getById={getExampleFile}
        linkpfx="examples" />
    </CopyToPersonalPens>
  );
}
