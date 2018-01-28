import {
  CONTEXT_TYPE,
} from './constants';
import {
  AnyCanvasContext,
  AnyCanvasContextAttributes,
  Size,
} from './types';
import {
  formatFont,
  getFontParts,
  titleCase,
} from './utils';

interface SetSize {
  (size: Size): Canvasimo;
  (width: number, height: number): Canvasimo;
}

export default class Canvasimo {
  private element: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ctxType: typeof CONTEXT_TYPE = CONTEXT_TYPE;
  private density: number = 1;

  public constructor (element: HTMLCanvasElement) {
    this.element = element;
    const ctx = this.element.getContext(CONTEXT_TYPE);

    if (!ctx) {
      throw new Error('Could not get a canvas context from the provided element');
    }

    this.ctx = ctx;
    this.ctx.font = formatFont(ctx.font);
  }

  public getCanvas = (): HTMLCanvasElement => {
    return this.element;
  }

  public getBoundingClientRect = (): ClientRect => {
    return this.element.getBoundingClientRect();
  }

  public getContext = (type: string, contextAttributes?: AnyCanvasContextAttributes): AnyCanvasContext => {
    return this.element.getContext(type, contextAttributes);
  }

  public getCurrentContext = (): AnyCanvasContext => {
    return this.ctx;
  }

  public getCurrentContextType = (): typeof CONTEXT_TYPE => {
    return this.ctxType;
  }

  public getDataURL = (type: string, ...args: any[]): string => {
    return this.element.toDataURL(type, ...args);
  }

  public setWidth = (width: number): Canvasimo => {
    this.element.width = width * this.density;
    return this;
  }

  public setHeight = (height: number): Canvasimo => {
    this.element.height = height * this.density;
    return this;
  }

  public getWidth = (): number => {
    return this.element.width / this.density;
  }

  public getHeight = (): number => {
    return this.element.height / this.density;
  }

  public setSize: SetSize = (width: number | Size, height?: number): Canvasimo => {
    if (typeof width === 'object') {
      this.element.width = width.width;
      this.element.height = width.height;
    } else if (typeof width === 'number' && typeof height === 'number') {
      this.element.width = width;
      this.element.height = height;
    }

    return this;
  }

  public getSize = (): Size => {
    return {
      width: this.element.width,
      height: this.element.height,
    };
  }
}

function CanvasimoOld (input: HTMLCanvasElement) {
  const element = input;
  const ctx = element.getContext(CONTEXT_TYPE);

  if (!ctx) {
    throw new Error('Could not get a canvas context from the provided element');
  }

  ctx.font = formatFont(ctx.font);

  this.getCanvas = this.getElement = function () {
    return element;
  }.bind(this);

  this.getBoundingClientRect = function () {
    return element.getBoundingClientRect();
  }.bind(this);

  this.getContext = function (type, contextAttributes) {
    return element.getContext(type, contextAttributes);
  }.bind(this);

  this.getCurrentContext = function () {
    return ctx;
  }.bind(this);

  this.getCurrentContextType = function () {
    return CONTEXT_TYPE;
  }.bind(this);

  this.getDataURL = function (type, encoderOptions) {
    return element.toDataURL(type, encoderOptions);
  }.bind(this);

  // Attribute getters & setters
  this.setWidth = function (value) {
    element.setAttribute('width', parseInt(value, 10));
    return this;
  }.bind(this);

  this.setHeight = function (value) {
    element.setAttribute('height', parseInt(value, 10));
    return this;
  }.bind(this);

  this.getWidth = function () {
    return parseInt(element.getAttribute('width'), 10);
  }.bind(this);

  this.getHeight = function () {
    return parseInt(element.getAttribute('height'), 10);
  }.bind(this);

  this.setSize = function (width, height) {
    return this
      .setWidth(width)
      .setHeight(height);
  }.bind(this);

  this.getSize = function () {
    return {
      width: this.getWidth(),
      height: this.getHeight()
    };
  }.bind(this);

  // Image smoothing
  this.setImageSmoothingEnabled = function (value) {
    for (var i = 0; i < imageSmoothingKeys.length; i += 1) {
      if (imageSmoothingKeys[i] in ctx) {
        ctx[imageSmoothingKeys[i]] = value;
        return this;
      }
    }
    return this;
  }.bind(this);

  this.getImageSmoothingEnabled = function () {
    for (var i = 0; i < imageSmoothingKeys.length; i += 1) {
      if (imageSmoothingKeys[i] in ctx) {
        return ctx[imageSmoothingKeys[i]];
      }
    }
    return null;
  }.bind(this);

  // Canvas basic getters and setters
  function setCanvasProperty (attribute, value) {
    ctx[attribute] = value;
    return this;
  }

  function getCanvasProperty (attribute) {
    return ctx[attribute];
  }

  // Map all properties except image smoothing
  var mapPropertyGettersAndSetters = function () {
    for (var key in propertyMap) {
      var newKey = titleCase(propertyMap[key]);

      this['set' + newKey] = setCanvasProperty.bind(this, key);
      this['get' + newKey] = getCanvasProperty.bind(this, key);

      if (key !== propertyMap[key]) {
        var oldKey = titleCase(key);

        this['set' + oldKey] = this['set' + newKey];
        this['get' + oldKey] = this['get' + newKey];
      }
    }
  }.bind(this);

  mapPropertyGettersAndSetters();

  // Canvas basic action
  function canvasAction (method) {
    ctx[method].apply(ctx, Array.prototype.slice.call(arguments, 1));
    return this;
  }

  const unchangedCanvasMethods = [
    'save',
    'restore',
    'scale',
    'rotate',
    'translate',
    'transform',
    'setTransform',
    'drawFocusIfNeeded',
    'clip',
    'clearRect',
    'moveTo',
    'lineTo',
    'quadraticCurveTo',
    'bezierCurveTo',
    'arcTo',
    'beginPath',
    'closePath',
    'drawImage',
    'putImageData',
    'rect',
    'arc',
    'setLineDash',
  ];

  // Standard actions
  var mapStandardActions = function () {
    for (var i = 0; i < unchangedCanvasMethods.length; i += 1) {
      var key = unchangedCanvasMethods[i];
      this[key] = canvasAction.bind(this, key);
    }
  }.bind(this);

  mapStandardActions();

  // Changed to plot to match plotters
  this.plotRect = this.rect;
  this.plotArc = this.arc;

  // Changed to stroke to match other stroke functions
  this.setStrokeDash = this.setLineDash;

  function lastArgIs (predicate, args) {
    if (!args || !args.length) {
      return false;
    }

    var arg = args[args.length - 1];

    return predicate(arg);
  }

  var lastArgIsColorString = lastArgIs.bind(this, function isColorString (arg) {
    return typeof arg === 'string' && !isSpecialFill.test(arg);
  });

  var lastArgIsString = lastArgIs.bind(this, function isString (arg) {
    return typeof arg === 'string';
  });

  this.fill = function () {
    var args = Array.prototype.slice.call(arguments);

    if (lastArgIsColorString(args)) {
      this.setFill(args.pop());
    }

    ctx.fill.apply(ctx, args);
    return this;
  }.bind(this);

  this.stroke = function () {
    var args = Array.prototype.slice.call(arguments);

    if (lastArgIsString(args)) {
      this.setStroke(args.pop());
    }

    ctx.stroke.apply(ctx, args);
    return this;
  }.bind(this);

  this.resetTransform = function () {
    if (typeof ctx.resetTransform === 'function') {
      ctx.resetTransform();
      return this;
    }

    return this.setTransform(1, 0, 0, 1, 0, 0);
  }.bind(this);

  this.ellipse = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise) {
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise);
      return this;
    }

    return this
      .save()
      .translate(x, y)
      .rotate(rotation)
      .scale(1, radiusY / radiusX)
      .plotArc(0, 0, radiusX, startAngle, endAngle, counterClockwise)
      .restore();
  }.bind(this);

  this.plotEllipse = this.ellipse;

  function canvasGetter (method) {
    return ctx[method].apply(ctx, Array.prototype.slice.call(arguments, 1));
  }

  var unchangedCanvasGetters = [
    'getContextAttributes',
    'getImageData',
    'createLinearGradient',
    'createRadialGradient',
    'createPattern',
    'createImageData',
    'isPointInPath',
    'isPointInStroke',
    'measureText',
    'getLineDash'
  ];

  var mapStandardGetters = function () {
    for (var i = 0; i < unchangedCanvasGetters.length; i += 1) {
      var key = unchangedCanvasGetters[i];
      this[key] = canvasGetter.bind(this, key);
    }
  }.bind(this);

  mapStandardGetters();

  // Standard measure text
  this.getTextSize = this.measureText;

  // Changed to stroke to match other stroke functions
  this.getStrokeDash = this.getLineDash;

  // Additional actions
  this.clearCanvas = function () {
    return this
      .setWidth(this.getWidth());
  }.bind(this);

  this.fillCanvas = function (color) {
    return this
      .resetTransform()
      .fillRect(0, 0, this.getWidth(), this.getHeight(), color);
  }.bind(this);

  this.plotLine = function (x1, y1, x2, y2) {
    return this
      .moveTo(x1, y1)
      .lineTo(x2, y2);
  }.bind(this);

  this.strokeLine = function (x1, y1, x2, y2, color) {
    return this
      .plotLine(x1, y1, x2, y2)
      .setStroke(color)
      .stroke();
  }.bind(this);

  this.plotLength = function (x1, y1, length, r) {
    var x2 = x1 + length * Math.cos(r);
    var y2 = y1 + length * Math.sin(r);

    return this
      .moveTo(x1, y1)
      .lineTo(x2, y2);
  }.bind(this);

  this.strokeLength = function (x1, y1, length, r, color) {
    return this
      .plotLength(x1, y1, length, r)
      .setStroke(color)
      .stroke();
  }.bind(this);

  this.plotPoly = function (x, y, r, sides, counterClockwise) {
    sides = Math.round(parseFloat(sides));

    if (!sides || sides < 3) {
      return this;
    }

    var direction = counterClockwise ? -1 : 1;

    function beforeEnd (i) {
      return counterClockwise ? i > -sides : i < sides;
    }

    this
      .beginPath()
      .moveTo(x + r, y);

    for (var i = 0; beforeEnd(i); i += direction) {
      var angle = Math.PI * 2 / sides * i;
      this.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
    }

    return this
      .closePath();
  }.bind(this);

  this.strokePoly = function (x, y, r, sides, counterClockwise, color) {
    sides = Math.round(parseFloat(sides));

    if (!sides || sides < 3) {
      return this;
    }

    return this
      .plotPoly(x, y, r, sides, counterClockwise)
      .setStroke(color)
      .stroke();
  }.bind(this);

  this.fillPoly = function (x, y, r, sides, counterClockwise, color) {
    sides = Math.round(parseFloat(sides));

    if (!sides || sides < 3) {
      return this;
    }

    return this
      .plotPoly(x, y, r, sides, counterClockwise)
      .setFill(color)
      .fill();
  }.bind(this);

  this.plotStar = function (x, y, r1, sides, counterClockwise) {
    sides = Math.round(parseFloat(sides));

    if (!sides || sides < 3) {
      return this;
    } else if (sides === 3 || sides === 4) {
      return this.plotPoly(x, y, r1, sides);
    }

    sides = sides * 2;

    var direction = counterClockwise ? -1 : 1;
    var offset = Math.PI * 2 / sides;
    var cross = Math.cos(offset * 2) * r1;
    var r2 = cross / Math.cos(offset);

    function beforeEnd (i) {
      return counterClockwise ? i > -sides : i < sides;
    }

    this
      .beginPath()
      .moveTo(x + r1, y);

    for (var i = 0; beforeEnd(i); i += direction) {
      var angle = offset * i;
      var r = i % 2 ? r2 : r1;
      this.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
    }

    return this
      .closePath();
  }.bind(this);

  this.strokeStar = function (x, y, r1, sides, counterClockwise, color) {
    sides = Math.round(parseFloat(sides));

    if (!sides || sides < 3) {
      return this;
    }

    return this
      .plotStar(x, y, r1, sides, counterClockwise)
      .setStroke(color)
      .stroke();
  }.bind(this);

  this.fillStar = function (x, y, r1, sides, counterClockwise, color) {
    sides = Math.round(parseFloat(sides));

    if (!sides || sides < 3) {
      return this;
    }

    return this
      .plotStar(x, y, r1, sides, counterClockwise)
      .setFill(color)
      .fill();
  }.bind(this);

  this.plotBurst = function (x, y, r1, r2, sides, counterClockwise) {
    sides = Math.round(parseFloat(sides));

    if (!sides || sides < 3) {
      return this;
    }

    sides = sides * 2;

    var direction = counterClockwise ? -1 : 1;
    var offset = Math.PI * 2 / sides;

    function beforeEnd (i) {
      return counterClockwise ? i > -sides : i < sides;
    }

    this
      .beginPath()
      .moveTo(x + r1, y);

    for (var i = 0; beforeEnd(i); i += direction) {
      var angle = offset * i;
      var r = i % 2 ? r2 : r1;
      this.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
    }

    return this
      .closePath();
  }.bind(this);

  this.strokeBurst = function (x, y, r1, r2, sides, counterClockwise, color) {
    sides = Math.round(parseFloat(sides));

    if (!sides || sides < 3) {
      return this;
    }

    return this
      .plotBurst(x, y, r1, r2, sides, counterClockwise)
      .setStroke(color)
      .stroke();
  }.bind(this);

  this.fillBurst = function (x, y, r1, r2, sides, counterClockwise, color) {
    sides = Math.round(parseFloat(sides));

    if (!sides || sides < 3) {
      return this;
    }

    return this
      .plotBurst(x, y, r1, r2, sides, counterClockwise)
      .setFill(color)
      .fill();
  }.bind(this);

  this.plotPath = function (points) {
    var transformedPoints = transformPoints(points);

    forPoints(transformedPoints, function (x, y, i) {
      if (i === 0) {
        this.moveTo(x, y);
      } else {
        this.lineTo(x, y);
      }
    }.bind(this));

    return this;
  }.bind(this);

  this.fillPath = function (points, color) {
    var transformedPoints = transformPoints(points);

    return this
      .setFill(color)
      .plotPath(transformedPoints)
      .fill();
  }.bind(this);

  this.strokePath = function (points, color) {
    var transformedPoints = transformPoints(points);

    return this
      .setStroke(color)
      .plotPath(transformedPoints)
      .stroke();
  }.bind(this);

  this.plotClosedPath = function (points) {
    return this
      .beginPath()
      .plotPath(points)
      .closePath();
  }.bind(this);

  this.fillClosedPath = function (points, color) {
    return this
      .setFill(color)
      .plotClosedPath(points)
      .fill();
  }.bind(this);

  this.strokeClosedPath = function (points, color) {
    return this
      .setStroke(color)
      .plotClosedPath(points)
      .stroke();
  }.bind(this);

  this.fillText = function (text, x, y, maxWidth, color) {
    this.setFill(color);
    // If max width is not a number (e.g. undefined) then iOS does not draw anything
    if (!maxWidth && maxWidth !== 0) {
      ctx.fillText(text, x, y);
    } else {
      ctx.fillText(text, x, y, maxWidth);
    }
    return this;
  }.bind(this);

  this.strokeText = function (text, x, y, maxWidth, color) {
    this.setStroke(color);
    ctx.strokeText(text, x, y, maxWidth);
    return this;
  }.bind(this);

  this.fillRect = function (x, y, width, height, color) {
    this.setFill(color);
    ctx.fillRect(x, y, width, height);
    return this;
  }.bind(this);

  this.strokeRect = function (x, y, width, height, color) {
    this.setStroke(color);
    ctx.strokeRect(x, y, width, height);
    return this;
  }.bind(this);

  this.fillArc = function (x, y, radius, startAngle, endAngle, counterClockwise, color) {
    return this
      .setFill(color)
      .plotArc(x, y, radius, startAngle, endAngle, counterClockwise)
      .fill();
  }.bind(this);

  this.strokeArc = function (x, y, radius, startAngle, endAngle, counterClockwise, color) {
    return this
      .setStroke(color)
      .plotArc(x, y, radius, startAngle, endAngle, counterClockwise)
      .stroke();
  }.bind(this);

  this.fillEllipse = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise, color) {
    return this
      .setFill(color)
      .plotEllipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise)
      .fill();
  }.bind(this);

  this.strokeEllipse = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise, color) {
    return this
      .setStroke(color)
      .plotEllipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise)
      .stroke();
  }.bind(this);

  this.plotCircle = function (x, y, radius, counterClockwise) {
    return this
      .beginPath()
      .plotArc(x, y, radius, 0, Math.PI * 2, counterClockwise)
      .closePath();
  }.bind(this);

  this.fillCircle = function (x, y, radius, counterClockwise, color) {
    return this
      .setFill(color)
      .plotCircle(x, y, radius, counterClockwise)
      .fill();
  }.bind(this);

  this.strokeCircle = function (x, y, radius, counterClockwise, color) {
    return this
      .setStroke(color)
      .plotCircle(x, y, radius, counterClockwise)
      .stroke();
  }.bind(this);

  this.plotRoundedRect = function (x, y, width, height, radius) {
    var minRadius = Math.min(width / 2, height / 2, radius);

    return this
      .beginPath()
      .moveTo(x + minRadius, y)
      .lineTo(x + width - minRadius, y)
      .arcTo(x + width, y, x + width, y + minRadius, minRadius)
      .lineTo(x + width, y + height - minRadius)
      .arcTo(x + width, y + height, x + width - minRadius, y + height, minRadius)
      .lineTo(x + minRadius, y + height)
      .arcTo(x, y + height, x, y + height - minRadius, minRadius)
      .lineTo(x, y + minRadius)
      .arcTo(x, y, x + minRadius, y, minRadius)
      .closePath();
  }.bind(this);

  this.fillRoundedRect = function (x, y, width, height, radius, color) {
    return this
      .setFill(color)
      .plotRoundedRect(x, y, width, height, radius)
      .fill();
  }.bind(this);

  this.strokeRoundedRect = function (x, y, width, height, radius, color) {
    return this
      .setStroke(color)
      .plotRoundedRect(x, y, width, height, radius)
      .stroke();
  }.bind(this);

  this.plotPixel = function (x, y) {
    return this
      .plotRect(x, y, 1, 1);
  }.bind(this);

  this.fillPixel = function (x, y, color) {
    return this
      .fillRect(x, y, 1, 1, color);
  }.bind(this);

  this.strokePixel = function (x, y, color) {
    return this
      .strokeRect(x, y, 1, 1, color);
  }.bind(this);

  // Fonts
  this.setFont = function (font) {
    ctx.font = formatFont(font);
    return this;
  }.bind(this);

  this.getFont = function () {
    return formatFont(ctx.font);
  }.bind(this);

  // Font property setters
  this.setFontStyle = function (style) {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return this.setFont(null);
    }
    parts[0] = style || defaultFont[0];
    ctx.font = formatFont(parts.join(' '));
    return this;
  }.bind(this);

  this.setFontVariant = function (variant) {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return this.setFont(null);
    }
    parts[1] = variant || defaultFont[1];
    ctx.font = formatFont(parts.join(' '));
    return this;
  }.bind(this);

  this.setFontWeight = function (weight) {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return this.setFont(null);
    }
    parts[2] = weight || defaultFont[2];
    ctx.font = formatFont(parts.join(' '));
    return this;
  }.bind(this);

  this.setFontSize = function (size) {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return this.setFont(null);
    }
    parts[3] = (typeof size === 'number' ? size + 'px' : size) || defaultFont[3];
    ctx.font = formatFont(parts.join(' '));
    return this;
  }.bind(this);

  this.setFontFamily = function (family) {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return this.setFont(null);
    }
    parts[4] = family || defaultFont[4];
    ctx.font = formatFont(parts.join(' '));
    return this;
  }.bind(this);

  // Font property getters
  this.getFontStyle = function () {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return null;
    }
    return parts[0];
  }.bind(this);

  this.getFontVariant = function () {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return null;
    }
    return parts[1];
  }.bind(this);

  this.getFontWeight = function () {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return null;
    }
    return parts[2];
  }.bind(this);

  this.getFontSize = function () {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return null;
    }
    return parseFloat(parts[3]);
  }.bind(this);

  this.getFontFamily = function () {
    var parts = getFontParts(ctx.font);
    if (parts.length < 5) {
      return null;
    }
    return parts[4];
  }.bind(this);

  // Helper methods
  this.createHSL = function (h, s, l) {
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
  }.bind(this);

  this.createHSLA = function (h, s, l, a) {
    return 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ')';
  }.bind(this);

  this.createRGB = function (r, g, b) {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }.bind(this);

  this.createRGBA = function (r, g, b, a) {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }.bind(this);

  this.getDistance = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }.bind(this);

  var incorrectGetAngleArguments = 'Incorrect number of arguments supplied for getAngle. ' +
    'Arguments must be [x1, y1, x2, y2] or [x1, y1, x2, y2, x3, y3].';

  this.getAngle = function () {
    var args = Array.prototype.slice.call(arguments);

    if (!args.length || !(args.length === 4 || args.length === 6)) {
      throw new Error(incorrectGetAngleArguments);
    }

    var x1 = args[0];
    var y1 = args[1];
    var x2 = args[2];
    var y2 = args[3];

    if (args.length === 4) {
      return Math.atan2(y2 - y1, x2 - x1);
    }

    var x3 = args[4];
    var y3 = args[5];

    var a = this.getAngle(x1, y1, x2, y2);
    var b = this.getAngle(x2, y2, x3, y3);
    var c = b - a;

    if (c >= 0) {
      return Math.PI - c;
    }

    return -Math.PI - c;
  }.bind(this);

  this.getRGBFromRGBA = this.getHSLFromHSLA = function (color) {
    var lastCommaIndex = color.lastIndexOf(',');
    return color.replace(/^(\w{3})a/, '$1').substring(0, lastCommaIndex - 1) + ')';
  }.bind(this);

  this.getRadiansFromDegrees = function (degrees) {
    return degrees * Math.PI / 180;
  }.bind(this);

  this.getDegreesFromRadians = function (radians) {
    return radians * 180 / Math.PI;
  }.bind(this);

  this.getPercentFromFraction = function (fraction) {
    return (fraction * 100);
  }.bind(this);

  this.getFractionFromPercent = function (percent) {
    return (percent / 100);
  }.bind(this);

  this.getPercentOfWidth = function (percent) {
    return this.getWidth() / 100 * percent;
  }.bind(this);

  this.getFractionOfWidth = function (fraction) {
    return this.getWidth() * fraction;
  }.bind(this);

  this.getPercentOfHeight = function (percent) {
    return this.getHeight() / 100 * percent;
  }.bind(this);

  this.getFractionOfHeight = function (fraction) {
    return this.getHeight() * fraction;
  }.bind(this);

  this.getPixelColor = function (x, y) {
    var data = this.getImageData(x, y, 1, 1).data;
    return this.createRGBA(data[0], data[1], data[2], data[3]);
  }.bind(this);

  this.getPixelData = function (x, y) {
    return this.getImageData(x, y, 1, 1).data;
  }.bind(this);

  this.tap = function (callback) {
    if (typeof callback !== 'function') {
      throw new Error(
        'Callback must be a function. Instead got ' +
        callback +
        ' (' +
        (typeof callback) +
        ')'
      );
    }

    callback.call(this);

    return this;
  }.bind(this);

  this.repeat = function () {
    var args = Array.prototype.slice.call(arguments);
    var start, end, step, callback;

    switch (args.length) {
      case 2:
        start = 0;
        end = (typeof args[0] === 'number' ? args[0] || 0 : 0);
        step = 1;
        callback = args[1];
        break;
      case 3:
        start = (typeof args[0] === 'number' ? args[0] || 0 : 0);
        end = (typeof args[1] === 'number' ? args[1] || 0 : 0);
        step = 1;
        callback = args[2];
        break;
      case 4:
        start = (typeof args[0] === 'number' ? args[0] || 0 : 0);
        end = (typeof args[1] === 'number' ? args[1] || 0 : 0);
        step = Math.abs(typeof args[2] === 'number' ? args[2] || 0 : 0);
        callback = args[3];
        break;
      default:
        throw new Error(
          'Incorrect number of arguments supplied for repeat. ' +
          'Arguments must be [end, callback], [start, end, callback], ' +
          'or [start, end, step, callback].'
        );
    }

    if (step === 0) {
      return this;
    }

    if (typeof callback !== 'function') {
      throw new Error(
        'Callback must be a function. Instead got ' +
        callback +
        ' (' +
        (typeof callback) +
        ')'
      );
    }

    callback = callback.bind(this);

    var positive = end > start;
    step = positive ? step : -step;

    for (var i = start; (positive ? i < end : i > end); i += step) {
      if (callback(i) === false) {
        return this;
      }
    }

    return this;
  }.bind(this);

  this.forEach = function (obj, callback) {
    if (typeof callback !== 'function') {
      throw new Error(
        'Callback must be a function. Instead got ' +
        callback +
        ' (' +
        (typeof callback) +
        ')'
      );
    }

    if (typeof obj !== 'object' && typeof obj !== 'string') {
      throw new Error('First argument of forEach must me an array, object, or string');
    }

    callback = callback.bind(this);

    if (Array.isArray(obj) || typeof obj === 'string') {
      for (var i = 0; i < obj.length; i += 1) {
        if (callback(obj[i], i) === false) {
          return this;
        }
      }
    } else {
      for (var key in obj) {
        if (callback(obj[key], key) === false) {
          return this;
        }
      }
    }

    return this;
  }.bind(this);

  this.constrain = function (value, min, max) {
    if (min > max) {
      var temp = min;
      min = max;
      max = temp;
    }

    return Math.max(Math.min(value, max), min);
  }.bind(this);

  this.map = function (value, fromStart, fromEnd, toStart, toEnd) {
    var fromDiff = fromEnd - fromStart;
    var toDiff = toEnd - toStart;
    return toStart + toDiff * (value - fromStart) / fromDiff;
  }.bind(this);

}
