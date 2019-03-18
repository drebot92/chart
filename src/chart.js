console.time();

const minMax = (min, max, value) => Math.min(max, Math.max(min, value));

const forEachKey = (obj, fn) => Object.keys(obj).forEach(key => fn(key, obj[key]));

const setAttributes = (node, attrs) => forEachKey(attrs, (key, value) => node.setAttribute(key, value));
const setAttributesNS = (node, attrs) => forEachKey(attrs, (key, value) => node.setAttributeNS(null, key, value));

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

  const timeInc = 1000 * 3600 * 4;
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
  let viewedY = { ...getViewedY(0, xPoints.length - 1) };

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
      // polyline.setAttribute('style', `transform: translate(${-startX}px);`);
      // console.log(id, type, name, color, data);
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
    });
    usePreview.setAttributeNS(xlinkns, 'xlink:href', '#preview');
    setAttributesNS(usePreview, {
      x: 0,
      y: 0,
      height: previewWrapperHeight,
    });

    preview.appendChild(previewUseChart);
    svg.appendChild(preview);
    svg.appendChild(usePreview);
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
    const previewLeft = -(leftPercent * previewWidth);
    const previewHeight = previewWrapperHeight / heightPercent;
    const previewTop = -(topPercent * previewHeight);

    setAttributesNS(previewUseChart, {
      x: previewLeft,
      y: previewTop,
      width: previewWidth,
      height: previewHeight,
    });
    setAttributesNS(usePreview, {
      x: 0,
      height: previewWrapperHeight,
    });
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
    svgWrapper.appendChild(svg);
    svgWrapper.appendChild(rangeSelector.node);
  };

  initSvg();

  return svgWrapper;
};

class RangeSelector {
  constructor(style) {
    this.style = style;
    this.range = {
      width: 0,
      left: 0,
      leftPercent: 0,
      right: 0,
      value: 0,
      valuePercent: 1,
    };

    this.node = document.createElement('div');
    this.rangeArea = document.createElement('div');
    this.areaHandle = document.createElement('div');
    this.leftHandle = document.createElement('div');
    this.rightHandle = document.createElement('div');
    this.overflowLeft = document.createElement('div');
    this.overflowRight = document.createElement('div');

    this.init(this);
  }

  init({
    range,
    node,
    rangeArea,
    areaHandle,
    leftHandle,
    rightHandle,
    overflowLeft,
    overflowRight,
  }) {
    let leftOld = 0;
    let rightOld = 0;
    let leftMax = 0;
    let rightMax = 0;

    node.setAttribute('class', 'range-controls');
    node.style.display = 'grid';
    node.style.gridTemplateColumns = `${0}px 1fr ${0}px`;

    Object.keys(this.style).forEach(key => {
      node.style[key] = this.style[key];
    });

    rangeArea.setAttribute('class', 'range-controls__area');
    areaHandle.setAttribute('class', 'range-controls__area-handle');
    leftHandle.setAttribute('class', 'range-controls__handle');
    rightHandle.setAttribute('class', 'range-controls__handle');
    overflowLeft.setAttribute('class', 'range-controls__overflow');
    overflowRight.setAttribute('class', 'range-controls__overflow');

    rangeArea.appendChild(leftHandle);
    rangeArea.appendChild(areaHandle);
    rangeArea.appendChild(rightHandle);
    node.appendChild(overflowLeft);
    node.appendChild(rangeArea);
    node.appendChild(overflowRight);

    let handle = null;
    const cursor = {
      offsetX: 0,
      startX: 0,
    };
    const minAreaWidth = 30;
    const mouseMove = event => {
      if (handle === null) return;
      cursor.offsetX = event.clientX - cursor.startX;

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
      this.change(this.range);
    };
    const mouseDownArea = event => {
      cursor.startX = event.clientX;
      handle = 'area';
    };
    const mouseDownLeft = event => {
      cursor.startX = event.clientX;
      handle = 'left';
    };
    const mouseDownRight = event => {
      cursor.startX = event.clientX;
      handle = 'right';
    };
    const mouseUp = () => {
      if (handle !== null) {
        leftOld = range.left;
        rightOld = range.right;
      }
      handle = null;
      cursor.startX = 0;
    };
    node.addEventListener('mouseenter', () => {
      window.addEventListener('mousemove', mouseMove);
      leftHandle.addEventListener('mousedown', mouseDownLeft);
      rightHandle.addEventListener('mousedown', mouseDownRight);
      areaHandle.addEventListener('mousedown', mouseDownArea);
      window.addEventListener('mouseup', mouseUp);
    });
    node.removeEventListener('mouseleave', () => {
      window.removeEventListener('mousemove', mouseMove);
      leftHandle.removeEventListener('mousedown', mouseDownLeft);
      rightHandle.removeEventListener('mousedown', mouseDownRight);
      areaHandle.removeEventListener('mousedown', mouseDownArea);
      window.removeEventListener('mouseup', mouseUp);
    });
  }

  onChange(cb) {
    this.change = cb;
  }
}
