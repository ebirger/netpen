import React from 'react';
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import dagre from '@dagrejs/dagre';
import { GetTypeName } from '../Types.js';

const CARD_W = 200;
const CARD_H = 60;
const LAYOUT_NODE_SEP = 24;
const LAYOUT_RANK_SEP = 48;
const LAYOUT_MARGIN = 12;
const CONTAINER_PADDING = 12;
const NODE_CONTAINER_PAD_X = 20;
const NODE_CONTAINER_PAD_TOP = 30;
const NODE_CONTAINER_PAD_BOTTOM = 20;
const NESTED_CONTAINER_PAD = 18;

function computeContainerBounds(containers, visibleItems, positions) {
  const visibleById = {};
  visibleItems.forEach((node) => { visibleById[node.id] = node; });
  const childrenByParent = {};
  containers.forEach((c) => {
    if (!c.parentId)
      return;
    if (!childrenByParent[c.parentId])
      childrenByParent[c.parentId] = [];
    childrenByParent[c.parentId] = childrenByParent[c.parentId].concat(c.id);
  });
  const bounds = {};
  const emptyContainers = [];

  containers.forEach((c) => {
    const members = c.members.filter((id) => visibleById[id]);
    const memberPos = members.map((id) => positions[id]).filter((p) => p);

    let left;
    let top;
    let right;
    let bottom;
    if (memberPos.length === 0) {
      if (childrenByParent[c.id])
        return;
      emptyContainers.push(c.id);
      return;
    }

    left = Math.max(0, Math.min(...memberPos.map((p) => p.x)) - NODE_CONTAINER_PAD_X);
    top = Math.max(0, Math.min(...memberPos.map((p) => p.y)) - NODE_CONTAINER_PAD_TOP);
    right = Math.max(...memberPos.map((p) => p.x + CARD_W)) + NODE_CONTAINER_PAD_X;
    bottom = Math.max(...memberPos.map((p) => p.y + CARD_H)) + NODE_CONTAINER_PAD_BOTTOM;
    bounds[c.id] = { left, top, width: right - left, height: bottom - top };
  });

  // Expand parent containers so nested containers (e.g. VRF inside netns) have breathing room.
  for (let i = 0; i < containers.length; i += 1) {
    let changed = false;
    containers.forEach((c) => {
      if (!c.parentId || !bounds[c.id])
        return;
      const child = bounds[c.id];
      if (!bounds[c.parentId]) {
        const left = Math.max(0, child.left - NESTED_CONTAINER_PAD);
        const top = Math.max(0, child.top - NESTED_CONTAINER_PAD);
        const right = child.left + child.width + NESTED_CONTAINER_PAD;
        const bottom = child.top + child.height + NESTED_CONTAINER_PAD;
        bounds[c.parentId] = { left, top, width: right - left, height: bottom - top };
        changed = true;
        return;
      }

      const p = bounds[c.parentId];
      const oldLeft = p.left;
      const oldTop = p.top;
      const oldRight = p.left + p.width;
      const oldBottom = p.top + p.height;
      const newLeft = Math.max(0, Math.min(oldLeft, child.left - NESTED_CONTAINER_PAD));
      const newTop = Math.max(0, Math.min(oldTop, child.top - NESTED_CONTAINER_PAD));
      const newRight = Math.max(oldRight, child.left + child.width + NESTED_CONTAINER_PAD);
      const newBottom = Math.max(oldBottom, child.top + child.height + NESTED_CONTAINER_PAD);
      if (newLeft !== oldLeft || newTop !== oldTop ||
        newRight !== oldRight || newBottom !== oldBottom) {
        bounds[c.parentId] = {
          left: newLeft,
          top: newTop,
          width: newRight - newLeft,
          height: newBottom - newTop,
        };
        changed = true;
      }
    });
    if (!changed)
      break;
  }

  const graphBottom = Object.values(bounds)
    .reduce((acc, b) => Math.max(acc, b.top + b.height), 0);
  const emptyTop = graphBottom + 16;
  emptyContainers.forEach((id, idx) => {
    const left = 20 + idx * 220;
    const top = emptyTop;
    bounds[id] = { left, top, width: 200, height: 44 };
  });

  return bounds;
}

function buildAutoPositions(items, edges, containers, hiddenIds, basePositions) {
  const visibleItems = items.filter((item) => !hiddenIds.has(item.id));
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({
    rankdir: 'TB',
    nodesep: LAYOUT_NODE_SEP,
    ranksep: LAYOUT_RANK_SEP,
    marginx: LAYOUT_MARGIN,
    marginy: LAYOUT_MARGIN,
  });
  g.setDefaultEdgeLabel(() => ({}));

  visibleItems.forEach((item) => {
    g.setNode(item.id, { width: CARD_W, height: CARD_H });
  });

  containers.forEach((c) => {
    const members = c.members.filter((id) => visibleItems.some((n) => n.id === id));
    if (members.length === 0) {
      const cid = `empty_cluster_${c.id}`;
      g.setNode(cid, { width: 220, height: 80 });
      return;
    }
    g.setNode(c.id, { padding: CONTAINER_PADDING });
    members.forEach((id) => g.setParent(id, c.id));
  });

  const visibleNodeIds = new Set(visibleItems.map((n) => n.id));
  edges.forEach((e) => {
    if (!visibleNodeIds.has(e.from) || !visibleNodeIds.has(e.to))
      return;
    g.setEdge(e.from, e.to);
  });

  dagre.layout(g);

  const positions = {};
  visibleItems.forEach((item) => {
    const n = g.node(item.id);
    if (n) {
      positions[item.id] = { x: n.x - CARD_W / 2, y: n.y - CARD_H / 2 };
    }
  });
  return { ...positions, ...(basePositions || {}) };
}

export default function NodeCanvas(props) {
  const { itemlist, nodes, edges, containers, selectedItemId, onSelect,
    positions, onPositionChange, onPositionBatchChange } = props;
  const [draftPositions, setDraftPositions] = useState(positions || {});
  const dragRef = useRef(null);
  const justDraggedRef = useRef(false);
  const canvasRef = useRef(null);

  const items = nodes;
  const hiddenIds = new Set();
  const visibleItems = items;
  const visibleById = {};
  visibleItems.forEach((node) => { visibleById[node.id] = node; });

  useEffect(() => {
    if (dragRef.current)
      return;
    setDraftPositions(buildAutoPositions(items, edges, containers, hiddenIds, positions || {}));
  }, [positions, nodes, edges, containers]);

  function getNodePos(itemId) {
    return draftPositions[itemId] || { x: 40, y: 40 };
  }

  function dragDistance(d, ev) {
    return Math.abs(ev.clientX - d.startX) + Math.abs(ev.clientY - d.startY);
  }

  useEffect(() => {
    function onMove(ev) {
      if (!dragRef.current)
        return;

      const d = dragRef.current;
      if (dragDistance(d, ev) > 3)
        d.moved = true;

      if (d.kind === 'node') {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.max(0, ev.clientX - rect.left - d.pointerOffsetX);
        const y = Math.max(0, ev.clientY - rect.top - d.pointerOffsetY);
        d.lastPos = { x, y };
        setDraftPositions((prev) => ({ ...prev, [d.itemId]: { x, y } }));
        return;
      }

      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      const batch = {};
      d.memberIds.forEach((id) => {
        const o = d.origins[id];
        batch[id] = { x: Math.max(0, o.x + dx), y: Math.max(0, o.y + dy) };
      });
      d.lastBatch = batch;
      setDraftPositions((prev) => ({ ...prev, ...batch }));
    }

    function onUp() {
      if (!dragRef.current)
        return;

      const d = dragRef.current;
      dragRef.current = null;
      if (d.moved) {
        justDraggedRef.current = true;
        window.setTimeout(() => { justDraggedRef.current = false; }, 0);
      }

      if (d.kind === 'node') {
        if (d.lastPos)
          onPositionChange(d.itemId, d.lastPos);
        else if (draftPositions[d.itemId])
          onPositionChange(d.itemId, draftPositions[d.itemId]);
        return;
      }

      if (d.lastBatch)
        onPositionBatchChange(d.lastBatch);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draftPositions, onPositionChange, onPositionBatchChange]);

  function startNodeDrag(ev, item) {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = getNodePos(item.id);
    dragRef.current = {
      kind: 'node',
      itemId: item.id,
      startX: ev.clientX,
      startY: ev.clientY,
      pointerOffsetX: ev.clientX - rect.left - p.x,
      pointerOffsetY: ev.clientY - rect.top - p.y,
      moved: false,
      lastPos: p,
    };
  }

  function startContainerDrag(ev, container) {
    const memberIds = container.members.filter((id) => visibleById[id]);
    if (memberIds.length === 0)
      return;
    const origins = {};
    memberIds.forEach((id) => { origins[id] = getNodePos(id); });

    dragRef.current = {
      kind: 'container',
      containerId: container.id,
      memberIds,
      origins,
      startX: ev.clientX,
      startY: ev.clientY,
      moved: false,
      lastBatch: null,
    };
  }

  const containerBounds = computeContainerBounds(containers, visibleItems, draftPositions);
  const renderedContainers = containers
    .map((c) => {
      const b = containerBounds[c.id];
      if (!b)
        return null;
      return { ...c, bounds: b, area: b.width * b.height };
    })
    .filter((c) => c)
    .sort((a, b) => b.area - a.area);

  return (
    <div className="node-canvas" ref={canvasRef} onClick={() => onSelect(null)}>
      {renderedContainers.map((c) => {
        const b = c.bounds;
        let cls = c.type === 'netns' ? 'node-container node-container-netns' :
          'node-container node-container-vrf';
        if (selectedItemId === c.id)
          cls += ' node-container-selected';

        return (
          <div key={c.id} className={cls}
            onClick={(e) => {
              e.stopPropagation();
              if (justDraggedRef.current)
                return;
              onSelect(c.id);
            }}
            onMouseDown={(e) => {
              if (e.button !== 0)
                return;
              e.stopPropagation();
              startContainerDrag(e, c);
            }}
            style={{ left: `${b.left}px`, top: `${b.top}px`,
              width: `${b.width}px`, height: `${b.height}px` }}>
            <span className="node-container-title">{c.label}</span>
          </div>
        );
      })}
      <svg className="node-edges">
        {edges.map((e, ei) => {
          if (!visibleById[e.from] || !visibleById[e.to])
            return null;
          const from = getNodePos(e.from);
          const to = getNodePos(e.to);
          const x1 = from.x + CARD_W / 2;
          const y1 = from.y + CARD_H / 2;
          const x2 = to.x + CARD_W / 2;
          const y2 = to.y + CARD_H / 2;
          const samePair = edges.filter((oe) =>
            (oe.from === e.from && oe.to === e.to) ||
            (oe.from === e.to && oe.to === e.from));
          const sameIdx = samePair.findIndex((oe) => oe.id === e.id);
          const spread = (sameIdx - (samePair.length - 1) / 2) * 20;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.max(1, Math.hypot(dx, dy));
          const cx = mx - (dy / len) * spread;
          const cy = my + (dx / len) * spread;
          const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
          return (
            <g key={e.id}>
              <path
                d={path}
                className="node-edge-line"
                style={e.color ? { stroke: e.color } : {}}
              />
              {e.label ? (
                <text
                  x={cx}
                  y={cy - 6}
                  className="node-edge-label"
                >
                  {e.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {visibleItems.map((item) => {
        const p = getNodePos(item.id);
        const isSelected = item.id === selectedItemId || item.ownerId === selectedItemId;
        const cls = isSelected ? 'node-card node-card-selected' : 'node-card';
        const subnetRefs = item.subnetRefs || [];
        return (
          <div
            key={item.id}
            className={cls}
            style={{ left: `${p.x}px`, top: `${p.y}px` }}
            onClick={(e) => {
              e.stopPropagation();
              if (justDraggedRef.current)
                return;
              onSelect(item.ownerId || item.id);
            }}
            onMouseDown={(e) => {
              if (e.button !== 0)
                return;
              e.stopPropagation();
              startNodeDrag(e, item);
            }}
          >
            <div className="node-card-type">{GetTypeName(item.type) || item.type}</div>
            <div className="node-card-name">{item.label}</div>
            {item.cidrText ? <div className="node-card-cidr">{item.cidrText}</div> : <span />}
            {subnetRefs.length > 0 ? (
              <div className="node-subnet-refs">
                {subnetRefs.map((sid) => (
                  <button key={sid} className="node-subnet-ref"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(sid);
                    }}>
                    {itemlist[sid] ? itemlist[sid].displayName() : sid}
                  </button>
                ))}
              </div>
            ) : <span />}
          </div>
        );
      })}
    </div>
  );
}

NodeCanvas.propTypes = {
  nodes: PropTypes.array.isRequired,
  itemlist: PropTypes.object.isRequired,
  edges: PropTypes.array.isRequired,
  containers: PropTypes.array.isRequired,
  positions: PropTypes.object.isRequired,
  selectedItemId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onPositionChange: PropTypes.func.isRequired,
  onPositionBatchChange: PropTypes.func.isRequired,
};
