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
import * as d3 from "d3";
import "core-js/stable";
import "./../style/visual.less";
import "regenerator-runtime/runtime";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";

import { Card } from "./Card";
import { visualTransform } from "./model/visualTransform";
import { ICardViewModel } from "./model/ViewModel";
import { AdditiionalColor } from "./settings";
export type Selection = d3.Selection<any, any, any, any>;

export class CardKPI implements IVisual {
  private card: Card;
  private host: IVisualHost;
  private model: ICardViewModel;
  private isLandingPageOn: boolean;
  private events: IVisualEventService;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.events = options.host.eventService;
    this.card = new Card(options);
  }

  public update(options: VisualUpdateOptions) {
    this.events.renderingStarted(options);
    this.model = visualTransform(options, this.host);
    this.card.setModel(this.model);
    this.card.updateViewport(options.viewport);
    this.card.createCardContainer();
    this.card.draw();
    this.card.createTooltip();
    this.handleLandingPage(options);
    this.events.renderingFinished(options);
  }

  private handleLandingPage(options: VisualUpdateOptions) {
    if (!options.dataViews || !options.dataViews[0].categorical) {
      // if (!this.isLandingPageOn) {
      this.isLandingPageOn = true;
      this.card.createLandingPage();
      //   }
      // } else {
      //   this.isLandingPageOn = false;
      //   this.card.removeLandingPage();
    } else {
      if (this.isLandingPageOn) {
        this.card.removeLandingPage();
        this.isLandingPageOn = false;
      }
    }
  }

  // eslint-disable-next-line max-lines-per-function
  public getFormattingModel(): powerbi.visuals.FormattingModel {
    const settings = this.model.settings;

    console.log(settings.additionalFormat);

    const grid: powerbi.visuals.FormattingCard = {
      description: "Grid Description",
      displayName: "Grid",
      uid: "grid",
      groups: [],
      revertToDefaultDescriptors: [
        {
          objectName: "grid",
          propertyName: "percentageWidth",
        },
      ],
    };

    const mainMeasureValue: powerbi.visuals.FormattingGroup = {
      displayName: "Main measure value",
      description:
        "Enable this field if you want to change the position of the Main Measure",
      uid: "mainMeasureValue",
      slices: [
        {
          uid: "mainMeasureValue_percentageWidth",
          control: {
            type: powerbi.visuals.FormattingComponent.Slider,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "percentageWidth",
              },
              value: settings.grid.percentageWidth,
              options: {
                minValue: {
                  type: powerbi.visuals.ValidatorType.Min,
                  value: 10,
                },
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 90,
                },
              },
            },
          },
        },
        // {
        //   uid: "mainMeasureValue_wireframe",
        //   control: {
        //     type: powerbi.visuals.FormattingComponent.Dropdown,
        //     properties: {
        //       descriptor: {
        //         objectName: "grid",
        //         propertyName: "wireframe",
        //       },
        //       value: settings.grid.wireframe,
        //     },
        //   },
        // },
      ],
    };
    const mainMeasureName: powerbi.visuals.FormattingGroup = {
      displayName: "Main measure name",
      uid: "grid_category",
      topLevelToggle: {
        uid: "grid_category_show",
        suppressDisplayName: true,
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "grid",
              propertyName: "showMeasureName",
            },
            value: settings.grid.showMeasureName,
          },
        },
      },
      slices: [
        {
          uid: "grid_category_labelAsMeasurename",
          control: {
            type: powerbi.visuals.FormattingComponent.ToggleSwitch,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "labelAsMeasurename",
              },
              value: settings.grid.labelAsMeasurename,
            },
          },
        },
        {
          uid: "grid_category_position",
          control: {
            type: powerbi.visuals.FormattingComponent.Dropdown,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "position",
              },
              value: settings.grid.position,
            },
          },
        },
      ],
    };
    const category: powerbi.visuals.FormattingGroup = {
      displayName: "Category",
      description:
        "Enable this field if you want to change the position of the Categories.",
      uid: "grid_category1",
      slices: [
        {
          uid: "grid_category_cardsPerRow",
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "cardsPerRow",
              },
              value: settings.grid.cardsPerRow,
              options: {
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 15,
                },
              },
            },
          },
        },
        {
          uid: "grid_category_cardsMargin",
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "cardsMargin",
              },
              value: settings.grid.cardsMargin,
              options: {
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 100,
                },
              },
            },
          },
        },
      ],
    };
    const additionalMeasures: powerbi.visuals.FormattingGroup = {
      displayName: "Additional measures",
      description:
        "Еnable this field if you want to change the position of Additional Measures.",
      uid: "grid_additionalMeasures",
      slices: [
        {
          uid: "grid_category_layout_type",
          control: {
            type: powerbi.visuals.FormattingComponent.Dropdown,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "layoutType",
              },
              value: settings.grid.layoutType,
            },
          },
        },
      ],
    };

    grid.groups.push(mainMeasureValue);
    grid.groups.push(mainMeasureName);
    grid.groups.push(category);
    grid.groups.push(additionalMeasures);

    const alignment: powerbi.visuals.FormattingCard = {
      description: "Alignment Description",
      displayName: "Alignment",
      uid: "alignment",
      groups: [],
      revertToDefaultDescriptors: [],
    };

    // const alignment_all: powerbi.visuals.FormattingGroup = {
    //   displayName: "All",
    //   description: "Set alignment for all elements.",
    //   uid: "alignment_all",
    //   slices: [
    //     {
    //       uid: "alignment_vertical_alignment",
    //       disabled: settings.alignment.show_additional_vertical,
    //       control: {
    //         type: powerbi.visuals.FormattingComponent.AlignmentGroup,
    //         properties: {
    //           descriptor: {
    //             objectName: "alignment",
    //             propertyName: "vertical",
    //           },
    //           mode: powerbi.visuals.AlignmentGroupMode.Vertical,
    //           value: settings.alignment.vertical,
    //         },
    //       },
    //     },
    //     {
    //       uid: "alignment_horizontal_alignment",
    //       disabled: settings.alignment.show_additional_horizontal,
    //       control: {
    //         type: powerbi.visuals.FormattingComponent.AlignmentGroup,
    //         properties: {
    //           descriptor: {
    //             objectName: "alignment",
    //             propertyName: "horizontal",
    //           },
    //           mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
    //           value: settings.alignment.horizontal,
    //         },
    //       },
    //     },
    //   ],
    // };

    const alignment_additional_vertical: powerbi.visuals.FormattingGroup = {
      displayName: "Vertical alignment",
      description:
        "Enable this field if you want to change the vertical position of the element.",
      uid: "alignment_additional_vertical",
      topLevelToggle: {
        uid: "alignment_additional_vertical_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "alignment",
              propertyName: "show_additional_vertical",
            },
            value: settings.alignment.show_additional_vertical,
          },
        },
        suppressDisplayName: true,
      },
      slices: [
        {
          uid: "alignment_additional_vertical_main_measure",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "verticalMainMeasure",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Vertical,
              value: settings.alignment.verticalMainMeasure,
            },
          },
        },
        {
          uid: "alignment_additional_vertical_category",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "verticalCategory",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Vertical,
              value: settings.alignment.verticalCategory,
            },
          },
        },
        {
          uid: "alignment_additional_vertical_additional_measure",
          displayName:
            settings.grid.layoutType == "horizontal"
              ? "Additional measures name and value"
              : "Additional measures",
          description:
            settings.grid.layoutType == "horizontal"
              ? "Additional Measures section (name and values)."
              : "Additional Measures",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "verticalAdditionalMeasure",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Vertical,
              value: settings.alignment.verticalAdditionalMeasure,
            },
          },
        },
      ],
    };

    if (settings.grid.layoutType == "vertical") {
      alignment_additional_vertical.slices.push({
        uid: "alignment_additional_vertical_additional_measure_name",
        control: {
          type: powerbi.visuals.FormattingComponent.Dropdown,
          properties: {
            descriptor: {
              objectName: "alignment",
              propertyName: "verticalAdditionalMeasureName",
            },
            value: settings.alignment.verticalAdditionalMeasureName,
          },
        },
      });
    }

    const alignment_additional_horizontal: powerbi.visuals.FormattingGroup = {
      displayName: "Horizontal alignment",
      description:
        "Enable this field if you want to change the horizontal position of the element.",
      uid: "alignment_additional_horizontal",
      topLevelToggle: {
        uid: "alignment_additional_horizontal_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "alignment",
              propertyName: "show_additional_horizontal",
            },
            value: settings.alignment.show_additional_horizontal,
          },
        },
        suppressDisplayName: true,
      },
      slices: [
        {
          uid: "alignment_additional_horizontal_main_measure",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "horizontalMainMeasure",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
              value: settings.alignment.horizontalMainMeasure,
            },
          },
        },
        {
          uid: "alignment_additional_horizontal_category",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "horizontalCategory",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
              value: settings.alignment.horizontalCategory,
            },
          },
        },
        {
          uid: "alignment_additional_horizontal_additional_name",
          disabled: settings.grid.layoutType == "horizontal",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "horizontalAdditionalMeasureName",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
              value: settings.alignment.horizontalAdditionalMeasureName,
            },
          },
        },
        {
          uid: "alignment_additional_horizontal_additional_value",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "horizontalAdditionalMeasureValue",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
              value: settings.alignment.horizontalAdditionalMeasureValue,
            },
          },
        },
      ],
    };

    // alignment.groups.push(alignment_all);
    alignment.groups.push(alignment_additional_vertical);
    alignment.groups.push(alignment_additional_horizontal);

    const background: powerbi.visuals.FormattingCard = {
      description: "Background",
      displayName: "Background",
      uid: "background",
      groups: [],
      revertToDefaultDescriptors: [],
    };

    const background_layout: powerbi.visuals.FormattingGroup = {
      uid: "background_layout",
      displayName: "Layout",
      description: "Add layout background.",
      topLevelToggle: {
        uid: "background_layout_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "background",
              propertyName: "layoutShow",
            },
            value: settings.background.layoutShow,
          },
        },
        suppressDisplayName: true,
      },
      slices: [
        {
          uid: "background_layout_color",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "background",
                propertyName: "backFill",
                instanceKind: VisualEnumerationInstanceKinds.ConstantOrRule,
              },
              value: { value: settings.background.backFill },
            },
          },
        },
        {
          uid: "background_layout_transparency",
          control: {
            type: powerbi.visuals.FormattingComponent.Slider,
            properties: {
              descriptor: {
                objectName: "background",
                propertyName: "transparency",
              },
              value: settings.background.transparency,
            },
          },
        },
      ],
    };

    const background_border: powerbi.visuals.FormattingGroup = {
      uid: "background_border",
      displayName: "Border",
      description: "Add a border to the card.",
      topLevelToggle: {
        uid: "background_border_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "background",
              propertyName: "borderShow",
            },
            value: settings.background.borderShow,
          },
        },
        suppressDisplayName: true,
      },
      slices: [
        {
          uid: "background_border_color",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "background",
                propertyName: "borderFill",
                instanceKind: VisualEnumerationInstanceKinds.ConstantOrRule,
              },
              value: { value: settings.background.borderFill },
            },
          },
        },
        {
          uid: "background_border_borderWeight",
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "background",
                propertyName: "borderWeight",
              },
              value: settings.background.borderWeight,
              options: {
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 30,
                },
              },
            },
          },
        },
        {
          uid: "background_border_roundEdges",
          control: {
            type: powerbi.visuals.FormattingComponent.Slider,
            properties: {
              descriptor: {
                objectName: "background",
                propertyName: "roundEdges",
              },
              value: settings.background.roundEdges,
              options: {
                minValue: {
                  type: powerbi.visuals.ValidatorType.Min,
                  value: 1,
                },
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 30,
                },
              },
            },
          },
        },
      ],
    };

    background.groups.push(background_layout);
    background.groups.push(background_border);

    const font: powerbi.visuals.FormattingCard = {
      description: "Font",
      displayName: "Font",
      uid: "font",
      groups: [],
      revertToDefaultDescriptors: [],
    };

    const font_all: powerbi.visuals.FormattingGroup = {
      uid: "font_all",
      displayName: "All",
      disabled: settings.font.additionalShow,
      slices: [
        {
          uid: "font_all_font",
          displayName: "Font family",
          description: "Specify the font family",
          control: {
            type: powerbi.visuals.FormattingComponent.FontControl,
            properties: {
              fontFamily: {
                descriptor: {
                  objectName: "font",
                  propertyName: "fontFamily",
                },
                value: settings.font.fontFamily,
              },
              fontSize: {
                descriptor: {
                  objectName: "font",
                  propertyName: "textSize",
                },
                value: settings.font.textSize,
              },
              bold: {
                descriptor: {
                  objectName: "font",
                  propertyName: "isBold",
                },
                value: settings.font.isBold,
              },
              italic: {
                descriptor: {
                  objectName: "font",
                  propertyName: "isItalic",
                },
                value: settings.font.isItalic,
              },
              underline: {
                descriptor: {
                  objectName: "font",
                  propertyName: "isUnderline",
                },
                value: settings.font.isUnderline,
              },
            },
          },
        },
        {
          uid: "font_all_word_wrap",
          control: {
            type: powerbi.visuals.FormattingComponent.ToggleSwitch,
            properties: {
              descriptor: {
                objectName: "font",
                propertyName: "wordWrap_",
              },
              value: settings.font.wordWrap_,
            },
          },
        },
      ],
    };

    const font_additional: powerbi.visuals.FormattingGroup = {
      uid: "font_additional",
      displayName: "Additiional settings",
      topLevelToggle: {
        uid: "font_additional_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "font",
              propertyName: "additionalShow",
            },
            value: settings.font.additionalShow,
          },
        },
        suppressDisplayName: true,
      },
      slices: [
        {
          uid: "font_additional_font_category",
          displayName: "Category",
          description: "Specify the font family",
          control: {
            type: powerbi.visuals.FormattingComponent.FontControl,
            properties: {
              fontFamily: {
                descriptor: {
                  objectName: "font",
                  propertyName: "categoryFontFamily",
                },
                value: settings.font.categoryFontFamily,
              },
              fontSize: {
                descriptor: {
                  objectName: "font",
                  propertyName: "categoryTextSize",
                },
                value: settings.font.categoryTextSize,
              },
              bold: {
                descriptor: {
                  objectName: "font",
                  propertyName: "categoryIsBold",
                },
                value: settings.font.categoryIsBold,
              },
              italic: {
                descriptor: {
                  objectName: "font",
                  propertyName: "categoryIsItalic",
                },
                value: settings.font.categoryIsItalic,
              },
              underline: {
                descriptor: {
                  objectName: "font",
                  propertyName: "categoryIsUnderline",
                },
                value: settings.font.categoryIsUnderline,
              },
            },
          },
        },
        {
          uid: "font_additional_category_word_wrap",
          control: {
            type: powerbi.visuals.FormattingComponent.ToggleSwitch,
            properties: {
              descriptor: {
                objectName: "font",
                propertyName: "categoryWordWrap_",
              },
              value: settings.font.categoryWordWrap_,
            },
          },
        },
        {
          uid: "font_additional_font_main",
          displayName: "Main measure value",
          description: "Specify the font family",
          control: {
            type: powerbi.visuals.FormattingComponent.FontControl,
            properties: {
              fontFamily: {
                descriptor: {
                  objectName: "font",
                  propertyName: "mainFontFamily",
                },
                value: settings.font.mainFontFamily,
              },
              fontSize: {
                descriptor: {
                  objectName: "font",
                  propertyName: "mainTextSize",
                },
                value: settings.font.mainTextSize,
              },
              bold: {
                descriptor: {
                  objectName: "font",
                  propertyName: "mainIsBold",
                },
                value: settings.font.mainIsBold,
              },
              italic: {
                descriptor: {
                  objectName: "font",
                  propertyName: "mainIsItalic",
                },
                value: settings.font.mainIsItalic,
              },
              underline: {
                descriptor: {
                  objectName: "font",
                  propertyName: "mainIsUnderline",
                },
                value: settings.font.mainIsUnderline,
              },
            },
          },
        },
        {
          uid: "font_additional_font_additional_name",
          displayName: "Additional measure names",
          description: "Specify the font family",
          control: {
            type: powerbi.visuals.FormattingComponent.FontControl,
            properties: {
              fontFamily: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalNameFontFamily",
                },
                value: settings.font.additionalNameFontFamily,
              },
              fontSize: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalNameTextSize",
                },
                value: settings.font.additionalNameTextSize,
              },
              bold: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalNameIsBold",
                },
                value: settings.font.additionalNameIsBold,
              },
              italic: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalNameIsItalic",
                },
                value: settings.font.additionalNameIsItalic,
              },
              underline: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalNameIsUnderline",
                },
                value: settings.font.additionalNameIsUnderline,
              },
            },
          },
        },
        {
          uid: "font_additional_name_word_wrap",
          control: {
            type: powerbi.visuals.FormattingComponent.ToggleSwitch,
            properties: {
              descriptor: {
                objectName: "font",
                propertyName: "additionalNameWordWrap_",
              },
              value: settings.font.additionalNameWordWrap_,
            },
          },
        },
        {
          uid: "font_additional_font_additional_value",
          displayName: "Additional measure values",
          description: "Specify the font family",
          control: {
            type: powerbi.visuals.FormattingComponent.FontControl,
            properties: {
              fontFamily: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalValueFontFamily",
                },
                value: settings.font.additionalValueFontFamily,
              },
              fontSize: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalValueTextSize",
                },
                value: settings.font.additionalValueTextSize,
              },
              bold: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalValueIsBold",
                },
                value: settings.font.additionalValueIsBold,
              },
              italic: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalValueIsItalic",
                },
                value: settings.font.additionalValueIsItalic,
              },
              underline: {
                descriptor: {
                  objectName: "font",
                  propertyName: "additionalValueIsUnderline",
                },
                value: settings.font.additionalValueIsUnderline,
              },
            },
          },
        },
      ],
    };

    font.groups.push(font_all);
    font.groups.push(font_additional);

    const format: powerbi.visuals.FormattingCard = {
      description: "Value format",
      displayName: "Value format",
      uid: "format",
      groups: [],
      revertToDefaultDescriptors: [],
    };

    const format_all: powerbi.visuals.FormattingGroup = {
      uid: "format_all",
      displayName: "All",
      description: "Set the values format for all elements.",
      disabled: settings.format.mainShow && settings.format.additionalShow,
      slices: [
        {
          uid: "format_all_unit",
          control: {
            type: powerbi.visuals.FormattingComponent.Dropdown,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "displayUnit",
              },
              value: settings.format.displayUnit,
            },
          },
        },
        {
          uid: "format_all_decimalPlaces",
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "decimalPlaces",
              },
              value: settings.format.decimalPlaces,
              options: {
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 10,
                },
              },
            },
          },
        },
        {
          uid: "format_all_suppress_blank",
          control: {
            type: powerbi.visuals.FormattingComponent.ToggleSwitch,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "suppressBlankAndNaN",
              },
              value: settings.format.suppressBlankAndNaN,
            },
          },
        },
        {
          uid: "format_all_blank_text",
          disabled: !settings.format.suppressBlankAndNaN,
          control: {
            type: powerbi.visuals.FormattingComponent.TextInput,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "blankAndNaNReplaceText",
              },
              placeholder: "0",
              value: settings.format.blankAndNaNReplaceText,
            },
          },
        },
        {
          uid: "format_all_component_type",
          control: {
            type: powerbi.visuals.FormattingComponent.Dropdown,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "mainComponentType",
              },
              value: settings.format.mainComponentType,
            },
          },
        },
        {
          uid: "format_all_invert_variance",
          control: {
            type: powerbi.visuals.FormattingComponent.ToggleSwitch,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "mainInvertVariance",
              },
              value: settings.format.mainInvertVariance,
            },
          },
        },
      ],
    };

    const format_main: powerbi.visuals.FormattingGroup = {
      uid: "format_main",
      displayName: "Main measure value",
      description:
        "Enable this field if you want to change the format of the Main Measure value.",
      topLevelToggle: {
        uid: "format_main_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "format",
              propertyName: "mainShow",
            },
            value: settings.format.mainShow,
          },
        },
        suppressDisplayName: true,
      },
      slices: [
        {
          uid: "format_main_unit",
          control: {
            type: powerbi.visuals.FormattingComponent.Dropdown,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "mainDisplayUnit",
              },
              value: settings.format.mainDisplayUnit,
            },
          },
        },
        {
          uid: "format_main_decimalPlaces",
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "mainDecimalPlaces",
              },
              value: settings.format.mainDecimalPlaces,
              options: {
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 10,
                },
              },
            },
          },
        },
        {
          uid: "format_main_suppress_blank",
          control: {
            type: powerbi.visuals.FormattingComponent.ToggleSwitch,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "mainSuppressBlankAndNaN",
              },
              value: settings.format.mainSuppressBlankAndNaN,
            },
          },
        },
        {
          uid: "format_main_blank_text",
          disabled: !settings.format.mainSuppressBlankAndNaN,
          control: {
            type: powerbi.visuals.FormattingComponent.TextInput,
            properties: {
              descriptor: {
                objectName: "format",
                propertyName: "mainBlankAndNaNReplaceText",
              },
              placeholder: "0",
              value: settings.format.mainBlankAndNaNReplaceText,
            },
          },
        }
      ],
    };
    const format_additional: powerbi.visuals.FormattingGroup = {
      uid: "format_additional",
      displayName: "Additional measure values",
      description:
        "Enable this field if you want to change the format of the Additional Measure values.",
      topLevelToggle: {
        uid: "format_additional_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "format",
              propertyName: "additionalShow",
            },
            value: settings.format.additionalShow,
          },
        },
        suppressDisplayName: true,
      },
      container: {
        uid: "format_additional_container",
        displayName: "Additional options",
        containerItems: [
          ...settings.additionalFormat.map(
            // eslint-disable-next-line max-lines-per-function
            (item): powerbi.visuals.FormattingContainerItem => {
              return {
                uid: `format_additional_${item.measureDisplayName}`,
                displayName: item.measureDisplayName,
                slices: [
                  {
                    uid: `format_additional_component_type_${item.measureDisplayName}`,
                    control: {
                      type: powerbi.visuals.FormattingComponent.Dropdown,
                      properties: {
                        descriptor: {
                          objectName: "format",
                          propertyName: "componentType",
                          selector: {
                            metadata: item.metadata,
                          },
                        },
                        value: item.componentType,
                      },
                    },
                  },
                  {
                    uid: `format_additional_invert_variance_${item.measureDisplayName}`,
                    control: {
                      type: powerbi.visuals.FormattingComponent.ToggleSwitch,
                      properties: {
                        descriptor: {
                          objectName: "format",
                          propertyName: "invertVariance",
                          selector: {
                            metadata: item.metadata,
                          },
                        },
                        value: item.invertVariance,
                      },
                    },
                  },
                  {
                    uid: `format_additional_unit_${item.measureDisplayName}`,
                    control: {
                      type: powerbi.visuals.FormattingComponent.Dropdown,
                      properties: {
                        descriptor: {
                          objectName: "format",
                          propertyName: "displayUnit",
                          selector: {
                            metadata: item.metadata,
                          },
                        },
                        value: item.displayUnit,
                      },
                    },
                  },
                  {
                    uid: `format_additional_decimalPlaces_${item.measureDisplayName}`,
                    control: {
                      type: powerbi.visuals.FormattingComponent.NumUpDown,
                      properties: {
                        descriptor: {
                          objectName: "format",
                          propertyName: "decimalPlaces",
                          selector: {
                            metadata: item.metadata,
                          },
                        },
                        value: item.decimalPlaces,
                        options: {
                          maxValue: {
                            type: powerbi.visuals.ValidatorType.Max,
                            value: 10,
                          },
                        },
                      },
                    },
                  },
                  {
                    uid: `format_additional_suppress_blank_${item.measureDisplayName}`,
                    control: {
                      type: powerbi.visuals.FormattingComponent.ToggleSwitch,
                      properties: {
                        descriptor: {
                          objectName: "format",
                          propertyName: "suppressBlankAndNaN",
                          selector: {
                            metadata: item.metadata,
                          },
                        },
                        value: item.suppressBlankAndNaN,
                      },
                    },
                  },
                  {
                    uid: `format_additional_blank_text_${item.measureDisplayName}`,
                    disabled: !item.suppressBlankAndNaN,
                    control: {
                      type: powerbi.visuals.FormattingComponent.TextInput,
                      properties: {
                        descriptor: {
                          objectName: "format",
                          propertyName: "blankAndNaNReplaceText",
                        },
                        placeholder: "0",
                        value: item.blankAndNaNReplaceText,
                      },
                    },
                  },
                ],
              };
            },
          ),
        ],
      },
    };

    format.groups.push(format_all);
    format.groups.push(format_main);
    format.groups.push(format_additional);

    const color: powerbi.visuals.FormattingCard = {
      description: "Color",
      displayName: "Color",
      uid: "color",
      groups: [],
      revertToDefaultDescriptors: [],
    };

    const color_all: powerbi.visuals.FormattingGroup = {
      uid: "color_all",
      displayName: "All",
      description: "Set color for all elements.",
      slices: [
        {
          uid: "color_all_color",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "color",
                propertyName: "color",
              },
              value: { value: settings.color.color },
            },
          },
        },
        {
          uid: "color_all_category",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "color",
                propertyName: "categoryColor",
              },
              value: { value: settings.color.categoryColor },
            },
          },
        },
        {
          uid: "color_all_additional",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "color",
                propertyName: "additionalCategoryColor",
              },
              value: { value: settings.color.additionalCategoryColor },
            },
          },
        },
      ],
    };
    const color_main: powerbi.visuals.FormattingGroup = {
      uid: "color_main",
      displayName: "Main measure value",
      description: "Set Color for Main Measure",
      topLevelToggle: {
        uid: "color_main_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "color",
              propertyName: "mainShow",
            },
            value: settings.color.mainShow,
          },
        },
        suppressDisplayName: true,
      },
      slices: [
        {
          uid: "color_main_color",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "color",
                propertyName: "mainColor",
                instanceKind: VisualEnumerationInstanceKinds.ConstantOrRule,
              },
              value: { value: settings.color.mainColor },
            },
          },
        },
      ],
    };
    const color_additional: powerbi.visuals.FormattingGroup = {
      uid: "color_additional",
      displayName: "Additional measure values",
      description: "Additional measure values",
      topLevelToggle: {
        uid: "color_additional_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "color",
              propertyName: "additionalShow",
            },
            value: settings.color.additionalShow,
          },
        },
        suppressDisplayName: true,
      },
      container: {
        uid: "color_additional_container",
        displayName: "Additional options",
        containerItems: [
          ...settings.additionalColor.map(
            // tslint:disable-next-line: max-func-body-length
            (item, index): powerbi.visuals.FormattingContainerItem => {
              const list: powerbi.visuals.FormattingContainerItem = {
                uid: `color_additional_${item.measureDisplayName}`,
                displayName: item.measureDisplayName,
                slices: [
                  {
                    uid: `color_additional_unmatched_color_${item.measureDisplayName}`,
                    control: {
                      type: powerbi.visuals.FormattingComponent.ColorPicker,
                      properties: {
                        descriptor: {
                          objectName: "color",
                          propertyName: "unmatchedColor",
                          instanceKind: !item.conditionFormatting
                            ? VisualEnumerationInstanceKinds.ConstantOrRule
                            : VisualEnumerationInstanceKinds.Constant,
                          selector: {
                            metadata: item.metadata,
                          },
                        },
                        value: { value: item.unmatchedColor.solid.color },
                      },
                    },
                  },
                  {
                    uid: `color_additional_condition_formatting_${item.measureDisplayName}`,
                    control: {
                      type: powerbi.visuals.FormattingComponent.ToggleSwitch,
                      properties: {
                        descriptor: {
                          objectName: "color",
                          propertyName: "conditionFormatting",
                          selector: {
                            metadata: item.metadata,
                          },
                        },
                        value: item.conditionFormatting,
                      },
                    },
                  },
                ],
              };

              if (item.conditionFormatting) {
                list.slices.push(
                  {
                    uid: `color_additional_component_type_${item.measureDisplayName}`,
                    control: {
                      type: powerbi.visuals.FormattingComponent.Dropdown,
                      properties: {
                        descriptor: {
                          objectName: "color",
                          propertyName: "componentType",
                          selector: {
                            metadata: item.metadata,
                          },
                        },
                        value: item.componentType,
                      },
                    },
                  },
                  {
                    uid: `color_additional_invert_variance_${item.measureDisplayName}`,
                    control: {
                      type: powerbi.visuals.FormattingComponent.ToggleSwitch,
                      properties: {
                        descriptor: {
                          objectName: "color",
                          propertyName: "invertVariance",
                          selector: {
                            metadata: item.metadata,
                          },
                        },
                        value: item.invertVariance,
                      },
                    },
                  },
                );
                this.addConditionColor(list, item, 1);
                this.addConditionColor(list, item, 2);
                this.addConditionColor(list, item, 3);
              }
              return list;
            },
          ),
        ],
      },
    };

    color.groups.push(color_all);
    color.groups.push(color_main);
    color.groups.push(color_additional);

    const bullet: powerbi.visuals.FormattingCard = {
      description: "Bullet chart",
      displayName: "Bullet chart",
      uid: "bullet",
      groups: [],
      revertToDefaultDescriptors: [],
      topLevelToggle: {
        uid: "bullet_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "bulletChart",
              propertyName: "show",
            },
            value: settings.bulletChart.show,
          },
        },
        suppressDisplayName: true,
      },
    };

    const bullet_colors: powerbi.visuals.FormattingGroup = {
      uid: "bullet_colors",
      displayName: "Data colors",
      description: "Set color for bullet chart.",
      slices: [
        {
          uid: "bullet_color_main",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "bulletChart",
                propertyName: "mainColor",
              },
              value: { value: settings.bulletChart.mainColor },
            },
          },
        },
        {
          uid: "bullet_color_target",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "bulletChart",
                propertyName: "targetColor",
              },
              value: { value: settings.bulletChart.targetColor },
            },
          },
        },
      ],
    };
    const bullet_shape: powerbi.visuals.FormattingGroup = {
      uid: "bullet_shape",
      displayName: "Bullet shape",
      description: "Add shape.",
      topLevelToggle: {
        uid: "bullet_shape_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "bulletChart",
              propertyName: "borderShow",
            },
            value: settings.bulletChart.borderShow,
          },
        },
        suppressDisplayName: true,
      },
      slices: [
        {
          uid: "bullet_shape_color",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "bulletChart",
                propertyName: "borderFill",
                instanceKind: VisualEnumerationInstanceKinds.ConstantOrRule,
              },
              value: { value: settings.bulletChart.borderFill },
            },
          },
        },
        {
          uid: "bullet_shape_borderWeight",
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "bulletChart",
                propertyName: "borderWeight",
              },
              value: settings.bulletChart.borderWeight,
              options: {
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 30,
                },
              },
            },
          },
        },
        {
          uid: "bullet_shape_roundEdges",
          control: {
            type: powerbi.visuals.FormattingComponent.Slider,
            properties: {
              descriptor: {
                objectName: "bulletChart",
                propertyName: "roundEdges",
              },
              value: settings.bulletChart.roundEdges,
              options: {
                minValue: {
                  type: powerbi.visuals.ValidatorType.Min,
                  value: 0,
                },
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 30,
                },
              },
            },
          },
        },
      ],
    };
    const bullet_target_line: powerbi.visuals.FormattingGroup = {
      uid: "bullet_target_line",
      displayName: "Target line",
      description: "Target line",
      topLevelToggle: {
        uid: "bullet_target_line_show",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: {
              objectName: "bulletChart",
              propertyName: "targetLineShow",
            },
            value: settings.bulletChart.targetLineShow,
          },
        },
        suppressDisplayName: true,
      },
      slices: [
        {
          uid: "bullet_target_line_color",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "bulletChart",
                propertyName: "targetLineColor",
                instanceKind: VisualEnumerationInstanceKinds.ConstantOrRule,
              },
              value: { value: settings.bulletChart.targetLineColor },
            },
          },
        },
        {
          uid: "bullet_target_line_weight",
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "bulletChart",
                propertyName: "targetLineWeight",
              },
              value: settings.bulletChart.targetLineWeight,
              options: {
                maxValue: {
                  type: powerbi.visuals.ValidatorType.Max,
                  value: 30,
                },
              },
            },
          },
        },
      ],
    };

    bullet.groups.push(bullet_colors);
    bullet.groups.push(bullet_shape);
    bullet.groups.push(bullet_target_line);

    return {
      cards: [grid, alignment, format, font, color, background, bullet],
    };
  }

  private addConditionColor(
    list: powerbi.visuals.FormattingContainerItem,
    item: AdditiionalColor,
    index: number,
  ) {
    list.slices.push({
      uid: `color_additional_condition${index}_${item.measureDisplayName}`,
      control: {
        type: powerbi.visuals.FormattingComponent.ToggleSwitch,
        properties: {
          descriptor: {
            objectName: "color",
            propertyName: `condition${index}`,
            selector: {
              metadata: item.metadata,
            },
          },
          value: item[`condition${index}`],
        },
      },
    });

    if (item[`condition${index}`]) {
      list.slices.push(
        {
          uid: `color_additional_operator${index}_${item.measureDisplayName}`,
          control: {
            type: powerbi.visuals.FormattingComponent.Dropdown,
            properties: {
              descriptor: {
                objectName: "color",
                propertyName: `comparisonOperator${index}`,
                selector: {
                  metadata: item.metadata,
                },
              },
              value: item[`comparisonOperator${index}`],
            },
          },
        },
        {
          uid: `color_additional_value${index}_${item.measureDisplayName}`,
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "color",
                propertyName: `value${index}`,
                selector: {
                  metadata: item.metadata,
                },
              },
              value: item[`value${index}`],
            },
          },
        },
        {
          uid: `color_additional_color${index}_${item.measureDisplayName}`,
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "color",
                propertyName: `assignColor${index}`,
                selector: {
                  metadata: item.metadata,
                },
              },
              value: { value: item[`assignColor${index}`].solid.color },
            },
          },
        },
      );
    }
  }
}
