/*
 *  Power BI Visualizations
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

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
  public chartOrientation: chartOrientation = new chartOrientation();
  public sentimentColor: sentimentColor = new sentimentColor();
  public margins: margins = new margins();
  public definePillars: definePillars = new definePillars();
  public xAxisFormatting: xAxisFormatting = new xAxisFormatting();  
  public yAxisFormatting: yAxisFormatting = new yAxisFormatting();  
  public LabelsFormatting: LabelsFormatting = new LabelsFormatting();
  public Legend: Legend = new Legend();
}
export class chartOrientation {
  public orientation: string = "Vertical";
  public useSentimentFeatures: boolean = true;  
  public sortData: number = 1;
}
export class definePillars {
  public Totalpillar: boolean = true;
}
export class Legend {
  public show: boolean = false;
  public fontSize: number = 11;
  public fontColor: string = "#777777";
  public fontFamily: string = "\"Segoe UI\", wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public textFavourable: string = "Favourable";
  public textAdverse: string = "Adverse";
}
export class sentimentColor {
  public sentimentColorTotal: string = "#0000ff";
  public sentimentColorFavourable: string = "#00b050";
  public sentimentColorAdverse: string = "#ff0000";
}
export class margins {
  public topMargin: number = 0;
  public leftMargin: number = 0;
  public rightMargin: number = 0;
  public bottomMargin: number = 0;

}

export class xAxisFormatting {
  public fontSize: number = 10;
  public fontColor: string = "#777777";
  public fontFamily: string = "\"Segoe UI\", wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public labelWrapText: boolean = true;
  public fitToWidth: boolean = true;
  public barWidth: number = 50;
  public padding: number = 5;  
  public showGridLine: boolean = true;
  public gridLineStrokeWidth: number = 5;
  public gridLineColor: string = "#777777";  
}
export class yAxisFormatting {
  public show: boolean = true;
  public YAxisDataPointOption: string = "Auto";
  public YAxisDataPointRangeStart: number = 0;
  public YAxisDataPointRangeEnd: number = 0;
  public fontSize: number = 10;
  public fontColor: string = "#777777";
  public fontFamily: string = "\"Segoe UI\", wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public YAxisValueFormatOption: string = "Auto";
  public showGridLine: boolean = true;
  public gridLineStrokeWidth: number = 1;
  public gridLineColor: string = "#777777";
}
export class LabelsFormatting {
  public show: boolean = true;
  public fontSize: number = 10;
  public useDefaultFontColor: boolean = true;
  public fontColor: string = "#777777";
  public sentimentFontColorTotal: string = "#777777";
  public sentimentFontColorFavourable: string = "#777777";
  public sentimentFontColorAdverse: string = "#777777";
  public fontFamily: string = "\"Segoe UI\", wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public valueFormat: string = "Auto";
  public useDefaultLabelPositioning: boolean = true;
  public labelPosition: string = "Outside end";
  public labelPositionTotal: string = "Outside end";
  public labelPositionFavourable: string = "Outside end";
  public labelPositionAdverse: string = "Outside end";
  public negativeInBrackets: boolean = false;
  public HideZeroBlankValues: boolean = false;
}

