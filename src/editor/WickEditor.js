/* Wick - (c) 2016 Zach Rispoli, Luca Damasco, and Josh Rispoli */

var WickEditor = function () {

/*********************************
    Initialize all editor vars
*********************************/

    console.log("WickEditor Pre-Alpha");

    this.mode = "normal";

    // Check to see if we need to load a project from GitHub's Clubhouse
    var githubClubhouseProjectID = URLParameterUtils.getParameterByName("project");
    if (githubClubhouseProjectID) {
        console.log("Wick is in GitHub Clubhouse mode!");
        console.log("githubClubhouseProjectID: " + githubClubhouseProjectID);
        this.mode = "github-clubhouse";
        this.project = new WickProject(); // TODO: load project from github clubhouse server
    } else {
        this.project = WickProject.fromLocalStorage();
    }

    this.runningBuiltinPlayer = false;

    this.interfaces = {
        "builtinplayer" : new BuiltinPlayerInterface(this),
        "tooltips" : new TooltipsInterface(this),
        "rightclickmenu" : new RightClickMenuInterface(this),
        "splashscreen" : new SplashScreenInterface(this),
        "scriptingide" : new ScriptingIDEInterface(this),
        "timeline" : new TimelineInterface(this),
        "toolbar" : new ToolbarInterface(this),
        "menubar" : new MenuBarInterface(this),
        "properties" : new PropertiesInterface(this),
        "settings" : new SettingsInterface(this),
        "fabric" : new FabricInterface(this)
    };

    this.tools = {
        "cursor" : new CursorTool(this),
        "paintbrush" : new PaintbrushTool(this),
        "text" : new TextTool(this),
        "zoom" : new ZoomTool(this),
        "pan" : new PanTool(this)
    }
    this.currentTool = this.tools['cursor'];

    this.syncInterfaces();

    this.inputHandler = new InputHandler(this);
    this.actionHandler = new WickActionHandler(this);

}

WickEditor.prototype.syncInterfaces = function () {
    for (var key in this.interfaces) {
        this.interfaces[key].syncWithEditorState();
    }
}

