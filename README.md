# SimpleWaterfallPBI
Simple Waterfall, as name suggest allows users to create a multi step waterfall chart with full control to defind how measures are used and how they are layed out in the waterfall. User can define which measures are "Base / Pillers" and which measures are "Step measures". You can move them around to get them arrange in the right order without the need to create any custom sort order. 

Additionally, you can add Text/Commentary to the chart to give users additional information and analysis.

The visual is fully interactive with other PBI visual such as slicers and chart points. 

## Key Functionality

- Easily define which measures are base measures and which are step measures, simply by remaning the measures in the visual
- Customise how your measures are arranged and change the layout easily
- Complete formatting options available, including change the pillar/step colors, font size, font type, font color etc
- Option to show negative numbers in brackets i.e. show -30 as (30)
- Option to hide/show steps values that are blank or zero

## Demo Video and Sample file
- [Demo video](https://youtu.be/Mz6zCzp87-A)
- [Sample pbix file](https://github.com/nishantjainuk/SimpleWaterfallPBI/blob/master/Simple%20Waterfall%20Sample.pbix?raw=true)

## How to create the visual

- Step 1: Add "Simple Waterfall" visual on the canvas

- Step 2: Drop you measures in the field "Values"

- Step 3: Rename your base pillar easures in the visual and add "_" (underscore) in the beginning. This is very important as this distinguies which measures are base pillars and which are steps.

### Optional step:
- Step 4: Drop the commentary /  additional text in the field "Commentary"

## Important to know:

- The first measure should be a "Base pillar" measure. You cannot start with a step measure. You can instead have a base pillar with blank
- The visual doesn't carry out a reconciliation in case you steps don't add up to the base pillar. 
- The order of the measures if defined by the order in which they are arranged in the "value" field. You can move measures around to put them in the right order
