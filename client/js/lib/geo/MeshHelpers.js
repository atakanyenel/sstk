'use strict';

var Constants = require('Constants');
var Colors = require('util/Colors');
var GeometryUtil = require('geo/GeometryUtil');
var Object3DUtil = require('geo/Object3DUtil');
var OBB = require('geo/OBB');

function lineWidthToUnit(lineWidth) {
  return lineWidth/100 * Constants.metersToVirtualUnit;
}

var BoxMinMaxHelper = function (min, max, materialOrColor) {
  this.min = new THREE.Vector3();
  this.max = new THREE.Vector3();
  this.min.copy(min);
  this.max.copy(max);
  // NOTE: the min/max of the box is tied directly to the min and max
  this.box = new THREE.Box3(this.min, this.max);

  var material = Object3DUtil.getBasicMaterial(materialOrColor);
  THREE.Mesh.call(this, new THREE.BoxGeometry(1, 1, 1), material);
  this.box.getSize(this.scale);
  this.box.getCenter(this.position);
};

BoxMinMaxHelper.prototype = Object.create(THREE.Mesh.prototype);
BoxMinMaxHelper.prototype.constructor = BoxMinMaxHelper;

BoxMinMaxHelper.prototype.update = function (min, max) {
  if (min && max) {
    this.box.set(min,max);
  }
  this.box.getSize(this.scale);
  this.box.getCenter(this.position);
};

var OBBHelper = function (obb, materialOrColor) {
  var material = Object3DUtil.getBasicMaterial(materialOrColor);
  THREE.Mesh.call(this, new THREE.BoxGeometry(1, 1, 1), material);
  this.update(obb);
};

OBBHelper.prototype = Object.create(THREE.Mesh.prototype);
OBBHelper.prototype.constructor = OBBHelper;

OBBHelper.prototype.update = function (obb) {
  if (obb instanceof OBB) {
    this._updateFromOBB(obb);
  } else if (obb.centroid && obb.axesLengths && obb.normalizedAxes) {
    this._updateFromJson(obb);
  } else {
    console.error('Invalid OBB: ' + obb);
  }
  if (obb.orientation) {
    this.orientation = obb.orientation;
  }
};

OBBHelper.prototype._updateFromOBB = function (obb) {
  this.obb = obb;
  this.dominantNormal = obb.dominantNormal;
  this.position.copy(obb.position);
  this.scale.copy(obb.halfSizes).multiplyScalar(2);
  this.quaternion.setFromRotationMatrix(obb.basis);
  this.updateMatrix();
  this.updateMatrixWorld();
};

OBBHelper.prototype._updateFromJson = function (obb) {
  this.obb = obb;
  var dn = obb.dominantNormal;
  this.dominantNormal = dn? new THREE.Vector3(dn[0], dn[1], dn[2]) : undefined;
  this.position.set(obb.centroid[0], obb.centroid[1], obb.centroid[2]);
  this.scale.set(obb.axesLengths[0], obb.axesLengths[1], obb.axesLengths[2]);
  var m = this.obb.normalizedAxes;
  var matrix = new THREE.Matrix4();
  if (obb.matrixIsRowMajor) {
    matrix.set(
      m[0], m[1], m[2], 0,
      m[3], m[4], m[5], 0,
      m[6], m[7], m[8], 0,
      0, 0, 0, 1);
  } else {
    matrix.set(
      m[0], m[3], m[6], 0,
      m[1], m[4], m[7], 0,
      m[2], m[5], m[8], 0,
      0, 0, 0, 1);
  }
  this.quaternion.setFromRotationMatrix(matrix);
  this.updateMatrix();
  this.updateMatrixWorld();
};

OBBHelper.prototype.__createOrientationArrows = function(linewidth) {
  var colors = AxesColors;
  var axesLength = 0.50;
  var minLength = this.scale.clone().multiplyScalar(0.1).length();
  var worldToLocalRot = new THREE.Quaternion();
  worldToLocalRot.copy(this.quaternion);
  worldToLocalRot.inverse();
  if (this.orientation && this.orientation.length) {
    var arrowGroup = new THREE.Group();
    for (var i=0; i < this.orientation.length; i++) {
      var v = this.orientation[i];
      if (v) {
        var nv = v.clone().normalize();
        var lv = nv.clone().applyQuaternion(worldToLocalRot);
        var length = Math.max(Math.abs(this.scale.dot(lv)) * axesLength * 2, minLength);
        var arrow = this.__createArrow(nv, length, linewidth, colors[i]);
        arrow.traverse(function(node) {
          node.userData.isOrientationArrow = true;
          if (node.material) {
            node.axisMaterial = node.material;
          }
        });
        arrowGroup.add(arrow);
      } else {
        console.warn('Missing orientation ' + i, this.orientation);
      }
    }
    return arrowGroup;
  }
};

OBBHelper.prototype.__createArrow = function(direction, length, linewidth, materialOrColor) {
  if (direction) {
    if (linewidth > 0) {
      return new FatArrowHelper(direction, this.position, length, linewidth, undefined, undefined, materialOrColor);
    } else {
      return new THREE.ArrowHelper(direction, this.position, length, undefined, undefined, materialOrColor);
    }
  }
};

OBBHelper.prototype.__createNormal = function(linewidth, materialOrColor) {
  var axesLength = 0.25;
  var length = this.scale.clone().multiplyScalar(axesLength).length();
  return this.__createArrow(this.dominantNormal, length, linewidth, materialOrColor);
};

OBBHelper.prototype.__createAxes = function(linewidth) {
  var axesLength = 0.25;
  if (linewidth > 0) {
    var lengths = this.scale.clone().multiplyScalar(axesLength).toArray();
    return new FatAxesHelper(lengths, linewidth, this.position, this.quaternion);
  } else {
    var axes = new THREE.AxesHelper(axesLength);
    axes.position.copy(this.position);
    axes.scale.copy(this.scale);
    axes.quaternion.copy(this.quaternion);
    axes.isAxis = true;
    return axes;
  }
};

OBBHelper.prototype.toWireFrame = function(linewidth, showNormal, materialOrColor, showAxes, showOrientation) {
  materialOrColor = materialOrColor || this.material;
  var boxwf = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), Object3DUtil.getBasicMaterial(materialOrColor)));
  boxwf.position.copy(this.position);
  boxwf.scale.copy(this.scale);
  boxwf.quaternion.copy(this.quaternion);
  boxwf.updateMatrix();
  if (linewidth > 0) {
    boxwf = new FatLinesHelper(boxwf, linewidth, materialOrColor);
  }
  boxwf.userData.desc = 'obb-wireframe';
  if (showNormal || showAxes || showOrientation) {
    var normalArrow = showNormal? this.__createNormal(linewidth, materialOrColor) : null;
    var axes = showAxes? this.__createAxes(linewidth) : null;
    var orientArrows = showOrientation? this.__createOrientationArrows(linewidth) : null;
    if (normalArrow || axes || orientArrows) {
      console.log('Create box with normal')
      var boxWithNormal = new THREE.Group();
      boxWithNormal.add(boxwf);
      if (normalArrow) {
        normalArrow.userData.name = 'obb-dominantNormal';
        boxWithNormal.add(normalArrow);
      }
      if (axes) {
        axes.userData.name = 'obb-axes';
        boxWithNormal.add(axes);
      }
      if (orientArrows) {
        orientArrows.userData.name = 'obb-orient-arrows';
        boxWithNormal.add(orientArrows);
      }
      return boxWithNormal;
    }
  }
  return boxwf;
};

var LinesHelper = function (lines, materialOrColor) {
  this.lines = null;
  var material = (materialOrColor instanceof THREE.Material)? materialOrColor : new THREE.LineBasicMaterial( { color: materialOrColor });
  var geometry = new THREE.Geometry();
  THREE.LineSegments.call(this, geometry, material);
  this.__update(lines);
};

LinesHelper.prototype = Object.create(THREE.LineSegments.prototype);
LinesHelper.prototype.constructor = LinesHelper;

LinesHelper.prototype.__update = function (input) {
  if (input) {
    this.lines = null;
    if (input.length) {
      if (input[0] instanceof THREE.Vector3) {
        // Bunch of points in line
        this.lines = [input];
      } else if (input[0].length && input[0][0] instanceof THREE.Vector3) {
        // Bunch of line segments
        this.lines = input;
      }
    }
    if (!this.lines) {
      console.error('Unsupported input');
    }
  }

  // Add lines
  var geometry = this.geometry;
  if (this.lines && this.lines.length) {
    for (var i = 0; i < this.lines.length; i++) {
      for (var j = 1; j < this.lines[i].length; j++) {
        geometry.vertices.push(this.lines[i][j - 1]);
        geometry.vertices.push(this.lines[i][j]);
      }
    }
  }
};

function linesFromBoxCorners(points) {
  // Assumes points[0] and points[4] should be paired
  var lines = [];
  for (var i = 0; i < 4; i++) {
    lines.push([points[i], points[(i+1)%4]]);
    lines.push([points[i], points[i+4]]);
    lines.push([points[4+i], points[4+(i+1)%4]]);
  }
  return lines;
}

var FatLinesHelper = function (lines, width, materialOrColor, opts) {
  opts = opts || {};
  THREE.Group.call(this);
  this.lines = null;
  this.width = width;
  if (Array.isArray(materialOrColor)) {
    this.material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
    this.getColor = Colors.getColorFunction({
      type: 'interpolate',
      minWeight: 0,
      maxWeight: 1,
      colors: materialOrColor,
      space: 'hsl'
    });
  } else {
    this.material = Object3DUtil.getBasicMaterial(materialOrColor);
  }
  this.getWeight = opts.getWeight;
  if (opts.inputType === 'boxCorners') {
    lines = linesFromBoxCorners(lines);
  }
  this.update(lines);
};

FatLinesHelper.prototype = Object.create(THREE.Group.prototype);
FatLinesHelper.prototype.constructor = FatLinesHelper;

function toLineSegments(input) {
  var lines = null;
  if (input instanceof THREE.Line) {
    // Lets make these into our fat lines!!!
    var verts = GeometryUtil.getVertices(input);
    if (input.geometry.index) {
      var index = input.geometry.index.array;
      lines = [];
      for (var i = 0; i < index.length; i += 2) {
        var a = verts[index[i]];
        var b = verts[index[i + 1]];
        lines.push([a,b]);
      }
    } else {
      lines = [];
      for (var i = 0; i < verts.length; i += 2) {
        var a = verts[i];
        var b = verts[i + 1];
        lines.push([a,b]);
      }
    }

  } else if (input.length) {
    if (input[0] instanceof THREE.Vector3) {
      // Bunch of points in line
      lines = [input];
    } else if (input[0].length && input[0][0] instanceof THREE.Vector3) {
      // Bunch of line segments
      lines = input;
    }
  }
  if (!lines) {
    console.error('Unsupported line input');
  }
  return lines;
}

FatLinesHelper.prototype.setFromObject = function(input) {
  this.lines = toLineSegments(input);
  //if (input.matrix) {
  // Object3DUtil.setMatrix(this, input.matrix);
  //}
};

FatLinesHelper.prototype.__addLine = function (linePoints) {
  var totalPoints = linePoints.length;
  for (var j = 1; j < linePoints.length; j++) {
    var cylinder = Object3DUtil.makeCylinder(linePoints[j - 1], linePoints[j],
      this.width / 2, this.material);
    if (this.getColor) {
      var colors = this.getWeight?
        [this.getColor(this.getWeight(i, j-1)), this.getColor(this.getWeight(i, j))]
        : [this.getColor((j-1)/totalPoints), this.getColor(j/totalPoints)];
      GeometryUtil.colorCylinderVertices(cylinder.geometry, colors[0], colors[1]);
    }
    this.add(cylinder);
  }
};

FatLinesHelper.prototype.update = function (input) {
  // Create big fat cylinders connecting everything
  // Remove everything
  var objects = this.children.slice(0);
  for (var i = 0; i < objects.length; i++) {
    objects[i].parent.remove(objects[i]);
  }

  if (input) {
    this.setFromObject(input);
  }

  // Add lines
  if (this.lines && this.lines.length) {
    for (var i = 0; i < this.lines.length; i++) {
      this.__addLine(this.lines[i]);
    }
  }
};

var FatArrowHelper = function (dir, origin, length, lineWidth, headLength, headWidth, materialOrColor) {
  THREE.Group.call(this);
  this.name = 'Arrow';

  if (length === undefined) length = 1;
  if (lineWidth === undefined) lineWidth = 1;
  if (headLength === undefined) headLength = 0.2 * length;
  if (headWidth === undefined) headWidth = lineWidth + 0.2 * headLength;
  if (materialOrColor === undefined) materialOrColor = 0xffff00;

  this.start = origin.clone();
  this.dir = dir.clone();
  this.length = length;

  this.material = Object3DUtil.getBasicMaterial(materialOrColor);
  this.line = Object3DUtil.makeColumn(this.start, this.dir, this.length - headLength,
    lineWidthToUnit(lineWidth) / 2, this.material);
  this.add(this.line);

  var coneGeometry = new THREE.CylinderGeometry(0, 0.5, 1, 5, 1);
  coneGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.5, 0));

  this.cone = new THREE.Mesh(coneGeometry, this.material);
  this.cone.matrixAutoUpdate = false;
  Object3DUtil.setCylinderDirection(this.cone, dir);
  this.cone.scale.set(headWidth, headLength, headWidth);
  var end = this.start.clone().add(this.dir.clone().multiplyScalar(this.length));
  this.cone.position.copy(end);
  this.cone.updateMatrix();

  this.add(this.cone);

};

FatArrowHelper.prototype = Object.create(THREE.Group.prototype);
FatArrowHelper.prototype.constructor = FatArrowHelper;

FatArrowHelper.prototype.setOrigin = function (start) {
  var delta = new THREE.Vector3();
  delta.subVectors(start, this.start);
  this.line.position.addVectors(this.line.position, delta);
  this.cone.position.addVectors(this.cone.position, delta);
};

FatArrowHelper.prototype.setDirection = function (dir) {
  this.dir = dir.clone();
  Object3DUtil.setCylinderDirection(this.line, dir);
  Object3DUtil.setCylinderDirection(this.cone, dir);
};

FatArrowHelper.prototype.setLength = function (length, lineWidth, headLength, headWidth) {

  if (lineWidth === undefined) lineWidth = 1;
  if (headLength === undefined) headLength = 0.2 * length;
  if (headWidth === undefined) headWidth = lineWidth + 0.2 * headLength;

  this.remove(this.line);
  this.length = length;
  this.line = Object3DUtil.makeColumn(this.start, this.dir, this.length - headLength,
    lineWidthToUnit(lineWidth) / 2, this.material);
  this.add(this.line);

  this.cone.scale.set(headWidth, headLength, headWidth);
  var end = this.start.clone().add(this.dir.clone().multiplyScalar(this.length));
  this.cone.position.copy(end);
  this.cone.updateMatrix();
};

var AxesDirs = [ new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)];
var AxesColors = [ new THREE.Color(0xff0000), new THREE.Color(0x00ff00), new THREE.Color(0x0000ff) ];
var FatAxesHelper = function (length, lineWidth, origin, quaternion) {
  THREE.Group.call(this);
  this.name = 'Axes';

  if (origin) {
    this.position.copy(origin);
  }
  if (quaternion) {
    this.quaternion.copy(quaternion);
  }
  this.length = length || 1;
  this.lineWidth = lineWidth || 1;
  this.axes = [];
  for (var i = 0; i < AxesDirs.length; i++) {
    var axisLength = (Array.isArray(this.length))? this.length[i] : this.length;
    this.axes[i] = new FatArrowHelper(AxesDirs[i], new THREE.Vector3(), axisLength, this.lineWidth, undefined, undefined, AxesColors[i]);
    this.add(this.axes[i]);
  }
  this.traverse(function(node) {
    node.userData.isAxis = true;
    if (node.material) {
      node.axisMaterial = node.material;
    }
  });
};

FatAxesHelper.prototype = Object.create(THREE.Group.prototype);
FatAxesHelper.prototype.constructor = FatAxesHelper;

FatAxesHelper.prototype.update = function () {
  if (this.object) {
    this.object.updateMatrixWorld();
    this.position.setFromMatrixPosition(this.object.matrixWorld);
    this.object.getWorldQuaternion(this.quaternion);
  }
};

FatAxesHelper.prototype.attach = function (object) {
  this.object = object;
  this.update();
};

FatAxesHelper.prototype.detach = function () {
  this.object = null;
  this.update();
};

module.exports = { BoxMinMax: BoxMinMaxHelper, OBB: OBBHelper, Lines: LinesHelper, FatLines: FatLinesHelper, FatArrow: FatArrowHelper, FatAxes: FatAxesHelper };
