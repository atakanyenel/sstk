# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2021-06-11
### Changes
- Update to three.js r115 (changes to rendering behavior)
- Add support for articulated objects
- Add support for arch files with custom textures
- Various improvements to annotation tools (for categorizing models, scaling models, part annotation)
- Improved batch rendering scripts
- Refactor and reformat many classes
- Update dependencies

## [0.7.3] - 2018-01-14
### Changes
- Improve handling of array cameras and resizeable sensors
- Change stats/v4/suncg paths to just stats/suncg
- Added support for embedded architecture elements to SUNCGLoader
- Improvements to SUNCGExporter and added SceneStateExporter (saves list of models and their transforms in json)
- Better support for custom assets.json
- Fixed bug ssc readSync
- Have ssc support offscreen picking

## [0.7.2] - 2018-12-16
### Changes
- Support equirectangular panorama rendering
- Add render configurations for fixed physical pixel size
- Fix bug in HSL color interpolation
- Fix depth rendering for large resolutions and orthographic cameras
- Make materials front-sided by default instead of double-sided
- Fix floor height bug in navigation grids
- Improved support for shortest path computation with room goals
- Fix bug with multi-level grid cell traversibility computation

## [0.7.1] - 2018-11-03
### Changes
- Update webpack to v4.19.0
- Improved OBJ mesh exporting
- Add new ViewGenerator mode positionByBBoxOffset
- Follow redirects for reverse proxies
- Improved computation of scene support relations
- Support loading of more than 1000 ids in SearchPanel

## [0.7.0] - 2018-09-03
### Changes
- Update to three.js r95 (changes to rendering behavior)
- Update from jade to pug template language
- Update package.json dependencies to remove deprecated packages
- Enable TIFF, TGA texture support in offscreen rendering mode
- Improved rendering convenience scripts

## [0.6.0] - 2018-09-03
### Changes
- Preliminary object coloring functionality
- Preliminary semantic segmentation texture support
- Using sstk-metadata v0.5.3 (rendering differences due to basic material use)
- Updated to suncg version v2

## [0.5.3] - 2018-04-25
### Fixes
- Improved downloading and packing of asset metadata
- Fix over-eager cache clearing logic leading to occasional crashes
- Add support for semantic segmentation annotation tool used in ScanNet

## [0.5.2] - 2018-03-25
### Fixes
- Adjust depth buffer unpacking to return zero pixel value when no depth

## [0.5.1] - 2018-03-16
### Fixes
- Robustify room sampling routine
- Fix depth RGBA unpacking

## [0.5.0] - 2017-12-11
### Initial beta release
