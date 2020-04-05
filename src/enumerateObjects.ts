
import powerbi from "powerbi-visuals-api";
import VisualObjectInstance = powerbi.VisualObjectInstance;
import PrimitiveValue = powerbi.PrimitiveValue;
import ISelectionId = powerbi.visuals.ISelectionId;
import { VisualSettings, yAxisFormatting, chartOrientation } from "./settings";
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

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
}

export interface IEnumerateObjects {
    enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject;
}
export function createenumerateObjects(
    visualType: String,
        barChartData: barChartDataPoint[],
        visualSettings: VisualSettings,
        defaultXAxisGridlineStrokeWidth: PrimitiveValue,
        defaultYAxisGridlineStrokeWidth: PrimitiveValue
): IEnumerateObjects {
    return new enumerateObjects(            
        visualType,         
        barChartData,
        visualSettings,
         defaultXAxisGridlineStrokeWidth,
        defaultYAxisGridlineStrokeWidth);
}
class enumerateObjects implements IEnumerateObjects{
    private visualType: String;
    private barChartData: barChartDataPoint[];
    private visualSettings: VisualSettings;
    private defaultXAxisGridlineStrokeWidth: PrimitiveValue;
    private defaultYAxisGridlineStrokeWidth: PrimitiveValue;
    
    constructor(visualType: String,barchartData: barChartDataPoint[],visualSettings: VisualSettings,defaultXAxisGridlineStrokeWidth: PrimitiveValue,defaultYAxisGridlineStrokeWidth: PrimitiveValue) {
        this.visualType = visualType;
        this.barChartData = barchartData;
        this.visualSettings = visualSettings;
        this.defaultXAxisGridlineStrokeWidth = defaultXAxisGridlineStrokeWidth;        
        this.defaultYAxisGridlineStrokeWidth = defaultYAxisGridlineStrokeWidth;        
    }
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        let objectName: string = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];
        switch (objectName) {

            case 'chartOrientation':
                this.propertiesChartOrientation(objectName, objectEnumeration);
                break;
            case 'definePillars':
                this.propertiesDefinePillars(objectName, objectEnumeration);
                break;
            case 'sentimentColor':
                this.propertiesSentimentColor(objectName, objectEnumeration);
                break;
            case 'xAxisFormatting':
                this.propertiesXaxis(objectName, objectEnumeration);
                break;
            case 'yAxisFormatting':
                this.propertiesYaxis(objectName, objectEnumeration);
                break;
            case 'LabelsFormatting':
                this.propertiesLabelFormatting(objectName, objectEnumeration);
                break;
            case 'margins':
                this.propertiesMargin(objectName, objectEnumeration);
                break;

        };

        return objectEnumeration;
    }
    private propertiesDefinePillars(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualType == "static") {
            switch (objectName) {
                case 'definePillars':
                    var isPillarBoolean: boolean;
                    
                    for (var index = 0; index < this.barChartData.length; index++) {
                        if (this.barChartData[index].isPillar) {
                            isPillarBoolean = true;
                        } else {
                            isPillarBoolean = false;
                        }
                        objectEnumeration.push({
                            objectName: "objectName",
                            displayName: this.barChartData[index].category,
                            properties: {
                                pillars: isPillarBoolean
                            },
                            selector: this.barChartData[index].selectionId.getSelector()
                        });
                    }
            }
        }
        if (this.visualType == "staticCategory") {
            switch (objectName) {
                case 'definePillars':
                    var isPillarBoolean: boolean;
                    for (var index = 0; index < this.barChartData.length; index++) {
                        if (this.barChartData[index].isPillar) {
                            isPillarBoolean = true;
                        } else {
                            isPillarBoolean = false;
                        }
                        objectEnumeration.push({
                            objectName: "objectName",
                            displayName: this.barChartData[index].category,
                            properties: {
                                pillars: isPillarBoolean
                            },
                            selector: this.barChartData[index].selectionId.getSelector()
                        });
                    }
            }
        }
    }
    private propertiesSentimentColor(objectName: string, objectEnumeration: VisualObjectInstance[]) {

        if (this.visualType == "static" || this.visualType == "staticCategory") {
            if (this.visualSettings.chartOrientation.useSentimentFeatures && (this.visualType == "static" || this.visualType == "staticCategory")) {
                objectEnumeration.push({
                    objectName: "objectName",
                    properties: {
                        sentimentColorTotal: this.visualSettings.sentimentColor.sentimentColorTotal,
                        sentimentColorFavourable: this.visualSettings.sentimentColor.sentimentColorFavourable,
                        sentimentColorAdverse: this.visualSettings.sentimentColor.sentimentColorAdverse
                    },
                    selector: null
                });
            } else {
                for (var index = 0; index < this.barChartData.length; index++) {
                    objectEnumeration.push({
                        objectName: "objectName",
                        displayName: this.barChartData[index].category,
                        properties: {
                            fill1: {
                                solid: {
                                    color: this.barChartData[index].customBarColor
                                }
                            }
                        },
                        selector: this.barChartData[index].selectionId.getSelector()
                    });

                }
            }
        } else {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    sentimentColorTotal: this.visualSettings.sentimentColor.sentimentColorTotal,
                    sentimentColorFavourable: this.visualSettings.sentimentColor.sentimentColorFavourable,
                    sentimentColorAdverse: this.visualSettings.sentimentColor.sentimentColorAdverse
                },
                selector: null
            });
        }
    }
    private propertiesChartOrientation(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualType == "static" || this.visualType == "staticCategory") {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    orientation: this.visualSettings.chartOrientation.orientation,
                    useSentimentFeatures: this.visualSettings.chartOrientation.useSentimentFeatures
                },
                selector: null
            });
        } else {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    orientation: this.visualSettings.chartOrientation.orientation
                },
                selector: null
            });
        }
    }
    private propertiesXaxis(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                fontSize: this.visualSettings.xAxisFormatting.fontSize,
                fontColor: this.visualSettings.xAxisFormatting.fontColor,
                fontFamily: this.visualSettings.xAxisFormatting.fontFamily,
                //fitToWidth: this.visualSettings.xAxisFormatting.fitToWidth,
                labelWrapText: this.visualSettings.xAxisFormatting.labelWrapText
            },
            selector: null
        });

        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                barWidth: this.visualSettings.xAxisFormatting.barWidth
            },
            selector: null
        });

        objectEnumeration[1].validValues = {
            barWidth: { numberRange: { min: 10, max: 100 } }

        };


        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                padding: this.visualSettings.xAxisFormatting.padding,
                showGridLine: this.visualSettings.xAxisFormatting.showGridLine
            },
            selector: null
        });
        objectEnumeration[objectEnumeration.length - 1].validValues = {
            padding: { numberRange: { min: 0, max: 20 } }

        };

        if (this.visualSettings.xAxisFormatting.showGridLine) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    gridLineStrokeWidth: this.defaultXAxisGridlineStrokeWidth,
                    gridLineColor: {
                        solid: {
                            color: this.visualSettings.xAxisFormatting.gridLineColor
                        }
                    }
                },
                selector: null
            });
            objectEnumeration[objectEnumeration.length - 1].validValues = {
                gridLineStrokeWidth: { numberRange: { min: 1, max: 50 } }
            };
        }
    }
    private propertiesYaxis(objectName: string, objectEnumeration: VisualObjectInstance[]) {


        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                show: this.visualSettings.yAxisFormatting.show,
                YAxisDataPointOption: this.visualSettings.yAxisFormatting.YAxisDataPointOption
            },
            selector: null
        });

        
        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                fontSize: this.visualSettings.yAxisFormatting.fontSize,
                fontColor: this.visualSettings.yAxisFormatting.fontColor,
                YAxisValueFormatOption: this.visualSettings.yAxisFormatting.YAxisValueFormatOption,
                showGridLine: this.visualSettings.yAxisFormatting.showGridLine
            },
            selector: null
        });
        if (this.visualSettings.yAxisFormatting.showGridLine) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    gridLineStrokeWidth: this.defaultYAxisGridlineStrokeWidth,
                    gridLineColor: {
                        solid: {
                            color: this.visualSettings.yAxisFormatting.gridLineColor
                        }
                    }
                },
                selector: null
            });
            objectEnumeration[objectEnumeration.length - 1].validValues = {
                gridLineStrokeWidth: { numberRange: { min: 1, max: 50 } }

            };
        }

    }
    private propertiesLabelFormatting(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualSettings.LabelsFormatting.show) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    show: this.visualSettings.LabelsFormatting.show,
                    fontSize: this.visualSettings.LabelsFormatting.fontSize,
                    useDefaultFontColor: this.visualSettings.LabelsFormatting.useDefaultFontColor
                },
                selector: null
            });

            this.propertiesDefaultFontColor(objectName, objectEnumeration);
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    fontFamily: this.visualSettings.LabelsFormatting.fontFamily
                },
                selector: null
            });

            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    useDefaultLabelPositioning: this.visualSettings.LabelsFormatting.useDefaultLabelPositioning,
                },
                selector: null
            });

            this.propertiesDefaultLabelFormatting(objectName, objectEnumeration);

            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    valueFormat: this.visualSettings.LabelsFormatting.valueFormat
                },
                selector: null
            });
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    HideZeroBlankValues: this.visualSettings.LabelsFormatting.HideZeroBlankValues
                },
                selector: null
            });
        } else {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    show: this.visualSettings.LabelsFormatting.show
                },
                selector: null
            });
        }
    }
    private propertiesDefaultLabelFormatting(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualSettings.LabelsFormatting.useDefaultLabelPositioning) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    labelPosition: this.visualSettings.LabelsFormatting.labelPosition,
                },
                selector: null
            });
        } else {

            if (this.visualSettings.chartOrientation.useSentimentFeatures || (this.visualType != "static" && this.visualType != "staticCategory")) {
                objectEnumeration.push({
                    objectName: "objectName",
                    properties: {
                        labelPositionTotal: this.visualSettings.LabelsFormatting.labelPositionTotal,
                        labelPositionFavourable: this.visualSettings.LabelsFormatting.labelPositionFavourable,
                        labelPositionAdverse: this.visualSettings.LabelsFormatting.labelPositionAdverse
                    },
                    selector: null
                });
            } else {
                if (this.visualType == "static" || this.visualType == "staticCategory") {
                    for (var index = 0; index < this.barChartData.length; index++) {
                        objectEnumeration.push({
                            objectName: "objectName",
                            displayName: this.barChartData[index].category,
                            properties: {
                                labelPosition: this.barChartData[index].customLabelPositioning
                            },
                            selector: this.barChartData[index].selectionId.getSelector()
                        });
                    }
                }
            }
        }
    }
    private propertiesDefaultFontColor(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualSettings.LabelsFormatting.useDefaultFontColor) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    fontColor: this.visualSettings.LabelsFormatting.fontColor,
                },
                selector: null
            });
        } else {

            if (this.visualSettings.chartOrientation.useSentimentFeatures || (this.visualType != "static" && this.visualType != "staticCategory")) {
                objectEnumeration.push({
                    objectName: "objectName",
                    properties: {
                        sentimentFontColorTotal: this.visualSettings.LabelsFormatting.sentimentFontColorTotal,
                        sentimentFontColorFavourable: this.visualSettings.LabelsFormatting.sentimentFontColorFavourable,
                        sentimentFontColorAdverse: this.visualSettings.LabelsFormatting.sentimentFontColorAdverse
                    },
                    selector: null
                });
            } else {
                if (this.visualType == "static" || this.visualType == "staticCategory") {
                    for (var index = 0; index < this.barChartData.length; index++) {
                        objectEnumeration.push({
                            objectName: "objectName",
                            displayName: this.barChartData[index].category,
                            properties: {
                                fill1: {
                                    solid: {
                                        color: this.barChartData[index].customFontColor
                                    }
                                }
                            },
                            selector: this.barChartData[index].selectionId.getSelector()
                        });
                    }
                }
            }
        }
    }
    private propertiesMargin(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                topMargin: this.visualSettings.margins.topMargin,
                bottomMargin: this.visualSettings.margins.bottomMargin,
                leftMargin: this.visualSettings.margins.leftMargin,
                rightMargin: this.visualSettings.margins.rightMargin
            },

            selector: null
        });
        objectEnumeration[0].validValues = {
            topMargin: { numberRange: { min: 0, max: 100 } },
            leftMargin: { numberRange: { min: 0, max: 100 } },
            bottomMargin: { numberRange: { min: 0, max: 100 } },
            rightMargin: { numberRange: { min: 0, max: 100 } }
        };
    }
    
}