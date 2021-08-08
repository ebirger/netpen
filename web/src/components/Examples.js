import React from 'react'
import { useState, useEffect } from 'react';
import PenList from './PenList.js';
import PenLoader from './PenLoader.js';
import { CopyToPersonalPens } from './PersonalPens.js';
import { getExampleFile } from '../models/Examples.js';

export function ExamplesPenLoader() {
  return (
    <CopyToPersonalPens>
      <PenLoader getById={getExampleFile} originalPenType="example" />
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
    <CopyToPersonalPens>
      <PenList title="Examples" items={examples} getById={getExampleFile}
        linkpfx="examples" />
    </CopyToPersonalPens>
  );
}
