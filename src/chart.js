const generateId = () => Math.round(Math.random() * 1000000);

const roundUp = (value, precision) => {
  const multiplier = Math.pow(10, precision || 0);
  return Math.ceil(Math.ceil(value * multiplier) / multiplier);
};

const minMax = (min, max, value) => Math.min(max, Math.max(min, value));
const forEachKey = (obj, fn) => Object.keys(obj).forEach((key, index) => fn(key, obj[key], index));
const setAttributes = (node, attrs) => forEachKey(attrs, (key, value) => node.setAttribute(key, value));
const setAttributesNS = (node, attrs) => forEachKey(attrs, (key, value) => node.setAttributeNS(null, key, value));
const setStyle = (node, style) => forEachKey(style, (key, val) => {
  node.style[key] = val;
});
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

  if (style) {
    setStyle(node, style);
  }

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
  const groupId = `scroll-group-${generateId()}`;

  node.appendChild(scrollGroup);
  node.setAttribute('class', 'x-labels');
  scrollGroup.setAttribute('class', `x-labels__scroll-group ${groupId}`);

  if (style) {
    setStyle(node, style);
  }

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
      .x-labels__scroll-group.${groupId} > div:nth-child(${hiddenLabelsCount}n+1) {
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
  this.setPosition = (leftPercent, widthPercent) => {
    this.updateWidth();
    const labelsLength = labels.length - 1;
    const width = 1 / widthPercent * 100;
    const left = (leftPercent - leftPercent / labelsLength) * 100;
    const columnWidth = width / labelsLength;
    setStyle(scrollGroup, {
      width: `${width + columnWidth}%`,
      transform: `translateX(${-left}%)`,
      left: `${-columnWidth / 2}%`,
    });
  };
  this.node = node;
};

const Tooltips = function Tooltips(xPoints, lines, colors, style) {
  const node = document.createElement('div');
  const scrollGroup = document.createElement('div');
  const hilight = document.createElement('div');
  const tooltip = document.createElement('div');

  node.appendChild(scrollGroup);
  scrollGroup.appendChild(hilight);
  node.setAttribute('class', 'tooltips');
  scrollGroup.setAttribute('class', 'tooltips__scroll-group');
  hilight.setAttribute('class', 'tooltips__hilight');
  tooltip.setAttribute('class', 'tooltips__tooltip');

  let chartYRange = 0;
  const points = [];
  const tooltipValues = [];
  const tooltipDate = document.createElement('span');
  let getTooltipData = () => {};

  tooltip.appendChild(tooltipDate);
  lines.forEach((line, index) => {
    const point = document.createElement('div');
    const tooltipValue = document.createElement('span');
    point.setAttribute('class', 'tooltips__point');
    tooltipValue.setAttribute('class', 'tooltips__value');
    points[index] = point;
    tooltipValues[index] = tooltipValue;
    hilight.appendChild(point);
    tooltip.appendChild(tooltipValue);
  });
  hilight.appendChild(tooltip);

  const updatePoints = index => {
    tooltipDate.innerText = xPoints[index];
    lines.forEach((line, i) => {
      tooltipValues[i].innerHTML = `<span>${line[index + 1].toLocaleString()}</span>${line[0]}`;
      const bottom = line[index + 1] / chartYRange * 100;
      setStyle(points[i], {
        'border-color': colors[line[0]],
        bottom: `${bottom}%`,
      });
      tooltipValues[i].style.color = colors[line[0]];
    });
  };

  if (style) {
    setStyle(node, style);
  }

  node.addEventListener('mouseenter', () => {
    node.classList.add('tooltips--active');
  });
  node.addEventListener('mouseleave', () => {
    node.classList.remove('tooltips--active');
  });

  xPoints.forEach((xPoint, index) => {
    const tooltipArea = document.createElement('div');
    tooltipArea.addEventListener('mouseover', () => {
      const left = tooltipArea.offsetLeft;
      const width = tooltipArea.offsetWidth;
      setStyle(hilight, {
        left: `${left + width / 2}px`,
      });
      updatePoints(index);
    });
    scrollGroup.appendChild(tooltipArea);
  });

  this.setPosition = (leftPercent, widthPercent, yRange) => {
    chartYRange = yRange;
    const pointsLength = xPoints.length - 1;
    const width = 1 / widthPercent * 100;
    const left = (leftPercent - leftPercent / pointsLength) * 100;
    const columnWidth = width / pointsLength;
    setStyle(scrollGroup, {
      width: `${width + columnWidth}%`,
      transform: `translateX(${-left}%)`,
      left: `${-columnWidth / 2}%`,
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
    widthPercent: 1,
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

  if (style) {
    setStyle(node, style);
  }

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
    range.widthPercent = range.value / range.width;

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

const LegendCheckboxes = function LegendCheckboxes(names, colors, style) {
  const node = document.createElement('div');
  let change = () => {};

  node.setAttribute('class', 'legend');

  forEachKey(names, (key, val) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    const value = document.createElement('span');
    setAttributes(label, {
      class: 'legend__label',
      style: '',
    });
    value.innerHTML = `
      <i class='check' style='background-color: ${colors[key]};'></i>
      <span>${val}</span>
    `;
    setAttributes(input, {
      type: 'checkbox',
      value: key,
      title: val,
      checked: 'true',
    });
    input.addEventListener('change', event => {
      change(event.target.value, event.target.checked);
    });
    label.appendChild(input);
    label.appendChild(value);
    node.appendChild(label);
  });

  if (style) {
    setStyle(node, style);
  }
  this.onChange = cb => {
    change = cb;
  };
  this.node = node;
};

const Chart = function Chart(appendNode, {
  data,
  previewHeight,
}) {
  const xmlns = 'http://www.w3.org/2000/svg';
  const xlinkns = 'http://www.w3.org/1999/xlink';

  const node = document.createElement('div');
  const svg = {
    node: document.createElementNS(xmlns, 'svg'),
    symbol: document.createElementNS(xmlns, 'symbol'),
  };
  const range = {
    node: document.createElement('div'),
    svg: document.createElementNS(xmlns, 'svg'),
    use: document.createElementNS(xmlns, 'use'),
    height: 50,
    strokeWidth: 1,
  };
  const preview = {
    node: document.createElement('div'),
    svg: document.createElementNS(xmlns, 'svg'),
    use: document.createElementNS(xmlns, 'use'),
    height: previewHeight || 300,
    strokeWidth: 2,
  };

  const timeTick = 1000 * 3600 * 24;
  const formatX = x => x / timeTick;

  const types = data.types;
  const names = data.names;
  const colors = data.colors;
  const polylines = [];
  let hiddenLines = [];
  let lines = [];
  let xPoints = [];
  let xLabels = [];
  let previewLeftPercent = 0;
  let previewWidthPercent = 1;

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

    return {
      start,
      end,
      range: end - start,
      formattedStart: formatX(start),
      formattedEnd: formatX(end),
      formattedRange: formatX(end - start),
    };
  };
  const getViewedY = (startIndex, endIndex) => {
    const viewedYPoints = lines.flatMap(([name, ...points]) => (
      hiddenLines.includes(name)
        ? []
        : points.splice(startIndex, endIndex - startIndex)
    ));
    const endY = Math.max(...viewedYPoints);
    const k = endY.toString().length - 2;
    const step = roundUp(endY / 6, -k);
    const steps = [];
    const formattedSteps = [];
    for (let i = 0; i < 6; i++) {
      steps[i] = step * i;
      const formattedStep = (
        (k + 1 >= 9 && `${(step * i) / 1000000000}B`) ||
        (k + 1 >= 6 && `${(step * i) / 1000000}M`) ||
        (k + 1 >= 3 && `${(step * i) / 1000}K`) ||
        `${step * i}`
      );
      formattedSteps[i] = formattedStep;
    }

    return {
      start: 0,
      end: endY,
      steps,
      formattedSteps,
      step,
    };
  };

  const initedX = { ...getViewedX(0, xPoints.length - 1) };
  const initedY = { ...getViewedY(0, xPoints.length - 1) };
  let viewedY = initedY;
  let previewProps = {
    x: 0,
    width: initedX.formattedRange,
    transform: `scale(1, 1)`,
  };

  const yLines = new LineCarousel(viewedY.formattedSteps, {
    height: `${preview.height}px`,
    width: '100%',
    position: 'absolute',
    top: `${0}px`,
  });
  preview.yLines = yLines.node;

  const labels = new Labels(xLabels);
  preview.labels = labels.node;

  const tooltips = new Tooltips(xLabels, lines, colors);
  preview.tooltips = tooltips.node;

  const rangeSelector = new RangeSelector();
  range.selector = rangeSelector.node;

  const legend = new LegendCheckboxes(names, colors);

  const createPolylines = () => {
    lines.forEach(([name, ...yPoints], index) => {
      const polyline = document.createElementNS(xmlns, 'polyline');
      const points = yPoints.map((yPoint, i) => [formatX(xPoints[i]), -yPoint]).join(' ');

      setAttributesNS(polyline, {
        points,
        stroke: colors[name],
        'vector-effect': 'non-scaling-stroke',
        fill: 'none',
      });
      svg.symbol.appendChild(polyline);
      polylines[index] = polyline;
    });
  };

  const updatePolylines = () => {
    lines.forEach((line, index) => {
      setAttributesNS(polylines[index], {
        style: hiddenLines.includes(line[0])
          ? 'opacity: 0;'
          : 'opacity: 1;',
      });
    });
  };

  const initSvg = () => {
    const id = `chart-${generateId()}`;
    svg.symbol.id = id;
    preview.use.setAttributeNS(xlinkns, 'xlink:href', `#${id}`);
    range.use.setAttributeNS(xlinkns, 'xlink:href', `#${id}`);
    setAttributesNS(svg.node, {
      style: 'display: none;',
    });
    setAttributesNS(svg.symbol, {
      viewBox: `${initedX.formattedStart} ${-initedY.end} ${initedX.formattedRange} ${initedY.end}`,
      preserveAspectRatio: 'none',
    });

    createPolylines();
    svg.node.appendChild(svg.symbol);
  };

  const initPreview = () => {
    preview.node.setAttribute('class', 'chart__preview');
    setAttributesNS(preview.svg, {
      height: preview.height,
      width: '100%',
      preserveAspectRatio: 'none',
      'stroke-width': preview.strokeWidth,
    });
    setAttributesNS(preview.use, {
      x: `${previewLeftPercent * 100}%`,
      y: 0,
      width: `${previewWidthPercent * 100}%`,
      'transform-origin': 'bottom',
      style: 'transition: transform .3s;',
    });
    preview.svg.appendChild(preview.use);
    appendChilds(preview.node, [
      preview.svg,
      preview.yLines,
      preview.tooltips,
    ]);
  };

  const updatePreview = (leftPercent = previewLeftPercent, widthPercent = previewWidthPercent) => {
    previewLeftPercent = leftPercent;
    previewWidthPercent = widthPercent;

    const viewedStartX = initedX.start + (initedX.range * leftPercent);
    const viewedEndX = initedX.start + (initedX.range * (leftPercent + widthPercent));
    const startXIndex = minMax(0, xPoints.length - 1, xPoints.findIndex(point => point >= viewedStartX) - 1);
    const endXIndex = minMax(0, xPoints.length - 1, xPoints.findIndex(point => point >= viewedEndX) + 1);
    const tempViewedY = { ...getViewedY(startXIndex, endXIndex) };

    if (viewedY.end < tempViewedY.end) {
      yLines.up(tempViewedY.formattedSteps);
      viewedY = tempViewedY;
    } else if (viewedY.end > tempViewedY.end) {
      yLines.down(tempViewedY.formattedSteps);
      viewedY = tempViewedY;
    }
    const heightPercent = initedY.end / (viewedY.steps[5] + viewedY.step);
    const previewWidth = `${1 / widthPercent * 100}%`;
    const previewX = `${-leftPercent / widthPercent * 100}%`;
    const transform = `scale(1, ${heightPercent})`;

    labels.setPosition(leftPercent, widthPercent);
    tooltips.setPosition(leftPercent, widthPercent, viewedY.steps[5] + viewedY.step);

    setAttributesNS(preview.use, {
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

  const initRangeSelector = () => {
    range.node.setAttribute('class', 'chart__selector');
    setAttributesNS(range.svg, {
      height: range.height,
      'stroke-width': range.strokeWidth,
      preserveAspectRatio: 'none',
      width: '100%',
    });
    setAttributesNS(range.use, {
      x: 0,
      y: 0,
      height: range.height,
      style: 'transition: transform .3s;',
    });

    range.svg.appendChild(range.use);
    appendChilds(range.node, [
      range.svg,
      range.selector,
    ]);
  };

  const updateRangeSelector = () => {
    const heightPercent = viewedY.end / initedY.end;
    const transform = `scale(1, ${1 / heightPercent})`;
    setAttributesNS(range.use, {
      x: 0,
      y: 0,
      height: range.height,
      'stroke-width': range.strokeWidth,
      transform,
      'transform-origin': 'bottom',
    });
  };

  const initChart = () => {
    setAttributes(node, {
      class: 'chart',
      style: 'position:relative;',
    });
    initSvg();
    initPreview();
    initRangeSelector();
    appendChilds(node, [
      svg.node,
      preview.node,
      preview.labels,
      range.node,
      legend.node,
    ]);
  };

  initChart();
  appendNode.appendChild(node);
  updatePreview();

  labels.updateWidth();
  rangeSelector.onChange(({ leftPercent, widthPercent }) => updatePreview(leftPercent, widthPercent));
  legend.onChange((name, checked) => {
    if (checked) {
      hiddenLines = hiddenLines.filter(hiddenLine => hiddenLine !== name);
    } else {
      hiddenLines = hiddenLines.concat(name);
    }
    updatePolylines();
    updatePreview();
    updateRangeSelector();

    const isAllChartsHidden = Object.keys(names).every(key => hiddenLines.includes(key));
    if (isAllChartsHidden) {
      preview.node.classList.add('chart__preview--empty');
      range.node.classList.add('chart__selector--empty');
      yLines.up(['', '', '', '', '', '']);
    } else {
      preview.node.classList.remove('chart__preview--empty');
      range.node.classList.remove('chart__selector--empty');
      yLines.up(viewedY.formattedSteps);
    }
  });

  return this;
};
