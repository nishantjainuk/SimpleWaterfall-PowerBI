import powerbi from "powerbi-visuals-api";
import VisualObjectInstance = powerbi.VisualObjectInstance;
import PrimitiveValue = powerbi.PrimitiveValue;
import ISelectionId = powerbi.visuals.ISelectionId;
import { VisualSettings, yAxisFormatting, chartOrientation } from "./settings";
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import DataView = powerbi.DataView;
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
interface barChartDataPoint {
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
  displayName: string;
}

export interface IEnumerateObjects {
  enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject;
}
export function createenumerateObjects(
  visualType: String,
  barChartData: barChartDataPoint[],
  barChartDataAll,
  visualSettings: VisualSettings,
  defaultXAxisGridlineStrokeWidth: PrimitiveValue,
  defaultYAxisGridlineStrokeWidth: PrimitiveValue,
  dataView: DataView,
  barWidth: number
): IEnumerateObjects {
  return new enumerateObjects(
    visualType,
    barChartData,
    barChartDataAll,
    visualSettings,
    defaultXAxisGridlineStrokeWidth,
    defaultYAxisGridlineStrokeWidth,
    dataView,
    barWidth
  );
}
class enumerateObjects implements IEnumerateObjects {
  private visualType: String;
  private barChartData: barChartDataPoint[];
  private barChartDataAll;
  private visualSettings: VisualSettings;
  private defaultXAxisGridlineStrokeWidth: PrimitiveValue;
  private defaultYAxisGridlineStrokeWidth: PrimitiveValue;
  private dataView: DataView;
  private barWidth: number;

  constructor(
    visualType: String,
    barchartData: barChartDataPoint[],
    barchartDataAll,
    visualSettings: VisualSettings,
    defaultXAxisGridlineStrokeWidth: PrimitiveValue,
    defaultYAxisGridlineStrokeWidth: PrimitiveValue,
    dataView: DataView,
    barWidth: number
  ) {
    this.visualType = visualType;
    this.barChartData = barchartData;
    this.barChartDataAll = barchartDataAll;
    this.visualSettings = visualSettings;
    this.defaultXAxisGridlineStrokeWidth = defaultXAxisGridlineStrokeWidth;
    this.defaultYAxisGridlineStrokeWidth = defaultYAxisGridlineStrokeWidth;
    this.dataView = dataView;
    this.barWidth = barWidth;
  }
  public enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
    let objectName: string = options.objectName;
    let objectEnumeration: VisualObjectInstance[] = [];
    switch (objectName) {
      case "chartOrientation":
        this.propertiesChartOrientation(objectName, objectEnumeration);
        break;
      case "definePillars":
        this.propertiesDefinePillars(objectName, objectEnumeration);
        break;
      case "Legend":
        this.propertiesLegend(objectName, objectEnumeration);
        break;
      case "sentimentColor":
        this.propertiesSentimentColor(objectName, objectEnumeration);
        break;
      case "xAxisFormatting":
        this.propertiesXaxis(objectName, objectEnumeration);
        break;
      case "yAxisFormatting":
        this.propertiesYaxis(objectName, objectEnumeration);
        break;
      case "LabelsFormatting":
        this.propertiesLabelFormatting(objectName, objectEnumeration);
        break;
      case "margins":
        this.propertiesMargin(objectName, objectEnumeration);
        break;
    }

    return objectEnumeration;
  }

  private propertiesDefinePillars(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    if (this.visualType == "static") {
      var isPillarBoolean: boolean;

      for (var index = 0; index < this.barChartData.length; index++) {
        if (this.barChartData[index].category != "defaultBreakdownStepOther") {
          if (this.barChartData[index].isPillar) {
            isPillarBoolean = true;
          } else {
            isPillarBoolean = false;
          }
          objectEnumeration.push({
            objectName: objectName,
            displayName: this.barChartData[index].category,
            properties: {
              pillars: isPillarBoolean,
            },
            selector: this.barChartData[index].selectionId.getSelector(),
          });
        }
      }
    }
    if (this.visualType == "staticCategory") {
      var hasPillar: boolean = false;

      var isPillarBoolean: boolean;
      for (var index = 0; index < this.barChartData.length; index++) {
        if (this.barChartData[index].category != "defaultBreakdownStepOther") {
          if (
            index != this.barChartData.length &&
            !this.visualSettings.definePillars.Totalpillar
          ) {
            // if the last pillar is the only pillar than treat it as no pillar
            isPillarBoolean = true;
            if (
              index != this.barChartData.length &&
              !this.visualSettings.definePillars.Totalpillar
            ) {
              hasPillar = true;
            }
            //hasPillar = true;
          } else {
            isPillarBoolean = false;
          }
          // if (!this.visualSettings.definePillars.Totalpillar) {
          objectEnumeration.push({
            objectName: objectName,
            displayName: this.barChartData[index].category,
            properties: {
              pillars: isPillarBoolean,
            },
            selector: this.barChartData[index].selectionId.getSelector(),
          });
          // }
        }
      }

      if (!hasPillar) {
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            Totalpillar: this.visualSettings.definePillars.Totalpillar,
          },
          selector: null,
        });
      }
    }
    if (this.visualType == "drillableCategory") {
      objectEnumeration.push({
        objectName: objectName,
        properties: {
          Totalpillar: this.visualSettings.definePillars.Totalpillar,
        },
        selector: null,
      });
    }
  }

  private propertiesLegend(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    if (this.visualSettings.chartOrientation.useSentimentFeatures) {
      objectEnumeration.push({
        objectName: objectName,
        properties: {
          show: this.visualSettings.Legend.show,
          position: this.visualSettings.Legend.position,
          textFavourable: this.visualSettings.Legend.textFavourable,
          textAdverse: this.visualSettings.Legend.textAdverse,
          showTitle: this.visualSettings.Legend.showTitle,
        },
        selector: null,
      });

      if (this.visualSettings.Legend.showTitle)
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            title: this.visualSettings.Legend.title,
          },
          selector: null,
        });

      objectEnumeration.push({
        objectName: objectName,
        properties: {
          fontSize: this.visualSettings.Legend.fontSize,
          fontColor: this.visualSettings.Legend.fontColor,
          fontFamily: this.visualSettings.Legend.fontFamily,
          bold: this.visualSettings.Legend.bold,
          italic: this.visualSettings.Legend.italic,
          underline: this.visualSettings.Legend.underline,
        },
        selector: null,
      });
    }
  }
  private propertiesSentimentColor(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    if (this.visualType == "static" || this.visualType == "staticCategory") {
      if (this.visualSettings.chartOrientation.useSentimentFeatures) {
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            sentimentColorTotal:
              this.visualSettings.sentimentColor.sentimentColorTotal,
            sentimentColorFavourable:
              this.visualSettings.sentimentColor.sentimentColorFavourable,
            sentimentColorAdverse:
              this.visualSettings.sentimentColor.sentimentColorAdverse,
            sentimentColorOther:
              this.visualSettings.sentimentColor.sentimentColorOther,
          },
          selector: null,
        });
      } else {
        for (var index = 0; index < this.barChartData.length; index++) {
          if (
            this.barChartData[index].category != "defaultBreakdownStepOther"
          ) {
            let label: any = this.barChartData[index].category;
            label = label.split("|");

            if (label.length === 2) label = label[1];
            else if (label.length === 3) label = `${label[1]} | ${label[2]}`;
            else label = label[0];

            objectEnumeration.push({
              objectName: objectName,
              displayName: label,
              properties: {
                fill: {
                  solid: {
                    color: this.barChartData[index].customBarColor,
                  },
                },
              },
              //selector: this.barChartData[index].selectionId.getSelector()

              //More help on conditional formatting
              //https://docs.microsoft.com/en-us/power-bi/developer/visuals/conditional-format

              // Define whether the conditional formatting will apply to instances, totals, or both
              selector: dataViewWildcard.createDataViewWildcardSelector(
                dataViewWildcard.DataViewWildcardMatchingOption
                  .InstancesAndTotals
              ),

              // Add this property with the value previously defined for the selector property
              altConstantValueSelector:
                this.barChartData[index].selectionId.getSelector(),

              // propertyInstanceKind: {
              //     fill: VisualEnumerationInstanceKinds.ConstantOrRule
              // }
            });
          } else {
            objectEnumeration.push({
              objectName: objectName,
              //displayName: this.barChartData[index].category,
              properties: {
                sentimentColorOther:
                  this.visualSettings.sentimentColor.sentimentColorOther,
              },
              selector: null,
            });
          }
        }
      }
    } else if (this.visualType == "drillable") {
      if (this.visualSettings.chartOrientation.useSentimentFeatures) {
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            sentimentColorTotal:
              this.visualSettings.sentimentColor.sentimentColorTotal,
            sentimentColorFavourable:
              this.visualSettings.sentimentColor.sentimentColorFavourable,
            sentimentColorAdverse:
              this.visualSettings.sentimentColor.sentimentColorAdverse,
            sentimentColorOther:
              this.visualSettings.sentimentColor.sentimentColorOther,
          },
          selector: null,
        });
      } else {
        for (var index = 0; index < this.barChartData.length; index++) {
          if (
            this.barChartData[index].category !== "defaultBreakdownStepOther1"
          ) {
            let label: any = this.barChartData[index].category;
            label = label.split("|");

            if (label.length === 2) label = label[1];
            else if (label.length === 3) label = `${label[1]} | ${label[2]}`;
            else label = label[0];

            objectEnumeration.push({
              objectName: objectName,
              displayName: label,
              properties: {
                fill: {
                  solid: {
                    color: this.barChartData[index].customBarColor,
                  },
                },
              },
              //selector: this.barChartData[index].selectionId.getSelector()

              //More help on conditional formatting
              //https://docs.microsoft.com/en-us/power-bi/developer/visuals/conditional-format

              // Define whether the conditional formatting will apply to instances, totals, or both
              selector: dataViewWildcard.createDataViewWildcardSelector(
                dataViewWildcard.DataViewWildcardMatchingOption
                  .InstancesAndTotals
              ),

              // Add this property with the value previously defined for the selector property
              altConstantValueSelector:
                this.barChartData[index].selectionId.getSelector(),

              // propertyInstanceKind: {
              //     fill: VisualEnumerationInstanceKinds.ConstantOrRule
              // }
            });
          }
        }
      }
    } else {
      objectEnumeration.push({
        objectName: objectName,
        properties: {
          sentimentColorTotal:
            this.visualSettings.sentimentColor.sentimentColorTotal,
          sentimentColorFavourable:
            this.visualSettings.sentimentColor.sentimentColorFavourable,
          sentimentColorAdverse:
            this.visualSettings.sentimentColor.sentimentColorAdverse,
          sentimentColorOther:
            this.visualSettings.sentimentColor.sentimentColorOther,
        },
        selector: null,
      });
    }
  }
  private propertiesChartOrientation(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    if (
      this.visualType == "static" ||
      this.visualType == "staticCategory" ||
      this.visualType == "drillable"
    ) {
      objectEnumeration.push({
        objectName: objectName,
        properties: {
          orientation: this.visualSettings.chartOrientation.orientation,
          useSentimentFeatures:
            this.visualSettings.chartOrientation.useSentimentFeatures,
          sortData: this.visualSettings.chartOrientation.sortData,
        },
        selector: null,
      });
      if (
        // this.visualSettings.chartOrientation.useSentimentFeatures &&
        this.visualType == "staticCategory" ||
        this.dataView.matrix.rows.levels.length === 1
      ) {
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            limitBreakdown: this.visualSettings.chartOrientation.limitBreakdown,
          },
          selector: null,
        });
        if (this.visualSettings.chartOrientation.limitBreakdown) {
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              maxBreakdown: this.visualSettings.chartOrientation.maxBreakdown,
              otherTitle:
                this.visualSettings.chartOrientation.otherTitle ?? "Other",
            },
            selector: null,
          });
          objectEnumeration[2].validValues = {
            maxBreakdown: { numberRange: { min: 1, max: 100 } },
          };
        }
      }
      // }
      // else if (
      //   this.dataView.matrix.rows.levels.length ===
      //   1 /* && this.visualType == "drillable" */
      // ) {
      //   objectEnumeration.push({
      //     objectName: objectName,
      //     properties: {
      //       orientation: this.visualSettings.chartOrientation.orientation,
      //       sortData: this.visualSettings.chartOrientation.sortData,
      //     },
      //     selector: null,
      //   });
      //   objectEnumeration.push({
      //     objectName: objectName,
      //     properties: {
      //       limitBreakdown: this.visualSettings.chartOrientation.limitBreakdown,
      //     },
      //     selector: null,
      //   });
      //   if (this.visualSettings.chartOrientation.limitBreakdown) {
      //     objectEnumeration.push({
      //       objectName: objectName,
      //       properties: {
      //         maxBreakdown: this.visualSettings.chartOrientation.maxBreakdown,
      //         otherTitle: this.visualSettings.chartOrientation.otherTitle ?? "Other",
      //       },
      //       selector: null,
      //     });
      //     objectEnumeration[2].validValues = {
      //       maxBreakdown: { numberRange: { min: 1, max: 100 } },
      //     };
      //   }
    } else {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          orientation: this.visualSettings.chartOrientation.orientation,
        },
        selector: null,
      });
    }
  }
  private propertiesXaxis(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    objectEnumeration.push({
      objectName: "objectName",
      properties: {
        fontSize: this.visualSettings.xAxisFormatting.fontSize,
        fontBold: this.visualSettings.xAxisFormatting.fontBold,
        fontItalic: this.visualSettings.xAxisFormatting.fontItalic,
        fontUnderline: this.visualSettings.xAxisFormatting.fontUnderline,
        fontColor: this.visualSettings.xAxisFormatting.fontColor,
        fontFamily: this.visualSettings.xAxisFormatting.fontFamily,
        // fitToWidth: this.visualSettings.xAxisFormatting.fitToWidth,
        // labelWrapText: this.visualSettings.xAxisFormatting.labelWrapText,
      },
      selector: null,
    });
    if (
      this.barWidth > 21 &&
      this.visualSettings.chartOrientation.orientation !== "Horizontal"
    ) {
      objectEnumeration[objectEnumeration.length - 1].properties.fitToWidth =
        this.visualSettings.xAxisFormatting.fitToWidth;

      objectEnumeration[objectEnumeration.length - 1].properties.labelWrapText =
        this.visualSettings.xAxisFormatting.labelWrapText;
    }

    if (!this.visualSettings.xAxisFormatting.fitToWidth) {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          barWidth: this.visualSettings.xAxisFormatting.barWidth,
        },
        selector: null,
        validValues: {
          barWidth: { numberRange: { min: 20, max: 100 } },
        },
      });

      // objectEnumeration[1].
    }

    objectEnumeration.push({
      objectName: "objectName",
      properties: {
        padding: this.visualSettings.xAxisFormatting.padding,
        showGridLine: this.visualSettings.xAxisFormatting.showGridLine,
      },
      selector: null,
    });
    objectEnumeration[objectEnumeration.length - 1].validValues = {
      padding: { numberRange: { min: 0, max: 20 } },
    };

    if (this.visualSettings.xAxisFormatting.showGridLine) {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          gridLineStrokeWidth: this.defaultXAxisGridlineStrokeWidth,
          gridLineColor: {
            solid: {
              color: this.visualSettings.xAxisFormatting.gridLineColor,
            },
          },
        },
        selector: null,
      });
      objectEnumeration[objectEnumeration.length - 1].validValues = {
        gridLineStrokeWidth: { numberRange: { min: 1, max: 50 } },
      };
    }
  }
  private propertiesYaxis(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    objectEnumeration.push({
      objectName: "objectName",
      properties: {
        show: this.visualSettings.yAxisFormatting.show,
        YAxisDataPointOption:
          this.visualSettings.yAxisFormatting.YAxisDataPointOption,
        showYAxisValues: this.visualSettings.yAxisFormatting.showYAxisValues,
      },
      selector: null,
    });
    if (this.visualSettings.yAxisFormatting.showYAxisValues) {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          fontSize: this.visualSettings.yAxisFormatting.fontSize,
          fontColor: this.visualSettings.yAxisFormatting.fontColor,
          fontFamily: this.visualSettings.yAxisFormatting.fontFamily,
          bold: this.visualSettings.yAxisFormatting.bold,
          italic: this.visualSettings.yAxisFormatting.italic,
          underline: this.visualSettings.yAxisFormatting.underline,
          YAxisValueFormatOption:
            this.visualSettings.yAxisFormatting.YAxisValueFormatOption,
          decimalPlaces:
            this.visualSettings.yAxisFormatting.decimalPlaces ?? "Auto",
        },
        selector: null,
      });
      objectEnumeration[objectEnumeration.length - 1].validValues = {
        decimalPlaces: { numberRange: { min: 0, max: 15 } },
      };
    }
    objectEnumeration.push({
      objectName: "objectName",
      properties: {
        showGridLine: this.visualSettings.yAxisFormatting.showGridLine,
      },
      selector: null,
    });
    if (this.visualSettings.yAxisFormatting.showGridLine) {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          gridLineStrokeWidth: this.defaultYAxisGridlineStrokeWidth,
          gridLineColor: {
            solid: {
              color: this.visualSettings.yAxisFormatting.gridLineColor,
            },
          },
          gridlineTransparency:
            this.visualSettings.yAxisFormatting.gridlineTransparency,
          gridLineStyle: this.visualSettings.yAxisFormatting.gridLineStyle,
          dashArray:
            this.visualSettings.yAxisFormatting.gridLineStyle === "custom"
              ? this.visualSettings.yAxisFormatting.dashArray
              : undefined,
          scaleByWidth:
            this.visualSettings.yAxisFormatting.gridLineStyle === "custom"
              ? this.visualSettings.yAxisFormatting.scaleByWidth
              : undefined,
          dashCap:
            this.visualSettings.yAxisFormatting.gridLineStyle === "custom"
              ? this.visualSettings.yAxisFormatting.dashCap
              : undefined,
        },
        selector: null,
      });

      objectEnumeration[objectEnumeration.length - 1].validValues = {
        gridLineStrokeWidth: { numberRange: { min: 1, max: 50 } },
        gridlineTransparency: { numberRange: { min: 0, max: 100 } },
      };
    }
    objectEnumeration.push({
      objectName: "objectName",
      properties: {
        showZeroAxisGridLine:
          this.visualSettings.yAxisFormatting.showZeroAxisGridLine,
      },
      selector: null,
    });
    if (this.visualSettings.yAxisFormatting.showZeroAxisGridLine) {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          zeroLineStrokeWidth:
            this.visualSettings.yAxisFormatting.zeroLineStrokeWidth,
          zeroLineColor: {
            solid: {
              color: this.visualSettings.yAxisFormatting.zeroLineColor,
            },
          },
        },
        selector: null,
      });
      objectEnumeration[objectEnumeration.length - 1].validValues = {
        zeroLineStrokeWidth: { numberRange: { min: 1, max: 50 } },
      };
    }
    objectEnumeration.push({
      objectName: "objectName",
      properties: {
        joinBars: this.visualSettings.yAxisFormatting.joinBars,
      },
      selector: null,
    });
    if (this.visualSettings.yAxisFormatting.joinBars) {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          joinBarsStrokeWidth:
            this.visualSettings.yAxisFormatting.joinBarsStrokeWidth,
          joinBarsColor: this.visualSettings.yAxisFormatting.joinBarsColor,
        },
        selector: null,
      });
      objectEnumeration[objectEnumeration.length - 1].validValues = {
        joinBarsStrokeWidth: { numberRange: { min: 1, max: 50 } },
      };
    }

    objectEnumeration.push({
      objectName: objectName,
      properties: {
        switchPosition: this.visualSettings.yAxisFormatting.switchPosition,
      },
      selector: null,
    });

    objectEnumeration.push({
      objectName: objectName,
      properties: {
        showTitle: this.visualSettings.yAxisFormatting.showTitle,
      },
      selector: null,
    });

    if (this.visualSettings.yAxisFormatting.showTitle) {
      objectEnumeration.push({
        objectName: objectName,
        properties: {
          titleText: this.visualSettings.yAxisFormatting.titleText,
          titleStyle: this.visualSettings.yAxisFormatting.titleStyle,
          titleColor: this.visualSettings.yAxisFormatting.titleColor,
          titleFontFamily: this.visualSettings.yAxisFormatting.titleFontFamily,
          titleFontSize: this.visualSettings.yAxisFormatting.titleFontSize,
          titleBold: this.visualSettings.yAxisFormatting.titleBold,
          titleItalic: this.visualSettings.yAxisFormatting.titleItalic,
          titleUnderline: this.visualSettings.yAxisFormatting.titleUnderline,
        },
        selector: null,
      });
    }
  }
  private propertiesLabelFormatting(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    if (this.visualSettings.LabelsFormatting.show) {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          show: this.visualSettings.LabelsFormatting.show,
          fontSize: this.visualSettings.LabelsFormatting.fontSize,
          bold: this.visualSettings.LabelsFormatting.bold,
          italic: this.visualSettings.LabelsFormatting.italic,
          underline: this.visualSettings.LabelsFormatting.underline,
          transparency: this.visualSettings.LabelsFormatting.transparency,
          orientation: this.visualSettings.LabelsFormatting.orientation,
          useDefaultFontColor:
            this.visualSettings.LabelsFormatting.useDefaultFontColor,
        },
        selector: null,
      });

      objectEnumeration[objectEnumeration.length - 1].validValues = {
        transparency: { numberRange: { min: 0, max: 100 } },
      };

      this.propertiesDefaultFontColor(objectName, objectEnumeration);
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          fontFamily: this.visualSettings.LabelsFormatting.fontFamily,
        },
        selector: null,
      });

      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          useDefaultLabelPositioning:
            this.visualSettings.LabelsFormatting.useDefaultLabelPositioning,
        },
        selector: null,
      });

      this.propertiesDefaultLabelFormatting(objectName, objectEnumeration);

      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          valueFormat: this.visualSettings.LabelsFormatting.valueFormat,
          decimalPlaces: this.visualSettings.LabelsFormatting.decimalPlaces,
        },
        selector: null,
      });
      objectEnumeration[objectEnumeration.length - 1].validValues = {
        decimalPlaces: { numberRange: { min: 0, max: 15 } },
      };
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          HideZeroBlankValues:
            this.visualSettings.LabelsFormatting.HideZeroBlankValues,
        },
        selector: null,
      });
    } else {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          show: this.visualSettings.LabelsFormatting.show,
        },
        selector: null,
      });
    }
  }
  private propertiesDefaultLabelFormatting(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    if (this.visualSettings.LabelsFormatting.useDefaultLabelPositioning) {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          labelPosition: this.visualSettings.LabelsFormatting.labelPosition,
        },
        selector: null,
      });
    } else {
      if (
        this.visualSettings.chartOrientation.useSentimentFeatures ||
        (this.visualType != "static" && this.visualType != "staticCategory")
      ) {
        objectEnumeration.push({
          objectName: "objectName",
          properties: {
            labelPositionTotal:
              this.visualSettings.LabelsFormatting.labelPositionTotal,
            labelPositionFavourable:
              this.visualSettings.LabelsFormatting.labelPositionFavourable,
            labelPositionAdverse:
              this.visualSettings.LabelsFormatting.labelPositionAdverse,
            labelPositionOther:
              this.visualSettings.LabelsFormatting.labelPositionOther,
          },
          selector: null,
        });
      } else {
        if (
          this.visualType == "static" ||
          this.visualType == "staticCategory"
        ) {
          for (var index = 0; index < this.barChartData.length; index++) {
            if (
              this.barChartData[index].category != "defaultBreakdownStepOther"
            ) {
              objectEnumeration.push({
                objectName: "objectName",
                displayName: this.barChartData[index].category,
                properties: {
                  labelPosition:
                    this.barChartData[index].customLabelPositioning,
                },
                selector: this.barChartData[index].selectionId.getSelector(),
              });
            } else {
              objectEnumeration.push({
                objectName: "objectName",
                displayName: this.barChartData[index].displayName,
                properties: {
                  labelPositionOther:
                    this.visualSettings.LabelsFormatting.labelPositionOther,
                },
                selector: null,
              });
            }
          }
        }
      }
    }
  }
  private propertiesDefaultFontColor(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    if (this.visualSettings.LabelsFormatting.useDefaultFontColor) {
      objectEnumeration.push({
        objectName: "objectName",
        properties: {
          fontColor: this.visualSettings.LabelsFormatting.fontColor,
        },
        selector: null,
      });
    } else {
      if (
        this.visualSettings.chartOrientation.useSentimentFeatures ||
        (this.visualType != "static" && this.visualType != "staticCategory")
      ) {
        objectEnumeration.push({
          objectName: "objectName",
          properties: {
            sentimentFontColorTotal:
              this.visualSettings.LabelsFormatting.sentimentFontColorTotal,
            sentimentFontColorFavourable:
              this.visualSettings.LabelsFormatting.sentimentFontColorFavourable,
            sentimentFontColorAdverse:
              this.visualSettings.LabelsFormatting.sentimentFontColorAdverse,
            sentimentFontColorOther:
              this.visualSettings.LabelsFormatting.sentimentFontColorOther,
          },
          selector: null,
        });
      } else {
        if (
          this.visualType == "static" ||
          this.visualType == "staticCategory"
        ) {
          for (var index = 0; index < this.barChartData.length; index++) {
            if (
              this.barChartData[index].category != "defaultBreakdownStepOther"
            ) {
              objectEnumeration.push({
                objectName: "objectName",
                displayName: this.barChartData[index].category,
                properties: {
                  fill: {
                    solid: {
                      color: this.barChartData[index].customFontColor,
                    },
                  },
                },
                //selector: this.barChartData[index].selectionId.getSelector()

                //More help on conditional formatting
                //https://docs.microsoft.com/en-us/power-bi/developer/visuals/conditional-format

                // Define whether the conditional formatting will apply to instances, totals, or both
                selector: dataViewWildcard.createDataViewWildcardSelector(
                  dataViewWildcard.DataViewWildcardMatchingOption
                    .InstancesAndTotals
                ),

                // Add this property with the value previously defined for the selector property
                altConstantValueSelector:
                  this.barChartData[index].selectionId.getSelector(),

                // propertyInstanceKind: {
                //   fill: VisualEnumerationInstanceKinds.ConstantOrRule,
                // },
              });
            } else {
              objectEnumeration.push({
                objectName: objectName,
                displayName: this.barChartData[index].displayName,
                properties: {
                  sentimentFontColorOther:
                    this.visualSettings.LabelsFormatting
                      .sentimentFontColorOther,
                },
                selector: null,
              });
            }
          }
        }
      }
    }
  }
  private propertiesMargin(
    objectName: string,
    objectEnumeration: VisualObjectInstance[]
  ) {
    objectEnumeration.push({
      objectName: "objectName",
      properties: {
        topMargin: this.visualSettings.margins.topMargin,
        bottomMargin: this.visualSettings.margins.bottomMargin,
        leftMargin: this.visualSettings.margins.leftMargin,
        rightMargin: this.visualSettings.margins.rightMargin,
      },

      selector: null,
    });
    objectEnumeration[0].validValues = {
      topMargin: { numberRange: { min: 0, max: 100 } },
      leftMargin: { numberRange: { min: 0, max: 100 } },
      bottomMargin: { numberRange: { min: 0, max: 100 } },
      rightMargin: { numberRange: { min: 0, max: 100 } },
    };
  }
}
