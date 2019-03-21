console.time();

const roundUp = (value, precision) => {
  const multiplier = Math.pow(10, precision || 0);
  return Math.ceil(value * multiplier) / multiplier;
};

const minMax = (min, max, value) => Math.min(max, Math.max(min, value));
const forEachKey = (obj, fn) => Object.keys(obj).forEach((key, index) => fn(key, obj[key], index));
const setAttributes = (node, attrs) => forEachKey(attrs, (key, value) => node.setAttribute(key, value));
const setAttributesNS = (node, attrs) => forEachKey(attrs, (key, value) => node.setAttributeNS(null, key, value));
const appendChilds = (node, childs) => childs.forEach(child => node.appendChild(child));

const LineCarousel = function LineCarousel(value, style) {
  const node = document.createElement('div');
  setAttributes(node, {
    class: 'y-lines',
  });
  appendChilds(node, [
    document.createElement('div'),
    document.createElement('div'),
    document.createElement('div'),
  ]);
  forEachKey(style, (key, val) => {
    node.style[key] = val;
  });

  const childs = node.childNodes;
  const currentClass = 'current y-lines__group';
  const classes = [
    'down y-lines__group',
    currentClass,
    'up y-lines__group',
  ];
  childs.forEach((child, index) => {
    child.setAttribute('class', classes[index]);
    value.forEach(lineValue => {
      const line = document.createElement('div');
      line.innerText = lineValue;
      child.insertBefore(line, child.firstChild);
    });
  });

  const setNewValue = (newValue, currentIndex, direction) => (child, index) => {
    child.setAttribute('class', classes[index]);
    let nextIndex = 0;
    if (direction > 0) {
      nextIndex = index + direction <= childs.length - 1
        ? index + direction
        : 0;
    } else if (direction < 0) {
      nextIndex = index + direction >= 0
        ? index + direction
        : childs.length - 1;
    }
    if (nextIndex === currentIndex) {
      child.setAttribute('style', 'transition: none;');
    } else {
      child.removeAttribute('style');
    }
    if (classes[index] === currentClass) {
      const yLines = child.childNodes;
      newValue.forEach((lineValue, i) => {
        yLines[yLines.length - 1 - i].innerText = lineValue;
      });
    }
  };

  this.up = newValue => {
    const currentIndex = classes.indexOf(currentClass);
    classes.unshift(classes.pop());
    childs.forEach(setNewValue(newValue, currentIndex, 1));
  };
  this.down = newValue => {
    const currentIndex = classes.indexOf(currentClass);
    classes.push(classes.shift());
    childs.forEach(setNewValue(newValue, currentIndex, -1));
  };
  this.node = node;
};

const Labels = function Labels(labels, style) {
  const node = document.createElement('div');
  const scrollGroup = document.createElement('div');
  const styleNode = document.createElement('style');

  node.appendChild(scrollGroup);
  scrollGroup.setAttribute('class', 'x-labels__scroll-group');
  node.setAttribute('class', 'x-labels');

  forEachKey(style, (key, val) => {
    node.style[key] = val;
  });

  labels.forEach(label => {
    const labelNode = document.createElement('div');
    labelNode.innerText = label;
    scrollGroup.appendChild(labelNode);
  });

  let nodeWidth = scrollGroup.scrollWidth;
  const labelWidth = 100;
  let labelsCount = Math.floor(nodeWidth / labelWidth);
  node.appendChild(styleNode);

  const updateStyle = hiddenLabelsCount => {
    styleNode.innerHTML = `
      .x-labels__scroll-group > div {
        opacity: 0;
      }
      .x-labels__scroll-group > div:nth-child(${hiddenLabelsCount}n+1) {
        opacity: 1;
      }
    `;
  };
  this.updateWidth = () => {
    const scrollWidth = scrollGroup.scrollWidth;
    if (nodeWidth !== scrollWidth) {
      nodeWidth = scrollWidth;
    }
    const tempLabelsCount = Math.floor(nodeWidth / labelWidth);
    if (labelsCount !== tempLabelsCount) {
      labelsCount = tempLabelsCount;
      const hiddenLabelsCount = Math.floor(labels.length / labelsCount);
      updateStyle(hiddenLabelsCount);
    }
  };
  this.setPosition = (leftPercent, valuePercent) => {
    this.updateWidth();
    const width = 1 / valuePercent * 100;
    const left = leftPercent * 100;
    setAttributes(scrollGroup, {
      style: `
        width: ${width}%;
        transform: translateX(${-left}%);
      `,
    });
  };
  this.node = node;
};

const RangeSelector = function RangeSelector(style) {
  const range = {
    width: 0,
    left: 0,
    leftPercent: 0,
    right: 0,
    value: 0,
    valuePercent: 1,
  };
  const cursor = {
    offsetX: 0,
    startX: 0,
  };
  const minAreaWidth = 80;

  let leftOld = 0;
  let rightOld = 0;
  let leftMax = 0;
  let rightMax = 0;
  let change = () => {};

  const node = document.createElement('div');
  const rangeArea = document.createElement('div');
  const areaHandle = document.createElement('div');
  const leftHandle = document.createElement('div');
  const rightHandle = document.createElement('div');
  const overflowLeft = document.createElement('div');
  const overflowRight = document.createElement('div');

  node.setAttribute('class', 'range-controls');
  node.style.display = 'grid';
  node.style.gridTemplateColumns = `${0}px 1fr ${0}px`;

  forEachKey(style, (key, value) => {
    node.style[key] = value;
  });

  rangeArea.setAttribute('class', 'range-controls__area');
  areaHandle.setAttribute('class', 'range-controls__area-handle');
  leftHandle.setAttribute('class', 'range-controls__handle');
  rightHandle.setAttribute('class', 'range-controls__handle');
  overflowLeft.setAttribute('class', 'range-controls__overflow');
  overflowRight.setAttribute('class', 'range-controls__overflow');

  appendChilds(rangeArea, [
    leftHandle,
    areaHandle,
    rightHandle,
  ]);
  appendChilds(node, [
    overflowLeft,
    rangeArea,
    overflowRight,
  ]);

  let handle = null;

  const mouseMove = event => {
    if (handle === null) return;
    if (event.touches) {
      cursor.offsetX = event.touches[0].clientX - cursor.startX;
    } else {
      cursor.offsetX = event.clientX - cursor.startX;
    }

    range.width = range.width || node.offsetWidth;
    leftMax = range.width - minAreaWidth - range.right;
    rightMax = range.width - minAreaWidth - range.left;

    if (handle === 'left') {
      range.left = minMax(0, leftMax, leftOld + cursor.offsetX);
      range.leftPercent = range.left / range.width;
    }

    if (handle === 'right') {
      range.right = minMax(0, rightMax, rightOld - cursor.offsetX);
    }

    range.value = range.width - range.right - range.left;
    range.valuePercent = range.value / range.width;

    if (handle === 'area') {
      range.left = minMax(0, range.width - range.value, leftOld + cursor.offsetX);
      range.leftPercent = range.left / range.width;
      range.right = minMax(0, range.width - range.value, rightOld - cursor.offsetX);
    }

    node.style.gridTemplateColumns = `${range.left}px 1fr ${range.right}px`;
    change(range);
  };
  const mouseUp = () => {
    if (handle !== null) {
      leftOld = range.left;
      rightOld = range.right;
    }
    handle = null;
    cursor.startX = 0;
  };

  const setHandleStart = handleName => event => {
    handle = handleName;
    if (event.touches) {
      cursor.startX = event.touches[0].clientX;
      return;
    }
    cursor.startX = event.clientX;
  };
  const mouseDownArea = setHandleStart('area');
  const mouseDownLeft = setHandleStart('left');
  const mouseDownRight = setHandleStart('right');

  const listeners = {
    add: (target, eventList, fn) => eventList.split(' ').forEach(event => target.addEventListener(event, fn)),
    remove: (target, eventList, fn) => eventList.split(' ').forEach(event => target.removeEventListener(event, fn)),
  };

  listeners.add(leftHandle, 'mousedown touchstart', mouseDownLeft);
  listeners.add(areaHandle, 'mousedown touchstart', mouseDownArea);
  listeners.add(rightHandle, 'mousedown touchstart', mouseDownRight);
  listeners.add(node, 'touchmove', mouseMove);
  listeners.add(node, 'touchend', mouseUp);
  const addEventListeners = () => {
    listeners.add(window, 'mousemove', mouseMove);
    listeners.add(window, 'mouseup', mouseUp);
  };
  const removeEventListeners = () => {
    listeners.remove(window, 'mousemove', mouseMove);
    listeners.remove(window, 'mouseup', mouseUp);
    listeners.remove(window, 'mouseup', removeEventListeners);
  };
  listeners.add(node, 'mouseenter', addEventListeners);
  listeners.add(window, 'mouseleave', removeEventListeners);

  this.node = node;
  this.range = range;
  this.onChange = cb => {
    change = cb;
  };
};

const Chart = function Chart(appendNode, {
  data,
  gap = 50,
  previewHeight: previewWrapperHeight = 300,
  previewStrokeWidth = 2,
  chartHeight = 50,
  chartStrokeWidth = 1,
}) {
  const xmlns = 'http://www.w3.org/2000/svg';
  const xlinkns = 'http://www.w3.org/1999/xlink';

  const svgWrapper = document.createElement('div');
  const svg = document.createElementNS(xmlns, 'svg');
  const chart = document.createElementNS(xmlns, 'symbol');
  const useChart = document.createElementNS(xmlns, 'use');
  const preview = document.createElementNS(xmlns, 'symbol');
  const previewUseChart = document.createElementNS(xmlns, 'use');
  const usePreview = document.createElementNS(xmlns, 'use');

  const timeInc = 1000 * 3600 * 24;
  const formatX = x => x / timeInc;
  const unformatX = x => x * timeInc;
  const chartTop = previewWrapperHeight + gap;
  const svgHeight = previewWrapperHeight + gap + chartHeight;

  const types = data.types;
  const names = data.names;
  const colors = data.colors;
  let lines = [];
  let xPoints = [];
  let xLabels = [];

  data.columns.forEach(column => {
    const [name, ...points] = column;
    if (types[name] === 'x') {
      xPoints = points;
      xLabels = points.map(point => (
        new Date(point)
          .toDateString()
          .split(' ')
          .splice(1, 2)
          .join(' ')
      ));
      return;
    }
    lines = lines.length > 0 ? lines.concat([column]) : [].concat([column]);
  });

  const getViewedX = (startXIndex, endXIndex) => {
    const start = xPoints[startXIndex];
    const end = xPoints[endXIndex];
    const range = end - start;

    return {
      start,
      end,
      range,
      formattedStart: formatX(start),
      formattedEnd: formatX(end),
      formattedRange: formatX(range),
    };
  };
  const getViewedY = (startIndex, endIndex) => {
    const viewedYPoints = lines
      .map(([, ...points]) => points.splice(startIndex, endIndex - startIndex))
      .flat();
    const endY = Math.max(...viewedYPoints);
    const k = endY.toString().length - 2;
    const step = roundUp(endY / 6, -k);
    const steps = [];
    for (let i = 0; i < 6; i++) {
      steps[i] = step * i;
    }

    return {
      start: 0,
      end: endY,
      steps,
      step,
    };
  };

  const x = { ...getViewedX(0, xPoints.length - 1) };
  const y = { ...getViewedY(0, xPoints.length - 1) };
  let viewedY = y;
  let previewProps = {
    x: 0,
    width: x.formattedRange,
    transform: `translate(0, 0) scale(1, 1)`,
  };

  const rangeSelector = new RangeSelector({
    height: `${chartHeight}px`,
    width: '100%',
    position: 'absolute',
    top: `${chartTop}px`,
  });
  const carousel = new LineCarousel(viewedY.steps, {
    height: `${previewWrapperHeight}px`,
    width: '100%',
    position: 'absolute',
    top: `${0}px`,
  });
  const labels = new Labels(xLabels, {
    width: '100%',
    position: 'absolute',
    top: `${previewWrapperHeight}px`,
  });

  const createPolylines = () => {
    lines.forEach(([name, ...yPoints]) => {
      const polyline = document.createElementNS(xmlns, 'polyline');
      const points = yPoints.map((yPoint, index) => [formatX(xPoints[index]), -yPoint]).join(' ');

      setAttributesNS(polyline, {
        points,
        stroke: colors[name],
        'vector-effect': 'non-scaling-stroke',
        fill: 'none',
      });
      chart.appendChild(polyline);
    });
  };

  const updatePreview = (leftPercent, valuePercent) => {
    const viewedStartX = x.start + (x.range * leftPercent);
    const viewedStartXIndex = minMax(0, xPoints.length - 1, xPoints.findIndex(point => point >= viewedStartX) - 1);
    const viewedEndX = x.start + (x.range * (leftPercent + valuePercent));
    const viewedEndXIndex = minMax(0, xPoints.length - 1, xPoints.findIndex(point => point >= viewedEndX) + 1);
    const tempViewedY = { ...getViewedY(viewedStartXIndex, viewedEndXIndex) };

    if (viewedY.end < tempViewedY.end) {
      carousel.up(tempViewedY.steps);
      viewedY = tempViewedY;
    } else if (viewedY.end > tempViewedY.end) {
      carousel.down(tempViewedY.steps);
      viewedY = tempViewedY;
    }
    labels.setPosition(leftPercent, valuePercent);

    const topPercent = ((viewedY.steps[5] + viewedY.step) - y.end) / y.end;
    const heightPercent = (viewedY.steps[5] + viewedY.step) / y.end;
    const previewWidth = x.formattedRange / valuePercent;
    const previewX = -(leftPercent * previewWidth);
    const previewHeight = previewWrapperHeight / heightPercent;
    const previewTop = (topPercent * previewHeight);
    const transform = `translate(0, ${previewTop}) scale(1, ${1 / heightPercent})`;

    setAttributesNS(previewUseChart, {
      ...previewProps.x !== previewX && {
        x: previewX,
      },
      ...previewProps.width !== previewWidth && {
        width: previewWidth,
      },
      ...previewProps.transform !== transform && {
        transform,
      },
    });
    previewProps = {
      x: previewX,
      width: previewWidth,
      transform,
    };
  };

  const initPreview = () => {
    preview.id = 'preview';
    previewUseChart.setAttributeNS(xlinkns, 'xlink:href', '#chart');
    setAttributesNS(previewUseChart, {
      x: 0,
      y: 0,
      width: x.formattedRange,
      height: previewWrapperHeight,
      style: 'transition: transform .3s;',
    });
    usePreview.setAttributeNS(xlinkns, 'xlink:href', '#preview');
    setAttributesNS(usePreview, {
      x: 0,
      y: 0,
      height: previewWrapperHeight,
      'stroke-width': previewStrokeWidth,
    });

    preview.appendChild(previewUseChart);
    appendChilds(svg, [
      preview,
      usePreview,
    ]);
  };

  const initChart = () => {
    chart.id = 'chart';
    setAttributesNS(chart, {
      viewBox: `${x.formattedStart} ${-y.end} ${x.formattedRange} ${y.end}`,
      preserveAspectRatio: 'none',
      width: '100%',
      height: chartHeight,
    });
    useChart.setAttributeNS(xlinkns, 'xlink:href', '#chart');
    setAttributesNS(useChart, {
      x: 0,
      y: chartTop,
      height: chartHeight,
      'stroke-width': chartStrokeWidth,
    });

    svg.appendChild(chart);
    svg.appendChild(useChart);
    createPolylines();
  };

  const initSvg = () => {
    setAttributes(svgWrapper, {
      class: 'chart',
      style: 'position:relative;',
    });
    setAttributesNS(svg, {
      viewBox: `0 0 ${x.formattedRange} ${svgHeight}`,
      preserveAspectRatio: 'none',
      width: '100%',
      height: svgHeight,
    });
    initPreview();
    initChart();
    appendChilds(svgWrapper, [
      svg,
      carousel.node,
      labels.node,
      rangeSelector.node,
    ]);
  };

  initSvg();
  appendNode.appendChild(svgWrapper);
  labels.updateWidth();
  rangeSelector.onChange(({ leftPercent, valuePercent }) => updatePreview(leftPercent, valuePercent));
  updatePreview(0, 1);
  return this;
};

