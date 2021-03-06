# An alternative Mind Map visualization - inspired by Microscopes
![The Mind-o-scope User Interface](mind-o-scope-v0.7.png "The Mind-o-scope User Interface")
This is a Web-App that converts a Mind Map Freemind-file into a zoomable Venn-diagram visualization with features like search, a better zooming experience, an online share mechanism and much more.

# Interaction
Simply select the node in which you want to zoom in. Alternatively you can also select the parent node in the path heading or a node in the hierarchy tree list.

# The implementation
It's mainly based on the awesome [d3.js](http://d3js.org) framework. This helps me a lot to visualize the Mind Map. The upload drag-and-drop area is based on [dropzone.js](http://www.dropzonejs.com). The introductions is made with [intro.js](http://usablica.github.io/intro.js/).

# Demo
Look to this demo Mind Map (it's based on the German cat Wikipedia article): [Katzen Mind-o-scope](http://app.mind-o-scope.com/demo).
This one is based on the [ACM Computing Classification System](https://www.acm.org/about/class/2012) that contains nearly 2500 nodes for classification of articles, books and journals: [ACM CCS 2012 Mind-o-scope](http://app.mind-o-scope.com/acmccs2012).

# The story behind
I made and used monster-sized, careful crafted and structured Mind Maps for my Bachelor study and liked the way how it helps me to visually structure everything I know (and I have to know). It helps me a lot to remember very special term by deriving its association to more meta-like topics and terms.

But monster Mind Maps always have one issue: nobody but me wants to read them because they're not good enough to explore them easily. Also it was kind of hard to share the PDF or some kind of Freemind-file. A more scientific reason is that monster-sized Mind Maps are demotivating people to read and explore them. So this is a try to do it a different way.
