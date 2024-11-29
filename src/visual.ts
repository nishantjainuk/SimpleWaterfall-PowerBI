/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
"use strict";
//import "@babel/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IVisual = powerbi.extensibility.visual.IVisual;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import {
  ITooltipServiceWrapper,
  createTooltipServiceWrapper,
  TooltipEventArgs,
} from "./tooltipServiceWrapper";
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import DataViewHierarchyLevel = powerbi.DataViewHierarchyLevel;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewObject = powerbi.DataViewObject;
import PrimitiveValue = powerbi.PrimitiveValue;
import * as d3 from "d3";
import {
  valueFormatter as vf,
  textMeasurementService as tms,
  valueFormatter,
} from "powerbi-visuals-utils-formattingutils";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import { VisualSettings, yAxisFormatting, chartOrientation } from "./settings";
import { IEnumerateObjects, createenumerateObjects } from "./enumerateObjects";
import { dataRoleHelper } from "powerbi-visuals-utils-dataviewutils";
import { AxisScale, AxisDomain } from "d3";

interface BarChartDataPoint {
  value: PrimitiveValue;
  numberFormat: string;
  formattedValue: string;
  originalFormattedValue: string;
  isPillar: number;
  category: string;
  color: string;
  customBarColor: string;
  customFontColor: string;
  customLabelPositioning: string;
  selectionId: ISelectionId;
  childrenCount: number;
  sortOrderIndex: number;
  sortOrderIndexforLimitBreakdown: number;
  displayName: string;
}
export class Visual implements IVisual {
  private svg: d3.Selection<any, any, any, any>;
  private svgYAxis: d3.Selection<any, any, any, any>;
  private mainContainer: d3.Selection<any, any, any, any>;
  private legendContainer: d3.Selection<any, any, any, any>;
  private chartContainer: d3.Selection<any, any, any, any>;
  private gScrollable: d3.Selection<any, any, any, any>;
  private visualSettings: VisualSettings;
  private enumerateObjects: IEnumerateObjects;
  private adjustmentConstant: number;
  private minValue: number;
  private maxValue: number;
  private width: number;
  private height: number;
  private innerWidth: number;
  private innerHeight: number;
  private barChartData: BarChartDataPoint[];
  private barChartDataAll = [];
  private margin;
  private legendHeight;
  private host: IVisualHost;
  private selectionIdBuilder: ISelectionIdBuilder;
  private selectionManager: ISelectionManager;
  private tooltipServiceWrapper: ITooltipServiceWrapper;
  private visualType: string;
  private visualUpdateOptions: VisualUpdateOptions;
  private bars: d3.Selection<d3.BaseType, any, d3.BaseType, any>;
  private xAxisPosition = 0;
  private yAxisWidth = 0;
  private yAxisTitleWidth = 15;
  private yAxisHeightHorizontal = 0;
  private yAxisUnit: string;
  private scrollbarBreadth = 0;
  private yScaleTickValues = [];
  private events: IVisualEventService;
  private locale: string;
  private allowInteractions: boolean;
  private currentBarWidth: number;
  private isLabelVertical = false;
  private minLableVerticalHeight = 30;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.mainContainer = d3
      .select<HTMLElement, any>(options.element)
      .append("div");
    this.legendContainer = this.mainContainer.append("div");
    this.chartContainer = this.mainContainer.append("div");

    this.adjustmentConstant = 0;
    this.scrollbarBreadth = 8;
    this.tooltipServiceWrapper = createTooltipServiceWrapper(
      options.host.tooltipService,
      options.element
    );
    this.selectionIdBuilder = options.host.createSelectionIdBuilder();
    this.selectionManager = options.host.createSelectionManager();
    this.events = options.host.eventService;
    this.locale = options.host.locale;
  }
  private static parseSettings(dataView: DataView): VisualSettings {
    return <VisualSettings>VisualSettings.parse(dataView);
  }

  public enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
    this.enumerateObjects = createenumerateObjects(
      this.visualType,
      this.barChartData,
      this.barChartDataAll,
      this.visualSettings,
      this.defaultXAxisGridlineStrokeWidth(),
      this.defaultYAxisGridlineStrokeWidth(),
      this.visualUpdateOptions.dataViews[0],
      this.currentBarWidth
    );
    return this.enumerateObjects.enumerateObjectInstances(options);
  }
  public update(options: VisualUpdateOptions) {
    //Certification requirement to use rendering API//
    //-------------------------------------------------------------------------
    this.events.renderingStarted(options);
    //-------------------------------------------------------------------------
    this.visualUpdateOptions = options;
    let dataView: DataView = options.dataViews[0];
    this.visualSettings = Visual.parseSettings(
      options && options.dataViews && options.dataViews[0]
    );
    this.chartContainer.selectAll("svg").remove();
    this.addLegend(options);
    this.width = options.viewport.width;
    this.height = options.viewport.height - this.legendHeight;
    this.xAxisPosition = 0;
    if (dataView.matrix.rows.levels.length != 1) {
      this.visualSettings.chartOrientation.limitBreakdown = false;
    }
    if (dataView.matrix.rows.levels.length == 0) {
      this.visualType = "static";
      this.barChartData = this.getDataStaticWaterfall({ ...options });

      var allData = [];
      allData.push(this.barChartData);
    } else if (
      dataView.matrix.rows.levels.length == 1 &&
      dataView.matrix.valueSources.length == 1
    ) {
      this.visualType = "staticCategory";
      //this.barChartData = this.getDataStaticCategoryWaterfall(options);
      /*if (this.visualSettings.chartOrientation.limitBreakdown) {
                this.barChartData = this.limitBreakdownsteps(options, this.getDataStaticCategoryWaterfall(options));
            } else {
                
            }*/
      this.barChartData = this.getDataStaticCategoryWaterfall(options);

      var allData = [];
      allData.push(this.barChartData);
    } else if (
      dataView.matrix.rows.levels.length != 1 &&
      dataView.matrix.valueSources.length == 1
    ) {
      this.visualType = "drillableCategory";
      var allData = this.getDataDrillableCategoryWaterfall(options);
      this.barChartDataAll = this.getDataDrillableCategoryWaterfall(options);
      this.barChartData =
        this.getDataDrillableCategoryWaterfall(options)[allData.length - 1];
    } else {
      this.visualType = "drillable";
      var allData = this.getDataDrillableWaterfall(options);
      this.barChartDataAll = this.getDataDrillableWaterfall(options);
      /*if (this.visualSettings.chartOrientation.limitBreakdown) {
                this.barChartData = this.limitBreakdownsteps(options, this.barChartData = this.getDataDrillableWaterfall(options)[allData.length - 1]);
            } else {
                
            }*/
      this.barChartData =
        this.getDataDrillableWaterfall(options)[allData.length - 1];
    }
    // console.log({ type: this.visualType });

    this.createWaterfallGraph(options, allData);
    //Certification requirement to use rendering API//
    //-------------------------------------------------------------------------
    this.events.renderingFinished(options);
    //-------------------------------------------------------------------------
  }
  private addLegend(options: VisualUpdateOptions) {
    this.legendContainer.selectAll("svg").remove();
    if (
      this.visualSettings.chartOrientation.useSentimentFeatures &&
      this.visualSettings.Legend.show
    ) {
      //this.legendContainer.attr('width', options.viewport.width);
      //this.legendContainer.attr('height', 0);

      var circleFavourableSVG = this.legendContainer.append("svg");

      var circleFavourable = circleFavourableSVG.append("circle");

      var textFavourableSVG = this.legendContainer.append("svg");
      /* .attr('width', 10 + "pt")
                .attr('height', 10 + "pt") */
      /* .style('margin-left', 2 + "pt")
                .style('margin-right', 2 + "pt") */ var textFavourable =
        textFavourableSVG
          .append("text")
          .attr("x", 0)
          .attr("y", "75%")
          .style("font-size", this.visualSettings.Legend.fontSize + "pt")
          .text(this.visualSettings.Legend.textFavourable)
          .style("font-family", this.visualSettings.Legend.fontFamily)
          .style("fill", this.visualSettings.Legend.fontColor);

      var textBoxSize;
      var textBoxSizeHeight;
      var textBoxSizeWidth;
      textBoxSize = textFavourable.node().getBoundingClientRect();
      textBoxSizeHeight = textBoxSize.height;
      textBoxSizeWidth = textBoxSize.width;
      circleFavourableSVG
        .attr("height", textBoxSizeHeight)
        .attr("width", textBoxSizeHeight);

      textFavourableSVG
        .attr("width", textBoxSizeWidth)
        .attr("height", textBoxSizeHeight);

      circleFavourable
        .attr("r", (textBoxSizeHeight / 2) * 0.6)
        .attr("cx", textBoxSizeHeight / 2)
        .attr("cy", textBoxSizeHeight / 2)
        .attr(
          "fill",
          this.visualSettings.sentimentColor.sentimentColorFavourable
        );

      var circleAdverseSVG = this.legendContainer.append("svg");

      var circleAdverse = circleAdverseSVG.append("circle");

      var textAdverseSVG = this.legendContainer.append("svg");
      /* .attr('width', 10)
                .attr('height', 10) */
      /* .style('margin-left', 2 + "pt")
                .style('margin-right', 2+ "pt") */ var textAdverse =
        textAdverseSVG
          .append("text")
          .attr("x", 0)
          .attr("y", "75%")
          .style("font-size", this.visualSettings.Legend.fontSize + "pt")
          .text(this.visualSettings.Legend.textAdverse)
          .style("font-family", this.visualSettings.Legend.fontFamily)
          .style("fill", this.visualSettings.Legend.fontColor);

      textBoxSize = textAdverse.node().getBoundingClientRect();
      textBoxSizeHeight = textBoxSize.height;
      textBoxSizeWidth = textBoxSize.width;
      circleAdverseSVG
        .attr("height", textBoxSizeHeight)
        .attr("width", textBoxSizeHeight);

      textAdverseSVG
        .attr("width", textBoxSizeWidth)
        .attr("height", textBoxSizeHeight);

      circleAdverse
        .attr("r", (textBoxSizeHeight / 2) * 0.6)
        .attr("cx", textBoxSizeHeight / 2)
        .attr("cy", textBoxSizeHeight / 2)
        .attr("fill", this.visualSettings.sentimentColor.sentimentColorAdverse);
      this.legendContainer
        //.style('width', options.viewport.width)
        .style("height", textBoxSizeHeight + "pt");
      this.legendHeight = textBoxSizeHeight;
    } else {
      this.legendContainer
        //.style('width', options.viewport.width)
        .style("height", 0 + "pt");
      this.legendHeight = 0;
    }
  }
  private createWaterfallGraph(options, allData) {
    this.allowInteractions = true;
    if (this.visualSettings.chartOrientation.orientation == "Horizontal") {
      this.createWaterfallGraphHorizontal(options, allData);
    } else {
      this.createWaterfallGraphVertical(options, allData);
    }
  }

  private createWaterfallGraphVertical(options, allData) {
    if (this.visualSettings.yAxisFormatting.switchPosition) {
      this.svg = this.chartContainer.append("svg");
      this.svgYAxis = this.chartContainer.append("svg");
    } else {
      this.svgYAxis = this.chartContainer.append("svg");
      this.svg = this.chartContainer.append("svg");
    }

    this.svg.on("contextmenu", (event) => {
      const mouseEvent: MouseEvent = <MouseEvent>event;
      const eventTarget: EventTarget = mouseEvent.target;
      let dataPoint: any = d3.select(<d3.BaseType>eventTarget).datum();
      this.selectionManager.showContextMenu(
        dataPoint ? dataPoint.selectionId : {},
        {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
        }
      );
      mouseEvent.preventDefault();
    });
    this.chartContainer.attr("width", this.width);
    this.chartContainer.attr("height", this.height);
    this.svg.attr("height", this.height);
    this.svgYAxis.attr("height", this.height);

    this.margin = {
      top: this.visualSettings.margins.topMargin + 20,
      right: this.visualSettings.margins.rightMargin,
      bottom: this.visualSettings.margins.bottomMargin,
      left: this.visualSettings.margins.leftMargin,
    };
    this.innerWidth = this.width - this.margin.left - this.margin.right;
    this.innerHeight = this.height - this.margin.top - this.margin.bottom;
    this.adjustmentConstant = this.findXaxisAdjustment(this.barChartData);

    this.getMinMaxValue();
    this.gScrollable = this.svg.append("g");
    this.getYaxisWidth(this.gScrollable);

    const yAxisMargin = this.visualSettings.yAxisFormatting.switchPosition
      ? this.margin.right
      : this.margin.left;
    this.svgYAxis.attr("width", yAxisMargin + this.yAxisWidth);

    this.width = this.width - this.margin.left - this.yAxisWidth - 5;

    this.checkBarWidth(options);
    this.createXaxis(this.gScrollable, options, allData);
    this.createYAxis(this.svgYAxis, yAxisMargin + this.yAxisWidth);
    this.createYAxisGridlines(this.gScrollable, 0);
    if (this.visualSettings.yAxisFormatting.showTitle) {
      this.createYAxisTitle(this.svgYAxis, options);
    }
    this.createBars(this.gScrollable, this.barChartData);
    this.createLabels(this.gScrollable);

    this.svg.attr("width", this.width);
  }

  private createYAxisTitle(svg, options) {
    let title = "";
    switch (this.visualSettings.yAxisFormatting.titleStyle) {
      case "Show Title Only":
        title = options.dataViews[0].matrix.valueSources
          .map((v) => v.displayName)
          .join(", ");
        break;
      case "Show Unit Only":
        title = this.yAxisUnit;
        break;
      case "Show Both":
        title = `${options.dataViews[0].matrix.valueSources
          .map((v) => v.displayName)
          .join(", ")} (${this.yAxisUnit})`;
        break;
      default:
        break;
    }
    title = this.visualSettings.yAxisFormatting.titleText || title;

    const titleSvg = svg
      .append("text")
      .text(`${title}`)
      .style("text-anchor", "middle")
      .style(
        "font-size",
        this.visualSettings.yAxisFormatting.titleFontSize + "pt"
      )
      .style("font-family", this.visualSettings.yAxisFormatting.titleFontFamily)
      .style("fill", this.visualSettings.yAxisFormatting.titleColor)
      .style(
        "font-weight",
        this.visualSettings.yAxisFormatting.titleBold ? "bold" : "normal"
      )
      .style(
        "font-style",
        this.visualSettings.yAxisFormatting.titleItalic ? "italic" : "normal"
      )
      .style(
        "text-decoration",
        this.visualSettings.yAxisFormatting.titleUnderline
          ? "underline"
          : "none"
      );
    if (this.visualSettings.chartOrientation.orientation === "Vertical") {
      const yPosition = this.visualSettings.yAxisFormatting.switchPosition
        ? this.yAxisWidth - 5
        : this.yAxisTitleWidth - 5;
      titleSvg
        .attr("transform", "rotate(-90)")
        .attr("x", -(this.height / 2))
        .attr("y", yPosition);
    } else {
      const yPosition = this.visualSettings.yAxisFormatting.switchPosition
        ? this.yAxisTitleWidth - 5
        : this.yAxisHeightHorizontal - this.yAxisTitleWidth + 10;
      titleSvg.attr("x", this.innerWidth / 2).attr("y", yPosition);
    }
  }

  private checkBarWidth(options) {
    var xScale = d3
      .scaleBand()
      .domain(this.barChartData.map(this.xValue))
      .range([0, this.innerWidth])
      .padding(0.2);

    this.currentBarWidth = xScale.step();

    if (this.currentBarWidth < 20) {
      this.visualSettings.xAxisFormatting.fitToWidth = false;
    }
    if (!this.visualSettings.xAxisFormatting.fitToWidth) {
      if (this.currentBarWidth < 20) this.currentBarWidth = 20;
      this.visualUpdateOptions = options;
      if (
        this.currentBarWidth <= this.visualSettings.xAxisFormatting.barWidth
      ) {
        this.currentBarWidth = this.visualSettings.xAxisFormatting.barWidth;

        var scrollBarGroup = this.svg.append("g");
        var scrollbarContainer = scrollBarGroup
          .append("rect")
          .attr("width", this.width)
          .attr("height", this.scrollbarBreadth)
          .attr("x", 0)
          .attr("y", this.height - this.scrollbarBreadth)
          .attr("fill", "#e1e1e1")
          .attr("opacity", 0.5)
          .attr("rx", 4)
          .attr("ry", 4);
        this.innerWidth =
          this.currentBarWidth * this.barChartData.length +
          this.currentBarWidth * xScale.padding();

        this.innerHeight =
          this.height -
          this.margin.top -
          this.margin.bottom -
          this.scrollbarBreadth;
        var dragStartPosition = 0;
        var dragScrollBarXStartposition = 0;
        var scrollbarwidth = (this.width * this.width) / this.innerWidth;

        var scrollbar = scrollBarGroup
          .append("rect")
          .attr("width", scrollbarwidth)
          .attr("height", this.scrollbarBreadth)
          .attr("x", 0)
          .attr("y", this.height - this.scrollbarBreadth)
          .attr("fill", "#000")
          .attr("opacity", 0.24)
          .attr("rx", 4)
          .attr("ry", 4);

        var scrollBarDragBar = d3
          .drag()
          .on("start", (event) => {
            dragStartPosition = event.x;
            dragScrollBarXStartposition = parseInt(scrollbar.attr("x"));
          })
          .on("drag", (event) => {
            var scrollBarMovement = event.x - dragStartPosition;
            //do not move the scroll bar beyond the x axis or after the end of the scroll bar
            if (
              dragScrollBarXStartposition + scrollBarMovement >= 0 &&
              dragScrollBarXStartposition +
                scrollBarMovement +
                scrollbarwidth <=
                this.width
            ) {
              scrollbar.attr(
                "x",
                dragScrollBarXStartposition + scrollBarMovement
              );
              this.gScrollable.attr(
                "transform",
                `translate(${
                  ((dragScrollBarXStartposition + scrollBarMovement) /
                    (this.width - scrollbarwidth)) *
                  (this.innerWidth - this.width) *
                  -1
                },${0})`
              );
            }
          });
        var scrollBarVerticalWheel = d3.zoom().on("zoom", (event) => {
          var zoomScrollContainerheight = parseInt(
            scrollbarContainer.attr("width")
          );
          var deltaY = event.sourceEvent.deltaY;

          var zoomScrollBarMovement =
            ((deltaY / 100) * zoomScrollContainerheight) /
            this.barChartData.length;
          var zoomScrollBarXStartposition = parseInt(scrollbar.attr("x"));
          var zoomScrollBarheight = parseInt(scrollbar.attr("width"));

          var scrollBarMovement =
            zoomScrollBarXStartposition + zoomScrollBarMovement;
          if (scrollBarMovement < 0) {
            scrollBarMovement = 0;
          }
          if (
            scrollBarMovement + zoomScrollBarheight >
            zoomScrollContainerheight
          ) {
            scrollBarMovement = zoomScrollContainerheight - zoomScrollBarheight;
          }
          scrollbar.attr("x", scrollBarMovement);
          this.gScrollable.attr(
            "transform",
            `translate(${
              (scrollBarMovement / (this.width - scrollbarwidth)) *
              (this.innerWidth - this.width) *
              -1
            },${0})`
          );
        });

        scrollBarDragBar(this.svg);
        scrollBarVerticalWheel(this.svg);
        scrollBarDragBar(scrollbar);
      }
    }
  }

  private defaultYAxisGridlineStrokeWidth = () => {
    var currentgridLineStrokeWidth = 1;
    if (this.visualSettings.yAxisFormatting.gridLineStrokeWidth < 1) {
      currentgridLineStrokeWidth = 1;
    } else {
      currentgridLineStrokeWidth =
        this.visualSettings.yAxisFormatting.gridLineStrokeWidth;
    }
    return currentgridLineStrokeWidth;
  };
  private defaultXAxisGridlineStrokeWidth = () => {
    var currentgridLineStrokeWidth = 1;
    if (this.visualSettings.xAxisFormatting.gridLineStrokeWidth < 1) {
      currentgridLineStrokeWidth = 1;
    } else {
      currentgridLineStrokeWidth =
        this.visualSettings.xAxisFormatting.gridLineStrokeWidth;
    }
    return currentgridLineStrokeWidth;
  };

  private yValue = (d) => d.value;
  private xValue = (d) => d.category;

  private getMinMaxValue() {
    if (
      this.visualSettings.yAxisFormatting.YAxisDataPointOption == "Range" &&
      this.visualSettings.yAxisFormatting.YAxisDataPointRangeStart != 0 &&
      this.visualSettings.yAxisFormatting.YAxisDataPointRangeEnd != 0
    ) {
      this.minValue =
        this.visualSettings.yAxisFormatting.YAxisDataPointRangeStart;
      this.maxValue =
        this.visualSettings.yAxisFormatting.YAxisDataPointRangeEnd;
    } else {
      this.minValue = this.findMinCumulativeValue(this.barChartData);
      this.maxValue = this.findMaxCumulativeValue(this.barChartData);
    }

    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerHeight, 0]);

    var ticksCount = 5;
    var staticYscaleTIcks = yScale.ticks(ticksCount);

    //realigning the xaxis to the first tick value of yaxis
    if (this.minValue != 0) {
      if (this.minValue > 0) {
        var firstTickValueforPositive =
          staticYscaleTIcks[0] - (staticYscaleTIcks[1] - staticYscaleTIcks[0]);
        this.minValue = firstTickValueforPositive;
        staticYscaleTIcks.unshift(firstTickValueforPositive);
      }
      if (this.maxValue < 0) {
        var firstTickValueforNegative =
          staticYscaleTIcks[staticYscaleTIcks.length - 1] -
          (staticYscaleTIcks[staticYscaleTIcks.length - 2] -
            staticYscaleTIcks[staticYscaleTIcks.length - 1]);
        this.maxValue = firstTickValueforNegative;
        staticYscaleTIcks.push(firstTickValueforNegative);
      }
    }
    if (this.maxValue > 0) {
      var lastTickValueforPositive =
        staticYscaleTIcks[staticYscaleTIcks.length - 1] +
        (staticYscaleTIcks[staticYscaleTIcks.length - 1] -
          staticYscaleTIcks[staticYscaleTIcks.length - 2]);
      this.maxValue = lastTickValueforPositive;
      staticYscaleTIcks.push(lastTickValueforPositive);
    }
    if (this.minValue < 0) {
      var lastTickValueforNegative =
        staticYscaleTIcks[0] + (staticYscaleTIcks[0] - staticYscaleTIcks[1]);
      var lastTickValueforNegative2 =
        staticYscaleTIcks[0] +
        (staticYscaleTIcks[0] - staticYscaleTIcks[1]) * 2;
      //add 2 steps to have enough space between the xAxis and the labels.
      this.minValue = lastTickValueforNegative2;
      staticYscaleTIcks.unshift(
        lastTickValueforNegative,
        lastTickValueforNegative2
      );
    }

    this.yScaleTickValues = staticYscaleTIcks;
    this.visualSettings.yAxisFormatting.YAxisDataPointRangeStart =
      this.minValue;
    this.visualSettings.yAxisFormatting.YAxisDataPointRangeEnd = this.maxValue;
  }
  private createYAxis(gParent, adjustLeft) {
    var g = gParent.append("g").attr("class", "yAxisParentGroup");

    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerHeight, 0]);

    var yAxisScale = this.visualSettings.yAxisFormatting.switchPosition
      ? d3.axisRight(yScale).tickValues(this.yScaleTickValues)
      : d3.axisLeft(yScale).tickValues(this.yScaleTickValues);

    if (this.visualSettings.yAxisFormatting.show) {
      var yAxis = g
        .append("g")
        .style(
          "font",
          this.visualSettings.yAxisFormatting.fontSize + "pt times"
        )
        .style("font-family", this.visualSettings.yAxisFormatting.fontFamily)
        .style("color", this.visualSettings.yAxisFormatting.fontColor)
        .attr("class", "myYaxis");
      yAxisScale.tickFormat((d) => this.formatValueforYAxis(d));

      yAxis.call(yAxisScale);
      if (!this.visualSettings.yAxisFormatting.showYAxisValues) {
        yAxis.selectAll("text").style("visibility", "hidden");
      }
      yAxis
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "0pt");

      yAxis
        .selectAll("line")
        .style("fill", "none")
        .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor)
        .style("stroke-width", "0pt");
    }

    g.attr(
      "transform",
      `translate(${
        this.visualSettings.yAxisFormatting.switchPosition ? 0 : adjustLeft
      },${this.margin.top})`
    );
  }
  private createYAxisGridlines(gParent, adjustLeft) {
    var g = gParent.append("g").attr("class", "yAxisGridGroup");

    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerHeight, 0]);

    var yAxisScale = this.visualSettings.yAxisFormatting.switchPosition
      ? d3.axisRight(yScale).tickValues(this.yScaleTickValues)
      : d3.axisLeft(yScale).tickValues(this.yScaleTickValues);

    if (this.visualSettings.yAxisFormatting.show) {
      var yAxis = g
        .append("g")
        .style(
          "font",
          this.visualSettings.yAxisFormatting.fontSize + "pt times"
        )
        .style("font-family", this.visualSettings.yAxisFormatting.fontFamily)
        .style("color", this.visualSettings.yAxisFormatting.fontColor)
        .attr("class", "myYaxis");
      yAxisScale.tickFormat((d) => this.formatValueforYAxis(d));

      yAxis.call(yAxisScale);

      yAxis.selectAll("text").style("visibility", "hidden");

      yAxis
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "0pt");

      if (this.visualSettings.yAxisFormatting.showGridLine) {
        // Scale dash array by visual width if enabled
        const scaledDashArray = this.visualSettings.yAxisFormatting.scaleByWidth
          ? this.scaleDashArray(
              this.visualSettings.yAxisFormatting.dashArray,
              this.innerWidth
            )
          : this.visualSettings.yAxisFormatting.dashArray;

        yAxis
          .selectAll("line")
          .style("fill", "none")
          .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor)
          .style(
            "stroke-width",
            this.defaultYAxisGridlineStrokeWidth() / 10 + "pt"
          )
          .style(
            "stroke-dasharray",
            this.visualSettings.yAxisFormatting.gridLineStyle === "custom"
              ? scaledDashArray
              : this.getLineDashArray(
                  this.visualSettings.yAxisFormatting.gridLineStyle
                )
          )
          .style(
            "stroke-linecap",
            this.visualSettings.yAxisFormatting.gridLineStyle === "custom"
              ? this.visualSettings.yAxisFormatting.dashCap
              : "flat"
          ); // Default to flat
      } else {
        yAxis
          .selectAll("line")
          .style("fill", "none")
          .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor)
          .style("stroke-width", "0pt");
      }
      if (this.visualSettings.yAxisFormatting.showZeroAxisGridLine) {
        yAxis.selectAll("line").each((d, i, nodes) => {
          if (d == 0) {
            d3.select(nodes[i])
              .style("fill", "none")
              .style(
                "stroke",
                this.visualSettings.yAxisFormatting.zeroLineColor
              )
              .style(
                "stroke-width",
                this.visualSettings.yAxisFormatting.zeroLineStrokeWidth / 10 +
                  "pt"
              );
          }
        });
      }

      yAxis.selectAll("line").attr("x2", this.innerWidth);
    }
    g.attr(
      "transform",
      `translate(${
        this.visualSettings.yAxisFormatting.switchPosition ? 0 : adjustLeft
      },${this.margin.top})`
    );
  }

  private getLineDashArray(style: string): string {
    switch (style) {
      case "dashed":
        return "5,5"; // Dashed pattern
      case "dotted":
        return "1,5"; // Dotted pattern
      case "solid":
      default:
        return "0"; // Solid pattern
    }
  }

  private scaleDashArray(dashArray: string, width: number): string {
    if (!dashArray) return "";
    const scaleFactor = width / 100; // Adjust scaling logic as needed
    return dashArray
      .split(",")
      .map((value) => parseFloat(value) * scaleFactor)
      .join(",");
  }

  private getYaxisWidth(gParent) {
    var g = gParent.append("g").attr("class", "yAxisParentGroup");
    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerHeight, 0]);

    /*var ticksCount = 5;
        var staticYscaleTIcks = yScale.ticks(ticksCount);*/

    var yAxisScale = this.visualSettings.yAxisFormatting.switchPosition
      ? d3.axisRight(yScale).tickValues(this.yScaleTickValues)
      : d3.axisLeft(yScale).tickValues(this.yScaleTickValues);

    if (this.visualSettings.yAxisFormatting.show) {
      var yAxis = g
        .append("g")
        .style(
          "font",
          this.visualSettings.yAxisFormatting.fontSize + "pt times"
        )
        .style("font-family", this.visualSettings.yAxisFormatting.fontFamily)
        .style("color", this.visualSettings.yAxisFormatting.fontColor)
        .attr("class", "myYaxis");

      yAxisScale.tickFormat((d) => this.formatValueforYAxis(d));

      yAxis.call(yAxisScale);

      // adjust the left margin of the chart area according to the width of yaxis
      // yAxisWidth used to adjust the left margin
      this.yAxisWidth = this.visualSettings.yAxisFormatting.showYAxisValues
        ? yAxis.node().getBoundingClientRect().width
        : 0;
      // this.yAxisWidth = yAxis.node().getBoundingClientRect().width;
      this.yAxisWidth += this.visualSettings.yAxisFormatting.showTitle
        ? this.yAxisTitleWidth
        : 0;
      this.innerWidth = this.innerWidth - this.yAxisWidth;
    } else {
      this.yAxisWidth = 0;
    }
    g.remove();
  }
  private yBreakdown(d, i) {
    var yBreakdownValue = 0;
    var startingPointCumulative = 0;
    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerHeight, 0]);

    //calculate the cumulative starting value
    for (let index = 0; index < i; index++) {
      if (this.barChartData[index].isPillar == 1 || index == 0) {
        startingPointCumulative = this.yValue(this.barChartData[index]);
      } else {
        startingPointCumulative += this.yValue(this.barChartData[index]);
      }
    }

    //if the current breakdown is negative, reduce the value else do nothing.
    if (this.yValue(d) < 0) {
      startingPointCumulative += Math.abs(this.yValue(d));
    }
    // no adjustment done for the main pillars

    if (d.isPillar == 1 || i == 0) {
    } else {
      yBreakdownValue = yScale(0) - yScale(startingPointCumulative);
    }

    return yBreakdownValue;
  }

  private getYPosition(d, i) {
    var Yposition = 0;
    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerHeight, 0]);

    if ((d.isPillar == 1 || i == 0) && d.value < 0) {
      if (this.maxValue >= 0) {
        Yposition = yScale(0);
      } else {
        Yposition = yScale(this.maxValue);
      }
    } else {
      Yposition = yScale(d.value) - this.yBreakdown(d, i);
    }
    return parseFloat(Yposition.toFixed(2)); //Math.round(Yposition,2);
  }
  private getHeight(d, i) {
    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerHeight, 0]);
    if (d.isPillar == 1 || i == 0) {
      if (d.value > 0) {
        if (this.minValue < 0) {
          return yScale(0) - yScale(d.value);
        } else {
          return yScale(0) - yScale(Math.abs(d.value) - this.minValue);
        }
      } else {
        if (this.maxValue >= 0) {
          return yScale(d.value) - yScale(0);
        } else {
          return yScale(d.value) - yScale(this.maxValue);
        }
      }
    } else {
      return yScale(0) - yScale(Math.abs(d.value));
    }
  }

  private createLabels(gParent) {
    var g = gParent.append("g").attr("class", "myBarLabels");

    var yPosition = (d, i) => {
      var yPosition;
      var nodeID = i;
      var heightAdjustment = 0;

      pillarLabelsg.each((d, i, nodes) => {
        if (nodeID == i) {
          heightAdjustment = nodes[i].getBoundingClientRect().height;
        }
      });
      var yScale = d3
        .scaleLinear()
        .domain([this.minValue, this.maxValue])
        .range([this.innerHeight, 0]);
      switch (d.customLabelPositioning) {
        case "Inside end":
          yPosition = this.getYPosition(d, i) + heightAdjustment;
          break;

        case "Outside end":
          if (d.value >= 0) {
            yPosition = this.getYPosition(d, i) - 5;
          } else {
            yPosition =
              this.getYPosition(d, i) + this.getHeight(d, i) + heightAdjustment;
          }

          //if the label touches the x-axis then show on top
          if (yPosition >= yScale(0)) {
            yPosition = this.getYPosition(d, i) - 5;
          }
          break;
        case "Inside center":
          yPosition =
            this.getYPosition(d, i) +
            this.getHeight(d, i) / 2 +
            heightAdjustment / 2;

          break;
        case "Inside base":
          yPosition =
            this.getYPosition(d, i) +
            this.getHeight(d, i) -
            heightAdjustment / 2;
          break;
        case "Outside top":
          yPosition = this.getYPosition(d, i) - 5;

          break;
        case "Inside bottom":
          yPosition =
            this.getYPosition(d, i) + this.getHeight(d, i) + heightAdjustment;
          //if the label touches the x-axis then show on top
          if (this.minValue >= 0 && this.maxValue >= 0) {
            if (yPosition >= yScale(0)) {
              yPosition = this.getYPosition(d, i) - 5;
            }
          }
          break;
      }

      return yPosition;
    };
    var xScale = d3
      .scaleBand()
      .domain(this.barChartData.map(this.xValue))
      .range([0, this.innerWidth])
      .padding(0.2);
    if (this.visualSettings.LabelsFormatting.show) {
      var pillarLabelsg = g
        .selectAll(".labels")
        .data(this.barChartData)
        .enter()
        .append("g");

      var pillarLabels = pillarLabelsg.append("text").attr("class", "labels");
      var labelFormatting = (d) => {
        return this.formatValueforLabels(d);
        //return this.formattedValuefromData(d);
      };

      var pillarLabelsText = pillarLabels.text((d) => labelFormatting(d));

      pillarLabelsText
        .style(
          "font-size",
          this.visualSettings.LabelsFormatting.fontSize + "pt"
        )
        .style("font-family", this.visualSettings.LabelsFormatting.fontFamily)
        .style("fill", (d) => {
          return d.customFontColor;
        });

      pillarLabelsg.attr(
        "transform",
        (d, i) => `translate(${xScale(d.category)},${yPosition(d, i)})`
      );
    }
    // g.selectAll(".labels").call(this.labelFitToWidth);
    this.tooltipServiceWrapper.addTooltip(
      g.selectAll(".labels"),
      (tooltipEvent: TooltipEventArgs<number>) =>
        this.getTooltipData(tooltipEvent.data),
      (tooltipEvent: TooltipEventArgs<number>) => null
    );

    g.selectAll(".labels").call(this.labelAlignment, xScale.bandwidth());
    g.attr("transform", `translate(${0},${this.margin.top})`);
  }
  private createBars(gParent, data) {
    var g = gParent.append("g").attr("class", "myBars");

    var xScale = d3
      .scaleBand()
      .domain(data.map(this.xValue))
      .range([0, this.innerWidth])
      .padding(0.2);

    this.bars = g
      .selectAll("rect")
      .data(this.barChartData)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.category))
      .attr("y", (d, i) => this.getYPosition(d, i))
      .attr("width", xScale.bandwidth())
      .attr("height", (d, i) => this.getHeight(d, i))
      .attr("fill", (d) => d.customBarColor);

    //line joinning the bars
    if (this.visualSettings.yAxisFormatting.joinBars) {
      this.bars.each((d, i, nodes) => {
        if (i != 0) {
          g.append("line")
            .style("stroke", this.visualSettings.yAxisFormatting.joinBarsColor)
            .style(
              "stroke-width",
              this.visualSettings.yAxisFormatting.joinBarsStrokeWidth / 10 +
                "pt"
            )
            .attr(
              "x1",
              parseFloat(d3.select(nodes[i - 1]).attr("x")) + xScale.bandwidth()
            )
            .attr("y1", () => {
              var y1;
              if ((d.value < 0 && !d.isPillar) || (d.value > 0 && d.isPillar)) {
                y1 = parseFloat(d3.select(nodes[i]).attr("y"));
              } else {
                y1 =
                  parseFloat(d3.select(nodes[i]).attr("y")) +
                  this.getHeight(d, i);
              }
              return y1;
            })
            .attr("x2", parseFloat(d3.select(nodes[i]).attr("x")))
            .attr("y2", () => {
              var y2;
              if ((d.value < 0 && !d.isPillar) || (d.value > 0 && d.isPillar)) {
                y2 = parseFloat(d3.select(nodes[i]).attr("y"));
              } else {
                y2 =
                  parseFloat(d3.select(nodes[i]).attr("y")) +
                  this.getHeight(d, i);
              }
              return y2;
            });
        }
      });
    }

    // Clear selection when clicking outside a bar
    this.svg.on("click", (d) => {
      if (this.allowInteractions) {
        this.selectionManager.clear().then(() => {
          this.selectionManager.registerOnSelectCallback(
            (ids: ISelectionId[]) => {
              this.syncSelectionState(this.bars, ids);
            }
          );
        });
      }
      this.bars.attr("fill-opacity", 1);
    });

    //reset selections when the visual is re-drawn
    this.syncSelectionState(
      this.bars,
      <ISelectionId[]>this.selectionManager.getSelectionIds()
    );
    if (
      this.visualType == "drillable" ||
      this.visualType == "staticCategory" ||
      this.visualType == "drillableCategory"
    ) {
      this.bars.on("click", (d) => {
        // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)

        if (this.allowInteractions) {
          const isCtrlPressed: boolean = (<MouseEvent>d).ctrlKey;
          if (this.selectionManager.hasSelection() && !isCtrlPressed) {
            this.bars.attr("fill-opacity", 1);
          }
          this.selectionManager
            .select(d.selectionId, isCtrlPressed)
            .then((ids: ISelectionId[]) => {
              this.syncSelectionState(this.bars, ids);
            });
          (<Event>d).stopPropagation();
        }
      });
    }

    this.tooltipServiceWrapper.addTooltip(
      g.selectAll("rect"),
      (tooltipEvent: TooltipEventArgs<number>) =>
        this.getTooltipData(tooltipEvent.data),
      (tooltipEvent: TooltipEventArgs<number>) =>
        this.getTooltipSelectionID(tooltipEvent.data)
    );

    g.attr("transform", `translate(${0},${this.margin.top})`);
  }
  private syncSelectionState = (bars, selectionIds: ISelectionId[]) => {
    if (!selectionIds.length) {
      bars.attr("fill-opacity", null);
      return;
    }
    bars.each((d, i, nodes) => {
      const isSelected: boolean = this.isSelectionIdInArray(
        selectionIds,
        d.selectionId
      );
      d3.select(nodes[i]).attr("fill-opacity", isSelected ? 1 : 0.5);
    });
  };
  private isSelectionIdInArray(
    selectionIds: ISelectionId[],
    selectionId: ISelectionId
  ): boolean {
    if (!selectionIds || !selectionId) {
      return false;
    }
    return selectionIds.some((currentSelectionId: ISelectionId) => {
      return currentSelectionId.includes(selectionId);
    });
  }
  private lineWidth(d, i) {
    var defaultwidth = this.defaultXAxisGridlineStrokeWidth() / 10 + "pt";
    if (d.displayName == "" || i == 0) {
      defaultwidth = "0" + "pt";
    }
    return defaultwidth;
  }
  private getTooltipSelectionID(value: any): ISelectionId {
    return value.selectionId;
  }
  private getTooltipData(value: any): VisualTooltipDataItem[] {
    var tooltip = [];
    if (value.isPillar == 1) {
      tooltip = [
        {
          displayName: value.toolTipDisplayValue1,
          value: value.toolTipValue1Formatted,
        },
      ];
    } else {
      if (value.toolTipDisplayValue2 == null) {
        tooltip = [
          {
            displayName: value.toolTipDisplayValue1,
            value: value.toolTipValue1Formatted,
          },
        ];
      } else {
        tooltip = [
          {
            displayName: value.toolTipDisplayValue1,
            value: value.toolTipValue1Formatted,
          },
          {
            displayName: value.toolTipDisplayValue2,
            value: value.toolTipValue2Formatted,
          },
        ];
      }
    }
    return tooltip;
  }
  private getTooltipXaxis(value: any): VisualTooltipDataItem[] {
    var tooltip = [];
    tooltip = [
      {
        displayName: value.displayName,
      },
    ];

    return tooltip;
  }
  private labelAlignment(tspan, width) {
    tspan.each(function () {
      var tspan = d3.select(this);
      var tspanWidth = tspan.node().getComputedTextLength();
      var diff = (width - tspanWidth) / 2;
      tspan.attr("dx", diff);
    });
  }
  private findXaxisAdjustment = (data): number => {
    var returnvalue = 0;
    if (
      this.visualSettings.yAxisFormatting.YAxisDataPointOption == "Auto" ||
      this.visualSettings.yAxisFormatting.YAxisDataPointOption == "Range"
    ) {
      /************************************************
                this function is used to move the Yaxis to reduce the pillars size so that they don't start from zero, if pillars are all positive or negative
            *************************************************/
      var minDataPoint = 0;
      var maxDataPoint = 0;
      var cumulativeDataPoints = [];
      for (let index = 0; index < data.length; index++) {
        if (data[index].isPillar == 0) {
          if (index == 0) {
            cumulativeDataPoints.push(data[index].value);
          } else {
            cumulativeDataPoints.push(
              data[index].value + cumulativeDataPoints[index - 1]
            );
          }
        } else {
          cumulativeDataPoints.push(data[index].value);
        }
      }
      minDataPoint = Math.min(...cumulativeDataPoints);
      maxDataPoint = Math.max(...cumulativeDataPoints);

      if (minDataPoint >= 0 && maxDataPoint >= 0) {
        if (maxDataPoint - minDataPoint < minDataPoint) {
          returnvalue = maxDataPoint - minDataPoint;
        }
      }

      if (minDataPoint <= 0 && maxDataPoint <= 0) {
        if (minDataPoint - maxDataPoint > maxDataPoint) {
          returnvalue = Math.abs(minDataPoint - maxDataPoint);
        }
      }
    }
    return returnvalue;
  };
  private findMinCumulativeValue = (data): number => {
    var minDataPoint = 0;
    /*if (this.visualSettings.yAxisFormatting.YAxisDataPointOption == "Range") {
            minDataPoint = this.visualSettings.yAxisFormatting.YAxisDataPointStartRange;
        } else */ {
      var cumulativeDataPoints = [];
      for (let index = 0; index < data.length; index++) {
        if (data[index].isPillar == 0) {
          if (index == 0) {
            cumulativeDataPoints.push(data[index].value);
          } else {
            cumulativeDataPoints.push(
              data[index].value + cumulativeDataPoints[index - 1]
            );
          }
        } else {
          cumulativeDataPoints.push(data[index].value);
        }
      }
      minDataPoint = Math.min(...cumulativeDataPoints);

      if (minDataPoint > 0) {
        if (this.adjustmentConstant == 0) {
          minDataPoint = 0;
        } else {
          minDataPoint = minDataPoint - this.adjustmentConstant;
        }
      } else {
        minDataPoint = minDataPoint;
      }
    }
    return minDataPoint;
  };
  private findMaxCumulativeValue = (data): number => {
    var maxDataPoint = 0;
    /*if (this.visualSettings.yAxisFormatting.YAxisDataPointOption == "Range") {
            maxDataPoint = this.visualSettings.yAxisFormatting.YAxisDataPointEndRange;
        } else*/ {
      var cumulativeDataPoints = [];
      for (let index = 0; index < data.length; index++) {
        if (data[index].isPillar == 0) {
          if (index == 0) {
            cumulativeDataPoints.push(data[index].value);
          } else {
            cumulativeDataPoints.push(
              data[index].value + cumulativeDataPoints[index - 1]
            );
          }
        } else {
          cumulativeDataPoints.push(data[index].value);
        }
      }
      maxDataPoint = Math.max(...cumulativeDataPoints);
      if (maxDataPoint < 0) {
        if (this.adjustmentConstant == 0) {
          maxDataPoint = 0;
        } else {
          maxDataPoint = maxDataPoint + this.adjustmentConstant;
        }
      } else {
        maxDataPoint = maxDataPoint;
      }
    }
    return maxDataPoint;
  };
  private getfillColor(isPillar: number, value: number) {
    var barColor: string = "#777777";
    if (isPillar == 1) {
      barColor = this.visualSettings.sentimentColor.sentimentColorTotal;
    } else {
      if (value < 0) {
        barColor = this.visualSettings.sentimentColor.sentimentColorAdverse;
      } else {
        barColor = this.visualSettings.sentimentColor.sentimentColorFavourable;
      }
    }
    return barColor;
  }
  private getLabelFontColor(isPillar: number, value: number) {
    if (this.visualSettings.LabelsFormatting.useDefaultFontColor) {
      return this.visualSettings.LabelsFormatting.fontColor;
    } else {
      if (isPillar == 1) {
        return this.visualSettings.LabelsFormatting.sentimentFontColorTotal;
      } else if (value < 0) {
        return this.visualSettings.LabelsFormatting.sentimentFontColorAdverse;
      } else {
        return this.visualSettings.LabelsFormatting
          .sentimentFontColorFavourable;
      }
    }
  }
  private getLabelPosition(isPillar: number, value: number) {
    if (this.visualSettings.LabelsFormatting.useDefaultLabelPositioning) {
      return this.visualSettings.LabelsFormatting.labelPosition;
    } else {
      if (isPillar == 1) {
        return this.visualSettings.LabelsFormatting.labelPositionTotal;
      } else if (value < 0) {
        return this.visualSettings.LabelsFormatting.labelPositionAdverse;
      } else {
        return this.visualSettings.LabelsFormatting.labelPositionFavourable;
      }
    }
  }
  private getDataStaticWaterfall(options: VisualUpdateOptions) {
    let dataView: DataView = options.dataViews[0];

    var visualData = [];
    var sortOrderIndex = 0;
    for (
      let index = 0;
      index < dataView.matrix.columns.root.children.length;
      index++
    ) {
      dataView.matrix.rows.root.children.forEach((x: DataViewMatrixNode) => {
        var checkforZero = false;
        if (
          this.visualSettings.LabelsFormatting.HideZeroBlankValues &&
          +x.values[index].value == 0
        ) {
          checkforZero = true;
        }
        if (checkforZero == false) {
          var data2 = [];

          data2["value"] = +x.values[index].value;
          data2["numberFormat"] =
            this.extractFormattingValue(dataView, 0) ||
            dataView.metadata.columns[index].format;

          data2["selectionId"] = this.host
            .createSelectionIdBuilder()
            .withMeasure(dataView.matrix.valueSources[index].queryName)
            .createSelectionId();
          var y = dataView.matrix.valueSources[index];
          if (y.objects) {
            if (y.objects.definePillars) {
              data2["category"] =
                dataView.matrix.valueSources[index].displayName;
              data2["displayName"] =
                dataView.matrix.valueSources[index].displayName;
              if (y.objects["definePillars"]["pillars"]) {
                data2["isPillar"] = 1;
              } else {
                data2["isPillar"] = 0;
              }
            } else {
              if (
                dataView.matrix.valueSources[index].displayName.substring(
                  0,
                  1
                ) != "_"
              ) {
                data2["isPillar"] = 0;
                data2["category"] =
                  dataView.matrix.valueSources[index].displayName;
                data2["displayName"] =
                  dataView.matrix.valueSources[index].displayName;
              } else {
                data2["isPillar"] = 1;
                data2["category"] =
                  dataView.matrix.valueSources[index].displayName;
                data2["displayName"] =
                  dataView.matrix.valueSources[index].displayName;
              }
            }
            if (
              y.objects.sentimentColor &&
              !this.visualSettings.chartOrientation.useSentimentFeatures
            ) {
              data2["customBarColor"] =
                y.objects["sentimentColor"]["fill"]["solid"]["color"];
            } else {
              data2["customBarColor"] = this.getfillColor(
                data2["isPillar"],
                data2["value"]
              );
            }
            if (
              y.objects.LabelsFormatting &&
              !this.visualSettings.chartOrientation.useSentimentFeatures &&
              !this.visualSettings.LabelsFormatting.useDefaultFontColor
            ) {
              if (y.objects.LabelsFormatting.fill) {
                data2["customFontColor"] =
                  y.objects["LabelsFormatting"]["fill"]["solid"]["color"];
              } else {
                data2["customFontColor"] = this.getLabelFontColor(
                  data2["isPillar"],
                  data2["value"]
                );
              }
            } else {
              data2["customFontColor"] = this.getLabelFontColor(
                data2["isPillar"],
                data2["value"]
              );
            }

            if (
              y.objects.LabelsFormatting &&
              !this.visualSettings.chartOrientation.useSentimentFeatures &&
              !this.visualSettings.LabelsFormatting.useDefaultLabelPositioning
            ) {
              if (y.objects.LabelsFormatting.labelPosition) {
                data2["customLabelPositioning"] =
                  y.objects["LabelsFormatting"]["labelPosition"];
              } else {
                data2["customLabelPositioning"] = this.getLabelPosition(
                  data2["isPillar"],
                  data2["value"]
                );
              }
            } else {
              data2["customLabelPositioning"] = this.getLabelPosition(
                data2["isPillar"],
                data2["value"]
              );
            }
          } else {
            if (
              dataView.matrix.valueSources[index].displayName.substring(0, 1) !=
              "_"
            ) {
              data2["isPillar"] = 0;
              data2["category"] =
                dataView.matrix.valueSources[index].displayName;
              data2["displayName"] =
                dataView.matrix.valueSources[index].displayName;
            } else {
              data2["isPillar"] = 1;
              data2["category"] =
                dataView.matrix.valueSources[index].displayName;
              data2["displayName"] =
                dataView.matrix.valueSources[index].displayName;
            }
            data2["customBarColor"] = this.getfillColor(
              data2["isPillar"],
              data2["value"]
            );
            data2["customFontColor"] = this.getLabelFontColor(
              data2["isPillar"],
              data2["value"]
            );
            data2["customLabelPositioning"] = this.getLabelPosition(
              data2["isPillar"],
              data2["value"]
            );
          }
          data2["toolTipValue1Formatted"] = this.formatValueforLabels(data2);
          data2["toolTipDisplayValue1"] = data2["category"];
          data2["childrenCount"] = 1;
          if (data2["isPillar"] == 1) {
            sortOrderIndex = sortOrderIndex + 1;
            data2["sortOrderIndex"] = sortOrderIndex;
            sortOrderIndex = sortOrderIndex + 1;
          } else {
            data2["sortOrderIndex"] = sortOrderIndex;
          }
          visualData.push(data2);
        }
      });
    }
    visualData = this.sortData(visualData);
    return visualData;
  }
  private sortData(visualData) {
    visualData.sort((a, b) => {
      switch (this.visualSettings.chartOrientation.sortData) {
        case 3:
          if (Math.floor(a.sortOrderIndex) === Math.floor(b.sortOrderIndex)) {
            return (
              parseFloat(a.value.toString()) - parseFloat(b.value.toString())
            );
          } else {
            return a.sortOrderIndex - b.sortOrderIndex;
          }
          break;
        case 2:
          if (Math.floor(a.sortOrderIndex) === Math.floor(b.sortOrderIndex)) {
            return (
              parseFloat(b.value.toString()) - parseFloat(a.value.toString())
            );
          } else {
            return a.sortOrderIndex - b.sortOrderIndex;
          }
          break;
        default:
          return 0;
          break;
      }
    });
    return visualData;
  }
  private sortDataDrillable(visualData) {
    visualData.sort((a, b) => {
      switch (this.visualSettings.chartOrientation.sortData) {
        case 3:
          //if (a.isPillar != 1) {
          if (
            Math.floor(a.sortOrderIndex) ===
            Math.floor(b.sortOrderIndex) /* && a.isPillar != 1*/
          ) {
            return (
              parseFloat(a.value.toString()) - parseFloat(b.value.toString())
            );
          } else {
            return a.sortOrderIndex - b.sortOrderIndex;
          }
        case 2:
          //if (a.isPillar != 1) {
          if (
            Math.floor(a.sortOrderIndex) ===
            Math.floor(b.sortOrderIndex) /* && a.isPillar != 1 */
          ) {
            return (
              parseFloat(b.value.toString()) - parseFloat(a.value.toString())
            );
          } else {
            return a.sortOrderIndex - b.sortOrderIndex;
          }
        default:
          return a.sortOrderIndex - b.sortOrderIndex;
      }
    });
    return visualData;
  }

  private extractFormattingValue(dataView, index) {
    const data = dataView.matrix.rows.root?.children[index];

    if (data) {
      const formatString1 = data.values?.[0]?.objects?.general?.formatString;
      if (formatString1) return formatString1;

      const formatString2 =
        data.children?.[0]?.values?.[0]?.objects?.general?.formatString;
      if (formatString2) return formatString2;

      return undefined;
    }

    return undefined;
  }
  private getDataDrillableWaterfall(options: VisualUpdateOptions) {
    let dataView: DataView = options.dataViews[0];
    var totalData = [];
    var visualData = [];
    var allMeasureValues = [];
    // find all values and aggregate them in an array of array with each child in an array of a measure
    allMeasureValues = this.findLowestLevels();
    var sortOrderPrecision = Math.pow(
      10,
      allMeasureValues.length * allMeasureValues[0].length.toString().length
    );
    var sortOrderIndex = 1;
    // calculate the difference between each measure and add them to an array as the step bars and then add the pillar bars [visualData]
    for (
      let indexMeasures = 0;
      indexMeasures < allMeasureValues.length;
      indexMeasures++
    ) {
      var totalValueofMeasure = 0;
      var toolTipDisplayValue1 = "";
      var toolTipDisplayValue2 = "";
      var Measure1Value: number = null;
      var Measure2Value: number = null;
      var dataPillar = [];
      for (
        let nodeItems = 0;
        nodeItems < allMeasureValues[indexMeasures].length;
        nodeItems++
      ) {
        totalValueofMeasure =
          totalValueofMeasure +
          allMeasureValues[indexMeasures][nodeItems].value;
        if (indexMeasures < allMeasureValues.length - 1) {
          var data2Category = [];
          Measure1Value = +allMeasureValues[indexMeasures][nodeItems].value;
          Measure2Value = +allMeasureValues[indexMeasures + 1][nodeItems].value;
          var valueDifference = Measure2Value - Measure1Value;
          var HideZeroBlankValues: boolean =
            this.visualSettings.LabelsFormatting.HideZeroBlankValues;
          if (HideZeroBlankValues && valueDifference == 0) {
          } else {
            toolTipDisplayValue1 =
              dataView.matrix.valueSources[indexMeasures].displayName +
              allMeasureValues[indexMeasures][nodeItems].category.toString();
            toolTipDisplayValue2 =
              dataView.matrix.valueSources[indexMeasures + 1].displayName +
              allMeasureValues[indexMeasures + 1][
                nodeItems
              ].category.toString();

            var displayName: string =
              allMeasureValues[indexMeasures][nodeItems].displayName;
            var category: string =
              dataView.matrix.valueSources[indexMeasures].displayName +
              allMeasureValues[indexMeasures][nodeItems].category.toString();
            var selectionId =
              allMeasureValues[indexMeasures][nodeItems].selectionId;
            var formatString: string =
              dataView.matrix.valueSources[indexMeasures]?.format;
            if (
              !formatString &&
              this.extractFormattingValue(dataView, indexMeasures)
            ) {
              formatString = this.extractFormattingValue(
                dataView,
                indexMeasures
              );
            }
            data2Category = this.getDataForCategory(
              valueDifference,
              formatString,
              displayName,
              category,
              0,
              selectionId,
              sortOrderIndex + (nodeItems + 1) / sortOrderPrecision,
              1,
              toolTipDisplayValue1,
              toolTipDisplayValue2,
              Measure1Value,
              Measure2Value
            );
            visualData.push(data2Category);
          }
        }
      }
      toolTipDisplayValue1 =
        dataView.matrix.valueSources[indexMeasures].displayName;
      toolTipDisplayValue2 = null;
      Measure1Value = totalValueofMeasure;
      Measure2Value = null;
      dataPillar = this.getDataForCategory(
        totalValueofMeasure,
        formatString,
        dataView.matrix.valueSources[indexMeasures].displayName,
        dataView.matrix.valueSources[indexMeasures].displayName,
        1,
        null,
        sortOrderIndex - 1,
        1,
        toolTipDisplayValue1,
        toolTipDisplayValue2,
        Measure1Value,
        Measure2Value
      );
      sortOrderIndex = sortOrderIndex + 2;
      visualData.push(dataPillar);
    }
    if (this.visualSettings.chartOrientation.limitBreakdown) {
      visualData = this.limitBreakdownsteps(options, visualData);
    }
    // Sort the [visualData] in order of the display
    if (dataView.matrix.rows.levels.length === 1) {
      this.sortDataDrillable(visualData);
    } else {
      visualData.sort((a, b) => {
        return a.sortOrderIndex - b.sortOrderIndex;
      });
    }
    // add arrays to the main array for additional x-axis for each category
    for (
      let levelItems = 0;
      levelItems < dataView.matrix.rows.levels.length - 1;
      levelItems++
    ) {
      var categorynode = [];
      var childrenCount = 1;
      var displayNode;

      for (let nodeItems = 0; nodeItems < visualData.length; nodeItems++) {
        var currNode = visualData[nodeItems];
        var childnode = [];
        var currCategoryText: string = currNode["category"];
        var currCategoryArray: string[] = currCategoryText.split("|");
        var newDisplayName;
        if (this.visualSettings.chartOrientation.orientation == "Horizontal") {
          newDisplayName = currCategoryArray[levelItems + 1];

          if (currNode["isPillar"] == 1 || nodeItems == 0) {
          } else {
            var previousNode = visualData[nodeItems - 1];
            var previousCategoryText: string = previousNode["category"];
            var previousCategoryArray: string[] =
              previousCategoryText.split("|");
            if (newDisplayName == previousCategoryArray[levelItems + 1]) {
              newDisplayName = "";
            }
          }
        } else {
          newDisplayName = currCategoryText.split("|").reverse().join(", ");
        }
        childnode = this.getDataForCategory(
          currNode["value"],
          currNode["numberFormat"],
          newDisplayName,
          currCategoryText,
          currNode["isPillar"],
          null,
          currNode["sortOrderIndex"],
          childrenCount,
          currNode["toolTipDisplayValue1"],
          currNode["toolTipDisplayValue2"],
          currNode["Measure1Value"],
          currNode["Measure2Value"]
        );
        if (displayNode != undefined) {
          if (displayNode.displayName == currCategoryArray[levelItems + 1]) {
            displayNode.childrenCount = displayNode.childrenCount + 1;
          } else {
            displayNode = childnode;
          }
        } else {
          displayNode = childnode;
        }

        categorynode.push(childnode);
      }
      totalData.push(categorynode);
    }
    // final array that contains all the values as the last array, while all the other array are only for additional x-axis
    if (
      dataView.matrix.rows.levels.length === 1 ||
      this.visualSettings.chartOrientation.orientation == "Horizontal"
    )
      totalData.push(visualData);
    // return totalData[0].map(e=>{return {...e , displayName : 'jaimin'}});
    return totalData;
  }

  private getDataStaticCategoryWaterfall(options: VisualUpdateOptions) {
    let dataView: DataView = options.dataViews[0];

    var visualData = [];
    var hasPillar = false;
    //*******************************************************************
    //This will always be zero as it should only have 1 measure
    var measureIndex = 0;
    //*******************************************************************
    var sortOrderIndex = 0;
    var orderIndex = 0;
    dataView.matrix.rows.root.children.forEach((x: DataViewMatrixNode) => {
      var checkforZero = false;
      if (
        this.visualSettings.LabelsFormatting.HideZeroBlankValues &&
        +x.values[measureIndex].value == 0
      ) {
        checkforZero = true;
      }
      if (checkforZero == false) {
        var data2 = [];

        data2["value"] = +x.values[measureIndex].value;

        data2["numberFormat"] =
          this.extractFormattingValue(dataView, 0) ||
          dataView.matrix.valueSources[measureIndex].format;

        data2["selectionId"] = this.host
          .createSelectionIdBuilder()
          .withMatrixNode(x, dataView.matrix.rows.levels)
          .createSelectionId();
        data2["xAxisFormat"] = dataView.matrix.rows.levels[0].sources[0].format;
        data2["type"] = dataView.matrix.rows.levels[0].sources[0].type;
        data2["category"] = this.formatCategory(
          x.value,
          data2["type"],
          data2["xAxisFormat"]
        );
        data2["displayName"] = this.formatCategory(
          x.value,
          data2["type"],
          data2["xAxisFormat"]
        );
        if (x.objects) {
          if (x.objects.definePillars) {
            if (x.objects["definePillars"]["pillars"]) {
              data2["isPillar"] = 1;
              hasPillar = true;
            } else {
              data2["isPillar"] = 0;
            }
          } else {
            /* data2["category"] = x.value;
                        data2["displayName"] = x.value; */
            data2["isPillar"] = 0;
          }
          if (
            x.objects.sentimentColor &&
            !this.visualSettings.chartOrientation.useSentimentFeatures
          ) {
            data2["customBarColor"] =
              x.objects["sentimentColor"]["fill"]["solid"]["color"];
          } else {
            data2["customBarColor"] = this.getfillColor(
              data2["isPillar"],
              data2["value"]
            );
          }
          if (
            x.objects.LabelsFormatting &&
            !this.visualSettings.LabelsFormatting.useDefaultFontColor
          ) {
            if (x.objects.LabelsFormatting.fill) {
              data2["customFontColor"] =
                x.objects["LabelsFormatting"]["fill"]["solid"]["color"];
            } else {
              data2["customFontColor"] = this.getLabelFontColor(
                data2["isPillar"],
                data2["value"]
              );
            }
          } else {
            data2["customFontColor"] = this.getLabelFontColor(
              data2["isPillar"],
              data2["value"]
            );
          }

          if (
            x.objects.LabelsFormatting &&
            !this.visualSettings.chartOrientation.useSentimentFeatures &&
            !this.visualSettings.LabelsFormatting.useDefaultLabelPositioning
          ) {
            if (x.objects.LabelsFormatting.labelPosition) {
              data2["customLabelPositioning"] =
                x.objects["LabelsFormatting"]["labelPosition"];
            } else {
              data2["customLabelPositioning"] = this.getLabelPosition(
                data2["isPillar"],
                data2["value"]
              );
            }
          } else {
            data2["customLabelPositioning"] = this.getLabelPosition(
              data2["isPillar"],
              data2["value"]
            );
          }
        } else {
          data2["isPillar"] = 0;
          data2["customBarColor"] = this.getfillColor(
            data2["isPillar"],
            data2["value"]
          );
          data2["customFontColor"] = this.getLabelFontColor(
            data2["isPillar"],
            data2["value"]
          );
          data2["customLabelPositioning"] = this.getLabelPosition(
            data2["isPillar"],
            data2["value"]
          );
        }
        data2["toolTipValue1Formatted"] = this.formatValueforLabels(data2);
        data2["toolTipDisplayValue1"] = data2["category"];
        data2["childrenCount"] = 1;
        if (data2["isPillar"] == 1) {
          sortOrderIndex = Math.round(sortOrderIndex) + 1;
          data2["sortOrderIndex"] = sortOrderIndex;
          data2["sortOrderIndexforLimitBreakdown"] = sortOrderIndex;
          sortOrderIndex = sortOrderIndex + 1;
        } else {
          sortOrderIndex = sortOrderIndex + +0.000001;
          data2["sortOrderIndex"] = sortOrderIndex;
          data2["sortOrderIndexforLimitBreakdown"] = sortOrderIndex;
        }
        orderIndex++;
        data2["orderIndex"] = orderIndex;
        visualData.push(data2);
      }
    });
    if (!hasPillar && this.visualSettings.definePillars.Totalpillar) {
      visualData.push(this.addTotalLine(visualData, options));
    }
    if (this.visualSettings.chartOrientation.limitBreakdown) {
      visualData = this.limitBreakdownsteps(options, visualData);
    }
    visualData = this.sortData(visualData);

    return visualData;
  }
  private limitBreakdownsteps(options: VisualUpdateOptions, currData) {
    //var currData = []
    //currData = this.getDataStaticCategoryWaterfall(options);
    currData.sort((a, b) => {
      if (
        Math.round(a.sortOrderIndexforLimitBreakdown) ===
          Math.round(b.sortOrderIndexforLimitBreakdown) &&
        a.isPillar != 1
      ) {
        return (
          parseFloat(Math.abs(b.value).toString()) -
          parseFloat(Math.abs(a.value).toString())
        );
      } else {
        return (
          Math.round(a.sortOrderIndexforLimitBreakdown) -
          Math.round(b.sortOrderIndexforLimitBreakdown)
        );
      }
    });
    var limit = this.visualSettings.chartOrientation.maxBreakdown;
    var limitcounter = 0;
    var otherbreakdownstepCount = 0;
    var newOther = [];
    var otherTotalValue = 0;
    var othersortOrderIndex = 0;
    for (let index = 0; index < currData.length; index++) {
      /*currData[index]["showbreakdownstep"] = false;
            otherTotalValue = otherTotalValue + currData[index].value
            othersortOrderIndex*/
      if (currData[index].isPillar == 1) {
        currData[index]["showbreakdownstep"] = true;
        limitcounter = 0;
        if (otherTotalValue != 0) {
          newOther.push(
            this.addOtherBreakdownStep(
              options,
              otherTotalValue,
              othersortOrderIndex,
              othersortOrderIndex,
              otherbreakdownstepCount
            )
          );
          otherbreakdownstepCount++;
        }
        otherTotalValue = 0;
        othersortOrderIndex = 0;
      } else if (limitcounter < limit) {
        limitcounter++;
        currData[index]["showbreakdownstep"] = true;
      } else if (
        (index != currData.length - 1 &&
          currData[index].sortOrderIndex ==
            currData[index + 1].sortOrderIndex &&
          limitcounter < limit) ||
        (index != 0 &&
          currData[index].sortOrderIndex ==
            currData[index - 1].sortOrderIndex &&
          limitcounter < limit)
      ) {
        limitcounter++;
        currData[index]["showbreakdownstep"] = true;
      } else {
        currData[index]["showbreakdownstep"] = false;
        otherTotalValue = otherTotalValue + currData[index].value;
        othersortOrderIndex = Math.round(currData[index].sortOrderIndex);
      }
    }

    newOther.forEach((node) => {
      currData.push(node);
    });

    for (let index = 0; index < currData.length; index++) {
      const element = currData[index];
      if (currData[index].showbreakdownstep == false) {
        currData.splice(index, 1);
        index--;
      }
    }
    currData.sort((a, b) => {
      if (
        a.sortOrderIndexforLimitBreakdown === b.sortOrderIndexforLimitBreakdown
      ) {
        //return parseFloat(Math.abs(b.value).toString()) - parseFloat(Math.abs(a.value).toString());
        //return a.orderIndex - b.orderIndex;
        return (
          a.sortOrderIndexforLimitBreakdown - b.sortOrderIndexforLimitBreakdown
        );
      } else {
        return (
          a.sortOrderIndexforLimitBreakdown - b.sortOrderIndexforLimitBreakdown
        );
      }
    });

    return currData;
  }
  private addOtherBreakdownStep(
    options: VisualUpdateOptions,
    value,
    sortOrderIndex,
    sortOrderIndexforLimitBreakdown,
    otherbreakdownstepCount
  ) {
    //*******************Add "Other" breakdown item *********************
    let dataView: DataView = options.dataViews[0];
    //*******************************************************************
    //This will always be zero as it should only have 1 measure
    var measureIndex = 0;
    //
    var data2 = [];

    data2["value"] = value;

    data2["numberFormat"] = dataView.matrix.valueSources[measureIndex].format;
    data2["selectionId"] = null;
    data2["xAxisFormat"] = dataView.matrix.rows.levels[0].sources[0].format;
    data2["type"] = dataView.matrix.rows.levels[0].sources[0].type;
    data2["category"] = "defaultBreakdownStepOther" + sortOrderIndex;
    data2["displayName"] = "Other";
    data2["customBarColor"] =
      this.visualSettings.sentimentColor.sentimentColorOther;
    if (this.visualSettings.LabelsFormatting.useDefaultFontColor) {
      data2["customFontColor"] = this.visualSettings.LabelsFormatting.fontColor;
    } else {
      data2["customFontColor"] =
        this.visualSettings.LabelsFormatting.sentimentFontColorOther;
    }
    if (this.visualSettings.LabelsFormatting.useDefaultLabelPositioning) {
      data2["customLabelPositioning"] =
        this.visualSettings.LabelsFormatting.labelPosition;
    } else {
      data2["customLabelPositioning"] =
        this.visualSettings.LabelsFormatting.labelPositionOther;
    }
    data2["isPillar"] = 0;
    data2["toolTipValue1Formatted"] = this.formatValueforLabels(data2);
    data2["toolTipDisplayValue1"] = data2["category"];
    data2["childrenCount"] = 1;
    data2["sortOrderIndex"] = sortOrderIndex + 0.999999;
    data2["sortOrderIndexforLimitBreakdown"] =
      sortOrderIndexforLimitBreakdown + 0.999999;
    data2["showbreakdownstep"] = true;
    return data2;
  }
  private getDataDrillableCategoryWaterfall(options: VisualUpdateOptions) {
    let dataView: DataView = options.dataViews[0];
    var totalData = [];
    var visualData = [];
    var allMeasureValues = [];

    // find all values and aggregate them in an array of array with each child in an array of a measure
    allMeasureValues = this.findLowestLevels();
    var sortOrderPrecision = Math.pow(
      10,
      allMeasureValues.length * allMeasureValues[0].length.toString().length
    );

    // calculate the difference between each measure and add them to an array as the step bars and then add the pillar bars [visualData]
    let indexMeasures = 0;
    var totalValueofMeasure = 0;
    var toolTipDisplayValue1 = "";
    var Measure1Value: number = null;
    for (
      let nodeItems = 0;
      nodeItems < allMeasureValues[indexMeasures].length;
      nodeItems++
    ) {
      totalValueofMeasure =
        totalValueofMeasure + allMeasureValues[indexMeasures][nodeItems].value;

      var data2Category = [];
      Measure1Value = +allMeasureValues[indexMeasures][nodeItems].value;

      var valueDifference = Measure1Value;
      var HideZeroBlankValues: boolean =
        this.visualSettings.LabelsFormatting.HideZeroBlankValues;
      if (HideZeroBlankValues && valueDifference == 0) {
      } else {
        toolTipDisplayValue1 =
          dataView.matrix.valueSources[indexMeasures].displayName +
          allMeasureValues[indexMeasures][nodeItems].category.toString();
        var displayName: string =
          allMeasureValues[indexMeasures][nodeItems].displayName;
        var category: string =
          // dataView.matrix.valueSources[indexMeasures].displayName +
          allMeasureValues[indexMeasures][nodeItems].category.toString();
        var selectionId =
          allMeasureValues[indexMeasures][nodeItems].selectionId;
        var formatString: string =
          dataView.matrix.valueSources[indexMeasures]?.format;
        if (
          !formatString &&
          this.extractFormattingValue(dataView, indexMeasures)
        ) {
          formatString = this.extractFormattingValue(dataView, indexMeasures);
        }

        data2Category = this.getDataForCategory(
          valueDifference,
          formatString,
          displayName,
          category,
          0,
          selectionId,
          1,
          1,
          toolTipDisplayValue1,
          null,
          Measure1Value,
          null
        );
        visualData.push(data2Category);
      }
    }
    if (this.visualSettings.definePillars.Totalpillar) {
      visualData.push(this.addTotalLine(visualData, options));
    }

    // add arrays to the main array for additional x-axis for each category
    for (
      let levelItems = 0;
      levelItems < dataView.matrix.rows.levels.length - 1;
      levelItems++
    ) {
      var categorynode = [];
      var childrenCount = 1;
      var displayNode;

      for (let nodeItems = 0; nodeItems < visualData.length; nodeItems++) {
        var currNode = visualData[nodeItems];
        var childnode = [];
        var currCategoryText: string = currNode["category"];
        var currCategoryArray: string[] = currCategoryText.split("|");
        var newDisplayName;
        if (this.visualSettings.chartOrientation.orientation == "Horizontal") {
          newDisplayName = currCategoryArray[levelItems + 1];

          if (currNode["isPillar"] == 1 || nodeItems == 0) {
          } else {
            var previousNode = visualData[nodeItems - 1];
            var previousCategoryText: string = previousNode["category"];
            var previousCategoryArray: string[] =
              previousCategoryText.split("|");
            if (newDisplayName == previousCategoryArray[levelItems + 1]) {
              newDisplayName = "";
            }
          }
        } else {
          newDisplayName = currCategoryText
            .split("|")
            .filter((x) => x !== "")
            .join(", ");
        }

        childnode = this.getDataForCategory(
          currNode["value"],
          currNode["numberFormat"],
          newDisplayName,
          currCategoryText,
          currNode["isPillar"],
          null,
          currNode["sortOrderIndex"],
          childrenCount,
          currNode["toolTipDisplayValue1"],
          currNode["toolTipDisplayValue2"],
          currNode["Measure1Value"],
          currNode["Measure2Value"]
        );
        if (displayNode != undefined) {
          if (displayNode.displayName == currCategoryArray[levelItems + 1]) {
            displayNode.childrenCount = displayNode.childrenCount + 1;
          } else {
            displayNode = childnode;
          }
        } else {
          displayNode = childnode;
        }

        categorynode.push(childnode);
      }
      totalData.push(categorynode);
    }

    // final array that contains all the values as the last array, while all the other array are only for additional x-axis
    if (
      dataView.matrix.rows.levels.length === 1 ||
      this.visualSettings.chartOrientation.orientation == "Horizontal"
    )
      totalData.push(visualData);
    return totalData;
  }
  private findLowestLevels() {
    function getChildLevel(
      currentNode,
      parentText: string,
      indexMeasures,
      rootnode: boolean
    ) {
      if (currentNode.children.length != undefined) {
        currentNode.children.forEach((child) => {
          if (rootnode) {
            parentNodes.length = 0;
          }
          var format =
            dataView.matrix.rows.levels[child.level].sources[0].format;
          var type = dataView.matrix.rows.levels[child.level].sources[0].type;
          if (child.children != undefined) {
            childrenCount = childrenCount + 1;

            /* if (currentNode == root) {
                            //selectionNode = host1.createSelectionIdBuilder().withMatrixNode(child, rows.levels)
                        } else {
                            
                        } */
            parentNodes.push(child);
            getChildLevel(
              child,
              parentText +
                "|" +
                getFormatCategory.formatCategory(child.value, type, format),
              indexMeasures,
              false
            );
          } else {
            /* data2["xAxisFormat"] = dataView.matrix.rows.levels[0].sources[0].format;
                        data2["type"] = dataView.matrix.rows.levels[indexMeasures].sources[0].type;
                        data2["category"] = this.formatCategory(x.value, data2["type"], data2["xAxisFormat"]); */
            var node = [];
            node["value"] = child.values[indexMeasures].value;
            node["category"] = (
              parentText +
              "|" +
              getFormatCategory.formatCategory(child.value, type, format)
            ).replace("null", "(blank)");
            if (child.value == null) {
              node["displayName"] = "(blank)";
            } else {
              node["displayName"] = getFormatCategory.formatCategory(
                child.value,
                type,
                format
              );
              //node["displayName"] = this.formatCategory(child.value, node["type"], node["xAxisFormat"]);
            }

            var selectionbuilder = host1.createSelectionIdBuilder();
            var selectionnode;
            if (parentNodes.length > 0) {
              parentNodes.forEach((nodes) => {
                selectionnode = selectionbuilder.withMatrixNode(
                  nodes,
                  rows.levels
                );
              });
            } else {
              selectionnode = host1.createSelectionIdBuilder();
            }
            var selectionId: ISelectionId = selectionnode
              .withMatrixNode(child, rows.levels)
              .createSelectionId();
            node["selectionId"] = selectionId;
            nodes.push(node);
          }
        });
      }
    }
    var dataView = this.visualUpdateOptions.dataViews[0];
    var rows = dataView.matrix.rows;
    var root = rows.root;
    var allNodes = [];
    var childrenCount = 0;
    var host1 = this.host;
    var getFormatCategory = this;
    var parentNodes = [];
    for (
      let indexMeasures = 0;
      indexMeasures < dataView.matrix.valueSources.length;
      indexMeasures++
    ) {
      var nodes = [];
      getChildLevel(root, "", indexMeasures, true);
      allNodes.push(nodes);
    }
    return allNodes;
  }
  private getAllMatrixLevelsNew(root, num) {
    function getChildLevel(currentNode, parentText: string) {
      if (currentNode.children.length != undefined) {
        currentNode.children.forEach((child) => {
          if (index == num) {
            mainNode.push(createNode(child));
          } else {
            index = index + 1;
            if (child.children != undefined) {
              getChildLevel(child, parentText + "|" + child.value);
            }
            index = index - 1;
          }
        });
      }
    }
    function createNode(child) {
      var node = [];
      if (child.children == undefined) {
        for (
          let indexMeasures = 0;
          indexMeasures < dataView.matrix.valueSources.length;
          indexMeasures++
        ) {
          var nodeValue = [];
          nodeValue = child.values[indexMeasures].value;
          node.push(nodeValue);
        }
      } else {
        counter = 0;
        countChildrens(child);
        node["childrenCount"] = counter;
      }
      var format = dataView.matrix.rows.levels[num].sources[0].format;
      var type = dataView.matrix.rows.levels[num].sources[0].type;
      if (child.value == null) {
        node["category"] = "(blank)";
        node["displayName"] = "(blank)";
      } else {
        node["category"] = getFormatCategory.formatCategory(
          child.value,
          type,
          format
        );
        node["displayName"] = getFormatCategory.formatCategory(
          child.value,
          type,
          format
        );
      }

      var selectionId: ISelectionId = host1
        .createSelectionIdBuilder()
        .withMatrixNode(child, rows.levels)
        .createSelectionId();
      node["selectionId"] = selectionId;
      return node;
    }
    function countChildrens(child) {
      if (child.children == undefined) {
        counter = counter + 1;
      } else {
        child.children.forEach((element) => {
          countChildrens(element);
        });
      }
    }
    var counter;
    var index = 0;
    var allNodes = [];
    var childrenCount = 0;
    var host1 = this.host;
    var getFormatCategory = this;
    var nodes = [];
    var mainNode = [];
    var dataView = this.visualUpdateOptions.dataViews[0];
    var rows = dataView.matrix.rows;
    getChildLevel(root, "");
    allNodes.push(nodes);
    return mainNode;
  }
  private createXaxis(gParent, options, allDatatemp) {
    var g = gParent.append("g").attr("class", "xAxisParentGroup");
    var myAxisParentHeight = 0;
    var dataView = this.visualUpdateOptions.dataViews[0];
    var rows = dataView.matrix.rows;
    var root = rows.root;
    var levels = allDatatemp.length;
    var xScale;
    var xBaseScale = d3
      .scaleBand()
      .domain(allDatatemp[allDatatemp.length - 1].map(this.xValue))
      .range([0, this.innerWidth])
      .padding(0.2);

    if (dataView.matrix.valueSources.length > 1) {
      var pillarsCount = 3;
      var fullWidth =
        this.innerWidth -
        xBaseScale.bandwidth() +
        xBaseScale.step() * xBaseScale.padding() * pillarsCount;
      var myBandwidth = fullWidth / allDatatemp[allDatatemp.length - 1].length;
    } else {
      var pillarsCount = 2;
      var fullWidth =
        this.innerWidth -
        xBaseScale.bandwidth() -
        xBaseScale.step() * xBaseScale.padding() * pillarsCount;
      var myBandwidth =
        fullWidth / (allDatatemp[allDatatemp.length - 1].length - 1);
    }

    for (var allDataIndex = levels - 1; allDataIndex >= 0; allDataIndex--) {
      var currData = [];

      if (allDataIndex == levels - 1) {
        xScale = xBaseScale;
        currData = allDatatemp[allDatatemp.length - 1];
      } else {
        currData = this.getAllMatrixLevelsNew(root, allDataIndex);
        var xAxisrange = [];
        var currChildCount = 0;
        xAxisrange.push(0);
        currData.forEach((element) => {
          currChildCount = currChildCount + myBandwidth * element.childrenCount;
          xAxisrange.push(currChildCount);
        });
        xScale = d3
          .scaleOrdinal()
          .domain(currData.map((displayName, index) => index + displayName))
          .range(xAxisrange);
      }
      this.findBottom = 0;
      var myWidth = currChildCount + myBandwidth;
      if (allDataIndex == levels - 1) {
        var myxAxisParent;
        this.createAxis(
          myxAxisParent,
          g,
          true,
          myWidth,
          1,
          xScale,
          xBaseScale,
          currData,
          allDataIndex,
          levels,
          xAxisrange,
          myAxisParentHeight
        );
      }
      myAxisParentHeight = this.findBottom;
    }

    g.selectAll("text").each((d, i, nodes) => {
      if (this.xAxisPosition <= nodes[i].getBoundingClientRect().bottom) {
        this.xAxisPosition = nodes[i].getBoundingClientRect().bottom;
      }
    });

    g.attr(
      "transform",
      `translate(${0},${
        this.height -
        this.xAxisPosition -
        this.margin.bottom -
        this.scrollbarBreadth +
        this.legendHeight
      })`
    );

    this.innerHeight =
      this.height -
      this.margin.top -
      this.margin.bottom -
      this.xAxisPosition -
      this.scrollbarBreadth +
      this.legendHeight;

    if (this.isLabelVertical) this.innerHeight -= this.minLableVerticalHeight;
  }
  private findBottom;

  private createAxis(
    myxAxisParent,
    g,
    baseAxis: boolean,
    myWidth,
    index: number,
    xScale,
    xBaseScale,
    currData,
    allDataIndex,
    levels,
    xAxisrange,
    myAxisParentHeight
  ) {
    var myxAxisParentx = d3.axisBottom(xScale).tickSize(0);
    const wrapText = this.visualSettings.xAxisFormatting.labelWrapText;
    const columnWidth = this.getColumnWidth(
      currData,
      allDataIndex,
      levels,
      xScale,
      xAxisrange
    );
    var textWidth = 0;
    myxAxisParentx.tickSizeOuter(0);

    myxAxisParent = g
      .append("g")
      .style("font", this.visualSettings.xAxisFormatting.fontSize + "pt times")
      .style("font-family", this.visualSettings.xAxisFormatting.fontFamily)
      .style("color", this.visualSettings.xAxisFormatting.fontColor)
      .attr("class", "myXaxis")
      .call(myxAxisParentx);
    // if (baseAxis) {
    //     myxAxisParent
    //         .attr('transform', `translate(0,${myAxisParentHeight})`)
    //         .selectAll('path').style('fill', 'none').style('stroke', this.visualSettings.yAxisFormatting.gridLineColor);
    // } else if (index == 0) {
    //     myxAxisParent
    //         .attr('transform', `translate(${((xBaseScale.step() * xBaseScale.padding() * 0.5))},${myAxisParentHeight})`)
    //         .selectAll('path').style('fill', 'none').style('stroke', this.visualSettings.yAxisFormatting.gridLineColor);
    // } else {
    //     myxAxisParent
    //         .attr('transform', `translate(${(xBaseScale.bandwidth() + (xBaseScale.step() * xBaseScale.padding() * 1.5)) + myWidth * (index - 1)},${myAxisParentHeight})`)
    //         .selectAll('path').style('fill', 'none').style('stroke', this.visualSettings.yAxisFormatting.gridLineColor);
    // }

    var textWidth = 0;
    var textWidths = [];
    var xAxislabels = myxAxisParent
      .selectAll(".tick text")
      .data(currData)
      .style("padding", 20 + "px")
      .text((d) => d.displayName)
      .each(function (s) {
        var labelWidth = this.getBBox().width;
        textWidths.push({ displayName: s.displayName, width: labelWidth });
        textWidth = Math.max(textWidth, labelWidth); // Update textWidth if labelWidth is greater
      })
      .text((d) => {
        let percent = 100;
        if (this.innerHeight > 275) {
          percent = (this.innerHeight / 275) * 100;
          this.minLableVerticalHeight = (percent / 100) * 30;
        } else this.minLableVerticalHeight = 30;
        if (d.displayName.length > 8 && !wrapText && columnWidth <= textWidth) {
          let substringFactor = 9;
          if (this.innerHeight > 275) {
            substringFactor = Math.round((percent / 100) * 9);
          }
          return substringFactor < d.displayName.length
            ? d.displayName.substring(0, substringFactor) + "..."
            : d.displayName;
        } else {
          return d.displayName;
        }
      });
    if (columnWidth <= textWidth && !wrapText) {
      this.isLabelVertical = true;
    } else {
      this.isLabelVertical = false;
    }

    myxAxisParent
      .selectAll("path")
      .attr(
        "transform",
        `translate(0,${
          this.isLabelVertical ? `-${this.minLableVerticalHeight}` : "0"
        })`
      );

    if (
      this.visualType == "drillable" ||
      this.visualType == "staticCategory" ||
      this.visualType == "drillableCategory"
    ) {
      xAxislabels.on("click", (d) => {
        // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)
        if (this.allowInteractions) {
          const isCtrlPressed: boolean = (<MouseEvent>d).ctrlKey;
          if (this.selectionManager.hasSelection() && !isCtrlPressed) {
            this.bars.attr("fill-opacity", 1);
          }
          this.selectionManager
            .select(d.selectionId, isCtrlPressed)
            .then((ids: ISelectionId[]) => {
              this.syncSelectionState(this.bars, ids);
            });
          (<Event>d).stopPropagation();
        }
      });
    }
    //tooltip for x-axis labels
    this.tooltipServiceWrapper.addTooltip(
      myxAxisParent.selectAll(".tick text"),
      (tooltipEvent: TooltipEventArgs<number>) =>
        this.getTooltipXaxis(tooltipEvent.data),
      (tooltipEvent: TooltipEventArgs<number>) => null
    );

    //move the labels of all secondary axis to the right as they don't have pillars

    if (allDataIndex != levels - 1) {
      if (wrapText && !this.isLabelVertical) {
        myxAxisParent
          .selectAll(".tick text")
          .call(this.labelWrapText, xBaseScale.bandwidth());
      } else {
        myxAxisParent
          .selectAll(".tick text")
          .call(this.labelNoWrapText, xBaseScale.bandwidth());
      }

      myxAxisParent
        .selectAll(".tick text")
        .data(currData)
        .attr(
          "transform",
          (d, i) =>
            `translate(${(xAxisrange[i + 1] - xAxisrange[i]) / 2},${
              this.visualSettings.xAxisFormatting.padding
            })`
        );

      myxAxisParent.selectAll("line").remove();
    } else {
      if (wrapText && !this.isLabelVertical) {
        myxAxisParent
          .selectAll(".tick text")
          .call(this.labelWrapText, xBaseScale.bandwidth());
      } else {
        myxAxisParent
          .selectAll(".tick text")
          .call(this.labelNoWrapText, xBaseScale.bandwidth());
      }
      xAxislabels.attr(
        "transform",
        `translate(0,${this.visualSettings.xAxisFormatting.padding}) ${
          this.isLabelVertical && !wrapText ? "rotate(-90)" : ""
        }`
      );
    }

    myxAxisParent.selectAll("text").each((d, i, nodes) => {
      if (this.findBottom <= nodes[i].getBoundingClientRect().bottom) {
        this.findBottom =
          nodes[i].getBoundingClientRect().bottom - this.legendHeight;
      }
    });
    if (!this.isLabelVertical)
      this.currentAxisGridlines(
        myxAxisParent,
        currData,
        allDataIndex,
        levels,
        xScale,
        xAxisrange
      );
  }
  private getColumnWidth(
    currData: any,
    allDataIndex: any,
    levels: any,
    xScale: any,
    xAxisrange: any
  ) {
    var x1;
    if (allDataIndex == levels - 1) {
      x1 =
        xScale(currData[0].category) - (xScale.padding() * xScale.step()) / 2;
    } else {
      x1 = xAxisrange[0];
    }
    var x2;
    if (allDataIndex == levels - 1) {
      x2 =
        xScale(currData[1].category) - (xScale.padding() * xScale.step()) / 2;
    } else {
      x2 = xAxisrange[1];
    }
    return x2 - x1;
  }
  private currentAxisGridlines(
    myxAxisParent: any,
    currData: any,
    allDataIndex: any,
    levels: any,
    xScale: any,
    xAxisrange: any
  ) {
    if (this.visualSettings.xAxisFormatting.showGridLine) {
      myxAxisParent
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", this.visualSettings.xAxisFormatting.gridLineColor)
        .style(
          "stroke-width",
          this.defaultXAxisGridlineStrokeWidth() / 8 + "pt"
        );
      var myAxisTop = myxAxisParent
        .select("path")
        .node()
        .getBoundingClientRect().top;
      myxAxisParent
        .selectAll(".text")
        .data(currData)
        .enter()
        .append("line")
        .attr("x1", (d, i) => {
          var x1;
          if (allDataIndex == levels - 1) {
            x1 = xScale(d.category) - (xScale.padding() * xScale.step()) / 2;
          } else {
            x1 = xAxisrange[i];
          }
          return x1;
        })
        .attr("y1", 0)
        .attr("x2", (d, i) => {
          var x1;
          if (allDataIndex == levels - 1) {
            x1 = xScale(d.category) - (xScale.padding() * xScale.step()) / 2;
          } else {
            x1 = xAxisrange[i];
          }
          return x1;
        })
        .attr("y2", this.height - this.margin.bottom)
        .attr("stroke-width", (d, i) => this.lineWidth(d, i))
        .attr("stroke", this.visualSettings.xAxisFormatting.gridLineColor);
    } else {
      myxAxisParent
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", this.visualSettings.xAxisFormatting.gridLineColor)
        .style("stroke-width", "0pt");
    }
  }
  private addTotalLine(data: any, options: VisualUpdateOptions) {
    let dataView: DataView = options.dataViews[0];
    var data2 = [];
    var totalValue = 0;
    var orderIndex = 0;
    var d3formatnegative = d3.format("(.3s");
    //*******************************************************************
    //This will always be zero as it should only have 1 measure
    var measureIndex = 0;
    //*******************************************************************

    data.forEach((element) => {
      totalValue = totalValue + element["value"];
      if (orderIndex < element["orderIndex"]) {
        orderIndex = element["orderIndex"];
      }
    });

    data2["value"] = totalValue;
    data2["orderIndex"] = orderIndex;
    data2["numberFormat"] = data[0]["numberFormat"];
    data2["isPillar"] = 1;
    data2["category"] = dataView.matrix.valueSources[0].displayName;
    data2["displayName"] = dataView.matrix.valueSources[0].displayName;

    var x = dataView.matrix.valueSources[measureIndex];
    data2["selectionId"] = this.host
      .createSelectionIdBuilder()
      .withMeasure(x.queryName)
      .createSelectionId();
    if (x.objects) {
      if (
        x.objects.sentimentColor &&
        !this.visualSettings.chartOrientation.useSentimentFeatures
      ) {
        data2["customBarColor"] =
          x.objects["sentimentColor"]["fill"]["solid"]["color"];
      } else {
        data2["customBarColor"] = this.getfillColor(
          data2["isPillar"],
          data2["value"]
        );
      }

      if (
        x.objects.LabelsFormatting &&
        !this.visualSettings.chartOrientation.useSentimentFeatures &&
        !this.visualSettings.LabelsFormatting.useDefaultFontColor
      ) {
        if (x.objects.LabelsFormatting.fill) {
          data2["customFontColor"] =
            x.objects["LabelsFormatting"]["fill"]["solid"]["color"];
        } else {
          data2["customFontColor"] = this.getLabelFontColor(
            data2["isPillar"],
            data2["value"]
          );
        }
      } else {
        data2["customFontColor"] = this.getLabelFontColor(
          data2["isPillar"],
          data2["value"]
        );
      }

      if (
        x.objects.LabelsFormatting &&
        !this.visualSettings.LabelsFormatting.useDefaultLabelPositioning
      ) {
        if (x.objects.LabelsFormatting.labelPosition) {
          data2["customLabelPositioning"] =
            x.objects["LabelsFormatting"]["labelPosition"];
        } else {
          data2["customLabelPositioning"] = this.getLabelPosition(
            data2["isPillar"],
            data2["value"]
          );
        }
      } else {
        data2["customLabelPositioning"] = this.getLabelPosition(
          data2["isPillar"],
          data2["value"]
        );
      }
    } else {
      data2["customBarColor"] = this.getfillColor(
        data2["isPillar"],
        data2["value"]
      );
      data2["customFontColor"] = this.getLabelFontColor(
        data2["isPillar"],
        data2["value"]
      );
      data2["customLabelPositioning"] = this.getLabelPosition(
        data2["isPillar"],
        data2["value"]
      );
    }

    data2["toolTipValue1Formatted"] = this.formatValueforLabels(data2);
    data2["toolTipDisplayValue1"] = data2["category"];
    data2["childrenCount"] = 1;
    data2["sortOrderIndex"] = 1;
    data2["sortOrderIndexforLimitBreakdown"] = 1;
    return data2;
  }
  private getDataForCategory(
    value: number,
    numberFormat: string,
    displayName: any,
    displayID: any,
    isPillar: number,
    selectionId: any,
    sortOrderIndex: number,
    childrenCount: number,
    toolTipDisplayValue1: string,
    toolTipDisplayValue2: string,
    Measure1Value: number,
    Measure2Value: number
  ) {
    var data2 = [];
    data2["value"] = value;
    data2["numberFormat"] = numberFormat;
    data2["isPillar"] = isPillar;
    data2["category"] = displayID;
    data2["displayName"] = displayName;
    data2["selectionId"] = selectionId;
    data2["sortOrderIndex"] = sortOrderIndex;
    data2["sortOrderIndexforLimitBreakdown"] = sortOrderIndex;
    data2["childrenCount"] = childrenCount;
    data2["Measure1Value"] = Measure1Value;
    data2["Measure2Value"] = Measure2Value;
    data2["toolTipValue1Formatted"] = this.formatValueforvalues(
      Measure1Value,
      numberFormat
    );
    data2["toolTipValue2Formatted"] = this.formatValueforvalues(
      Measure2Value,
      numberFormat
    );
    data2["toolTipDisplayValue1"] = toolTipDisplayValue1;
    data2["toolTipDisplayValue2"] = toolTipDisplayValue2;
    data2["customBarColor"] = this.getfillColor(
      data2["isPillar"],
      data2["value"]
    );
    data2["customFontColor"] = this.getLabelFontColor(
      data2["isPillar"],
      data2["value"]
    );
    data2["customLabelPositioning"] = this.getLabelPosition(
      data2["isPillar"],
      data2["value"]
    );

    return data2;
  }

  private labelNoWrapText(text, standardwidth) {
    var width;
    text.each(function () {
      var text = d3.select(this),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1,
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        joinwith = "";

      width = standardwidth * text.datum()["childrenCount"];
      joinwith = "";
      // var words = text.text().split("").reverse();

      // var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
      // while (word = words.pop()) {
      //     line.push(word);
      //     tspan.text(line.join(joinwith));
      //     if (tspan.node().getComputedTextLength() > width) {

      //         // if the 3 lines goes over the standard width, then add "..." and stop adding any more lines
      //         if (line.length != 1) {
      //             if (lineNumber == 2) {
      //                 tspan.text(tspan.text().substring(0, tspan.text().length - 3) + "...");
      //                 break;
      //             } else {
      //                 line.pop();
      //                 tspan.text(line.join(joinwith));
      //                 line = [word];
      //                 tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      //             }
      //         } else {

      //         }
      //     }

      // }
    });
  }
  private labelWrapText(text, standardwidth) {
    var width;

    text.each(function () {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1,
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");
      width = standardwidth * text.datum()["childrenCount"];

      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));

        if (tspan.node().getComputedTextLength() > width) {
          if (line.length == 1) {
            var currline = line[0].split("");
            while (tspan.node().getComputedTextLength() > width) {
              currline.pop();
              line[0] = currline.join("");
              tspan.text(line[0]);
            }
          } else {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text
              .append("tspan")
              .attr("x", 0)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
            currline = tspan.text().split("");
            while (tspan.node().getComputedTextLength() > width) {
              currline.pop();
              tspan.text(currline.join(""));
            }
          }
        }
      }
    });
  }
  private labelFitToWidth(text) {
    text.each((d, i, nodes) => {
      if (i != 0) {
        var boundaryLable2 = nodes[i].getBoundingClientRect();
        var boundaryLable1 = nodes[i - 1].getBoundingClientRect();
        var overlap = !(
          boundaryLable1.right < boundaryLable2.left ||
          boundaryLable1.left > boundaryLable2.right ||
          boundaryLable1.bottom < boundaryLable2.top ||
          boundaryLable1.top > boundaryLable2.bottom
        );
        if (overlap) {
          nodes[i].remove();
        }
      }
    });
  }

  private createWaterfallGraphHorizontal(options, allData) {
    if (this.visualSettings.yAxisFormatting.switchPosition) {
      this.svgYAxis = this.chartContainer.append("svg");
      this.svg = this.chartContainer.append("svg");
    } else {
      this.svg = this.chartContainer.append("svg");
      this.svgYAxis = this.chartContainer.append("svg");
    }

    this.svg.on("contextmenu", (event) => {
      const mouseEvent: MouseEvent = <MouseEvent>event;
      const eventTarget: EventTarget = mouseEvent.target;
      let dataPoint: any = d3.select(<d3.BaseType>eventTarget).datum();
      this.selectionManager.showContextMenu(
        dataPoint ? dataPoint.selectionId : {},
        {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
        }
      );
      mouseEvent.preventDefault();
    });
    this.visualUpdateOptions = options;

    this.chartContainer.attr("width", this.width);
    this.chartContainer.attr("height", this.height);
    this.svg.attr("height", this.height);
    this.svgYAxis.attr("height", this.height);

    this.margin = {
      top: this.visualSettings.margins.topMargin,
      right: this.visualSettings.margins.rightMargin + 20,
      bottom: this.visualSettings.margins.bottomMargin + 10,
      left: this.visualSettings.margins.leftMargin,
    };

    //reduce the innerwidth and height
    //adjust the margin of the div
    this.innerWidth = this.width - this.margin.left - this.margin.right;
    this.innerHeight = this.height - this.margin.top - this.margin.bottom;

    this.adjustmentConstant = this.findXaxisAdjustment(this.barChartData);
    this.getMinMaxValue();

    this.gScrollable = this.svg.append("g");

    this.getYaxisHeightHorizontal(this.gScrollable);
    this.svg.attr("width", this.width);
    this.innerHeight = this.innerHeight - this.yAxisHeightHorizontal;
    this.svg.attr("height", this.innerHeight);
    this.checkBarWidthHorizontal(options);
    this.createXaxisHorizontal(this.gScrollable, options, allData);
    this.svgYAxis.attr("width", this.innerWidth + 10);
    this.svgYAxis.attr("height", this.yAxisHeightHorizontal);
    const yAxisMargin = this.visualSettings.yAxisFormatting.switchPosition
      ? this.margin.top
      : this.margin.bottom;
    const yAxisTitleHeight = this.visualSettings.yAxisFormatting.showTitle
      ? this.yAxisTitleWidth
      : 0;
    this.createYAxisHorizontal(
      this.svgYAxis,
      this.visualSettings.yAxisFormatting.switchPosition
        ? yAxisMargin + yAxisTitleHeight
        : this.yAxisHeightHorizontal - yAxisTitleHeight
    );
    this.createYAxisGridlinesHorizontal(this.gScrollable, this.innerHeight);
    if (this.visualSettings.yAxisFormatting.showTitle) {
      this.createYAxisTitle(this.svgYAxis, options);
    }
    this.createBarsHorizontal(this.gScrollable, this.barChartData);
    this.createLabelsHorizontal(this.gScrollable);
    this.svg.attr(
      "transform",
      `translate(${this.margin.left},${this.margin.top})`
    );
    this.svgYAxis.attr(
      "transform",
      `translate(${this.margin.left},${this.margin.top})`
    );
  }

  private createBarsHorizontal(gParent, data) {
    var g = gParent.append("g").attr("class", "myBars");

    var xScale = d3
      .scaleBand()
      .domain(data.map(this.xValue))
      .range([0, this.innerHeight])
      .padding(0.2);

    this.bars = g
      .selectAll("rect")
      .data(this.barChartData)
      .enter()
      .append("rect")
      .attr("x", (d, i) => this.getXPositionHorizontal(d, i))
      .attr("y", (d) => xScale(d.category))
      .attr("width", (d, i) => this.getWidthHorizontal(d, i))
      .attr("height", xScale.bandwidth())
      .attr("fill", (d) => d.customBarColor);

    //line joinning the bars
    if (this.visualSettings.yAxisFormatting.joinBars) {
      this.bars.each((d, i, nodes) => {
        if (i != 0) {
          g.append("line")
            .style("stroke", this.visualSettings.yAxisFormatting.joinBarsColor)
            .style(
              "stroke-width",
              this.visualSettings.yAxisFormatting.joinBarsStrokeWidth / 10 +
                "pt"
            )
            .attr("x1", () => {
              var x1;
              if ((d.value < 0 && !d.isPillar) || (d.value > 0 && d.isPillar)) {
                x1 =
                  parseFloat(d3.select(nodes[i]).attr("x")) +
                  this.getWidthHorizontal(d, i);
              } else {
                x1 = parseFloat(d3.select(nodes[i]).attr("x"));
              }

              return x1;
            })
            .attr(
              "y1",
              parseFloat(d3.select(nodes[i - 1]).attr("y")) + xScale.bandwidth()
            )
            .attr("x2", () => {
              var x1;
              if ((d.value < 0 && !d.isPillar) || (d.value > 0 && d.isPillar)) {
                x1 =
                  parseFloat(d3.select(nodes[i]).attr("x")) +
                  this.getWidthHorizontal(d, i);
              } else {
                x1 = parseFloat(d3.select(nodes[i]).attr("x"));
              }

              return x1;
            })
            .attr("y2", parseFloat(d3.select(nodes[i]).attr("y")));
        }
      });
    }
    // Clear selection when clicking outside a bar
    this.svg.on("click", (d) => {
      if (this.allowInteractions) {
        this.selectionManager.clear().then(() => {
          this.selectionManager.registerOnSelectCallback(
            (ids: ISelectionId[]) => {
              this.syncSelectionState(this.bars, ids);
            }
          );
        });
      }
      this.bars.attr("fill-opacity", 1);
    });

    //reset selections when the visual is re-drawn
    this.syncSelectionState(
      this.bars,
      <ISelectionId[]>this.selectionManager.getSelectionIds()
    );
    if (
      this.visualType == "drillable" ||
      this.visualType == "staticCategory" ||
      this.visualType == "drillableCategory"
    ) {
      this.bars.on("click", (d) => {
        // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)

        if (this.allowInteractions) {
          const isCtrlPressed: boolean = (<MouseEvent>d).ctrlKey;
          if (this.selectionManager.hasSelection() && !isCtrlPressed) {
            this.bars.attr("fill-opacity", 1);
          }
          this.selectionManager
            .select(d.selectionId, isCtrlPressed)
            .then((ids: ISelectionId[]) => {
              this.syncSelectionState(this.bars, ids);
            });
          (<Event>d).stopPropagation();
        }
      });
    }

    this.tooltipServiceWrapper.addTooltip(
      g.selectAll("rect"),
      (tooltipEvent: TooltipEventArgs<number>) =>
        this.getTooltipData(tooltipEvent.data),
      (tooltipEvent: TooltipEventArgs<number>) =>
        this.getTooltipSelectionID(tooltipEvent.data)
    );

    g.attr("transform", `translate(${-this.findRightHorizontal},${0})`);
  }
  private xBreakdownHorizontal(d, i) {
    var yBreakdownValue = 0;
    var startingPointCumulative = 0;
    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerWidth + this.xAxisPosition - this.scrollbarBreadth, 0]);

    //calculate the cumulative starting value
    for (let index = 0; index < i; index++) {
      if (this.barChartData[index].isPillar == 1 || index == 0) {
        startingPointCumulative = this.yValue(this.barChartData[index]);
      } else {
        startingPointCumulative += this.yValue(this.barChartData[index]);
      }
    }

    //if the current breakdown is negative, reduce the value else do nothing.
    if (this.yValue(d) < 0) {
      startingPointCumulative += Math.abs(this.yValue(d));
    }
    // no adjustment done for the main pillars

    if (d.isPillar == 1 || i == 0) {
    } else {
      yBreakdownValue = yScale(this.minValue) - yScale(startingPointCumulative);
    }

    return yBreakdownValue;
  }
  private getXPositionHorizontal(d, i) {
    var Yposition = 0;

    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([0, this.innerWidth + this.xAxisPosition - this.scrollbarBreadth]);

    /* if ((d.isPillar == 1 || i == 0) && d.value < 0) {
            if (this.maxValue >= 0) {
                Yposition = yScale(0);      
            } else {
                Yposition = yScale(this.minValue);
            }
        } else {
            Yposition = this.xBreakdownHorizontal(d, i);
        } */

    if (d.isPillar == 1 || i == 0) {
      if (d.value > 0) {
        if (this.minValue < 0) {
          Yposition = yScale(0);
        } /*else {
                    Yposition = yScale(0) - yScale(Math.abs(d.value) - this.minValue);
                }*/
      } else {
        if (this.maxValue >= 0) {
          Yposition = yScale(0) - this.getWidthHorizontal(d, i);
        } /*else {
                    Yposition = yScale(0);
                }*/
      }
    } else if (d.value < 0) {
      Yposition =
        this.xBreakdownHorizontal(d, i) - this.getWidthHorizontal(d, i) * 2;
    } else {
      Yposition = this.xBreakdownHorizontal(d, i);
    }
    return Yposition;
  }
  private getWidthHorizontal(d, i) {
    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerWidth + this.xAxisPosition - this.scrollbarBreadth, 0]);
    if (d.isPillar == 1 || i == 0) {
      if (d.value > 0) {
        if (this.minValue < 0) {
          return yScale(0) - yScale(d.value);
        } else {
          return yScale(0) - yScale(Math.abs(d.value) - this.minValue);
        }
      } else {
        if (this.maxValue >= 0) {
          return yScale(d.value) - yScale(0);
        } else {
          return yScale(d.value) - yScale(this.maxValue);
        }
      }
    } else {
      return yScale(0) - yScale(Math.abs(d.value));
    }
  }

  private createLabelsHorizontal(gParent) {
    var g = gParent.append("g").attr("class", "myBarLabels");

    var yPositionHeight = (d, i, nodes) => {
      var yPosition;
      var nodeID = i;
      var heightAdjustment = 0;
      pillarLabelsg.each((d, i, nodes) => {
        if (nodeID == i) {
          heightAdjustment = nodes[i].getBoundingClientRect().height;
        }
      });

      return xScale(d.category) + xScale.step() / 2;
    };

    var xScale = d3
      .scaleBand()
      .domain(this.barChartData.map(this.xValue))
      .range([0, this.innerHeight])
      .padding(0.2);
    if (this.visualSettings.LabelsFormatting.show) {
      var pillarLabelsg = g
        .selectAll(".labels")
        .data(this.barChartData)
        .enter()
        .append("g");

      var pillarLabels = pillarLabelsg
        .append("text")
        .append("tspan")
        .attr("class", "labels");

      var labelFormatting = (d) => {
        return this.formatValueforLabels(d);
        //return this.formattedValuefromData(d);
      };

      var pillarLabelsText = pillarLabels.text((d) => labelFormatting(d));

      pillarLabelsText
        .style(
          "font-size",
          this.visualSettings.LabelsFormatting.fontSize + "pt"
        )
        .style("font-family", this.visualSettings.LabelsFormatting.fontFamily)
        .style("fill", (d) => {
          return d.customFontColor;
        });

      pillarLabelsg.attr(
        "transform",
        (d, i, nodes) =>
          `translate(${this.yPositionWidth(
            d,
            i,
            nodes,
            pillarLabelsg
          )},${yPositionHeight(d, i, nodes)})`
      );
    }

    g.selectAll(".labels").call(
      this.labelFitToWidthHorizontal,
      this.width + this.findRightHorizontal - this.scrollbarBreadth
    );
    this.tooltipServiceWrapper.addTooltip(
      g.selectAll(".labels"),
      (tooltipEvent: TooltipEventArgs<number>) =>
        this.getTooltipData(tooltipEvent.data),
      (tooltipEvent: TooltipEventArgs<number>) => null
    );

    g.selectAll(".labels").call(
      this.labelAlignmentHorizontal,
      xScale.bandwidth()
    );

    g.attr("transform", `translate(${-this.findRightHorizontal},${0})`);
  }
  private yPositionWidth = (d, i, nodes, pillarLabelsg) => {
    var yPosition;
    var nodeID = i;
    var widthAdjustment = 0;
    pillarLabelsg.each((d, i, nodes) => {
      if (nodeID == i) {
        widthAdjustment = nodes[i].getBoundingClientRect().width;
      }
    });

    switch (d.customLabelPositioning) {
      case "Inside end":
        yPosition =
          this.getXPositionHorizontal(d, i) +
          this.getWidthHorizontal(d, i) -
          widthAdjustment -
          5;
        break;
      case "Outside end":
        if (
          d.value >= 0 &&
          this.getXPositionHorizontal(d, i) % this.getWidthHorizontal(d, i) < 2
        ) {
          yPosition =
            this.getXPositionHorizontal(d, i) +
            this.getWidthHorizontal(d, i) +
            5;
        } else {
          yPosition = this.getXPositionHorizontal(d, i) - widthAdjustment - 5;
        }
        break;
      case "Inside center":
        yPosition =
          this.getXPositionHorizontal(d, i) +
          this.getWidthHorizontal(d, i) / 2 -
          widthAdjustment / 2;

        break;
      case "Inside base":
        yPosition = this.getXPositionHorizontal(d, i) + 5;
        break;
      case "Outside top":
        yPosition =
          this.getXPositionHorizontal(d, i) + this.getWidthHorizontal(d, i) + 5;
        break;
      case "Inside bottom":
        yPosition = this.getXPositionHorizontal(d, i) - widthAdjustment - 5;
    }

    return yPosition;
  };
  private labelFitToWidthHorizontal(text, rightEdge) {
    text.each((d, i, nodes) => {
      if (
        nodes[i].getBoundingClientRect().right > rightEdge ||
        nodes[i].getBoundingClientRect().left < 0
      ) {
        nodes[i].remove();
      }
    });
  }
  private labelAlignmentHorizontal(tspan, width) {
    return;
    tspan.each(function () {
      var tspan = d3.select(this);
      var tspanWidth = tspan.node().getComputedTextLength();
      var diff = (width - tspanWidth) / 2;
      tspan.attr("dy", diff);
    });
  }
  private checkBarWidthHorizontal(options) {
    this.visualUpdateOptions = options;

    var xScale = d3
      .scaleBand()
      .domain(this.barChartData.map(this.xValue))
      .range([0, this.innerHeight])
      .padding(0.2);

    this.currentBarWidth = xScale.step();

    if (this.currentBarWidth < 20) {
      this.visualSettings.xAxisFormatting.fitToWidth = false;
    }
    if (!this.visualSettings.xAxisFormatting.fitToWidth) {
      if (this.currentBarWidth < 20) this.currentBarWidth = 20;
      this.visualUpdateOptions = options;
      if (
        this.currentBarWidth <= this.visualSettings.xAxisFormatting.barWidth
      ) {
        this.currentBarWidth = this.visualSettings.xAxisFormatting.barWidth;

        var scrollBarGroup = this.svg.append("g");
        var scrollbarContainer = scrollBarGroup
          .append("rect")
          .attr("width", this.scrollbarBreadth)
          .attr("height", this.innerHeight)
          .attr("x", this.width - this.scrollbarBreadth - this.margin.left)
          .attr("y", 0)
          .attr("fill", "#e1e1e1")
          .attr("opacity", 0.5)
          .attr("rx", 4)
          .attr("ry", 4);
        var scrollBarGroupHeight = this.innerHeight;
        this.innerHeight =
          this.currentBarWidth * this.barChartData.length +
          this.currentBarWidth * xScale.padding();

        var dragStartPosition = 0;
        var dragScrollBarXStartposition = 0;
        var dragStartPositionWheel = 0;

        var scrollbarHeight =
          (scrollBarGroupHeight * scrollBarGroupHeight) / this.innerHeight;

        var scrollbar = scrollBarGroup
          .append("rect")
          .attr("width", this.scrollbarBreadth)
          .attr("height", scrollbarHeight)
          .attr("x", this.width - this.scrollbarBreadth - this.margin.left)
          .attr("y", 0)
          .attr("fill", "#000")
          .attr("opacity", 0.24)
          .attr("rx", 4)
          .attr("ry", 4);

        var scrollBarHorizontalDragBar = d3
          .drag()
          .on("start", (event) => {
            dragStartPosition = event.y;
            dragScrollBarXStartposition = parseInt(scrollbar.attr("y"));
          })
          .on("drag", (event) => {
            var scrollBarMovement = event.y - dragStartPosition;

            //do not move the scroll bar beyond the x axis or after the end of the scroll bar
            if (
              dragScrollBarXStartposition + scrollBarMovement >= 0 &&
              dragScrollBarXStartposition +
                scrollBarMovement +
                scrollbarHeight <=
                this.height -
                  this.margin.top -
                  this.margin.bottom -
                  this.yAxisHeightHorizontal
            ) {
              scrollbar.attr(
                "y",
                dragScrollBarXStartposition + scrollBarMovement
              );
              this.gScrollable.attr(
                "transform",
                `translate(${0},${
                  ((dragScrollBarXStartposition + scrollBarMovement) /
                    (this.height -
                      this.margin.top -
                      this.margin.bottom -
                      this.yAxisHeightHorizontal -
                      scrollbarHeight)) *
                  (this.innerHeight -
                    this.height +
                    this.margin.top +
                    this.margin.bottom +
                    this.yAxisHeightHorizontal) *
                  -1
                })`
              );
            }
          });

        var scrollBarHorizontalWheel = d3.zoom().on("zoom", (event) => {
          var zoomScrollContainerheight = parseInt(
            scrollbarContainer.attr("height")
          );
          var zoomScrollBarMovement =
            ((event.sourceEvent.deltaY / 100) * zoomScrollContainerheight) /
            this.barChartData.length;
          var zoomScrollBarXStartposition = parseInt(scrollbar.attr("y"));
          var zoomScrollBarheight = parseInt(scrollbar.attr("height"));

          var scrollBarMovement =
            zoomScrollBarXStartposition + zoomScrollBarMovement;
          if (scrollBarMovement < 0) {
            scrollBarMovement = 0;
          }
          if (
            scrollBarMovement + zoomScrollBarheight >
            zoomScrollContainerheight
          ) {
            scrollBarMovement = zoomScrollContainerheight - zoomScrollBarheight;
          }
          scrollbar.attr("y", scrollBarMovement);
          this.gScrollable.attr(
            "transform",
            `translate(${0},${
              (scrollBarMovement /
                (this.height -
                  this.margin.top -
                  this.margin.bottom -
                  this.yAxisHeightHorizontal -
                  scrollbarHeight)) *
              (this.innerHeight -
                this.height +
                this.margin.top +
                this.margin.bottom +
                this.yAxisHeightHorizontal) *
              -1
            })`
          );
        });

        scrollBarHorizontalDragBar(this.svg);
        scrollBarHorizontalWheel(this.svg);
        scrollBarHorizontalDragBar(scrollbar);
      }
    }
  }
  private createXaxisHorizontal(gParent, options, allDatatemp) {
    var g = gParent.append("g").attr("class", "xAxisParentGroup");

    var myAxisParentHeight = 0;
    var dataView = this.visualUpdateOptions.dataViews[0];
    var rows = dataView.matrix.rows;
    var root = rows.root;
    var levels = allDatatemp.length;
    var xScale;
    var xBaseScale = d3
      .scaleBand()
      .domain(allDatatemp[allDatatemp.length - 1].map(this.xValue))
      .range([0, this.innerHeight])
      .padding(0.2);

    if (dataView.matrix.valueSources.length > 1) {
      var pillarsCount = 3;
      var fullWidth =
        this.innerHeight -
        xBaseScale.bandwidth() +
        xBaseScale.step() * xBaseScale.padding() * pillarsCount;
      var myBandwidth = fullWidth / allDatatemp[allDatatemp.length - 1].length;
    } else {
      var pillarsCount = 2;
      var fullWidth =
        this.innerHeight -
        xBaseScale.bandwidth() -
        xBaseScale.step() * xBaseScale.padding() * pillarsCount;
      var myBandwidth =
        fullWidth / (allDatatemp[allDatatemp.length - 1].length - 1);
    }

    for (var allDataIndex = levels - 1; allDataIndex >= 0; allDataIndex--) {
      var currData = [];

      if (allDataIndex == levels - 1) {
        xScale = xBaseScale;
        currData = allDatatemp[allDatatemp.length - 1];
      } else {
        currData = this.getAllMatrixLevelsNew(root, allDataIndex);
        var xAxisrange = [];
        var currChildCount = 0;
        xAxisrange.push(0);
        currData.forEach((element) => {
          currChildCount = currChildCount + myBandwidth * element.childrenCount;
          xAxisrange.push(currChildCount);
        });
        xScale = d3
          .scaleOrdinal()
          .domain(currData.map((displayName, index) => index + displayName))
          .range(xAxisrange);
      }
      this.findRightHorizontal = 0;
      var myWidth = currChildCount + myBandwidth;
      if (allDataIndex != levels - 1) {
        if (dataView.matrix.valueSources.length == 1) {
          var myxAxisParent;
          this.createAxisHorizontal(
            myxAxisParent,
            g,
            false,
            myWidth,
            0,
            xScale,
            xBaseScale,
            currData,
            allDataIndex,
            levels,
            xAxisrange,
            myAxisParentHeight
          );
        } else {
          for (
            let index = 1;
            index < dataView.matrix.valueSources.length;
            index++
          ) {
            var myxAxisParent;
            this.createAxisHorizontal(
              myxAxisParent,
              g,
              false,
              myWidth,
              index,
              xScale,
              xBaseScale,
              currData,
              allDataIndex,
              levels,
              xAxisrange,
              myAxisParentHeight
            );
          }
        }
      } else {
        var myxAxisParent;
        this.createAxisHorizontal(
          myxAxisParent,
          g,
          true,
          myWidth,
          1,
          xScale,
          xBaseScale,
          currData,
          allDataIndex,
          levels,
          xAxisrange,
          myAxisParentHeight
        );
      }
      myAxisParentHeight = this.findRightHorizontal;
    }

    g.selectAll("text").each((d, i, nodes) => {
      if (this.xAxisPosition >= nodes[i].getBoundingClientRect().left) {
        this.xAxisPosition = nodes[i].getBoundingClientRect().left;
      }
    });

    this.findRightHorizontal = this.xAxisPosition;
    g.attr("transform", `translate(${this.xAxisPosition * -1},${0})`);
  }
  private findRightHorizontal;

  private createAxisHorizontal(
    myxAxisParent,
    g,
    baseAxis: boolean,
    myWidth,
    index: number,
    xScale,
    xBaseScale,
    currData,
    allDataIndex,
    levels,
    xAxisrange,
    myAxisParentHeight
  ) {
    var myxAxisParentx = d3.axisLeft(xScale).tickSize(0);

    myxAxisParentx.tickSizeOuter(0);
    myxAxisParent = g
      .append("g")
      .style("font", this.visualSettings.xAxisFormatting.fontSize + "pt times")
      .style("font-family", this.visualSettings.xAxisFormatting.fontFamily)
      .style("color", this.visualSettings.xAxisFormatting.fontColor)
      .attr("class", "myXaxis")
      .call(myxAxisParentx);

    if (baseAxis) {
      myxAxisParent
        .attr("transform", `translate(${myAxisParentHeight}, 0)`)
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor);
    } else if (index == 0) {
      myxAxisParent
        .attr(
          "transform",
          `translate(${myAxisParentHeight - 5}, ${
            xBaseScale.step() * xBaseScale.padding() * 0.5
          })`
        )
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor);
    } else {
      myxAxisParent
        .attr(
          "transform",
          `translate(${myAxisParentHeight - 5}, ${
            xBaseScale.bandwidth() +
            xBaseScale.step() * xBaseScale.padding() * 1.5 +
            myWidth * (index - 1)
          })`
        )
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor);
    }

    var xAxislabels = myxAxisParent
      .selectAll(".tick text")
      .data(currData)
      .text((d) => d.displayName);
    if (
      this.visualType == "drillable" ||
      this.visualType == "staticCategory" ||
      this.visualType == "drillableCategory"
    ) {
      xAxislabels.on("click", (d) => {
        // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)
        if (this.allowInteractions) {
          const isCtrlPressed: boolean = (<MouseEvent>d).ctrlKey;
          if (this.selectionManager.hasSelection() && !isCtrlPressed) {
            this.bars.attr("fill-opacity", 1);
          }
          this.selectionManager
            .select(d.selectionId, isCtrlPressed)
            .then((ids: ISelectionId[]) => {
              this.syncSelectionState(this.bars, ids);
            });
          (<Event>d).stopPropagation();
        }
      });
    }
    //tooltip for x-axis labels
    this.tooltipServiceWrapper.addTooltip(
      myxAxisParent.selectAll(".tick text"),
      (tooltipEvent: TooltipEventArgs<number>) =>
        this.getTooltipXaxis(tooltipEvent.data),
      (tooltipEvent: TooltipEventArgs<number>) => null
    );

    //move the labels of all secondary axis to the right as they don't have pillars

    if (allDataIndex != levels - 1) {
      if (this.visualSettings.xAxisFormatting.labelWrapText) {
        myxAxisParent
          .selectAll(".tick text")
          .call(this.wrapHorizontal, xBaseScale.bandwidth());
      }

      myxAxisParent
        .selectAll(".tick text")
        .data(currData)
        .attr(
          "transform",
          (d, i) =>
            `translate(${-this.visualSettings.xAxisFormatting.padding},${
              (xAxisrange[i + 1] - xAxisrange[i]) / 2
            })`
        );

      myxAxisParent.selectAll("line").remove();
    } else {
      if (this.visualSettings.xAxisFormatting.labelWrapText) {
        myxAxisParent
          .selectAll(".tick text")
          .call(this.wrapHorizontal, xBaseScale.bandwidth());
      }
      xAxislabels.attr(
        "transform",
        `translate(${-this.visualSettings.xAxisFormatting.padding},0)`
      );
    }

    myxAxisParent.selectAll("text").each((d, i, nodes) => {
      if (this.findRightHorizontal >= nodes[i].getBoundingClientRect().left) {
        this.findRightHorizontal = nodes[i].getBoundingClientRect().left;
      }
    });

    var maxtextWidth = 0;
    myxAxisParent.selectAll("text").each(function () {
      var text = d3.select(this);
      var textWidth = text.node().getBoundingClientRect().width;
      if (textWidth > maxtextWidth) {
        maxtextWidth = textWidth;
      }
    });
    myxAxisParent
      .selectAll("tspan")
      .call(this.xAxislabelAlignmentHorizontal, maxtextWidth);

    this.gridlinesHorizontal(
      myxAxisParent,
      currData,
      allDataIndex,
      levels,
      xScale,
      xAxisrange
    );
  }
  private gridlinesHorizontal(
    myxAxisParent: any,
    currData: any,
    allDataIndex: any,
    levels: any,
    xScale: any,
    xAxisrange: any
  ) {
    if (this.visualSettings.xAxisFormatting.showGridLine) {
      myxAxisParent
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", this.visualSettings.xAxisFormatting.gridLineColor)
        .style(
          "stroke-width",
          this.defaultXAxisGridlineStrokeWidth() / 10 + "pt"
        );
      var myAxisTop = myxAxisParent
        .select("path")
        .node()
        .getBoundingClientRect().top;

      myxAxisParent
        .selectAll(".text")
        .data(currData)
        .enter()
        .append("line")
        .attr("y1", (d, i) => {
          var x1;
          if (allDataIndex == levels - 1) {
            x1 = xScale(d.category) - (xScale.padding() * xScale.step()) / 2;
          } else {
            x1 = xAxisrange[i];
          }
          return x1;
        })
        .attr("x1", 0)
        .attr("y2", (d, i) => {
          var x1;
          if (allDataIndex == levels - 1) {
            x1 = xScale(d.category) - (xScale.padding() * xScale.step()) / 2;
          } else {
            x1 = xAxisrange[i];
          }
          return x1;
        })
        .attr("x2", this.findRightHorizontal - myAxisTop)
        .attr("stroke-width", (d, i) => this.lineWidth(d, i))
        .attr("stroke", this.visualSettings.xAxisFormatting.gridLineColor);
    } else {
      myxAxisParent
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", this.visualSettings.xAxisFormatting.gridLineColor)
        .style("stroke-width", "0pt");
    }
  }
  private xAxislabelAlignmentHorizontal(tspan, width) {
    tspan.each(function () {
      var tspan = d3.select(this);
      var tspanWidth = tspan.node().getComputedTextLength();
      var diff = (tspanWidth - width) / 2;
      tspan.attr("dx", diff);
    });
  }
  private createYAxisHorizontal(gParent, adjustPosition) {
    var g = gParent.append("g").attr("class", "yAxisParentGroup");

    //recreate yScale using the new values
    var yScale = d3
      .scaleLinear()
      .domain([this.maxValue, this.minValue])
      .range([this.innerWidth + this.xAxisPosition - this.scrollbarBreadth, 0]);

    var yAxisScale = this.visualSettings.yAxisFormatting.switchPosition
      ? d3.axisBottom(yScale).tickValues(this.yScaleTickValues)
      : d3.axisTop(yScale).tickValues(this.yScaleTickValues);

    if (this.visualSettings.yAxisFormatting.show) {
      var yAxis = g
        .append("g")
        .style(
          "font",
          this.visualSettings.yAxisFormatting.fontSize + "pt times"
        )
        .style("font-family", this.visualSettings.yAxisFormatting.fontFamily)
        .style("color", this.visualSettings.yAxisFormatting.fontColor)
        .attr("class", "myYaxis");

      yAxisScale.tickFormat((d) => this.formatValueforYAxis(d));

      yAxis.call(yAxisScale);

      if (!this.visualSettings.yAxisFormatting.showYAxisValues) {
        yAxis.selectAll("text").style("visibility", "hidden");
      }

      yAxis
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "0pt");

      yAxis
        .selectAll("line")
        .style("fill", "none")
        .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor)
        .style("stroke-width", "0pt");

      yAxis.selectAll("line").attr("y2", -this.innerHeight);
    }
    yAxis
      .selectAll("line")
      .style("fill", "none")
      .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor)
      .style("stroke-width", "0pt");

    g.attr(
      "transform",
      `translate(${-this.findRightHorizontal},${adjustPosition})`
    );
  }
  private createYAxisGridlinesHorizontal(gParent, adjustPosition) {
    var g = gParent.append("g").attr("class", "yAxisParentGroup");

    //recreate yScale using the new values
    var yScale = d3
      .scaleLinear()
      .domain([this.maxValue, this.minValue])
      .range([this.innerWidth + this.xAxisPosition - this.scrollbarBreadth, 0]);

    var yAxisScale = d3.axisBottom(yScale).tickValues(this.yScaleTickValues);

    if (this.visualSettings.yAxisFormatting.show) {
      var yAxis = g
        .append("g")
        .style(
          "font",
          this.visualSettings.yAxisFormatting.fontSize + "pt times"
        )
        .style("font-family", this.visualSettings.yAxisFormatting.fontFamily)
        .style("color", this.visualSettings.yAxisFormatting.fontColor)
        .attr("class", "myYaxis");

      yAxisScale.tickFormat((d) => this.formatValueforYAxis(d));

      yAxis.call(yAxisScale);

      if (!this.visualSettings.yAxisFormatting.showYAxisValues) {
        yAxis.selectAll("text").style("visibility", "hidden");
      }

      yAxis
        .selectAll("path")
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "0pt");
      if (this.visualSettings.yAxisFormatting.showGridLine) {
        const scaledDashArray = this.visualSettings.yAxisFormatting.scaleByWidth
          ? this.scaleDashArray(
              this.visualSettings.yAxisFormatting.dashArray,
              this.innerWidth
            )
          : this.visualSettings.yAxisFormatting.dashArray;

        yAxis
          .selectAll("line")
          .style("fill", "none")
          .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor)
          .style(
            "stroke-width",
            this.defaultYAxisGridlineStrokeWidth() / 10 + "pt"
          )
          .style(
            "stroke-dasharray",
            this.visualSettings.yAxisFormatting.gridLineStyle === "custom"
              ? scaledDashArray
              : this.getLineDashArray(
                  this.visualSettings.yAxisFormatting.gridLineStyle
                )
          )
          .style(
            "stroke-linecap",
            this.visualSettings.yAxisFormatting.gridLineStyle === "custom"
              ? this.visualSettings.yAxisFormatting.dashCap
              : "flat"
          ); // Default to flat
      } else {
        yAxis
          .selectAll("line")
          .style("fill", "none")
          .style("stroke", this.visualSettings.yAxisFormatting.gridLineColor)
          .style("stroke-width", "0pt");
      }
      if (this.visualSettings.yAxisFormatting.showZeroAxisGridLine) {
        yAxis.selectAll("line").each((d, i, nodes) => {
          if (d == 0) {
            d3.select(nodes[i])
              .style("fill", "none")
              .style(
                "stroke",
                this.visualSettings.yAxisFormatting.zeroLineColor
              )
              .style(
                "stroke-width",
                this.visualSettings.yAxisFormatting.zeroLineStrokeWidth / 10 +
                  "pt"
              );
          }
        });
      }

      yAxis.selectAll("line").attr("y2", -this.innerHeight);
    }

    g.attr(
      "transform",
      `translate(${-this.findRightHorizontal},${adjustPosition})`
    );
  }
  private getYaxisHeightHorizontal(gParent) {
    var g = gParent.append("g").attr("class", "yAxisParentGroup");
    var yScale = d3
      .scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([this.innerHeight, 0]);

    /*var ticksCount = 5;
        var staticYscaleTIcks = yScale.ticks(ticksCount);*/

    var yAxisScale = this.visualSettings.yAxisFormatting.switchPosition
      ? d3.axisBottom(yScale).tickValues(this.yScaleTickValues)
      : d3.axisTop(yScale).tickValues(this.yScaleTickValues);

    if (this.visualSettings.yAxisFormatting.show) {
      var yAxis = g
        .append("g")
        .style(
          "font",
          this.visualSettings.yAxisFormatting.fontSize + "pt times"
        )
        .style("font-family", this.visualSettings.yAxisFormatting.fontFamily)
        .style("color", this.visualSettings.yAxisFormatting.fontColor)
        .attr("class", "myYaxis");

      yAxisScale.tickFormat((d) => this.formatValueforYAxis(d));

      yAxis.call(yAxisScale);

      // adjust the left margin of the chart area according to the width of yaxis
      // yAxisWidth used to adjust the left margin
      this.yAxisHeightHorizontal = this.visualSettings.yAxisFormatting
        .showYAxisValues
        ? yAxis.node().getBoundingClientRect().height
        : 0;
      this.yAxisHeightHorizontal += this.visualSettings.yAxisFormatting
        .showTitle
        ? this.yAxisTitleWidth
        : 0;
    } else {
      this.yAxisHeightHorizontal = 0;
    }
    g.remove();
  }

  private wrapHorizontal(text, standardwidth) {
    var textHeight = text.node().getBoundingClientRect().height;
    var maxHeight = standardwidth * text.datum()["childrenCount"];
    var tspanAllowed = Math.floor(maxHeight / textHeight);

    text.each(function () {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        wordsPerLine = Math.ceil(words.length / tspanAllowed),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1,
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");

      var counter = 0;
      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        counter++;
        if (counter + 1 > wordsPerLine && words.length > 0) {
          counter = 0;
          line = [];
          tspan.attr("y", -textHeight / 2);

          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("y", -textHeight / 2)
            .attr("dy", ++lineNumber * lineHeight + dy + "em");
        }
      }
    });
  }
  private formatValueforLabels(d: any) {
    var iValueFormatter;
    var decimalPlaces = this.visualSettings.LabelsFormatting.decimalPlaces;
    var formattedvalue;

    switch (this.visualSettings.LabelsFormatting.valueFormat) {
      case "Auto": {
        if (Math.abs(d.value) >= 1000000000) {
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: d.numberFormat ? 0 : 1e9,
            precision: decimalPlaces,
          });

          formattedvalue = this.getValueSimpleFormatted(iValueFormatter, d);
        } else if (Math.abs(d.value) >= 1000000) {
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: d.numberFormat ? 0 : 1e6,
            precision: decimalPlaces,
            format: d.numberFormat,
          });
          formattedvalue = this.getValueSimpleFormatted(iValueFormatter, d);
        } else if (Math.abs(d.value) >= 1000) {
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: d.numberFormat ? 0 : 1001,
            precision: decimalPlaces,
            format: d.numberFormat,
          });
          formattedvalue = this.getValueSimpleFormatted(iValueFormatter, d);
        } else {
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: 0,
            precision: decimalPlaces,
            format: d.numberFormat,
          });
          formattedvalue = this.getValueSimpleFormatted(iValueFormatter, d);
        }
        break;
      }
      case "Thousands": {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          format: d.numberFormat,
          value: 1e3,
          precision: decimalPlaces,
        });
        formattedvalue = iValueFormatter.format(d.value);
        break;
      }
      case "Millions": {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          format: d.numberFormat,
          value: 1e6,
          precision: decimalPlaces,
        });
        formattedvalue = iValueFormatter.format(d.value);
        break;
      }
      case "Billions": {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          format: d.numberFormat,
          value: 1e9,
          precision: decimalPlaces,
        });
        formattedvalue = iValueFormatter.format(d.value);
        break;
      }
      default: {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          format: d.numberFormat,
          value: 0,
          precision: decimalPlaces,
        });

        formattedvalue = this.getValueSimpleFormatted(iValueFormatter, d);

        break;
      }
    }

    return formattedvalue;
  }

  private getValueSimpleFormatted(iValueFormatter, d) {
    const formattedvalueOriginal = iValueFormatter.format(d.value);
    const formattedvalueNew = iValueFormatter.format(Math.abs(d.value));
    return this.hasParentheses(formattedvalueOriginal) &&
      !this.hasParentheses(formattedvalueNew)
      ? `(${formattedvalueNew})`
      : formattedvalueOriginal;
  }

  private hasParentheses(str) {
    const regex = /\(.*\)/;
    return regex.test(str); // Returns true if parentheses are found, otherwise false
  }

  private formatValueforvalues(value, numberFormat) {
    var iValueFormatter;
    var decimalPlaces = this.visualSettings.LabelsFormatting.decimalPlaces;
    var formattedvalue;
    switch (this.visualSettings.LabelsFormatting.valueFormat) {
      case "Auto": {
        if (Math.abs(value) >= 1000000000) {
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: 1e9,
            precision: decimalPlaces,
          });
          formattedvalue = iValueFormatter.format(value);
        } else if (Math.abs(value) >= 1000000) {
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: 1e6,
            precision: decimalPlaces,
          });
          formattedvalue = iValueFormatter.format(value);
        } else if (Math.abs(value) >= 1000) {
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: 1001,
            precision: decimalPlaces,
          });
          formattedvalue = iValueFormatter.format(value);
        } else {
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: 0,
            precision: decimalPlaces,
          });
          formattedvalue = iValueFormatter.format(value);
        }
        break;
      }
      case "Thousands": {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          format: numberFormat,
          value: 1e3,
          precision: decimalPlaces,
        });
        formattedvalue = iValueFormatter.format(value);
        break;
      }
      case "Millions": {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          format: numberFormat,
          value: 1e6,
          precision: decimalPlaces,
        });
        formattedvalue = iValueFormatter.format(value);
        break;
      }
      case "Billions": {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          format: numberFormat,
          value: 1e9,
          precision: decimalPlaces,
        });
        formattedvalue = iValueFormatter.format(value);
        break;
      }
      default: {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          format: numberFormat,
        });
        formattedvalue = iValueFormatter.format(value);
        break;
      }
    }
    return formattedvalue;
  }

  private formatValueforYAxis(d: any) {
    var iValueFormatter;
    var formatString = this.barChartData[0].numberFormat;
    if (!formatString && this.barChartData[1].numberFormat)
      formatString = this.barChartData[1].numberFormat;
    var decimalPlaces = this.visualSettings.yAxisFormatting.decimalPlaces;
    var formattedvalue;
    this.yAxisUnit = this.visualSettings.yAxisFormatting.YAxisValueFormatOption;
    switch (this.visualSettings.yAxisFormatting.YAxisValueFormatOption) {
      case "Auto": {
        if (
          Math.abs(this.minValue) >= 1000000000 ||
          Math.abs(this.maxValue) >= 1000000000
        ) {
          this.yAxisUnit = "Billions";
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: 1e9,
            precision: decimalPlaces,
            format: formatString,
          });
          formattedvalue = iValueFormatter.format(d);
        } else if (
          Math.abs(this.minValue) >= 1000000 ||
          Math.abs(this.maxValue) >= 1000000
        ) {
          this.yAxisUnit = "Millions";
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: 1e6,
            precision: decimalPlaces,
            format: formatString
              ? `${formatString}${decimalPlaces}`
              : formatString,
          });
          formattedvalue = iValueFormatter.format(d);
        } else if (
          Math.abs(this.minValue) >= 1000 ||
          Math.abs(this.maxValue) >= 1000
        ) {
          this.yAxisUnit = "Thousands";
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: 1001,
            precision: decimalPlaces,
            format: formatString,
          });
          formattedvalue = iValueFormatter.format(d);
        } else {
          this.yAxisUnit = "Hundreds";
          iValueFormatter = valueFormatter.create({
            cultureSelector: this.locale,
            value: 0,
            precision: decimalPlaces,
            format: formatString
              ? `${formatString}${decimalPlaces}`
              : formatString,
          });
          formattedvalue = iValueFormatter.format(d);
        }
        break;
      }
      case "Thousands": {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          value: 1e3,
          format: formatString
            ? `${formatString}${decimalPlaces}`
            : formatString,
          precision: decimalPlaces,
        });
        formattedvalue = iValueFormatter.format(d);
        break;
      }
      case "Millions": {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          value: 1e6,
          format: formatString
            ? `${formatString}${decimalPlaces}`
            : formatString,
          precision: decimalPlaces,
        });
        formattedvalue = iValueFormatter.format(d);
        break;
      }
      case "Billions": {
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          value: 1e9,
          format: formatString
            ? `${formatString}${decimalPlaces}`
            : formatString,
          precision: decimalPlaces,
        });
        formattedvalue = iValueFormatter.format(d);
        break;
      }
      default: {
        this.yAxisUnit = "Hundreds";
        iValueFormatter = valueFormatter.create({
          cultureSelector: this.locale,
          format: formatString,
        });
        formattedvalue = iValueFormatter.format(d);
        break;
      }
    }
    return formattedvalue;
  }
  private formatCategory(value: any, type: any, format: any) {
    let iValueFormatter_XAxis;
    iValueFormatter_XAxis = valueFormatter.create({
      cultureSelector: this.locale,
      format: format,
    });
    var formattedValue = value;
    if (value == null) {
      formattedValue = "(blank)";
    }
    if (type["dateTime"]) {
      var currDate = new Date(formattedValue);
      formattedValue = iValueFormatter_XAxis.format(currDate, format);
    }
    return formattedValue;
  }
}
