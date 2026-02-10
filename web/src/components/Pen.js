import React from 'react'
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import NewItem from './NewItem.js';
import NodeCanvas from './NodeCanvas.js';
import NodeDrawer from './NodeDrawer.js';
import { Provider } from '../Context.js';
import { getObjsByType, getL3Devs } from '../models/ObjModel.js';
import { getL2Devs, getItemById, serializeObjList } from '../models/ObjModel.js';
import { objModels } from '../models/Loader.js';
import { API_BASE } from '../consts.js';

const dotUrl = API_BASE + 'v1/dot';

function parseNodeLabel(raw) {
  const s = raw.startsWith('{') && raw.endsWith('}') ? raw.slice(1, -1) : raw;
  const parts = s.split('|');
  const label = parts[0] || raw;
  const cidrText = parts.length > 1 ? parts.slice(1).join(' | ') : '';
  const cidrs = cidrText ? cidrText.split(',').map((v) => v.trim()).filter((v) => v.includes('/')) : [];
  return { label, cidrText, cidrs };
}

function parseEdgeAttrs(raw) {
  const ret = {};
  if (!raw)
    return ret;
  const color = raw.match(/color="([^"]+)"/);
  const label = raw.match(/label="([^"]+)"/);
  if (color)
    ret.color = color[1];
  if (label)
    ret.label = label[1];
  return ret;
}

function parseDot(dot) {
  const lines = dot.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const clusters = {};
  const nodes = {};
  const edges = [];
  const edgeCounts = {};
  const clusterStack = [];

  function currentClusterId() {
    if (clusterStack.length === 0)
      return null;
    return clusterStack[clusterStack.length - 1];
  }

  function ensureCluster(clusterId) {
    if (!clusters[clusterId])
      clusters[clusterId] = { id: clusterId, label: clusterId, nodeIds: [], parentId: null };
    return clusters[clusterId];
  }

  function addNodeToOpenClusters(nodeId) {
    clusterStack.forEach((clusterId) => {
      const c = ensureCluster(clusterId);
      if (!c.nodeIds.includes(nodeId))
        c.nodeIds = c.nodeIds.concat(nodeId);
    });
  }

  lines.forEach((line) => {
    const clusterMatch = line.match(/^subgraph (cluster_[^ ]+) \{$/);
    if (clusterMatch) {
      const parentId = currentClusterId();
      const c = ensureCluster(clusterMatch[1]);
      c.parentId = parentId;
      clusterStack.push(clusterMatch[1]);
      return;
    }

    if (line === '}') {
      clusterStack.pop();
      return;
    }

    const labelMatch = line.match(/^label="([^"]+)"$/);
    if (labelMatch && currentClusterId()) {
      clusters[currentClusterId()].label = labelMatch[1];
      return;
    }

    const edgeMatch = line.match(/^"([^"]+)" -- "([^"]+)"(?: \[(.*)\])?;?$/);
    if (edgeMatch) {
      const from = edgeMatch[1];
      const to = edgeMatch[2];
      const attrs = parseEdgeAttrs(edgeMatch[3]);
      const edgeKey = `${from}->${to}`;
      const count = edgeCounts[edgeKey] || 0;
      edgeCounts[edgeKey] = count + 1;
      edges.push({ id: `${edgeKey}#${count}`, from, to, ...attrs });
      return;
    }

    const nodeMatch = line.match(/^"([^"]+)" \[label="([^"]+)"(?:,.*)?\];?$/);
    if (nodeMatch) {
      const nodeId = nodeMatch[1];
      const parsed = parseNodeLabel(nodeMatch[2]);
      nodes[nodeId] = { id: nodeId, ...parsed, clusterId: currentClusterId() };
      addNodeToOpenClusters(nodeId);
      return;
    }

    const nodeRefMatch = line.match(/^"([^"]+)";?$/);
    if (nodeRefMatch) {
      const nodeId = nodeRefMatch[1];
      addNodeToOpenClusters(nodeId);
    }
  });

  return { clusters, nodes, edges };
}

export default function Pen(props) {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [], containers: [] });
  const nodePositions = props.settings.node_positions || {};

  function findByDictId(dictId) {
    return Object.values(props.objlist).find((o) => o.dictId() === dictId);
  }

  function nodeOwnerFromGraphId(nodeId) {
    const suffix = nodeId.includes('-') ? nodeId.split('-').slice(-1)[0] : nodeId;
    if (!suffix.includes('_'))
      return null;
    const idx = suffix.indexOf('_');
    const dictId = `${suffix.slice(0, idx)}.${suffix.slice(idx + 1)}`;
    const owner = findByDictId(dictId);
    return owner ? owner.id : null;
  }

  function subnetIdsByCidr() {
    const ret = {};
    Object.values(props.objlist)
      .filter((o) => o.type === 'subnet' && o.cidr)
      .forEach((s) => {
        if (!ret[s.cidr])
          ret[s.cidr] = [];
        ret[s.cidr] = ret[s.cidr].concat(s.id);
      });
    return ret;
  }

  function updateFromDot(dot) {
    const parsed = parseDot(dot);
    const cidrMap = subnetIdsByCidr();

    const nodes = Object.values(parsed.nodes).map((n) => {
      const ownerId = nodeOwnerFromGraphId(n.id);
      const owner = ownerId ? props.objlist[ownerId] : null;
      let subnetRefs = [];
      n.cidrs.forEach((cidr) => {
        if (cidrMap[cidr])
          subnetRefs = subnetRefs.concat(cidrMap[cidr]);
      });
      subnetRefs = [...new Set(subnetRefs)];
      return {
        id: n.id,
        ownerId: ownerId || n.id,
        type: owner ? owner.type : 'unknown',
        label: n.label,
        cidrText: n.cidrText,
        subnetRefs,
      };
    });

    const rawToContainerId = {};
    Object.values(parsed.clusters).forEach((c) => {
      const vrfLabel = c.label.split(' ')[0];
      rawToContainerId[c.id] = c.id.startsWith('cluster_netns_') ?
        (findByDictId(`netns.${c.label}`)?.id || c.id) :
        (c.id.startsWith('cluster_vrf_') ?
          (findByDictId(`vrf.${vrfLabel}`)?.id || c.id) : c.id);
    });

    const containers = Object.values(parsed.clusters).map((c) => {
      let type = 'group';
      if (c.id.startsWith('cluster_netns_'))
        type = 'netns';
      else if (c.id.startsWith('cluster_vrf_'))
        type = 'vrf';
      return {
        id: rawToContainerId[c.id],
        type,
        label: c.label,
        parentId: c.parentId ? (rawToContainerId[c.parentId] || c.parentId) : null,
        members: c.nodeIds.filter((id) => parsed.nodes[id]),
      };
    }).filter((c) => !(c.id === 'cluster_ebpfprog' && c.members.length === 0));

    setGraph({ nodes, edges: parsed.edges, containers });
  }

  function refreshDot() {
    const postBody = {items: serializeObjList(props.objlist)};
    const requestMetadata = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(postBody),
    };

    fetch(dotUrl, requestMetadata).then((res) => res.text())
      .then((dot) => updateFromDot(dot));
  }

  useEffect(refreshDot, [props.objlist]);

  function updateItem(item) {
    let copy = {...props.objlist};
    copy[item.id] = item;
    props.setObjList(copy);
  }

  function delItem(item) {
    let copy = {...props.objlist};

    delete copy[item.id];
    props.setObjList(copy);
    if (selectedItemId === item.id)
      setSelectedItemId(null);
  }

  const ctx = {
    getObjsByType: (t) => getObjsByType(props.objlist, t),
    getL2Devs: () => getL2Devs(props.objlist),
    getL3Devs: () => getL3Devs(props.objlist),
    getItemById: (id) => getItemById(props.objlist, id),
  };

  function onNewItem(type, name) {
    const ctor = objModels[type];
    const item = new ctor(null, name, type);
    updateItem(item);
    setSelectedItemId(item.id);
  }

  function onPositionChange(itemId, pos) {
    const current = nodePositions[itemId];
    if (current && current.x === pos.x && current.y === pos.y)
      return;
    let settings = {...props.settings};
    settings.node_positions = {...nodePositions, [itemId]: pos};
    props.onSettingsChange(settings);
  }

  function onPositionBatchChange(newPositions) {
    let settings = {...props.settings};
    settings.node_positions = {...nodePositions, ...newPositions};
    props.onSettingsChange(settings);
  }

  return (
    <Provider value={ctx}>
      <div className="node-canvas-shell">
        <NewItem compact onDone={onNewItem}/>
        <NodeCanvas nodes={graph.nodes} itemlist={props.objlist} edges={graph.edges}
          containers={graph.containers}
          positions={nodePositions} selectedItemId={selectedItemId}
          onSelect={setSelectedItemId} onPositionChange={onPositionChange}
          onPositionBatchChange={onPositionBatchChange} />
      </div>
      <NodeDrawer item={selectedItemId ? props.objlist[selectedItemId] : null}
        onClose={() => setSelectedItemId(null)}
        onDelete={delItem} onChange={updateItem} />
    </Provider>
  );
}

Pen.propTypes = {
  objlist: PropTypes.object.isRequired,
  setObjList: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  onSettingsChange: PropTypes.func.isRequired,
};
