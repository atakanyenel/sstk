'use strict';

// Application entry point
require(['scene-viewer/SceneViewer','Constants','physijs','jquery-ui'], function (SceneViewer, Constants) {
  Physijs.scripts.worker = 'client/js/vendor/physijs/physijs_worker.js';
  Physijs.scripts.ammo = 'ammo.js';
  Constants.sys = {
    fs: require('io/FileUtil'),
    Buffer: Buffer
  };

  function onResize() {
    var tabs = $('#tabs');
    var tabsPanelTotalHeight = $('#sidebar').height() - $('#info').height() - 10;
    tabs.height(tabsPanelTotalHeight);
    var tabsPanelHeight = tabsPanelTotalHeight - tabs.children('ul.ui-tabs-nav').outerHeight() - 10;
    tabs.children('.ui-tabs-panel').height(tabsPanelHeight);
  }

  window.addEventListener('resize', onResize, false);
  Constants.setVirtualUnit(1);  // set to meters
  $('#textScenePanel').hide();
  $('#tabs').tabs();
  var canvas = document.getElementById('canvas');
  var sceneViewer = new SceneViewer({
      container: canvas,
      tabs: ['scenes', 'models', 'textures', 'colors', 'arch', 'scans', 'sceneHierarchy', 'bvh', 'sceneGen'],
      onTabsActivate: onResize,
      addGround: true,
      loadingIconUrl:  Constants.defaultLoadingIconUrl,
      allowEdit: true,
      allowMaterialMode: true,
      editMode: false,
      allowBBoxQuery: true,
      allowSelectMode: true,
      allowConsole: true,
      allowScenePrevNext: true,
      allowHighlightMode: true,
      allowMagicColors: true,
      supportArticulated: true,
      enableUILog: true,
      showSearchSourceOption: true,
      showInstructions: true,
      contextQueryOptions: { showPriorsViz: true, allowGroupExpansion: true },
      useAmbientOcclusion: false,
      usePhysicalLights: false,
      useShadows: true,
      useDatGui: true
    });
  if (sceneViewer.urlParams.scanModelId) {
    sceneViewer.skipLoadInitialScene = true;
    sceneViewer.launch();
    sceneViewer.assetManager.registerCustomAssetGroups({
      assetFiles: Constants.extraAssetsFile,
      filterByAssetId: sceneViewer.urlParams.scanModelId,
      callback: function (err, res) {
        sceneViewer.loadInitialScene();
      }
    });
  } else if (sceneViewer.urlParams.scans || sceneViewer.urlParams.extra) {
    sceneViewer.skipLoadInitialScene = true;
    sceneViewer.launch();
    sceneViewer.registerAssets(Constants.extraAssetsFile);
  } else {
    sceneViewer.launch();
  }

  sceneViewer.sceneSearchController.searchPanel.Subscribe('SearchSucceededPreparePanel', null, function () {
      $('#tabs').tabs({ active: 0 });
    });
  sceneViewer.modelSearchController.searchPanel.Subscribe('SearchSucceededPreparePanel', null, function () {
      $('#tabs').tabs({ active: 1 });
    });

  // Make text scene form toggleable
  //$( '#textSceneForm' ).hide();
  $('#textSceneCaption').click(function () { $('#textSceneForm').toggle(); });

  // Make scene template toggleable
  var sceneTemplateGraph = $('#graph');
  sceneTemplateGraph.hide();
  $('#sceneTemplateTitle').click(function () {
    sceneTemplateGraph.toggle();
    if (sceneTemplateGraph.is(':visible')) {
      sceneViewer.sceneTemplateViewer.onResize();
    }
  });

  // Make various components draggable
  $('#instructionsPanel').draggable();
  $('#sceneTemplatePanel').draggable();
  $('#customLoadingPanel').draggable();
  onResize();
  window.app = sceneViewer; // Hack through to sceneViewer for console debugging
});
