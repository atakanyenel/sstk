var FileUtil = require('io/FileUtil');
var Object3DUtil = require('geo/Object3DUtil');
var _ = require('util/util');

/**
 * Export a mesh in Assimp json format
 * @param options
 * @param options.fs File system to use for exporting (defaults to FileUtil)
 * @constructor
 * @memberOf exporters
 */
function JSONExporter(options) {
  options = options || {};
  this.__fs = options.fs || FileUtil;
}

JSONExporter.prototype.export = function(obj, opts) {
  var fileutil = this.__fs;
  opts = opts || {};
  opts.name = (opts.name != undefined)? opts.name : 'scene';
  opts.dir = (opts.dir != undefined)? opts.dir + '/' : '';
  var filename = opts.dir + opts.name + '.ajson';
  var callback = opts.callback;

  // Linearize nodes and put meshes into an array
  var indexed = Object3DUtil.getIndexedNodes(obj, {
    keepDoubleFacesTogether: opts.keepDoubleFacesTogether,
    splitByMaterial: opts.splitByMaterial,
    splitByConnectivity: opts.splitByConnectivity
  });
  var nodes = _.map(indexed.nodes, function(node) {
    var meshIds;
    var childIds;
    if (node instanceof THREE.Mesh) {
      meshIds = [node.geometry.userData.geometryIndex];
    } else {
      childIds = _.map(node.children, function(x) { return x.userData.nodeIndex; });
    }
    return {
      id: node.userData.nodeIndex,
      name: node.name || (node.userData.id != null? node.userData.id : node.userData.name) || ("node" + node.userData.nodeIndex),
      partId: node.userData.partId,
      path: node.userData.sceneGraphPath,
      transformation: node.matrix.toArray(),
      meshes: meshIds,
      children: childIds
    };
  });
  // TODO: Export meshes and materials
  var meshes;
  // var meshes = _.map(indexed.geometries, function(geometry) {
  //
  // });
  var json = { nodes: nodes, meshes: meshes };
  if (opts.json) {
    _.merge(json, opts.json);
  }
  function finishFile() {
    fileutil.fsExportFile(filename, filename);
    console.log('finished exporting mesh data to ' + filename);
    json.leafIds = _.map(indexed.leafNodes, function(x) { return x.userData.nodeIndex; });
    if (callback) { callback(null, { indexed: indexed, json: json }); }
  }
  var blob = JSON.stringify(json, null, 2);
  fileutil.fsWriteToFile(filename, blob, finishFile);
};

module.exports = JSONExporter;
