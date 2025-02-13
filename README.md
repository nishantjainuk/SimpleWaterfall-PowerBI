# Simple Waterfall

## Live Version: 2.1.0.4

## Under Review (Microsoft): 2.1.0.6

## Development Version: 2.0.11.0

Simple Waterfall provides an easy to use interface to create a waterfall chart. You can define pillars based on categories or measures and choose between vertical or horizontal chart type. You can format all elements of the waterfall chart including individual bar colours, label colour and a lot more. 

## Key Features
-	Choose between Vertical and Horizontal Chart
-	Define chart pillars by measure or category (see attached image)
-	Drillable and Drill-through capability
-	Format the chart either by sentiment (Total, favourable and adverse) or each individual data point
-	Define scrollable or non-scrollable chart (fit to the chart window)
-	Customize bar colour
-	Customisable margins of the chart
-	Choose when to show or hide category / measure with zero value 
-	X-axis / Y-axis
    -	Choose whether y-axis is auto defined or always starts with zero
    -	Choose between wrap-text or otherwise for x-axis labels
    -	Customise
        -	x-axis padding
        -	bars width
        -	gridlines
        -	font size and font type
        -	and a lot more
  -	Choose the number formatting for y-axis as (none, auto, thousand, millions or billions)
-	Labels
    -	Customise font colour, label positioning by sentiment or individual data points
    -	Choose the number formatting for y-axis as (none, auto, thousand, millions or billions)
-   Visual Interaction: 
    -   You can interact with the chart to filter other visuals on the same report.
    -   Example: Click on a pillar in the waterfall chart, and other visuals will update based on the data point.
-   Define Pillars: 
    Decide which measures act as pillars or steps in the chart:
    -   Pillars: Represent start or end values.
    -   Steps: Show changes between pillars. 
-   Enable or disable measures with a toggle button. 
-   Bar Colors:
    -   When sentiment formatting is ON: 
        -   Total is blue, favorable is green, and adverse is red.
    -   When sentiment formatting is OFF:
        -   Assign custom colors to each bar individually. 

## Different ways of creating charts

| Number of Categories |	Number of Measures |	Define pillars using | Drillable? |
| -------------------  | ------------------- | --------------- | ------------- |  
| None |	Any |	Measures |	No |
| 1 |	1 |	Category | No |
| More than 1 |	1 |	Category |	Yes|
| 1 |	More than 1	| Default (Measures = Pillars  Categories = Steps) | No |
| More than 1 |	More than 1 |	Default (Measures = Pillars Categories = Steps) |	Yes |


## Temporarily fixed version
We would like to inform you that the issues you're encountering with the "Simple Waterfall" visual is because the visual was developed a few years ago and has become outdated. When we tried to update it using a new API, some bugs were introduced with the latest version. This happened because we updated to the newest version, and those bugs were inadvertently added. We are fully aware of this issue and are working on releasing an updated version to the Microsoft AppStore. In the meantime, we’ve prepared a manual version of the visual that you can import into your report to temporarily resolve the issue. 

Here are the two options you can consider: 
1. **Organizational Visual**: You can add this visual to your organizational visuals.
2. **Power BI Visual**: You can import the visual directly into Power BI. 

Please follow the instructions below to guide you through the import process. We understand this is not ideal, but we are doing our best to work around the issue, and we’ll release the new version soon.

**Instructions to Import Simple Waterfall Visual from Your Local Computer**
To import the custom visual and resolve the issue temporarily, please follow these steps: 
1. **Enable Developer Options**:
    - In Power BI Desktop or your report, click on **File > Options and Settings > Options**.
    - In the **Options** window, go to **Report Settings** and check the box next to **Develop a Visual**.
    - Click **OK** to save the settings.
2. **Import the Custom Visual**:
    - Now, follow these instructions from Microsoft to import the visual from your local computer: [Import Power BI visuals from AppSource or from a file - Power BI | Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/developer/visuals/import-visual)
3. **Update the Visual**:
    - Once the custom visual is imported, change the Simple Waterfall visual to any other visual, such as a table.
    - Then, click back on the Simple Waterfall visual (from the visuals pane) and it should start working fine.

##Formatting Notes (Temporary Visual Behaviour):

1. **Label Formatting**:
    - If you set **Value Format** to **Auto**, it works as expected, and you can control decimal places in the labels.
    - If you set **Value Format** to **None**, the label formatting depends on the measure’s format, and the decimal places option in the formatting pane won’t apply.
2. **Small Chart Width**:
    - Even when the chart is narrow, it will display numbers properly without deleting or hiding them.
3. **Mac Compatibility**:
    - The chart is now fully fixed for Mac users and works properly.
4. **Line Breaks on X-Axis**:
    - If you face issues with line breaks in the X-axis labels, try the temporary fixed version. If you are still facing issues, use the **Wrap Text** option, toggle it off and on, and see if the issue is resolved.
5. **X-Axis Label Issues**:
    - If X-axis labels overlap or concatenate, use the **Wrap Text** option in the X-axis settings. Toggle it off and on to see if it resolves the issue.
6. **Bar Colour Changes After Update**:
    - If you’ve customized bar colours  in the visual, after importing the temporary fixed version, the colours  you set might change. 
    - To resolve this, simply reapply your desired colours  to the bars.
