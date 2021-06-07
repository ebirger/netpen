import YAML from 'yaml';
import { EXAMPLES_BASE } from '../consts.js';

export function getExampleFile(path, cb) {
  const url = EXAMPLES_BASE + path;
  fetch(url).then(res => res.text()).then((b) => {
    cb(YAML.parse(b));
  });
}
