console.time();

const minMax = (min, max, value) => Math.min(max, Math.max(min, value));
const forEachKey = (obj, fn) => Object.keys(obj).forEach(key => fn(key, obj[key]));
const setAttributes = (node, attrs) => forEachKey(attrs, (key, value) => node.setAttribute(key, value));
const setAttributesNS = (node, attrs) => forEachKey(attrs, (key, value) => node.setAttributeNS(null, key, value));
const appendChilds = (node, childs) => childs.forEach(child => node.appendChild(child));

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

  listeners.add(leftHandle, 'mousedown touchstart pointerdown', mouseDownLeft);
  listeners.add(areaHandle, 'mousedown touchstart pointerdown', mouseDownArea);
  listeners.add(rightHandle, 'mousedown touchstart pointerdown', mouseDownRight);
  listeners.add(node, 'touchmove', mouseMove);
  listeners.add(node, 'touchend', mouseUp);
  const addEventListeners = () => {
    listeners.add(window, 'mousemove pointermove', mouseMove);
    listeners.add(window, 'mouseup pointerup', mouseUp);
  };
  const removeEventListeners = () => {
    listeners.remove(window, 'mousemove pointermove', mouseMove);
    listeners.remove(window, 'mouseup pointerup', mouseUp);
    listeners.remove(window, 'mouseup pointerup', removeEventListeners);
  };
  listeners.add(node, 'mouseenter pointerenter', addEventListeners);
  listeners.add(window, 'mouseleave pointerleave', removeEventListeners);

  this.node = node;
  this.range = range;
  this.onChange = cb => {
    change = cb;
  };
};

const newChart = chartData => {
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
  const chartHeight = 100;
  const chartTop = 300;
  const previewWrapperHeight = 300;

  const types = chartData.types;
  const names = chartData.names;
  const colors = chartData.colors;
  let lines = [];
  let xPoints = [];

  chartData.columns.forEach(column => {
    const [name, ...points] = column;
    if (types[name] === 'x') {
      xPoints = points;
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
    const startY = Math.min(...viewedYPoints);
    const endY = Math.max(...viewedYPoints);

    return {
      start: Math.min(...viewedYPoints),
      end: Math.max(...viewedYPoints),
      range: endY - startY,
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

  const createPolylines = () => {
    lines.forEach(([name, ...yPoints]) => {
      const polyline = document.createElementNS(xmlns, 'polyline');
      const points = yPoints.map((yPoint, index) => [formatX(xPoints[index]), yPoint]).join(' ');

      setAttributesNS(polyline, {
        points,
        stroke: colors[name],
        strokeWidth: 1,
        'vector-effect': 'non-scaling-stroke',
        fill: 'none',
      });
      chart.appendChild(polyline);
    });
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
    });

    preview.appendChild(previewUseChart);
    appendChilds(svg, [
      preview,
      usePreview,
    ]);
  };

  const updatePreview = (leftPercent, valuePercent) => {
    const viewedStartX = unformatX(x.formattedStart + (x.formattedRange * leftPercent));
    const viewedStartXIndex = minMax(0, xPoints.length - 1, xPoints.findIndex(point => point >= viewedStartX) - 1);
    const viewedEndX = unformatX(x.formattedEnd - (x.formattedRange * (1 - leftPercent - valuePercent)));
    const viewedEndXIndex = minMax(0, xPoints.length - 1, xPoints.findIndex(point => point >= viewedEndX) + 1);
    viewedY = { ...getViewedY(viewedStartXIndex, viewedEndXIndex) };

    const topPercent = (viewedY.start - y.start) / y.range;
    const heightPercent = viewedY.range / y.range;
    const previewWidth = x.formattedRange / valuePercent;
    const previewX = -(leftPercent * previewWidth);
    const previewHeight = previewWrapperHeight / heightPercent;
    const previewTop = -(topPercent * previewHeight);
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

  const initChart = () => {
    chart.id = 'chart';
    setAttributesNS(chart, {
      viewBox: `${x.formattedStart} ${y.start} ${x.formattedRange} ${y.range}`,
      preserveAspectRatio: 'none',
      width: '100%',
      height: chartHeight,
    });
    useChart.setAttributeNS(xlinkns, 'xlink:href', '#chart');
    setAttributesNS(useChart, {
      x: 0,
      y: chartTop,
      height: chartHeight,
    });

    svg.appendChild(chart);
    svg.appendChild(useChart);
    createPolylines();
  };

  const rangeSelector = new RangeSelector({
    height: `${chartHeight}px`,
    width: '100%',
    position: 'absolute',
    top: `${chartTop}px`,
  });

  rangeSelector.onChange(({ leftPercent, valuePercent }) => updatePreview(leftPercent, valuePercent));

  const initSvg = () => {
    setAttributes(svgWrapper, {
      class: 'chart',
      style: 'position:relative;',
    });
    setAttributesNS(svg, {
      viewBox: `0 0 ${x.formattedRange} ${previewWrapperHeight + chartHeight}`,
      preserveAspectRatio: 'none',
      width: '100%',
      height: previewWrapperHeight + chartHeight,
    });
    initPreview();
    initChart();
    appendChilds(svgWrapper, [
      svg,
      rangeSelector.node,
    ]);
  };

  initSvg();

  return svgWrapper;
};

