/*global d3:false*/

function buildMindmap(hash) {
  'use strict';

  d3.select('#upload').style('display', 'none');
  d3.select('#mindmap').style('display', 'block');
  /*----------  Options to set (or to calculate)  ----------*/

  var margin = 35,
      circlePadding = 1,
      diameter = getDiameter(),
        // The diameter is the minimum available screen size for the graphics.
      container   = 'content',                // The container name which holds the graphics
      $sidebar    = d3.select('#sidebar'),    // The sidebar for additional content or interactions
      $menubutton = d3.select('#menubutton'), // The menubutton to show the sidebar
      $overviewButton = d3.select('#toRoot'), // The button to show the overview
      fileURL     = 'content/'+hash+'.json',
      width       = document.getElementById(container).offsetWidth,
      height      = document.getElementById(container).offsetHeight,
      maxNodeSize = 1000, // The standard size of a node. Will be used to calc the node size
      title       = "Mind-o-scope",
      zoomDuration = 750;
  ;


  /*----------  Colors  ----------*/

  // Color palette by http://tools.medialab.sciences-po.fr/iwanthue/
  // H: 0 - 291
  // C: 1.380 - 2.33
  // L: 0.81 - 1.22
  var color = d3.scale.ordinal()
    .range(
      ["#EF721F",
       "#4E9CEE",
       "#36D63D",
       "#DEC815",
       "#E076E7",
       "#75AE29",
       "#E8A117",
       "#39CD68",
       "#A886F2",
       "#C985D6",
       "#CA8025",
       "#ABA414",
       "#F46841",
       "#A0CB1C",
       "#50AB46",
       "#75CE2F",
       "#8E94E8",
       "#33B22E",
       "#61D350",
       "#E58222"]);
  //var color = d3.scale.category20();

  // Grey colors for the sidebar
  var colorgrey = d3.scale.linear()
    .domain([0, 6])
    .range(["#FCFCFC", "#C4C4C4"])
    .interpolate(d3.interpolateRgb);


  /*----------  Specifying the packing algorithm  ----------*/

  var pack = d3.layout.pack()
    .padding(circlePadding) // set the node padding
    .size([diameter - margin, diameter - margin]) // set the visual size
    .value(function(d) {
      // Calculating the size of each node, based on its depth.
      return maxNodeSize * Math.pow(1/d.depth,3);
    });


  /*----------  Building the Environment  ----------*/

  var svg = d3.select("#"+container).append("svg")
    .append("g");

  // This is for the tooltip vis
  // See /vendors/d3-tip
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return d.name;
    });

  // Invoke the tip in the context of the visualization
  svg.call(tip);

  /*=============================================
  =            CALCULATION FUNCTIONS            =
  =============================================*/

  /*----------  Calculates the diameter  ----------*/

  function getDiameter() {
    return (window.innerWidth > window.innerHeight ? (window.innerHeight - 50) : window.innerWidth);
  }

  /*-----------------------------  One child node handler functions  ----------------------------------*/
  /* Found on:                                                                                         */
  /* http://stackoverflow.com/questions/22307486/d3-js-packed-circle-layout-how-to-adjust-child-radius */

  function addPlaceholders( node ) {
    if(node.children) {
      for ( var i = 0; i < node.children.length; i++ ) {
        var child = node.children[i];
        addPlaceholders( child );
      }

      if(node.children.length === 1) {
        node.children.push({ name:'placeholder', children: [ { name:'placeholder', children:[] }] });
      }
    }
  }

  function removePlaceholders( nodes ) {
    for( var i = nodes.length - 1; i >= 0; i-- ) {
      var node = nodes[i];
      if( node.name === 'placeholder' ) nodes.splice(i,1);
      else if( node.children ) removePlaceholders( node.children );
    }
  }

  function centerNodes( nodes ) {
    for( var i = 0; i < nodes.length; i ++ ) {
      var node = nodes[i];
      if( node.children ) {
        if( node.children.length === 1) {
          var offset = node.x - node.children[0].x;
          node.children[0].x += offset;
          reposition(node.children[0],offset);
        }
      }
    }

    function reposition( node, offset ) {
      if(node.children) {
        for( var i = 0; i < node.children.length; i++ ) {
          node.children[i].x += offset;
          reposition( node.children[i], offset );
        }
      }
    }
  }

  function makePositionsRelativeToZero( nodes ) {

    //use this to have vis centered at 0,0,0 (easier for positioning)
    var offsetX = nodes[0].x;
    var offsetY = nodes[0].y;

    for( var i = 0; i < nodes.length; i ++ ) {
      var node = nodes[i];
      node.x -= offsetX;
      node.y -= offsetY;
    }
  }

  String.prototype.trunc =
    function(n,useWordBoundary){
       var toLong = this.length>n,
           s_ = toLong ? this.substr(0,n-1) : this;
       s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
       return  toLong ? s_ + '…' : s_;
    };

  /*=====  End of CALCULATION FUNCTIONS  ======*/


  /*=========================================
  =            DRAWING FUNCTIONS            =
  =========================================*/
  /**
   * TODO: Is it better to group circle and text via g-element?
   */

  /*----------  Variables  ----------*/
  var nodeTree;


  /**
   * Draws circles and attach every class on it
   * @param  {Object} nodes The nodes data
   * @return {Object}       Selection of every circle
   */
  function drawCircle(nodes) {
    nodeTree = 0;
    return svg.selectAll("circle")
      .data(nodes) // getting the data for every node
        .enter() // this is the D3 foreach loop
          .append("circle") // building the circle for each data node
            .attr("class", function(d) {
              // set class to node and to leaf (for endpoints) or to root (for stem)
              var output = 'node'+(d.parent ? d.children ? '' : ' leaf' : ' root');

              // set class to even or to odd, based on its level;
              output += ((d.depth % 2) === 0 ? ' even' : ' odd');

              return output;
            })
            .attr("r", function(d) { return d.r+ 7; })
            .style("fill", function(d) {

              // Setting the color based on the hierarchy
              if (d.depth == 1) nodeTree++;

              if (d.children) {
                if ((d.depth % 2) != 0) return color(nodeTree);
                else {
                  var tempColor = d3.hsl(color(nodeTree));
                  var newColor = d3.hsl('hsl('+tempColor.h+","+(tempColor.s * 100 * 1.09)+"%,"+(tempColor.l * 100 * 1.2)+'%)');

                  return newColor;
                  //return "rgba(255,255,255,0.30)";
                }
              }
              else return null;
            })
  }


  /**
   * Draws the labels that are belonging to the circles
   * @param  {Object} nodes The data container
   * @return {Object}       Selection of every built text element
   */
  function drawLabels(nodes,root) {
    return svg.selectAll("text")
      .data(nodes)
        .enter() // this is the D3 foreach loop
          .append("text")
            .attr("class", "label")
            .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
            .style("display", function(d) { return d.parent === root ? null : 'none'; })
            .text(function(d) {
              return d.name;
            });
            // .html(function(d) {
            //   var name = d.name;
            //   var x = 15;
            //   var output = "";
            //   var split = name.match(/\b[\w']+(?:[^\w\n]+[\w']+){0,2}\b/g);

            //   split.forEach(function (elem) {
            //     output += "<tspan>"+elem+'</tspan>';
            //   });
            //   return output;
            // });
  }


  /**
   * Draws the node elements
   * @param  {Object} nodes The data container
   * @return {Object}       Selection of every built nodelist element
   */
  function drawNodeList(nodes) {
    nodeTree = 0;
    return d3.select('#nodelist').selectAll("div")
      .data(nodes)
        .enter()
          .append('div')
              .text(function(d) {
                return d.name;
              })
          .attr("class", function(d) {
            // set class to node and to leaf (for endpoints) or to root (for stem)
            var output = 'listitem'+(d.parent ? d.children ? '' : ' leaf' : ' root');

            // set class to even or to odd, based on its level;
            output += ((d.depth % 2) === 0 ? ' even' : ' odd');

            return output;
          })
          .style("background-color", function(d) {
            return d.children ? colorgrey(d.depth) : "#f2f2f2";
          })
  }

  /*=====  End of DRAWING FUNCTIONS  ======*/


  /*====================================================
  =            INTERACTION ACTION FUNCTIONS            =
  ====================================================*/

  /*----------  Variables  ----------*/
  var isSidebarOpen = false;
  var isSettingsOpen = false;

  /**
   * Translates the zoom from current focused node to node d
   * @param  {Object} d The target node
   */
  function zoom(d) {
    var focus0 = focus; focus = d;

    setPath(d);

    if (focus === focus0) {
      return;
    }

    if (d.parent == null) {
      $overviewButton.attr('disabled', 'true');
    }
    else {
      $overviewButton.attr('disabled', null);
    }

    // interpolates the Zoom from current focused node to target node d
    var transition = d3.transition()
      .duration(d3.event.altKey ? zoomDuration * 10 : zoomDuration)
      .tween("zoom", function() {
        var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return function(t) { zoomTo(i(t)); };
      });

    // Arranges which labels are shown
    transition.selectAll("text")
      .filter(function(d) {
        return d.parent === focus || this.style.display === "inline";
      })
      .style("fill-opacity", function(d) {
        return d.parent === focus ? 1 : 0;
      })
      .each("start", function(d) {
        if (d.parent === focus) {
          this.style.display = "inline";
        }
      })
      .each("end", function(d) {
        if (d.parent !== focus) {
          this.style.display = "none";
        }
      });
  }


  /**
   * Calculates the transformation and the size for each single node
   * @param  {Array} v The Array with the x and y position
   */
  function zoomTo(v) {

    // Set the active node element in the list by attaching the class 'active'
    nodelist
      .classed("active", false)
      .filter(function(d) {
        return focus == d;
      })
      .classed("active", true);

    // Set the active node by attaching the class 'active'
    node
      .classed("active", false)
      .filter(function(d) {
        return focus == d;
      })
      .classed("active", true);

    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }


  /**
   * Shows and hides the sidebar and handles the focus on the #search input field
   */
  function toggleSidebar() {
    $sidebar.classed("show", !$sidebar.classed("show"));
    if (isSidebarOpen == false) {
      setSidebarContentHeight();
      isSidebarOpen = true;
      setTimeout(function(){
        d3.select('#search').node().focus();
      }, 300);
    }
    else {
      isSidebarOpen = false;
      d3.select('#search').node().blur();
    }
  }


  /**
   * Closes immediately the sidebar
   */
  function closeSidebar() {
    $sidebar.classed("show", false);
    isSidebarOpen = false;
    d3.select('#search').node().blur();
  }


  /**
   * Shows and hides the settings pane
   */
  function toggleSettings() {
    var nodeListElement = '#nodelist';
    var settingsElement = '#settings';
    var settingsButton = "#openSettings"
    $sidebar.select(nodeListElement).classed("show", !$sidebar.select(nodeListElement).classed("show"));
    $sidebar.select(settingsElement).classed("show", !$sidebar.select(settingsElement).classed("show"));
    $sidebar.select(settingsButton).classed("active", !$sidebar.select(settingsButton).classed("active"));
  }


  /**
   * Handles the search input by giving a direct feedback. For this we have to handle every
   * single Element in the UI to visualize the feedback.
   * @param  {String} searchterm: The string that holds the search term
   */
  function handleSearchInput(searchterm) {
    // First we have to filter the node list
    nodelist
      .classed("hide", true)
      .filter(function(d) {
        var name = d.name;
        return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
      })
      .classed("hide", false);

    // Then we have to filter the nodes itself
    node
      .classed("hide", true)
      .filter(function(d) {
        var name = d.name;
        return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
      })
      .classed("hide", false);

    // Handle the searchterm if it's not empty
    if (searchterm != "") {
      // attach the searchterm to the searchterm element in the UI
      d3.select('#searchterm')
        .text(searchterm)
        .classed('show',true)
        .on('click', function() {
          d3.select('#searchterm').classed('show',false);
          document.getElementById("search").value = "";
          nodelist.classed("hide", false);
          node.classed("hide", false);
        });
    }
    // Else: hide the searchterm element (that enables fast deleting of the searchterm)
    else {
      d3.select('#searchterm')
        .classed('show',false);
    }
  }

  function setZoomDuration(duration) {
    zoomDuration = duration;
  }

  /*=====  End of INTERACTION ACTION FUNCTIONS  ======*/

  /*=============================================
  =            ARRANGEMENT FUNCTIONS            =
  =============================================*/

  /**
   * Sets the size of the visualization and of every single UI element
   */
  function setSize() {
    // update variables
    width  = document.getElementById(container).offsetWidth;
    height = document.getElementById(container).offsetHeight;
    diameter = getDiameter();

    // reset the sizes
    d3.select('#'+container)
      .select('svg')
        .style('width',width+'px')
        .style('height',height+'px');

    d3.select(self.frameElement)
      .style("height", diameter + "px");

    d3.select('#'+container)
      .select('svg')
        .select('g')
          .attr('transform', 'translate('+(width/2)+','+((height/2)+(margin/2))+')'); // centering

  }


  /**
   * Sets recursive the node path by using getParentPath function
   * @param {Object} d: the actual node
   */
  function setPath(d) {
    var container = d3.select('#path .content');
    container.html('');
    container.append('span')
      .attr('class','active')
      .text(d.name);

    // start the recursive call
    getParentPath(d, container);

    /**
     * gets recursively a clickable breadcrumb path from actual node to the root
     * @param  {Object} d:         the actual viewed node (depends on recursion state)
     * @param  {Object} container: the container element that holds the path.
     * @return {String}            exits the function call if no parent node was found
     *                             (that means it's the root).
     */
    function getParentPath(d, container) {
      if (d.parent == null) return;
      d = d.parent;

      container.insert('span', ':first-child')
        .attr('class','divider');

      var title = ((d.depth + 2) > focus.depth || d.depth < 2) ? d.name : '···';

      container.insert('button', ':first-child')
        .text(title)
        .on('click', function() {
          closeSidebar();
          zoom(d);
        })
        .on('mouseover', function() {
          circle
            .filter(function(d2) {
              return d == d2;
            })
            .classed("hover", true);
        })
        .on('mouseout', function() {
          circle
            .filter(function(d2) {
              return d == d2;
            })
            .classed("hover", false);
        });

      getParentPath(d, container);
    }
  }


  /**
   * Sets the sidebar content height
   * TODO: could be depreached by a table display style
   */
  function setSidebarContentHeight() {
    // Set nodelist height
    var listheight = (
      height
      -($sidebar.select('header').node().getBoundingClientRect().height)
      -($sidebar.select('.searchbar').node().getBoundingClientRect().height)
      -($sidebar.select('footer').node().getBoundingClientRect().height)
    );

    $sidebar.select('.content').style('height', listheight+'px');
    $sidebar.select('.scrollmask').style('height', listheight+'px');
  }

  /*=====  End of ARRANGEMENT FUNCTIONS  ======*/


  /*=========================================================
  =            READ DATA AND BUILD VISUALIZATION            =
  =========================================================*/

  /*----------  Variables  ----------*/

  var focus, nodes, view;
  var circle, text, nodelist, node;

  d3.json(fileURL, function(error, root) {

    // Kill the process when there's no file or if the structure is unreadable
    if (error) throw error;


    /*----------  Initialize the data  ----------*/

    // Adding placeholders if a node has just one child
    // This extends the radius of the parent node
    addPlaceholders(root);

    // dynamic variables to calculate the visualization
    focus   = root; // The middle of everything
    nodes   = pack.nodes(root); // Packing every node into a circle packing layout

    // Removing the placeholders
    removePlaceholders(nodes);
    // Centering the one child nodes
    centerNodes( nodes );
    // Repositioning the nodes
    makePositionsRelativeToZero( nodes );

    // DEV: show the root in the console
    console.log(root);


    /*----------  Building the visuals  ----------*/

    circle = drawCircle(nodes);

    text = drawLabels(nodes, root);

    nodelist = drawNodeList(nodes);


    /*----------  Initialize Interactions  ----------*/

    /**
     * Window Arrangements
     */

    // Resizing the window
    d3.select(window).on('resize', function(){
      setSize();
      setSidebarContentHeight();
    });



    /**
     * Basic Visualization interactions
     */

    // Zoom out when user clicks on container
    d3.select('#'+container)
      // .style("background", color(-1))
      .on("click", function() {
        zoom(root);
        closeSidebar();
      });


    // Zoom back to the overview
    $overviewButton
      .on("click", function() {
        zoom(root);
      });

    // Mouse Events on circles
    circle
      .on("click", function(d) {
        d3.select(this).classed('visited',true);
        if (focus !== d) {
          closeSidebar();
          zoom(d), d3.event.stopPropagation();
        }
      })
      .on('mouseover', function(d) {
        tip.attr('class', 'd3-tip animate').show(d);
      })
      .on('mouseout', function(d) {
        tip.attr('class', 'd3-tip').show(d);
        tip.hide();
      });


    /**
     * Sidebar interactions
     */

    // Open the sidebar
    $menubutton
      .on("click", function() {
        toggleSidebar();
      });

    // Mouse events on nodelist elements
    nodelist
      .on('click', function(d) {
        if (d.children) {
          if (focus !== d) zoom(d), d3.event.stopPropagation();
        }
        else {
          if (focus !== d.parent) zoom(d.parent), d3.event.stopPropagation();
        }
      })
      .on('mouseover', function(d,i) {
        node
          .filter(function(d2,i2) {
            return i == i2;
          })
          .classed("hover", true);
      })
      .on('mouseout', function(d,i) {
        node
          .filter(function(d2,i2) {
            return i == i2;
          })
          .classed("hover", false);
      });

    // Open the settings pane
    d3.select('#openSettings')
      .on("click", function() {
        toggleSettings();
      });

    // Handle search inputs
    d3.select("#search")
      .on("input", function () {

        // First zoom out
        zoom(root);

        // then: handle the search input and its following actions
        var searchterm = this.value;
        handleSearchInput(searchterm);
      });

    // Option: hide visited nodes
    d3.select("#hideVisited")
      .on("change", function() {
        var hide = this.checked ? true : false;
        d3.select('body').classed('hide-visited',hide);
      });

    d3.select("#hideLabels")
      .on("change", function() {
        var hide = this.checked ? true : false;
        d3.select('body').classed('hide-labels',hide);
      });
    d3.select("#disableTooltip")
      .on("change", function() {
        var hide = this.checked ? true : false;
        d3.select('body').classed('hide-tooltip',hide);
      });

    d3.select('#zoomDuration')
      .on("mousedown", function() {
        d3.select('#zoomDurationOutput').classed('active', true);
      })
      .on("mouseout", function() {
        d3.select('#zoomDurationOutput').classed('active', false);
      })
      .on("change", function() {
        setZoomDuration(this.value);
      })

    /**
     * Keyboard interactions
     */

    d3.select("body").on("keydown", function () {
      // f key opens the sidebar and focuses the search input field
      if (!isSidebarOpen && d3.event.keyCode == 70) {
        d3.event.preventDefault();
        toggleSidebar();
      }
      // Escape key
      else if (d3.event.keyCode == 27) {
        d3.event.preventDefault();
        toggleSidebar();
      }
    });


    /*----------  Arrangement and initialization  ----------*/

    // Set sizes of the UI
    setSize();
    setSidebarContentHeight();

    // Register the nodes
    node = svg.selectAll("circle,text");

    // Set initial zoom to root
    zoomTo([root.x, root.y, root.r * 2 + margin]);
    setPath(root);

    // set the URL to the found hash value
    history.pushState('', root.name, "/"+hash);

    document.getElementById("shareURL").value = window.location.href;
    // set the title of the document (for browser history)
    document.title = root.name + ' | '+title;
  });

  /*=====  End of READ DATA AND BUILD VISUALIZATION  ======*/

  /*=====  End of document  ======*/
}