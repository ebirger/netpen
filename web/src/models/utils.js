export function filterObject(o, filt) {
  function pred(elem) {
    const [key, value] = elem;
    return filt(key, value);
  }

  return Object.fromEntries(Object.entries(o).filter(pred));
}
