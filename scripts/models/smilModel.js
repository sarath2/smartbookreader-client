// SmilModel both creates and plays the model
// Right now, the model extends the SMIL XML DOM; 
// if this becomes too heavy, we could use a custom lightweight tree instead
Readium.Models.SmilModel = function() {
    
    // these are playback logic functions for SMIL nodes
    // the context of each function is the node itself, as these functions will be attached to the nodes as members
    // e.g. 
    // parNode.render = parRender
    // seqNode.render = seqRender
    // etc
    NodeLogic = {
        
        parRender: function() {
            $.each(this.childNodes, function(index, value) {
                if (value.hasOwnProperty("render")) {
                    value.render();
                }
            });
        },
    
        // render starting at the given node; if null, start at the beginning
        seqRender: function(node) {
            if (node == null) {
                this.firstElementChild.render();
            }
            else {
                node.render();
            }
        },
    
        // called when the clip has completed playback
        audioNotifyChildDone: function() {
            this.parentNode.notifyChildDone(this);
        },
    
        // receive notice that a child node has finished playing
        parNotifyChildDone: function(node) {
            // we're only expecting one audio node child that we have to wait for
            // in the case of a more complex SMIL document (i.e. not media overlays), 
            // we might have to wait for more children to finish playing
            if (node.tagName == "audio") {
                this.parentNode.notifyChildDone(this);
            }
        },
    
        // receive notice that a child node has finished playing
        seqNotifyChildDone: function(node) {
            if (node.nextElementSibling == null) {
                if (this == root) {
                    notifySmilDone();
                }
                else {
                    this.parentNode.notifyChildDone(this);
                }
            }
            else {
                // prepare to play the next child node
                this.render(node.nextElementSibling);
            }
        }
    };
    
    
    // default renderers for time container playback
    // treat <body> like <seq>
    var renderers = {"seq": NodeLogic.seqRender, 
                    "par": NodeLogic.parRender, 
                    "body": NodeLogic.seqRender};
                    
    // each node type has a notification function associated with it
    // the notifiers get called when a child of the node has finished playback
    var notifiers = {"seq": NodeLogic.seqNotifyChildDone, 
                    "par": NodeLogic.parNotifyChildDone, 
                    "body": NodeLogic.seqNotifyChildDone,
                    "audio": NodeLogic.audioNotifyChildDone,
                    "text": function() {}}
    var url = null;
    var urlObj = null;
    var notifySmilDone = null;
    var root = null;
    
    // call this first with the media node renderers to add them to the master list
    this.addRenderers = function(rendererList) {
        renderers = $.extend(renderers, rendererList);
    };
    
    // set this so the model can resolve src attributes
    this.setUrl = function(fileUrl) {
        url = fileUrl;
        urlObj = new URI(url);
    };
    
    // set the callback for when the tree is done
    this.setNotifySmilDone = function(fn) {
        notifySmilDone = fn;
    };
    
    // build the model
    // node is the root of the SMIL tree, for example the body node of the DOM
    this.build = function(node) {
        root = node;
        processTree(node);
    };
    
    // prepare the tree to start rendering from a node
    this.render = function(node) {
        if (node == null || node == undefined || node == root) {
            root.render(null);
        }
        else {
            // if we're jumping to a point in the middle of the tree, then mark the first audio clip as a jump target
            // because it affects audio playback
            var audioNode = this.peekNextAudio(node);
            audioNode.isJumpTarget = true;
            node.parentNode.render(node);
        }
    };
    
    // find the first node with the given attribute value
    // e.g.
    // findNodeByAttrValue("*", "id", "num1")
    // findNodeByAttrValue("text", "", "")
    // findNodeByAttrValue("*", "id", "")
    // but NOT findNodeByAttrValue("text", "", "num1")
    this.findNodeByAttrValue = function(nodename, attr, val) {
        if (root == null) return null;
        var res = null;
        var attr_ = attr;
        
        if (attr_.indexOf(":") != -1) {
            // normalize for jquery
            attr_ = attr_.replace(":", "\\:");
        }
        
        var selector = nodename;
        if (attr_ != "") {
            selector += "[" + attr_;
            if (val != "") {
                selector += "='" + val + "'";
            }
            selector += "]";
        }
        res = $(root).find(selector);
        res = res.length == 0 ? null : res[0]; // grab first result
          
        return res;
    };
    
    // see what the next audio node is going to be
    // TODO take skippability into consideration
    this.peekNextAudio = function(currentNode) {
        
        // these first 2 cases are arguably just here for convenience: if we're near an audio node, then return it
        // TODO this does not consider that audio elements are actually optional children of <par>
        if (currentNode.tagName == "par") {
            return $(currentNode).find("audio")[0];
        }
        // TODO same as above
        if (currentNode.tagName == "text") {
            return $(currentNode.parentNode).find("audio")[0];
        }
        
        // if we aren't near an audio node, then keep looking
        var node = currentNode.parentNode;
        // go up the tree until we find a relative
        while(node.nextElementSibling == null) {
            node = node.parentNode;
            if (node == root) {
                return null;
            }
        }
        // find the first audio node
        return $(node.nextElementSibling).find("audio")[0];
    };
    
    // recursively process a SMIL XML DOM
    function processTree(node) {
        processNode(node);
        if (node.childNodes.length > 0) {
            $.each(node.childNodes, function(idx, val) {
                processTree(val);
            });
        }
    }       
    
    // process a single node and attach render and notify functions to it
    function processNode(node) {
        // add a toString method for debugging
        node.toString = function() {
            var string = "<" + this.nodeName;
            for (var i = 0; i < this.attributes.length; i++) {
                string += " " + this.attributes.item(i).nodeName + "=" + this.attributes.item(i).nodeValue;
            }
            string += ">";
            return string;
        };
        
        // connect the appropriate renderer
        if (renderers.hasOwnProperty(node.tagName)) {
            node.render = renderers[node.tagName];
        }
        
        // connect the appropriate notifier
        if (notifiers.hasOwnProperty(node.tagName)) {
            node.notifyChildDone = notifiers[node.tagName];
        }
        
        scrubAttributes(node);
    }
    
    // make sure the attributes are to our liking
    function scrubAttributes(node) {
        // process audio nodes' clock values
        if (node.tagName == "audio") {
            if ($(node).attr("src") != undefined) {
                $(node).attr("src", resolveUrl($(node).attr("src")));
            }    
            if ($(node).attr("clipBegin") != undefined) {
                $(node).attr("clipBegin", resolveClockValue($(node).attr("clipBegin")));
            }
            else {
                $(node).attr("clipBegin", 0);
            }
            if ($(node).attr("clipEnd") != undefined) {
                $(node).attr("clipEnd", resolveClockValue($(node).attr("clipEnd")));
            }
            else {
                $(node).attr("clipEnd", -1);
            }
        }
        else if (node.tagName == "text") {
            if ($(node).attr("src") != undefined) {
                $(node).attr("src", resolveUrl($(node).attr("src")));
            }
            if ($(node).attr("epub:textref") != undefined) {
                $(node).attr("epub:textref", resolveUrl($(node).attr("epub:textref")));
            }
        }
    }
    
    // TODO in the future, this will act as a skippability filter
    function canPlayNode(node) {
        return true;
    }
    
    // resolve url against SmilModel's urlObj
    function resolveUrl(url) {
        var url_ = new URI(url);
        return url_.resolve(urlObj).toString();
    }
    
    // parse the timestamp and return the value in seconds
    // supports this syntax: http://idpf.org/epub/30/spec/epub30-mediaoverlays.html#app-clock-examples
    function resolveClockValue(value) {        
        var hours = 0;
        var mins = 0;
        var secs = 0;
        
        if (value.indexOf("min") != -1) {
            mins = parseFloat(value.substr(0, value.indexOf("min")));
        }
        else if (value.indexOf("ms") != -1) {
            var ms = parseFloat(value.substr(0, value.indexOf("ms")));
            secs = ms/1000;
        }
        else if (value.indexOf("s") != -1) {
            secs = parseFloat(value.substr(0, value.indexOf("s")));                
        }
        else if (value.indexOf("h") != -1) {
            hours = parseFloat(value.substr(0, value.indexOf("h")));                
        }
        else {
            // parse as hh:mm:ss.fraction
            // this also works for seconds-only, e.g. 12.345
            arr = value.split(":");
            secs = parseFloat(arr.pop());
            if (arr.length > 0) {
                mins = parseFloat(arr.pop());
                if (arr.length > 0) {
                    hours = parseFloat(arr.pop());
                }
            }
        }
        var total = hours * 3600 + mins * 60 + secs;
        return total;
    }
};