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
    this.card.createLabels();
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

  // tslint:disable-next-line: max-func-body-length
  public getFormattingModel(): powerbi.visuals.FormattingModel {
    let settings = this.model.settings;

    let grid: powerbi.visuals.FormattingCard = {
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

    let mainMeasureValue: powerbi.visuals.FormattingGroup = {
      displayName: "Main measure value",
      uid: "mainMeasureValue",
      slices: [
        {
          uid: "mainMeasureValue_percentageWidth",
          displayName: "Percentage width",
          control: {
            type: powerbi.visuals.FormattingComponent.Slider,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "percentageWidth",
              },
              value: settings.grid.percentageWidth,
            },
          },
        },
        {
          uid: "mainMeasureValue_wireframe",
          displayName: "Wireframe",
          control: {
            type: powerbi.visuals.FormattingComponent.Dropdown,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "wireframe",
              },
              value: settings.grid.wireframe,
            },
          },
        },
      ],
    };
    let category: powerbi.visuals.FormattingGroup = {
      displayName: "Category",
      uid: "grid_category",
      slices: [
        {
          uid: "grid_category_labelAsMeasurename",
          displayName: "Show measure name instead of category",
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
          displayName: "Position main measure name",
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
    let category1: powerbi.visuals.FormattingGroup = {
      displayName: "Category",
      uid: "grid_category1",
      slices: [
        {
          uid: "grid_category_cardsPerRow",
          displayName: "Cards per row",
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "cardsPerRow",
              },
              value: settings.grid.cardsPerRow,
            },
          },
        },
        {
          uid: "grid_category_cardsMargin",
          displayName: "Space between cards",
          control: {
            type: powerbi.visuals.FormattingComponent.NumUpDown,
            properties: {
              descriptor: {
                objectName: "grid",
                propertyName: "cardsMargin",
              },
              value: settings.grid.cardsMargin,
            },
          },
        },
      ],
    };
    let additionalMeasures: powerbi.visuals.FormattingGroup = {
      displayName: "Additional measures",
      uid: "grid_additionalMeasures",
      slices: [
        {
          uid: "grid_category_layout_type",
          displayName: "Layout type",
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
    grid.groups.push(category);
    grid.groups.push(category1);
    grid.groups.push(additionalMeasures);

    let alignment: powerbi.visuals.FormattingCard = {
      description: "Alignment Description",
      displayName: "Alignment",
      uid: "alignment",
      groups: [],
      revertToDefaultDescriptors: [],
    };

    let alignment_all: powerbi.visuals.FormattingGroup = {
      displayName: "All",
      uid: "alignment_all",
      slices: [
        {
          uid: "alignment_vertical_alignment",
          displayName: "Vertical",
          disabled: settings.alignment.show_additional_vertical,
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "vertical",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Vertical,
              value: settings.alignment.vertical,
            },
          },
        },
        {
          uid: "alignment_horizontal_alignment",
          displayName: "Horizontal",
          disabled: settings.alignment.show_additional_horizontal,
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "horizontal",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
              value: settings.alignment.horizontal,
            },
          },
        },
      ],
    };

    let alignment_additional_vertical: powerbi.visuals.FormattingGroup = {
      displayName: "Vertical alignment",
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
          displayName: "Main measure value",
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
      ],
    };

    if (settings.grid.layoutType == "horizontal") {
      alignment_additional_vertical.slices.push({
        uid: "alignment_additional_vertical_additional_measures_name_value",
        displayName: "Additional measures name and value",
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
      });
    }

    let alignment_additional_horizontal: powerbi.visuals.FormattingGroup = {
      displayName: "Horizontal alignment",
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
          displayName: "Main measure name",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "horizontalMainMeasure",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Vertical,
              value: settings.alignment.horizontalMainMeasure,
            },
          },
        },
        {
          uid: "alignment_additional_horizontal_category",
          displayName: "Category",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "horizontalCategory",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Vertical,
              value: settings.alignment.horizontalCategory,
            },
          },
        },
        {
          uid: "alignment_additional_horizontal_additional_name",
          displayName: "Additional measure name",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "horizontalAdditionalMeasureName",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Vertical,
              value: settings.alignment.horizontalAdditionalMeasureName,
            },
          },
        },
        {
          uid: "alignment_additional_horizontal_additional_value",
          displayName: "Additional measure value",
          control: {
            type: powerbi.visuals.FormattingComponent.AlignmentGroup,
            properties: {
              descriptor: {
                objectName: "alignment",
                propertyName: "horizontalAdditionalMeasureValue",
              },
              mode: powerbi.visuals.AlignmentGroupMode.Vertical,
              value: settings.alignment.horizontalAdditionalMeasureValue,
            },
          },
        },
      ],
    };

    alignment.groups.push(alignment_all);
    alignment.groups.push(alignment_additional_vertical);
    alignment.groups.push(alignment_additional_horizontal);

    let background: powerbi.visuals.FormattingCard = {
      description: "Background",
      displayName: "Background",
      uid: "background",
      groups: [],
      revertToDefaultDescriptors: [],
    };

    let background_layout: powerbi.visuals.FormattingGroup = {
      uid: "background_layout",
      displayName: "Layout",
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

    let background_border: powerbi.visuals.FormattingGroup = {
      uid: "background_border",
      displayName: "Border",
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
            },
          },
        },
      ],
    };

    background.groups.push(background_layout);
    background.groups.push(background_border);

    let font: powerbi.visuals.FormattingCard = {
      description: "Font",
      displayName: "Font",
      uid: "font",
      groups: [],
      revertToDefaultDescriptors: [],
    };

    let font_all: powerbi.visuals.FormattingGroup = {
      uid: "font_all",
      displayName: "All",
      disabled: settings.font.additionalShow,
      slices: [
        {
          uid: "font_all_font",
          displayName: "Font family",
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
      ],
    };

    let font_additional: powerbi.visuals.FormattingGroup = {
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
          control: {
            type: powerbi.visuals.FormattingComponent.FontControl,
            properties: {
              fontFamily: {
                descriptor: {
                  objectName: "font",
                  propertyName: "categoryFontFamily",
                },
                value: settings.font.categoryfontFamily,
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
      ],
    };

    font.groups.push(font_all);
    font.groups.push(font_additional);

    let format: powerbi.visuals.FormattingCard = {
      description: "Value format",
      displayName: "Value format",
      uid: "format",
      groups: [],
      revertToDefaultDescriptors: [],
    };

    let format_all: powerbi.visuals.FormattingGroup = {
      uid: "format_all",
      displayName: "All",
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
      ],
    };

    if (settings.format.suppressBlankAndNaN) {
      format_all.slices.push({
        uid: "format_all_blank_text",
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
      });
    }
    let format_additional: powerbi.visuals.FormattingGroup = {
      uid: "format_additional",
      displayName: "Additional measure values",
      container: {
        uid: "format_additional_container",
        displayName: "Additional options",
        containerItems: [
          ...settings.additionalItems.map((item) => {
            let containerItem: powerbi.visuals.FormattingContainerItem = {
              uid: `format_additional_${item.measureDisplayName}`,
              displayName: item.measureDisplayName,
              slices: [
                {
                  uid: `format_additional_unit_${item.measureDisplayName}`,
                  control: {
                    type: powerbi.visuals.FormattingComponent.Dropdown,
                    properties: {
                      descriptor: {
                        objectName: "additional",
                        propertyName: "displayUnit",
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
                        objectName: "additional",
                        propertyName: "decimalPlaces",
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
                        objectName: "additional",
                        propertyName: "suppressBlankAndNaN",
                      },
                      value: item.suppressBlankAndNaN,
                    },
                  },
                },
              ],
            };
            return containerItem;
          }),
        ],
      },
    };

    format.groups.push(format_all);
    format.groups.push(format_additional);

    return {
      cards: [grid, alignment, format, font, background],
    };
  }

  // tslint:disable-next-line: max-func-body-length
  public enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
    var objectName = options.objectName;
    var objectEnumeration: VisualObjectInstance[] = [];
    let model = this.model;
    const enumerationObject: powerbi.VisualObjectInstanceEnumerationObject = {
      containers: [],
      instances: [],
    };
    switch (objectName) {
      case "categoryLabel":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            show: model.settings.categoryLabel.show,
            horizontalAlignment:
              model.settings.categoryLabel.horizontalAlignment,
            position: model.settings.categoryLabel.position,
            // paddingTop: model.settings.categoryLabel.paddingTop,
            // paddingSide: model.settings.categoryLabel.paddingSide,
            font: model.settings.categoryLabel.font,
          },
          // validValues: {
          //   paddingTop: {
          //     numberRange: {
          //       min: 0,
          //       max: 15,
          //     },
          //   },
          //   paddingSide: {
          //     numberRange: {
          //       min: 0,
          //       max: 15,
          //     },
          //   },
          // },
          selector: null,
        });
        if (model.settings.categoryLabel.font) {
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              color: model.settings.categoryLabel.color,
              textSize: model.settings.categoryLabel.textSize,
              fontFamily: model.settings.categoryLabel.fontFamily,
              wordWrap_: model.settings.categoryLabel.wordWrap_,
              isItalic: model.settings.categoryLabel.isItalic,
              isBold: model.settings.categoryLabel.isBold,
            },
            selector: null,
          });
        }
        break;

      case "dataLabel":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            alignment: model.settings.dataLabel.alignment,
          },
          selector: null,
        });
        if (model.settings.dataLabel.alignment) {
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              verticalAlignment: model.settings.dataLabel.verticalAlignment,
              horizontalAlignment: model.settings.dataLabel.horizontalAlignment,
            },
            selector: null,
          });

          // add dynamic paddings
          if (model.settings.dataLabel.verticalAlignment == "top") {
            objectEnumeration.push({
              objectName: objectName,
              properties: {
                paddingTop: model.settings.dataLabel.paddingTop,
              },
              validValues: {
                paddingTop: {
                  numberRange: {
                    min: 0,
                    max: 15,
                  },
                },
              },
              selector: null,
            });
          } else if (model.settings.dataLabel.verticalAlignment == "bottom") {
            objectEnumeration.push({
              objectName: objectName,
              properties: {
                paddingBottom: model.settings.dataLabel.paddingBottom,
              },
              validValues: {
                paddingBottom: {
                  numberRange: {
                    min: 0,
                    max: 15,
                  },
                },
              },
              selector: null,
            });
          }
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              paddingSide: model.settings.dataLabel.paddingSide,
            },
            validValues: {
              paddingSide: {
                numberRange: {
                  min: 0,
                  max: 15,
                },
              },
              paddintTop: {
                numberRange: {
                  min: 0,
                  max: 15,
                },
              },
            },
            selector: null,
          });
        }

        objectEnumeration.push({
          objectName: objectName,
          properties: {
            font: model.settings.dataLabel.font,
          },
          selector: null,
        });
        if (model.settings.dataLabel.font) {
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              fontFamily: model.settings.dataLabel.fontFamily,
              textSize: model.settings.dataLabel.textSize,
              color: model.settings.dataLabel.color,
              isItalic: model.settings.dataLabel.isItalic,
              isBold: model.settings.dataLabel.isBold,
              displayUnit: model.settings.dataLabel.displayUnit,
              decimalPlaces: model.settings.dataLabel.decimalPlaces,
              suppressBlankAndNaN: model.settings.dataLabel.suppressBlankAndNaN,
            },
            validValues: {
              decimalPlaces: {
                numberRange: {
                  min: 0,
                  max: 15,
                },
              },
            },
            propertyInstanceKind: {
              color: VisualEnumerationInstanceKinds.ConstantOrRule,
            },
            altConstantValueSelector: null,
            selector: dataViewWildcard.createDataViewWildcardSelector(
              dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
            ),
          });
          if (this.model.settings.dataLabel.suppressBlankAndNaN)
            objectEnumeration.push({
              objectName: objectName,
              properties: {
                blankAndNaNReplaceText:
                  this.model.settings.dataLabel.blankAndNaNReplaceText,
              },
              selector: null,
            });
        }
        break;

      case "background":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            show: model.settings.background1.show,
            layout: model.settings.background1.layout,
          },
          selector: null,
        });
        model.settings.background1.layout &&
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              percentageWidth: model.settings.background1.percentageWidth,
              backFill: model.settings.background.backFill,
              transparency: model.settings.background.transparency,
            },
            validValues: {
              percentageWidth: {
                numberRange: {
                  min: 10,
                  max: 90,
                },
              },
            },
            propertyInstanceKind: {
              backFill: VisualEnumerationInstanceKinds.ConstantOrRule,
            },
            altConstantValueSelector: null,
            selector: dataViewWildcard.createDataViewWildcardSelector(
              dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
            ),
          });
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            borderShow: model.settings.background.borderShow,
          },
          selector: null,
        });
        model.settings.background.borderShow &&
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              borderFill: model.settings.background1.borderFill,
              borderType: model.settings.background1.borderType,
              borderWeight: model.settings.background1.borderWeight,
            },
            validValues: {
              borderWeight: {
                numberRange: {
                  min: 1,
                  max: 30,
                },
              },
            },
            propertyInstanceKind: {
              backFill: VisualEnumerationInstanceKinds.ConstantOrRule,
            },
            altConstantValueSelector: null,
            selector: dataViewWildcard.createDataViewWildcardSelector(
              dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
            ),
          });
        break;

      case "category":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            cardsPerRow: model.settings.category.cardsPerRow,
            cardsMargin: model.settings.category.cardsMargin,
            labelAsMeasurename: model.settings.category.labelAsMeasurename,
            // spaceBeforeFirstComponent:
            //   model.settings.multiple.spaceBeforeFirstComponent,
          },
          validValues: {
            cardsPerRow: {
              numberRange: {
                min: 1,
                max: 15,
              },
            },
            cardsMargin: {
              numberRange: {
                min: 0,
                max: 100,
              },
            },
            spaceBeforeFirstComponent: {
              numberRange: {
                min: 0,
                max: 100,
              },
            },
          },
          selector: null,
        });
        break;

      case "additional":
        if (model.settings.additionalItems.length == 0) break;

        enumerationObject.instances.push({
          objectName,
          properties: {
            alignment: model.settings.additional.alignment,
          },
          selector: null,
        });

        if (model.settings.additional.alignment) {
          enumerationObject.instances.push({
            objectName,
            properties: {
              layoutType: model.settings.additional.layoutType,
              // paddingTop: model.settings.additional.paddingTop,
              // paddingBottom: model.settings.additional.paddingBottom,
              // paddingLeft: model.settings.additional.paddingLeft,
              // paddingRight: model.settings.additional.paddingRight,
              // wordWrap_: model.settings.additional.wordWrap_,
              // horizontalAlignment:
              //   model.settings.additional.horizontalAlignment,
            },
            validValues: {
              verticalPadding: {
                numberRange: {
                  min: 0,
                  max: 40,
                },
              },
              // paddingTop: {
              //   numberRange: {
              //     min: 0,
              //     max: 40,
              //   },
              // },
              // paddingBottom: {
              //   numberRange: {
              //     min: 0,
              //     max: 40,
              //   },
              // },
              // paddingLeft: {
              //   numberRange: {
              //     min: 0,
              //     max: 40,
              //   },
              // },
              // paddingRight: {
              //   numberRange: {
              //     min: 0,
              //     max: 40,
              //   },
              // },
            },
            selector: null,
          });
          if (model.settings.additional.layoutType == "vertical")
            enumerationObject.instances.push({
              objectName,
              properties: {
                // verticalTextAnchor:
                //   model.settings.additional.verticalTextAnchor,
                textAnchor: model.settings.additional.textAnchor,
                // percentageWidth: model.settings.additional.percentageWidth,
              },
              validValues: {
                percentageWidth: {
                  numberRange: {
                    min: 30,
                    max: 70,
                  },
                },
              },
              selector: null,
            });
          enumerationObject.instances.push({
            objectName,
            properties: {
              marginOfMeasure: model.settings.additional.marginOfMeasure,
            },
            validValues: {
              marginOfMeasure: {
                numberRange: {
                  min: 0,
                  max: 40,
                },
              },
            },
            selector: null,
          });
          enumerationObject.instances.push({
            objectName,
            properties: {
              showAdditionalOptions:
                model.settings.additional.showAdditionalOptions,
            },
            selector: null,
          });
        }

        enumerationObject.instances.push({
          objectName,
          properties: {
            font: model.settings.additional.font,
          },
          selector: null,
        });
        if (model.settings.additional.font) {
          enumerationObject.instances.push({
            objectName,
            properties: {
              textSize: model.settings.additional.textSize,
              fontFamily: model.settings.additional.fontFamily,
              isItalic: model.settings.additional.isItalic,
              isBold: model.settings.additional.isBold,
              backFill: model.settings.additional.backFill,
              transparency: model.settings.additional.transparency,
            },
            propertyInstanceKind: {
              backFill: VisualEnumerationInstanceKinds.ConstantOrRule,
            },
            selector: null,
          });
        }

        if (model.settings.additional.showAdditionalOptions) {
          for (let i = 0; i < model.settings.additionalItems.length; i++) {
            const displayName: string =
              model.settings.additionalItems[i].measureDisplayName;
            const containerIdx: number =
              enumerationObject.containers.push({ displayName }) - 1;
            enumerationObject.instances.push({
              containerIdx,
              objectName,
              properties: {
                componentType: model.settings.additionalItems[i].componentType,
                invertVariance:
                  model.settings.additionalItems[i].invertVariance,
                displayUnit: model.settings.additionalItems[i].displayUnit,
                decimalPlaces: model.settings.additionalItems[i].decimalPlaces,
                suppressBlankAndNaN:
                  model.settings.additionalItems[i].suppressBlankAndNaN,
                blankAndNaNReplaceText:
                  model.settings.additionalItems[i].blankAndNaNReplaceText,
              },
              validValues: {
                decimalPlaces: {
                  numberRange: {
                    min: 0,
                    max: 15,
                  },
                },
              },
              selector: {
                metadata: model.settings.additionalItems[i].metadata,
              },
            });
          }
        }
        return enumerationObject;

      case "additionalCategory":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            wordWrap_: model.settings.additionalCategory.wordWrap_,
            textSize: model.settings.additionalCategory.textSize,
            color: model.settings.additionalCategory.color,
            fontFamily: model.settings.additionalCategory.fontFamily,
            isItalic: model.settings.additionalCategory.isItalic,
            isBold: model.settings.additionalCategory.isBold,
          },
          propertyInstanceKind: {
            color: VisualEnumerationInstanceKinds.ConstantOrRule,
          },
          altConstantValueSelector: undefined,
          selector: dataViewWildcard.createDataViewWildcardSelector(
            dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
          ),
        });
        break;

      case "additionalMeasureColors":
        for (let i = 0; i < model.settings.additionalItems.length; i++) {
          const displayName: string =
            model.settings.additionalItems[i].measureDisplayName;
          const containerIdx: number =
            enumerationObject.containers.push({ displayName }) - 1;
          // let componentTypeForColor =
          //   model.settings.additionalItems[i].componentTypeForColor;

          enumerationObject.instances.push({
            containerIdx,
            objectName,
            properties: {
              unmatchedColor: model.settings.additionalItems[i].unmatchedColor,
              conditionFormatting:
                model.settings.additionalItems[i].conditionFormatting,
            },
            propertyInstanceKind: {
              unmatchedColor: VisualEnumerationInstanceKinds.ConstantOrRule,
            },
            selector: { metadata: model.settings.additionalItems[i].metadata },
          });
          if (model.settings.additionalItems[i].conditionFormatting) {
            enumerationObject.instances[i].properties["componentTypeForColor"] =
              model.settings.additionalItems[i].componentTypeForColor;
            enumerationObject.instances[i].properties[
              "invertVarianceForColor"
            ] = model.settings.additionalItems[i].invertVarianceForColor;
            enumerationObject.instances[i].properties["condition1"] =
              model.settings.additionalItems[i].condition1;
            if (model.settings.additionalItems[i].condition1) {
              enumerationObject.instances[i].properties["comparisonOperator1"] =
                model.settings.additionalItems[i].comparisonOperator1;
              enumerationObject.instances[i].properties["value1"] =
                model.settings.additionalItems[i].value1;
              enumerationObject.instances[i].properties["assignColor1"] =
                model.settings.additionalItems[i].assignColor1;
            }
            enumerationObject.instances[i].properties["condition2"] =
              model.settings.additionalItems[i].condition2;
            if (model.settings.additionalItems[i].condition2) {
              enumerationObject.instances[i].properties["comparisonOperator2"] =
                model.settings.additionalItems[i].comparisonOperator2;
              enumerationObject.instances[i].properties["value2"] =
                model.settings.additionalItems[i].value2;
              enumerationObject.instances[i].properties["assignColor2"] =
                model.settings.additionalItems[i].assignColor2;
            }
            enumerationObject.instances[i].properties["condition3"] =
              model.settings.additionalItems[i].condition3;
            if (model.settings.additionalItems[i].condition3) {
              enumerationObject.instances[i].properties["comparisonOperator3"] =
                model.settings.additionalItems[i].comparisonOperator3;
              enumerationObject.instances[i].properties["value3"] =
                model.settings.additionalItems[i].value3;
              enumerationObject.instances[i].properties["assignColor3"] =
                model.settings.additionalItems[i].assignColor3;
            }
          }
        }
        return enumerationObject;
    }

    return objectEnumeration;
  }
}
