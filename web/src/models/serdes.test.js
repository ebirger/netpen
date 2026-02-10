import fs from 'fs';
import YAML from 'yaml';
import { describe, it, expect } from 'vitest';
import { loadObjList } from '../models/Loader.js';
import { serializeObjList } from '../models/ObjModel.js';

function getPaths() {
  const fname = `../examples/example_list.yml`;
  const content = fs.readFileSync(fname, "utf8", function(err, data) {
    return data;
  });

  const o = YAML.parse(content);
  let paths = [];
  o.forEach((x) => {
    x.items.forEach((i) => {
      paths = paths.concat(i.path);
    });
  });
  return paths;
}


describe('Serialization tests', () => {
  const paths = getPaths();
  it.each(paths.map((x) => [x]))("serdes %s", (example) => {
    const fname = `../examples/${example}`;
    const content = fs.readFileSync(fname, "utf8", function(err, data) {
      return data;
    });

    const y = YAML.parse(content);
    const loaded = loadObjList(y);
    const serialized = serializeObjList(loaded);
    expect(serialized).toEqual(y.items);
  });
});
