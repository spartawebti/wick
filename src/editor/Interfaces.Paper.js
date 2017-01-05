/* Wick - (c) 2016 Zach Rispoli, Luca Damasco, and Josh Rispoli */

var PaperInterface = function (wickEditor) {

    /*var that = this;

    var paperCanvas;
    var paperObjectWickMappings = {};

    var currentFrame;
    var SVGDataDirty;

    var ready = false;

    var debugLog = true;

    // Create the canvas to be used with paper.js and init the paper.js instance.
    paperCanvas = document.createElement('canvas');
    paperCanvas.className = 'paperCanvas';
    paperCanvas.style.backgroundColor = "#FFDDDD";
    paperCanvas.style.width  = (wickEditor.project.resolution.x/2)+'px';
    paperCanvas.style.height = (wickEditor.project.resolution.y/2)+'px';
    paper.setup(paperCanvas);
    paper.view.viewSize.width  = wickEditor.project.resolution.x;
    paper.view.viewSize.height = wickEditor.project.resolution.y;

    // (Debug) Put the canvas somewhere we can see it
    if(localStorage.pathDebug === "1") document.body.appendChild(paperCanvas);


    this.setup = function () {
        // Set initial frame to load SVG data from
        currentFrame = wickEditor.project.currentObject.getCurrentFrame();
        SVGDataDirty = true;
        ready = true;

        this.syncWithEditorState();
    }

    this.syncWithEditorState = function () {
        if (!ready) return;
        if (!paper.project) return; // sync may get called before paper.js is ready

        var newFrame = wickEditor.project.currentObject.getCurrentFrame();
        if(newFrame !== currentFrame) {
            // Set SVGData of currentFrame to svg data from paper.js
            this.applyChangesToFrame();

            SVGDataDirty = true;
        }
        currentFrame = newFrame;

        if(currentFrame) {
            var pathsToUpdate = [];
            currentFrame.wickObjects.forEach(function (wickObject) {
                if(wickObject.pathData && !wickObject.inFrameSVG) {
                    pathsToUpdate.push(wickObject);
                }
            });
            if(pathsToUpdate.length > 0) {
                paper.project.clear();
            }
            pathsToUpdate.forEach(function (wickObject) {
                wickObject.parentObject.removeChild(wickObject);
                addSVGToCanvas(wickObject.pathData, {x:wickObject.x, y:wickObject.y});
            });
            if(pathsToUpdate.length > 0) {
                that.applyChangesToFrame()
            }
        }

        // Only update the paper.js canvas if new SVG data exists in the WickProject
        if (!SVGDataDirty) return;

        paper.project.clear();
        paperObjectWickMappings = {};

        // currentFrame may be null if the playhead isn't over a frame
        if (!currentFrame) return;

        addSVGGroupToCanvas(currentFrame.pathData);
        resetPathWickObjects();
        SVGDataDirty = false;
    }

    this.updatePaperSceneForObject = function (wickObject, deleted) {
        var path = paperObjectWickMappings[wickObject.uuid];

        if(!path) {
            wickObject.parentObject.removeChild(wickObject);
            addSVGToCanvas(wickObject.pathData, {x:wickObject.x, y:wickObject.y});
        } else if (deleted) {
            paperObjectWickMappings[wickObject.uuid] = null;
            path.remove();
        } else {
            path.applyMatrix = true;
            path.position.x = wickObject.x;
            path.position.y = wickObject.y;

            if(path.origRotation === undefined) path.origRotation = 0;
            var newRotation = wickObject.angle;
            if(newRotation !== path.origRotation) {
                //path.rotation = newRotation-path.origRotation;
                //console.log(path.bounds)
                path.rotate(newRotation-path.origRotation);
                //path.origRotation = wickObject.angle;
                //resetPathWickObjects()
                wickObject.parentObject.removeChild(wickObject)
                addWickObjectFromPaperData(path);
            }

            if(path.origScaleX === undefined) path.origScaleX = 1;
            var newScaleX = wickObject.scaleX;
            if(newScaleX !== path.origScaleX) {
                path.scaling.x = newScaleX*path.origScaleX;
                path.origScaleX = wickObject.scaleX;
            }

            if(path.origScaleY === undefined) path.origScaleY = 1;
            var newScaleY = wickObject.scaleY;
            if(newScaleY !== path.origScaleY) {
                path.scaling.y = newScaleY*path.origScaleY;
                path.origScaleY = wickObject.scaleY;
            }
        }
    }

    this.applyChangesToFrame = function () {
        if(currentFrame)
            currentFrame.pathData = paper.project.activeLayer.exportSVG({ asString: true });
    }

    this.addSVG = function (svgString, offset) {
        addSVGToCanvas(svgString, offset);
    }

    this.updateTouchingPaths = function () {

        // Find all paths with needsIntersectCheck flag, these need to be checked for new intersections
        var paths = getAllSVGs();
        var pathsThatNeedUpdate = [];
        paths.forEach(function(path) {
            if(path.needsIntersectCheck) {
                pathsThatNeedUpdate.push(path);
            }
        });

        if (debugLog) console.log("- - - - - - - - - -");
        if (debugLog) console.log("# of pathsThatNeedUpdate: " + pathsThatNeedUpdate.length);

        // Check for intersections for all paths with needsIntersectCheck flag
        pathsThatNeedUpdate.forEach(function (path) {

            // Find all paths intersecting
            var paths = getAllSVGs();
            var intersectingPaths = [];
            paths.forEach(function (checkPath) {
                var pathA = path;
                var pathB = checkPath;

                if(pathA === pathB) return;

                var foundIntersection = false;
                for(var a = 0; a < pathA.children.length; a++) {
                    for(var b = 0; b < pathB.children.length; b++) {
                        var childA = pathA.children[a];
                        var childB = pathB.children[b];
                        if (!foundIntersection && childA.intersects(childB)) {
                            foundIntersection = true;
                            intersectingPaths.push(checkPath);
                        }
                    }
                }
            });

            path.needsIntersectCheck = false;

            if (debugLog) console.log("pathsThatNeedUpdate["+pathsThatNeedUpdate.indexOf(path)+"] # intersections: " + intersectingPaths.length);
        });
    }

    this.fillHole = function (x,y) {

    }

    this.eraseWithPath = function (pathData) {

    }

    this.setPathNeedsUpdate = function (wickObject) {
        var path = paperObjectWickMappings[wickObject.uuid];
        if(path)
            path.needsIntersectCheck = true;
    }


    var getAllSVGs = function () {
        var allSVGs = [];

        paper.project.activeLayer.children.forEach(function (child) {
            allSVGs.push(child);
        });

        return allSVGs;
    }

    var resetPathWickObjects = function () {
        if (debugLog) console.log("resetPathWickObjects")

        var removedWOs = [];
        currentFrame.wickObjects.forEach(function (wickObject) {
            if (!wickObject.pathData) return;
            removedWOs.push(wickObject);
        });
        removedWOs.forEach(function (wickObject) {
            wickObject.parentObject.removeChild(wickObject);
        })

        getAllSVGs().forEach(function (path) {
            addWickObjectFromPaperData(path);
        });
    }
    var addWickObjectFromPaperData = function (path) {
        WickObject.fromPathFile(path.exportSVG({asString:true}), function (wickObject) {
            wickObject.x = path.position.x;
            wickObject.y = path.position.y;
            wickObject.inFrameSVG = true;
            paperObjectWickMappings[wickObject.uuid] = path;
            wickEditor.project.addObject(wickObject, null, true);
        });
    }

    var addSVGGroupToCanvas = function (svgString) {
        if(!svgString) return;

        var xmlString = svgString
          , parser = new DOMParser()
          , doc = parser.parseFromString(xmlString, "text/xml");
        var paperGroup = paper.project.importSVG(doc);
        if(paperGroup.closePath) paperGroup.closePath();
        
        paperGroup.parent.insertChildren(paperGroup.index,  paperGroup.removeChildren());
        paperGroup.remove();
    }

    var addSVGToCanvas = function (svgString, offset) {
        var xmlString = svgString
          , parser = new DOMParser()
          , doc = parser.parseFromString(xmlString, "text/xml");
        var paperGroup = paper.project.importSVG(doc);
        if(paperGroup.closePath) paperGroup.closePath();

        if(offset)
            paperGroup.position = new paper.Point(offset.x, offset.y);

        addWickObjectFromPaperData(paperGroup);
    }*/

    var self = this;

    var paperCanvas;
    var paperObjectMappings = {};

    var debugLog = true;

    self.setup = function () {
        // Create the canvas to be used with paper.js and init the paper.js instance.
        paperCanvas = document.createElement('canvas');
        paperCanvas.className = 'paperCanvas';
        paperCanvas.style.backgroundColor = "#FFDDDD";
        paperCanvas.style.width  = (wickEditor.project.resolution.x/2)+'px';
        paperCanvas.style.height = (wickEditor.project.resolution.y/2)+'px';
        paper.setup(paperCanvas);
        paper.view.viewSize.width  = wickEditor.project.resolution.x;
        paper.view.viewSize.height = wickEditor.project.resolution.y;

        // (Debug) Put the canvas somewhere we can see it
        if(localStorage.pathDebug === "1") document.body.appendChild(paperCanvas);

        self.onWickObjectsChange();
    }
    
    self.syncWithEditorState = function () {
        
    }
    
    // Called when the wickobjects in the current frame have been modified.
    // Update the paper canvas accordingly.
    self.onWickObjectsChange = function () {
        
        // Generate a list of all wickobjects in the currentframe.
        // ALWAYS do this or you'll be modifying a list while forEaching through it (this is bad)
        var currentFrame = wickEditor.project.currentObject.getCurrentFrame();
        var wickObjects = [];
        if(currentFrame) {
            currentFrame.wickObjects.forEach(function (wickObject) { wickObjects.push(wickObject); });
        }
        
         // For each wickobject in the current frame:
        wickObjects.forEach(function (wickObject) {
            if (!wickObject.pathData) return;
            
            // If there is no corresponding paper path in the paper
            // canvas, create one.
            if(!paperObjectMappings[wickObject.uuid]) {
                
                var xmlString = wickObject.pathData
                  , parser = new DOMParser()
                  , doc = parser.parseFromString(xmlString, "text/xml");
                var group = paper.project.importSVG(doc);

                group.children.forEach(function (child) {
                    // Convert all paper.Shapes into paper.Paths (Paths have boolean ops, Shapes do not)
                    if(child instanceof paper.Shape) {
                        child.remove();
                        group.addChild(child.toPath());
                    }

                    // Boolean ops only work with closed paths (potrace generates open paths for some reason)
                    if(child.closePath) child.closePath();
                });

                group.position = new paper.Point(wickObject.x, wickObject.y);

                // Newly drawn paths need to get checked for intersections on next onPathsNeedCleanup
                if(wickObject.isNewDrawingPath) {
                    group.needsIntersectCheck = true;
                    wickObjects.isNewDrawingPath = undefined;
                }

                paperObjectMappings[wickObject.uuid] = group;

            // If there is, update the path's position/scale/rotation.
            } else {
                
                var path = paperObjectMappings[wickObject.uuid];
                
                path.applyMatrix = true;
                path.position.x = wickObject.x;
                path.position.y = wickObject.y;

                if(path.origRotation === undefined) path.origRotation = 0;
                var newRotation = wickObject.angle;
                if(newRotation !== path.origRotation) {
                    path.rotate(newRotation-path.origRotation);
                    wickObject.parentObject.removeChild(wickObject);
                    self.onPaperCanvasChange();
                    wickEditor.syncInterfaces();
                }

                if(path.origScaleX === undefined) path.origScaleX = 1;
                var newScaleX = wickObject.scaleX;
                if(newScaleX !== path.origScaleX) {
                    path.scaling.x = newScaleX*path.origScaleX;
                    path.origScaleX = wickObject.scaleX;
                }

                if(path.origScaleY === undefined) path.origScaleY = 1;
                var newScaleY = wickObject.scaleY;
                if(newScaleY !== path.origScaleY) {
                    path.scaling.y = newScaleY*path.origScaleY;
                    path.origScaleY = wickObject.scaleY;
                }
                
            }
        });
            
        allPaths = getAllPathsInCanvas();
        // For each path in the paper project:
        allPaths.forEach(function (path) {
            // If the wickobject corresponding to this path no
            // longer exists, delete it from the paper canvas
            var pathExistsInProject = false
            wickObjects.forEach(function (wickObject) {
                if (paperObjectMappings[wickObject.uuid] === path) {
                    pathExistsInProject = true;
                }
            });
            
            if(!pathExistsInProject) {
                removePathFromCanvas(path);
            }
        });
            
        // Apply changes to paper canvas to the current frame SVG.
        applyChangesToFrame();
        
    }
    
    // Called when the paths in the paper canvas have been modified.
    // Update the wickobjects in the current frame accordingly.
    self.onPaperCanvasChange = function () {

        var allPaths = getAllPathsInCanvas();
        
        // For each path in the paper canvas:
        allPaths.forEach(function (path) {
            var wickObject = null;
            for (uuid in paperObjectMappings) {
                if(paperObjectMappings[uuid] === path) {
                    wickObject = wickEditor.project.currentObject.getCurrentFrame().getObjectByUUID(uuid);
                }
            }

            // If there is no corresponding wickobject for this
            // path, create one.
            if (!wickObject) {
                if(debugLog) console.log("no wickObject")
                WickObject.fromPathFile(path.exportSVG({asString:true}), function (wickObject) {
                    wickObject.x = path.position.x;
                    wickObject.y = path.position.y;
                    paperObjectMappings[wickObject.uuid] = path;
                    wickEditor.project.addObject(wickObject, null, true);
                });
            // If there is, update the wickobject's position, reset
            // its rotation/scale, update its pathData, and set the
            // flag to regen its fabric object next sync.
            } else {
                if(debugLog) console.log("wickObject exists")
            }

        });
        
        // For each wickobject in the current frame:
        var currentFrame = wickEditor.project.currentObject.getCurrentFrame();
        var wickObjects = [];
        currentFrame.wickObjects.forEach(function (wickObject) { wickObjects.push(wickObject); });

        wickObjects.forEach(function (wickObject) {
            if (!wickObject.pathData) return;
            // If the paper object corresponding to this wickobject
            // no longer exists, delete it from the project.
            if(!paperObjectMappings[wickObject.uuid]) {
                if(debugLog) console.log("paper object no longer exists")
                wickObject.parentObject.removeChild(wickObject);
            }
        });
            
        // Apply changes to paper canvas to the current frame SVG.
        
    }
    
    // Called when overlapping paths need to be cleaned up.
    self.onPathsNeedCleanup = function () {

        var pathsDirty = false;
        
        // Do overlapping path union/subtraction for paper canvas.
        // Find all paths with needsIntersectCheck flag, these need to be checked for new intersections
        var paths = getAllPathsInCanvas();
        var pathsThatNeedUpdate = [];
        paths.forEach(function(path) {
            if(path.needsIntersectCheck) {
                pathsThatNeedUpdate.push(path);
            }
        });

        if(debugLog) console.log("- - - - - - - - - -");
        if(debugLog) console.log("# of pathsThatNeedUpdate: " + pathsThatNeedUpdate.length);

        // Check for intersections for all paths with needsIntersectCheck flag
        pathsThatNeedUpdate.forEach(function (path) {

            // Find all paths intersecting
            var paths = getAllPathsInCanvas();
            var intersectingPaths = [];
            paths.forEach(function (checkPath) {
                var pathA = path;
                var pathB = checkPath;

                if(pathA === pathB) return;

                var foundIntersection = false;
                for(var a = 0; a < pathA.children.length; a++) {
                    for(var b = 0; b < pathB.children.length; b++) {
                        var childA = pathA.children[a];
                        var childB = pathB.children[b];
                        if (!foundIntersection && childA.intersects(childB)) {
                            foundIntersection = true;
                            intersectingPaths.push(checkPath);
                        }
                    }
                }
            });

            path.needsIntersectCheck = false;

            if(debugLog) console.log("pathsThatNeedUpdate["+pathsThatNeedUpdate.indexOf(path)+"] # intersections: " + intersectingPaths.length);
            
            if(intersectingPaths.length > 0) {

                pathsDirty = true;

                var superPath = path.children[0].clone({insert:false});
                intersectingPaths.forEach(function (intersectingPath) {
                    superPath = superPath.unite(intersectingPath.children[0]);
                    removePathFromCanvas(intersectingPath);
                });

                var superGroup = new paper.Group();
                superGroup.addChild(superPath)

                removePathFromCanvas(path);

            }
        });
        
        if (pathsDirty) {
            self.onPaperCanvasChange();
            wickEditor.syncInterfaces();
        }
        
    }

    self.onFill = function (x,y) {

        var point = new paper.Point(x,y);

        // Try to find a path to fill
        var pathFilled = false;
        var paths = getAllPathsInCanvas();
        paths.forEach(function (path) {
            if(pathFilled) return;

            if(path.contains(point)) {
                console.log("Path filled:")
                console.log(path);

                pathFilled = true;
            }
        });

        // No path filled, try to find a hole to fill
        var holeFilled = false;
        if(!pathFilled) {
            console.log("No path filled, looking for holes now");

            // Unite all on-screen paths 
            var allPathsUnion = undefined;
            var paths = getAllPathsInCanvas();
            paths.forEach(function (path) {
                var clone = path.clone({insert:false});

                if(!allPathsUnion) {
                    allPathsUnion = clone.children[0];
                } else {
                    allPathsUnion = allPathsUnion.unite(clone.children[0]);
                }
            });

            if(!allPathsUnion) return;

            // Subtract union of all paths from huge rectangle
            var hugeRectangle = new paper.Path.Rectangle(new paper.Point(-1000,-1000), new paper.Size(2000,2000));
            var negativeSpace = hugeRectangle.subtract(allPathsUnion);
            hugeRectangle.remove();
            negativeSpace.remove();

            //console.log(allPathsUnion);
            //console.log(negativeSpace);
            //console.log(allPathsUnion.exportSVG({insert:false}))
            //console.log(negativeSpace.exportSVG({insert:false}))

            negativeSpace.children.forEach(function (child) {
                if(holeFilled) return;
                if(child.clockwise && child.area !== 4000000 && child.contains(point)) {
                    var clone = child.clone({insert:false});//.intersect(negativeSpace);
                    var group = new paper.Group();
                    group.addChild(clone);
                    clone.clockwise = false;
                    clone.fillColor = 'green';
                    group.fillRule = 'evenodd';
                    holeFilled = true;
                }
            });
        }

        if (pathFilled || holeFilled) {
            /*getAllPathsInCanvas().forEach(function (path) {
                path.children.forEach(function (child) {
                    if(child instanceof paper.Path) console.log(child.style);
                })
            });*/

            self.onPaperCanvasChange();
            wickEditor.syncInterfaces();
        }
    }

    self.setPathNeedsIntersectionCheck = function (wickObject) {
        var path = paperObjectMappings[wickObject.uuid];
        if (path) path.needsIntersectCheck = true;
    }
    
    //

    var removePathFromCanvas = function (path) {
        for (uuid in paperObjectMappings) {
            if(paperObjectMappings[uuid] === path) {
                paperObjectMappings[uuid] = null;
            }
        }

        path.remove();
    }
    
    var getAllPathsInCanvas = function () {
        
        var allSVGs = [];

        paper.project.activeLayer.children.forEach(function (child) {
            allSVGs.push(child);
        });

        return allSVGs;
        
    }
    
    var applyChangesToFrame = function () {
        
        var currentFrame = wickEditor.project.currentObject.getCurrentFrame();
        
        if(currentFrame) {
            currentFrame.pathData = paper.project.activeLayer.exportSVG({ asString: true });
        }
        
    }

 }