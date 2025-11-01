import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

export class ChartOptionsGeneralCard extends formattingSettings.SimpleCard {
    uid: string = "chartOptionsGeneralCard";
    name: string = "chartOptionsGeneral";
    displayName: string = "General";

    orientation = new formattingSettings.ItemDropdown({
        name: "orientation",
        displayName: "Chart Orientation",
        value: { value: "Vertical", displayName: "Vertical" },
        items: [
            { value: "Vertical", displayName: "Vertical" },
            { value: "Horizontal", displayName: "Horizontal" }
        ]
    });

    useSentimentFeatures = new formattingSettings.ToggleSwitch({
        name: "useSentimentFeatures",
        displayName: "Format using Sentiments",
        value: true
    });

    slices = [
        this.orientation,
        this.useSentimentFeatures
    ];
}
export class ChartOptionsDataControlCard extends formattingSettings.SimpleCard {
    uid: string = "chartOptionsDataControlCard";
    name: string = "chartOptionsDataControl";
    displayName: string = "Data Control";

    sortData = new formattingSettings.ItemDropdown({
        name: "sortData",
        displayName: "Sort Data",
        value: { value: 1, displayName: "Default" },
        items: [
            { value: 1, displayName: "Default" },
            { value: 2, displayName: "Descending" },
            { value: 3, displayName: "Ascending" }
        ]
    });

    limitBreakdown = new formattingSettings.ToggleSwitch({
        name: "limitBreakdown",
        displayName: "Limit Steps",
        value: false
    });

    maxBreakdown = new formattingSettings.NumUpDown({
        name: "maxBreakdown",
        displayName: "Max Steps",
        value: 5,
        options: {}
    });

    otherTitle = new formattingSettings.TextInput({
        name: "otherTitle",
        displayName: "Other Step Title",
        value: "Other",
        placeholder: "Enter other step title"
    });

    slices = [
        this.sortData,
        this.limitBreakdown,
        this.maxBreakdown,
        this.otherTitle
    ];
}
export class ChartOptionsCompositeCard extends formattingSettings.CompositeCard {
    uid: string = "chartOptionsCompositeCard";
    name: string = "chartOptions";
    displayName: string = "Chart Options";

    generalCard = new ChartOptionsGeneralCard();
    dataControlCard = new ChartOptionsDataControlCard();

    // cards = [
    //     this.generalCard,
    //     this.dataControlCard
    // ];

    // Add this line to satisfy the abstract member
    groups: formattingSettings.Group[] = [
        {
            name: "chartOptionsGeneral",
            displayName: "General",
            slices: [...this.generalCard.slices]
        },
        {
            name: "chartOptionsDataControl",
            displayName: "Data Control",
            slices: [...this.dataControlCard.slices]
        }
    ];
}
export class DefinePillarsCard extends formattingSettings.SimpleCard {
    uid: string = "definePillarsCard";
    name: string = "definePillars";
    displayName: string = "Define Pillars";

    totalPillar = new formattingSettings.ToggleSwitch({
        name: "Totalpillar",
        displayName: "Show Total Pillar",
        value: true
    });

    slices = [
        this.totalPillar
    ];
}

export class MarginsCard extends formattingSettings.SimpleCard {
    uid: string = "marginsCard";
    name: string = "margins";
    displayName: string = "Margins";

    topMargin = new formattingSettings.NumUpDown({
        name: "topMargin",
        displayName: "Top Margin",
        value: 0,
        options: {}
        //  options: { minValue: 0, maxValue: 100 }
    });

    leftMargin = new formattingSettings.NumUpDown({
        name: "leftMargin",
        displayName: "Left Margin",
        value: 0,
        options: {}
        //  options: { minValue: 0, maxValue: 100 }
    });

    rightMargin = new formattingSettings.NumUpDown({
        name: "rightMargin",
        displayName: "Right Margin",
        value: 0,
        options: {}
        //  options: { minValue: 0, maxValue: 100 }
    });

    bottomMargin = new formattingSettings.NumUpDown({
        name: "bottomMargin",
        displayName: "Bottom Margin",
        value: 0,
        options: {}
        //  options: { minValue: 0, maxValue: 100 }
    });

    slices = [
        this.topMargin,
        this.leftMargin,
        this.rightMargin,
        this.bottomMargin
    ];
}

export class BarColorCard extends formattingSettings.SimpleCard {
    uid: string = "barColorCard";
    name: string = "sentimentColor";
    displayName: string = "Bar Color";

    sentimentColorTotal = new formattingSettings.ColorPicker({
        name: "sentimentColorTotal",
        displayName: "Total Bar Color",
        value: { value: "#0055fe" }
    });

    sentimentColorFavourable = new formattingSettings.ColorPicker({
        name: "sentimentColorFavourable",
        displayName: "Favourable Bar Color",
        value: { value: "#00b050" }
    });

    sentimentColorAdverse = new formattingSettings.ColorPicker({
        name: "sentimentColorAdverse",
        displayName: "Adverse Bar Color",
        value: { value: "#ff0000" }
    });

    sentimentColorOther = new formattingSettings.ColorPicker({
        name: "sentimentColorOther",
        displayName: "Other Bar Color",
        value: { value: "#F2C811" }
    });

    slices = [
        this.sentimentColorTotal,
        this.sentimentColorFavourable,
        this.sentimentColorAdverse,
        this.sentimentColorOther
    ];
}

export class LegendVisibilityCard extends formattingSettings.SimpleCard {
    uid: string = "legendVisibilityCard";
    name: string = "legendVisibility";
    displayName: string = "Visibility";

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show Legend",
        value: false
    });

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        value: { value: "topLeft", displayName: "Top Left" },
        items: [
            { value: "topLeft", displayName: "Top Left" },
            { value: "topRight", displayName: "Top Right" },
            { value: "bottomLeft", displayName: "Bottom Left" },
            { value: "bottomRight", displayName: "Bottom Right" }
        ]
    });

    slices = [
        this.show,
        this.position
    ];
}
export class LegendTitleCard extends formattingSettings.SimpleCard {
    uid: string = "legendTitleCard";
    name: string = "legendTitle";
    displayName: string = "Title";

    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Show Title",
        value: false
    });

    title = new formattingSettings.TextInput({
        name: "title",
        displayName: "Legend Title",
        value: "",
        placeholder: "Enter legend title"
    });

    slices = [
        this.showTitle,
        this.title
    ];
}
export class LegendFontCard extends formattingSettings.SimpleCard {
    uid: string = "legendFontCard";
    name: string = "legendFont";
    displayName: string = "Font";

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font Color",
        value: { value: "#777777" }
    });

    fontFamily = new formattingSettings.FontPicker({ name: "fontFamily", displayName: "Font Family", value: "Segoe UI" });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font Size", value: 9, options: {} });
    bold = new formattingSettings.ToggleSwitch({ name: "bold", displayName: "Bold", value: false });
    italic = new formattingSettings.ToggleSwitch({ name: "italic", displayName: "Italic", value: false });
    underline = new formattingSettings.ToggleSwitch({ name: "underline", displayName: "Underline", value: false });
    font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        bold: this.bold,
        italic: this.italic,
        underline: this.underline
    });


    slices = [
        this.font,       // compact Font control
        this.fontColor
    ];
}
export class LegendLabelsCard extends formattingSettings.SimpleCard {
    uid: string = "legendLabelsCard";
    name: string = "legendLabels";
    displayName: string = "Labels";

    textFavourable = new formattingSettings.TextInput({
        name: "textFavourable",
        displayName: "Favourable Label",
        value: "Favourable",
        placeholder: "Enter favourable label"
    });

    textAdverse = new formattingSettings.TextInput({
        name: "textAdverse",
        displayName: "Adverse Label",
        value: "Adverse",
        placeholder: "Enter adverse label"
    });

    textTotal = new formattingSettings.TextInput({
        name: "textTotal",
        displayName: "Total Label",
        value: "Total",
        placeholder: "Enter total label"
    });

    textOther = new formattingSettings.TextInput({
        name: "textOther",
        displayName: "Other Label",
        value: "Other",
        placeholder: "Enter other label"
    });

    slices = [
        this.textFavourable,
        this.textAdverse,
        this.textTotal,
        this.textOther
    ];
}
export class LegendCompositeCard extends formattingSettings.CompositeCard {
    uid: string = "legendCompositeCard";
    name: string = "Legend";
    displayName: string = "Legend";

    visibilityCard = new LegendVisibilityCard();
    titleCard = new LegendTitleCard();
    fontCard = new LegendFontCard();
    labelsCard = new LegendLabelsCard();

    // cards = [
    //     this.visibilityCard,
    //     this.titleCard,
    //     this.fontCard,
    //     this.labelsCard
    // ];

    // Add this line to satisfy the abstract member
    groups: formattingSettings.Group[] = [
        {
            name: "legendVisibility",
            displayName: "Visibility",
            slices: [...this.visibilityCard.slices]
        },
        {
            name: "legendTitle",
            displayName: "Title",
            slices: [...this.titleCard.slices]
        },
        {
            name: "legendFont",
            displayName: "Font",
            slices: [...this.fontCard.slices]
        },
        {
            name: "legendLabels",
            displayName: "Labels",
            slices: [...this.labelsCard.slices]
        }
    ];
}
// Values Card (Font settings)
export class XAxisValuesCard extends formattingSettings.SimpleCard {
    uid: string = "xAxisValuesCard";
    name: string = "xAxisValues";
    displayName: string = "Values";

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show Values",
        value: true
    });

    // sub-slices (names must match capabilities.json)
    fontFamily = new formattingSettings.FontPicker({ name: "fontFamily", displayName: "Font Family", value: "Segoe UI" });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font Size", value: 8, options: {} });
    fontBold = new formattingSettings.ToggleSwitch({ name: "fontBold", displayName: "Bold", value: false });
    fontItalic = new formattingSettings.ToggleSwitch({ name: "fontItalic", displayName: "Italic", value: false });
    fontUnderline = new formattingSettings.ToggleSwitch({ name: "fontUnderline", displayName: "Underline", value: false });
    font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        bold: this.fontBold,
        italic: this.fontItalic,
        underline: this.fontUnderline
    });
    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font Color",
        value: { value: "#777777" }
    });

    slices = [
        this.show,
        this.font,       // compact control (family + size + B/I/U)
        this.fontColor
    ];
}
export class XAxisLabelsCard extends formattingSettings.SimpleCard {
    uid: string = "xAxisLabelsCard";
    name: string = "xAxisLabels";
    displayName: string = "Labels";

    labelWrapText = new formattingSettings.ToggleSwitch({
        name: "labelWrapText",
        displayName: "Wrap text",
        value: false
    });

    fitToWidth = new formattingSettings.ToggleSwitch({
        name: "fitToWidth",
        displayName: "Fit to width",
        value: true
    });
    concatenateLabels = new formattingSettings.ToggleSwitch({
        name: "concatenateLabels",
        displayName: "Concatenate labels",
        value: true
    });

    verticalLabels = new formattingSettings.ToggleSwitch({
        name: "verticalLabels",
        displayName: "Vertical labels",
        value: false
    });

    barWidth = new formattingSettings.NumUpDown({
        name: "barWidth",
        displayName: "Minimum Bar Width",
        value: 50,
        options: {
        }
    });
    padding = new formattingSettings.NumUpDown({
        name: "padding",
        displayName: "Padding",
        value: 5,
        options: {}
    });

    showXAxisValues = new formattingSettings.ToggleSwitch({
        name: "showXAxisValues",
        displayName: "Show / Hide Values",
        value: true
    });

    slices = [
        this.labelWrapText,
        this.fitToWidth,
        this.concatenateLabels,
        this.verticalLabels,
        this.barWidth,
        this.padding,
        this.showXAxisValues
    ];
}
// Layout Card (Gridlines, etc.)
export class XAxisLayoutCard extends formattingSettings.SimpleCard {
    uid: string = "xAxisLayoutCard";
    name: string = "xAxisLayout";
    displayName: string = "Layout";

    showGridlines = new formattingSettings.ToggleSwitch({
        name: "showGridLine",
        displayName: "Show Gridlines",
        value: true
    });

    gridlineColor = new formattingSettings.ColorPicker({
        name: "gridLineColor",
        displayName: "Gridline Color",
        value: { value: "rgb(119, 119, 119)" }
    });

    gridlineWidth = new formattingSettings.NumUpDown({
        name: "gridLineStrokeWidth",
        displayName: "Gridline Width",
        value: 5,
        options: {}
    });

    slices = [
        this.showGridlines,
        this.gridlineColor,
        this.gridlineWidth
    ];
}
export class XAxisCompositeCard extends formattingSettings.CompositeCard {
    uid: string = "xAxisCompositeCard";
    name: string = "xAxisFormatting";
    displayName: string = "X-Axis";

    valuesCard = new XAxisValuesCard();
    labelsCard = new XAxisLabelsCard();
    layoutCard = new XAxisLayoutCard();

    // cards = [
    //     this.valuesCard,
    //     this.titleCard,
    //     this.layoutCard
    // ];

    groups: formattingSettings.Group[] = [
        {
            name: "xAxisValues",
            displayName: "Values",
            slices: [...this.valuesCard.slices]
        },
        {
            name: "xAxisLabels",
            displayName: "Labels",
            slices: [...this.labelsCard.slices]
        },
        {
            name: "xAxisLayout",
            displayName: "Layout",
            slices: [...this.layoutCard.slices]
        }
    ];
}
// Y-Axis Values Card
export class YAxisValuesCard extends formattingSettings.SimpleCard {
    uid: string = "yAxisValuesCard";
    name: string = "yAxisValues";
    displayName: string = "Values";

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show Values",
        value: true
    });

    fontFamily = new formattingSettings.FontPicker({ name: "fontFamily", displayName: "Font Family", value: "Segoe UI" });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font Size", value: 8, options: {} });
    fontBold = new formattingSettings.ToggleSwitch({ name: "bold", displayName: "Bold", value: false });
    fontItalic = new formattingSettings.ToggleSwitch({ name: "italic", displayName: "Italic", value: false });
    fontUnderline = new formattingSettings.ToggleSwitch({ name: "underline", displayName: "Underline", value: false });

    font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        bold: this.fontBold,
        italic: this.fontItalic,
        underline: this.fontUnderline
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font Color",
        value: { value: "#777777" }
    });

    slices = [
        this.show,
        this.font,
        this.fontColor
    ];
}

// Y-Axis Title Card
export class YAxisTitleCard extends formattingSettings.SimpleCard {
    uid: string = "yAxisTitleCard";
    name: string = "yAxisTitle";
    displayName: string = "Title";

    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Show Title",
        value: false
    });

    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayName: "Title Text",
        value: "",
        placeholder: "Enter title text"
    });

    slices = [
        this.showTitle,
        this.titleText
    ];
}

// Y-Axis Layout Card (Gridlines, etc.)
export class YAxisLayoutCard extends formattingSettings.SimpleCard {
    uid: string = "yAxisLayoutCard";
    name: string = "yAxisLayout";
    displayName: string = "Layout";

    showGridlines = new formattingSettings.ToggleSwitch({
        name: "showGridLine",
        displayName: "Show Gridlines",
        value: true
    });

    gridlineColor = new formattingSettings.ColorPicker({
        name: "gridLineColor",
        displayName: "Gridline Color",
        value: { value: "#cccccc" }
    });

    gridlineWidth = new formattingSettings.NumUpDown({
        name: "gridLineStrokeWidth",
        displayName: "Gridline Width",
        value: 1,
        options: {}
        // options: { minValue: 1, maxValue: 10 }
    });

    slices = [
        this.showGridlines,
        this.gridlineColor,
        this.gridlineWidth
    ];
}
export class YAxisCompositeCard extends formattingSettings.CompositeCard {
    uid: string = "yAxisCompositeCard";
    name: string = "yAxisFormatting";
    displayName: string = "Y-Axis";

    valuesCard = new YAxisValuesCard();
    titleCard = new YAxisTitleCard();
    layoutCard = new YAxisLayoutCard();

    // cards = [
    //     this.valuesCard,
    //     this.titleCard,
    //     this.layoutCard
    // ];

    groups: formattingSettings.Group[] = [
        {
            name: "yAxisValues",
            displayName: "Values",
            slices: [...this.valuesCard.slices]
        },
        {
            name: "yAxisTitle",
            displayName: "Title",
            slices: [...this.titleCard.slices]
        },
        {
            name: "yAxisLayout",
            displayName: "Layout",
            slices: [...this.layoutCard.slices]
        }
    ];
}
// Labels Visibility Card
export class LabelsVisibilityCard extends formattingSettings.SimpleCard {
    uid: string = "labelsVisibilityCard";
    name: string = "labelsVisibility";
    displayName: string = "Visibility";

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show Labels",
        value: true
    });

    hideZeroBlankValues = new formattingSettings.ToggleSwitch({
        name: "HideZeroBlankValues",
        displayName: "Hide Zero/Blank Values",
        value: false
    });
    orientation = new formattingSettings.ItemDropdown({
        name: "orientation",
        displayName: "Orientation",
        value: { value: "horizontal", displayName: "Horizontal" },
        items: [
            { value: "horizontal", displayName: "Horizontal" },
            { value: "vertical", displayName: "Vertical" }
        ]
    });
    valueFormat = new formattingSettings.ItemDropdown({
        name: "valueFormat",
        displayName: "Value Format",
        value: { value: "Auto", displayName: "Auto" },
        items: [
            { value: "None", displayName: "None" },
            { value: "Auto", displayName: "Auto" },
            { value: "Thousands", displayName: "Thousands" },
            { value: "Millions", displayName: "Millions" },
            { value: "Billions", displayName: "Billions" }
        ]
    });
decimalPlaces = new formattingSettings.NumUpDown({
        name: "decimalPlaces",
        displayName: "Value decimal places",
        value: 0,
        options: {}
    });

    // negativeInBrackets = new formattingSettings.ToggleSwitch({
    //     name: "negativeInBrackets",
    //     displayName: "Negative value in brackets",
    //     value: false
    // });
    slices = [
        this.show,
        this.hideZeroBlankValues,
        this.orientation,
        this.valueFormat,
        this.decimalPlaces
    ];
}

// Labels Font Card
export class LabelsFontCard extends formattingSettings.SimpleCard {
    uid: string = "labelsFontCard";
    name: string = "labelsFont";
    displayName: string = "Font";

    fontFamily = new formattingSettings.FontPicker({ name: "fontFamily", displayName: "Font Family", value: "Segoe UI" });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font Size", value: 9, options: {} });
    bold = new formattingSettings.ToggleSwitch({ name: "bold", displayName: "Bold", value: false });
    italic = new formattingSettings.ToggleSwitch({ name: "italic", displayName: "Italic", value: false });
    underline = new formattingSettings.ToggleSwitch({ name: "underline", displayName: "Underline", value: false });

    useDefaultFontColor = new formattingSettings.ToggleSwitch({
        name: "useDefaultFontColor",
        displayName: "Use Default Font Color",
        value: true
    });
    font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        bold: this.bold,
        italic: this.italic,
        underline: this.underline
    });

    fontColor = new formattingSettings.ColorPicker({ name: "fontColor", displayName: "Default Font Color", value: { value: "#777777" } });

    slices = [
        this.font,
        this.useDefaultFontColor,
        this.fontColor,
    ];
}

// Labels Position Card
export class LabelsPositionCard extends formattingSettings.SimpleCard {
    uid: string = "labelsPositionCard";
    name: string = "labelsPosition";
    displayName: string = "Position";

    // Toggle default vs per-type positioning
    useDefaultLabelPositioning = new formattingSettings.ToggleSwitch({
        name: "useDefaultLabelPositioning",
        displayName: "Use Default Label Positioning",
        value: true
    });
    // labelPosition = new formattingSettings.ItemDropdown({
    //     name: "labelPosition",
    //     displayName: "Label Position",
    //     value: { value: "Outside end", displayName: "Outside end" },
    //     items: [
    //         { value: "Inside end", displayName: "Inside end" },
    //         { value: "Outside end", displayName: "Outside end" },
    //         { value: "Inside center", displayName: "Inside center" },
    //         { value: "Inside base", displayName: "Inside base" },
    //         { value: "Always top", displayName: "Always top" },
    //         { value: "Always bottom", displayName: "Always bottom" },
    //         { value: "Always left", displayName: "Always left" },
    //         { value: "Always right", displayName: "Always right" }
    //     ]
    // });
    //     // Per-type positions (used when useDefaultLabelPositioning = false)
    // labelPositionTotal = new formattingSettings.ItemDropdown({
    //     name: "labelPositionTotal",
    //     displayName: "Totals",
    //     value: { value: "Outside end", displayName: "Outside end" },
    //     items: this.labelPosition.items
    // });
    // labelPositionFavourable = new formattingSettings.ItemDropdown({
    //     name: "labelPositionFavourable",
    //     displayName: "Favourable",
    //     value: { value: "Outside end", displayName: "Outside end" },
    //     items: this.labelPosition.items
    // });

    // labelPositionAdverse = new formattingSettings.ItemDropdown({
    //     name: "labelPositionAdverse",
    //     displayName: "Adverse",
    //     value: { value: "Outside end", displayName: "Outside end" },
    //     items: this.labelPosition.items
    // });

    // labelPositionOther = new formattingSettings.ItemDropdown({
    //     name: "labelPositionOther",
    //     displayName: "Other",
    //     value: { value: "Outside end", displayName: "Outside end" },
    //     items: this.labelPosition.items
    // });
        // Call from visual.ts to update options based on Chart Orientation
            // Orientation-specific option sets
    private verticalItems = [
        { value: "Inside end", displayName: "Inside end" },
        { value: "Outside end", displayName: "Outside end" },
        { value: "Inside center", displayName: "Inside center" },
        { value: "Inside base", displayName: "Inside base" },
        { value: "Always top", displayName: "Always top" },
        { value: "Always bottom", displayName: "Always bottom" }
    ];

    private horizontalItems = [
        { value: "Inside end", displayName: "Inside end" },
        { value: "Outside end", displayName: "Outside end" },
        { value: "Inside center", displayName: "Inside center" },
        { value: "Inside base", displayName: "Inside base" },
        { value: "Always left", displayName: "Always left" },
        { value: "Always right", displayName: "Always right" }
    ];
        // Items will be set from orientation dynamically
    labelPosition = new formattingSettings.ItemDropdown({
        name: "labelPosition",
        displayName: "Label Position",
        value: { value: "Outside end", displayName: "Outside end" },
        items: [] // populated by setOrientation()
    });
    public setOrientation(orientation: string) {
        const isHorizontal = String(orientation) === "Horizontal";
        const items = isHorizontal ? this.horizontalItems : this.verticalItems;
        this.labelPosition.items = items;

        // Coerce current value if not valid for this orientation
        const current = (this.labelPosition.value as any)?.value ?? this.labelPosition.value;
        if (!items.some(i => i.value === current)) {
            this.labelPosition.value = { value: "Outside end", displayName: "Outside end" };
        }

        // If you later re-enable per-type dropdowns, also set their items here
        // this.labelPositionTotal.items = items; ...
    }
    slices = [
        this.useDefaultLabelPositioning,
        this.labelPosition,
        // this.labelPositionTotal,
        // this.labelPositionFavourable,
        // this.labelPositionAdverse,
        // this.labelPositionOther
    ];
}
export class LabelsCompositeCard extends formattingSettings.CompositeCard {
    uid: string = "labelsCompositeCard";
    name: string = "LabelsFormatting";
    displayName: string = "Labels";

    visibilityCard = new LabelsVisibilityCard();
    fontCard = new LabelsFontCard();
    positionCard = new LabelsPositionCard();

    // cards = [
    //     this.visibilityCard,
    //     this.fontCard,
    //     this.positionCard
    // ];
    topLevelToggle: formattingSettings.ToggleSwitch = this.visibilityCard.show;
    groups: formattingSettings.Group[] = [
        {
            name: "labelsVisibility",
            displayName: "Visibility",
            slices: [...this.visibilityCard.slices]
        },
        {
            name: "labelsFont",
            displayName: "Font",
            slices: [...this.fontCard.slices]
        },
        {
            name: "labelsPosition",
            displayName: "Position",
            slices: [...this.positionCard.slices]
        }
    ];
}
export class VisualFormattingModel extends formattingSettings.Model {
    // chartOptionsGeneralCard = new ChartOptionsGeneralCard();
    // chartOptionsDataControlCard = new ChartOptionsDataControlCard();
    chartOptionsCompositeCard = new ChartOptionsCompositeCard();
    definePillarsCard = new DefinePillarsCard();
    marginsCard = new MarginsCard();
    barColorCard = new BarColorCard();
    //     legendVisibilityCard = new LegendVisibilityCard();
    // legendTitleCard = new LegendTitleCard();
    // legendFontCard = new LegendFontCard();
    // legendLabelsCard = new LegendLabelsCard();
    legendCompositeCard = new LegendCompositeCard();
    //  xAxisValuesCard = new XAxisValuesCard();
    //     xAxisTitleCard = new XAxisTitleCard();
    //     xAxisLayoutCard = new XAxisLayoutCard();
    xAxisCompositeCard = new XAxisCompositeCard();
    // yAxisValuesCard = new YAxisValuesCard();
    // yAxisTitleCard = new YAxisTitleCard();
    // yAxisLayoutCard = new YAxisLayoutCard();
    yAxisCompositeCard = new YAxisCompositeCard();
    // labelsVisibilityCard = new LabelsVisibilityCard();
    // labelsFontCard = new LabelsFontCard();
    // labelsPositionCard = new LabelsPositionCard();
    labelsCompositeCard = new LabelsCompositeCard();

    cards = [
        // this.chartOptionsGeneralCard,
        // this.chartOptionsDataControlCard,
        this.chartOptionsCompositeCard,
        this.definePillarsCard,
        this.marginsCard,
        //         this.legendVisibilityCard,
        // this.legendTitleCard,
        // this.legendFontCard,
        // this.legendLabelsCard,
        this.legendCompositeCard,
        this.barColorCard,
        // this.xAxisValuesCard,
        // this.xAxisTitleCard,
        // this.xAxisLayoutCard,
        this.xAxisCompositeCard,
        // this.yAxisValuesCard,
        // this.yAxisTitleCard,
        // this.yAxisLayoutCard,
        this.yAxisCompositeCard,
        // this.labelsVisibilityCard,
        // this.labelsFontCard,
        // this.labelsPositionCard
        this.labelsCompositeCard

    ];
}