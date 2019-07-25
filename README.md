# SimpleWaterfallPBI
Simple Waterfall, as name suggest is a waterfall chart designed to give users ability to use measures to create a multi-step waterfall. 
Additionally, you can add Text/Commentary to the chart to give users additional information and analysis.

You can watch the demo [here](https://youtu.be/kBDzMkwxyUs). You can also download the sample pbix file here

You will need create 2 types of measures

1. Base piller measures: These are measures that will be used to create the pillars of the waterfall
2. Step measures: These are the measures that will create the steps in the measure

How to create the visual

Step 1: Add "Simple Waterfall" visual on the canvas

Step 2: Drop you measures in the field "Values"

Step 3: Rename your base pillar easures in the visual and add "_" (underscore) in the beginning. This is very important as this distinguies which measures are base pillars and which are steps.

Additional step:
Step 4: Drop the commentary /  additional text in the field "Commentary"

Important to know:

The first measure should be a "Base pillar" measure. You cannot start with a step measure. You can instead have a base pillar with blank

The visual doesn't carry out a reconciliation in case you steps don't add up to the base pillar. 

The order of the measures if defined by the order in which they are arranged in the "value" field. You can move measures around to put them in the right order
