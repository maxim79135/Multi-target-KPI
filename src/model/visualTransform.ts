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

import powerbi from "powerbi-visuals-api";
import {
  CardSettings,
  AdditiionalFormat,
  AdditiionalColor,
  Font,
} from "../settings";
import { IAdditionalMeasure, ICardViewModel, IDataGroup } from "./ViewModel";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { getValue } from "../utils/objectEnumerationUtility";
import { prepareMeasureText } from "../utils/prepareMeasureText";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;

import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataViewValueColumn = powerbi.DataViewValueColumn;
function parseSettings(dataView: DataView): CardSettings {
  return <CardSettings>CardSettings.parse(dataView);
}

export interface IFontProperties {
  fontFamily: string;
  textSize: number;
  isItalic: boolean;
  isBold: boolean;
  isUnderline?: boolean;
  wordWrap?: boolean;
  color?: string;
}

interface IFormatProperties {
  displayUnit: number;
  decimalPlaces: number;
  suppressBlankAndNaN: boolean;
  blankAndNaNReplaceText: string;
}

function getAdditionFormatValues(
  value: DataViewValueColumn,
  settings: CardSettings
): AdditiionalFormat {
  let format: AdditiionalFormat;
  format = settings.additionalFormat.find(
    (i) => i.metadata === value.source.queryName
  );
  if (!format) {
    format = new AdditiionalFormat();

    format.measureDisplayName = value.source.displayName;
    format.metadata = value.source.queryName;
    format.displayUnit = <number>(
      getValue(
        value.source.objects,
        "format",
        "displayUnit",
        format.displayUnit
      )
    );
    format.decimalPlaces = <number>(
      getValue(
        value.source.objects,
        "format",
        "decimalPlaces",
        format.decimalPlaces
      )
    );
    format.suppressBlankAndNaN = <boolean>(
      getValue(
        value.source.objects,
        "format",
        "suppressBlankAndNaN",
        format.suppressBlankAndNaN
      )
    );
    format.blankAndNaNReplaceText = <string>(
      getValue(
        value.source.objects,
        "format",
        "blankAndNaNReplaceText",
        format.blankAndNaNReplaceText
      )
    );
    format.componentType = <string>(
      getValue(
        value.source.objects,
        "format",
        "componentType",
        format.componentType
      )
    );
    format.invertVariance = <boolean>(
      getValue(
        value.source.objects,
        "format",
        "invertVariance",
        format.invertVariance
      )
    );
    settings.additionalFormat.push(format);
  }

  return format;
}

// eslint-disable-next-line max-lines-per-function
function getAdditionColor(
  value: DataViewValueColumn,
  settings: CardSettings
): AdditiionalColor {
  let color: AdditiionalColor;
  color = settings.additionalColor.find(
    (i) => i.metadata === value.source.queryName
  );
  if (!color) {
    color = new AdditiionalColor();

    color.measureDisplayName = value.source.displayName;
    color.metadata = value.source.queryName;
    color.unmatchedColor = getValue(
      value.source.objects,
      "color",
      "unmatchedColor",
      color.unmatchedColor
    );
    color.conditionFormatting = getValue(
      value.source.objects,
      "color",
      "conditionFormatting",
      color.conditionFormatting
    );
    color.componentType = getValue(
      value.source.objects,
      "color",
      "componentType",
      color.componentType
    );
    color.invertVariance = getValue(
      value.source.objects,
      "color",
      "invertVariance",
      color.invertVariance
    );
    color.condition1 = getValue(
      value.source.objects,
      "color",
      "condition1",
      color.condition1
    );
    color.comparisonOperator1 = getValue(
      value.source.objects,
      "color",
      "comparisonOperator1",
      color.comparisonOperator1
    );
    color.value1 = getValue(
      value.source.objects,
      "color",
      "value1",
      color.value1
    );
    color.assignColor1 = getValue(
      value.source.objects,
      "color",
      "assignColor1",
      color.assignColor1
    );
    color.condition2 = getValue(
      value.source.objects,
      "color",
      "condition2",
      color.condition2
    );
    color.comparisonOperator2 = getValue(
      value.source.objects,
      "color",
      "comparisonOperator2",
      color.comparisonOperator2
    );
    color.value2 = getValue(
      value.source.objects,
      "color",
      "value2",
      color.value2
    );
    color.assignColor2 = getValue(
      value.source.objects,
      "color",
      "assignColor2",
      color.assignColor2
    );
    color.condition3 = getValue(
      value.source.objects,
      "color",
      "condition3",
      color.condition3
    );
    color.comparisonOperator3 = getValue(
      value.source.objects,
      "color",
      "comparisonOperator3",
      color.comparisonOperator3
    );
    color.value3 = getValue(
      value.source.objects,
      "color",
      "value3",
      color.value3
    );
    color.assignColor3 = getValue(
      value.source.objects,
      "color",
      "assignColor3",
      color.assignColor3
    );

    settings.additionalColor.push(color);
  }

  return color;
}

function calculateAdditionalValue(
  mainMeasureValue: number,
  additionalMeasureValue: number,
  componentType: string,
  invert: boolean
): number {
  let result: number = null;
  if (mainMeasureValue || additionalMeasureValue)
    switch (componentType) {
      case "measure": {
        result = mainMeasureValue;
        break;
      }
      case "changeOver": {
        if (!mainMeasureValue)
          result = invert ? additionalMeasureValue : -additionalMeasureValue;
        else if (!additionalMeasureValue)
          result = invert ? -mainMeasureValue : mainMeasureValue;
        else
          result = invert
            ? additionalMeasureValue - mainMeasureValue
            : mainMeasureValue - additionalMeasureValue;
        break;
      }
      case "percentageChangeOver": {
        if (!invert) {
          if (
            mainMeasureValue &&
            additionalMeasureValue &&
            additionalMeasureValue != 0
          )
            result = mainMeasureValue / additionalMeasureValue - 1;
        } else {
          if (
            mainMeasureValue &&
            additionalMeasureValue &&
            mainMeasureValue != 0
          )
            result = additionalMeasureValue / mainMeasureValue - 1;
        }
        break;
      }
      case "percentageOver": {
        if (!invert) {
          if (
            mainMeasureValue &&
            additionalMeasureValue &&
            additionalMeasureValue != 0
          )
            result = mainMeasureValue / additionalMeasureValue;
        } else {
          if (
            mainMeasureValue &&
            additionalMeasureValue &&
            mainMeasureValue != 0
          )
            result = additionalMeasureValue / mainMeasureValue;
        }
        break;
      }
    }
  return Number(Number(result).toFixed(4));
}

function comparisonValues(
  value1: number,
  value2: number,
  operator: string
): boolean {
  switch (operator) {
    case ">":
      return value1 > value2;
    case ">=":
      return value1 >= value2;
    case "<":
      return value1 < value2;
    case "<=":
      return value1 <= value2;
    case "=":
      return value1 == value2;
  }
}

function updateAdditionalMeasureColor(
  additionalSettings: AdditiionalColor,
  value: number,
  value2Text: string,
  comparisonOperator: string,
  conditionText: string,
  assignColorText: string
) {
  if (
    additionalSettings[conditionText] &&
    comparisonValues(value, additionalSettings[value2Text], comparisonOperator)
  ) {
    if (additionalSettings[assignColorText]["solid"])
      return additionalSettings[assignColorText]["solid"]["color"];
    else return additionalSettings[assignColorText];
  }
  return undefined;
}

// eslint-disable-next-line max-lines-per-function
export function visualTransform(
  options: VisualUpdateOptions,
  host: IVisualHost
): ICardViewModel {
  const dataViews: DataView[] = options.dataViews;
  const dataGroups: IDataGroup[] = [];
  const settings: CardSettings = parseSettings(dataViews[0]);
  if (
    dataViews &&
    dataViews[0] &&
    dataViews[0].categorical &&
    dataViews[0].categorical.values
  ) {
    const dataCategorical = dataViews[0].categorical;
    const category = dataCategorical.categories
      ? dataCategorical.categories[dataCategorical.categories.length - 1]
      : null;
    const categories = category ? category.values : [""];

    for (let i = 0; i < categories.length; i++) {
      const dataGroup: IDataGroup = {
        additionalMeasures: [],
        tooltipValues: [],
      };

      for (let ii = 0; ii < dataCategorical.values.length; ii++) {
        const dataValue = dataCategorical.values[ii];
        const value: any = dataValue.values[i];
        const valueType = dataValue.source.type;
        if (dataValue.source.roles["Main Measure"]) {
          let formatProperties: IFormatProperties = {
            displayUnit: settings.format.mainDisplayUnit,
            decimalPlaces: settings.format.mainDecimalPlaces,
            suppressBlankAndNaN: settings.format.mainSuppressBlankAndNaN,
            blankAndNaNReplaceText: settings.format.mainBlankAndNaNReplaceText,
          };
          if (!settings.format.mainShow) {
            formatProperties = {
              displayUnit: settings.format.displayUnit,
              decimalPlaces: settings.format.decimalPlaces,
              suppressBlankAndNaN: settings.format.suppressBlankAndNaN,
              blankAndNaNReplaceText: settings.format.blankAndNaNReplaceText,
            };
          }

          if (categories[i]) {
            if (settings.grid.labelAsMeasurename) {
              dataGroup.displayName = dataValue.source.displayName;
            } else {
              dataGroup.displayName = category
                ? categories[i].toString()
                : dataValue.source.displayName;
            }
          } else {
            if (category) dataGroup.displayName = "";
            else dataGroup.displayName = dataValue.source.displayName;
          }
          dataGroup.mainMeasureValue =
            valueType.numeric || valueType.integer ? value : null;
          dataGroup.mainMeasureDataLabel = prepareMeasureText(
            value,
            valueType,
            dataValue.objects
              ? <string>dataValue.objects[0]["general"]["formatString"]
              : valueFormatter.getFormatStringByColumn(dataValue.source),
            formatProperties.displayUnit,
            formatProperties.decimalPlaces,
            false,
            formatProperties.suppressBlankAndNaN,
            formatProperties.blankAndNaNReplaceText,
            host.locale
          );
          dataGroup.isPercentage =
            dataValue.source &&
            dataValue.source.format &&
            dataValue.source.format.indexOf("%") != -1;
        }
        if (dataValue.source.roles["additional"]) {
          const additionalMeasure: IAdditionalMeasure = {};
          const additionalFormatSettings = getAdditionFormatValues(
            dataValue,
            settings
          );
          const additionalColorSettings = getAdditionColor(dataValue, settings);
          additionalMeasure.displayName =
            additionalFormatSettings.measureDisplayName;
          additionalMeasure.measureValue =
            valueType.numeric || valueType.integer ? value : null;

          additionalMeasure.isPercentage =
            dataValue.source &&
            dataValue.source.format &&
            dataValue.source.format.indexOf("%") != -1;
          additionalMeasure.calculatedValue = calculateAdditionalValue(
            dataGroup.mainMeasureValue,
            additionalMeasure.measureValue,
            additionalFormatSettings.componentType,
            additionalFormatSettings.invertVariance
          );
          const additionalMeasureForColor = calculateAdditionalValue(
            dataGroup.mainMeasureValue,
            additionalMeasure.measureValue,
            additionalColorSettings.componentType,
            additionalColorSettings.invertVariance
          );
          if (!additionalColorSettings.conditionFormatting) {
            additionalMeasure.labelFill =
              additionalColorSettings.unmatchedColor.solid.color;
          }

          if (additionalColorSettings.conditionFormatting) {
            let color1, color2, color3: string;
            switch (additionalColorSettings.componentType) {
              case "measure":
                color1 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  value,
                  "value1",
                  additionalColorSettings.comparisonOperator1,
                  "condition1",
                  "assignColor1"
                );
                color2 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  value,
                  "value2",
                  additionalColorSettings.comparisonOperator2,
                  "condition2",
                  "assignColor2"
                );
                color3 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  value,
                  "value3",
                  additionalColorSettings.comparisonOperator3,
                  "condition3",
                  "assignColor3"
                );
                break;
              case "changeOver":
                color1 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  additionalMeasureForColor,
                  "value1",
                  additionalColorSettings.comparisonOperator1,
                  "condition1",
                  "assignColor1"
                );
                color2 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  additionalMeasureForColor,
                  "value2",
                  additionalColorSettings.comparisonOperator2,
                  "condition2",
                  "assignColor2"
                );
                color3 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  additionalMeasureForColor,
                  "value3",
                  additionalColorSettings.comparisonOperator3,
                  "condition3",
                  "assignColor3"
                );
                break;
              case "percentageChangeOver":
                color1 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  additionalMeasureForColor * 100,
                  "value1",
                  additionalColorSettings.comparisonOperator1,
                  "condition1",
                  "assignColor1"
                );
                color2 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  additionalMeasureForColor * 100,
                  "value2",
                  additionalColorSettings.comparisonOperator2,
                  "condition2",
                  "assignColor2"
                );
                color3 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  additionalMeasureForColor * 100,
                  "value3",
                  additionalColorSettings.comparisonOperator3,
                  "condition3",
                  "assignColor3"
                );
                break;
              case "percentageOver":
                color1 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  additionalMeasureForColor * 100,
                  "value1",
                  additionalColorSettings.comparisonOperator1,
                  "condition1",
                  "assignColor1"
                );
                color2 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  additionalMeasureForColor * 100,
                  "value2",
                  additionalColorSettings.comparisonOperator2,
                  "condition2",
                  "assignColor2"
                );
                color3 = updateAdditionalMeasureColor(
                  additionalColorSettings,
                  additionalMeasureForColor * 100,
                  "value3",
                  additionalColorSettings.comparisonOperator3,
                  "condition3",
                  "assignColor3"
                );
                break;
            }
            if (color1 != undefined) additionalMeasure.labelFill = color1;
            else if (color2 != undefined) additionalMeasure.labelFill = color2;
            else if (color3 != undefined) additionalMeasure.labelFill = color3;
          }

          if (!settings.color.additionalShow) {
            additionalMeasure.labelFill = settings.color.color;
          }

          let formatProperties: IFormatProperties = {
            displayUnit: additionalFormatSettings.displayUnit,
            decimalPlaces: additionalFormatSettings.decimalPlaces,
            suppressBlankAndNaN: additionalFormatSettings.suppressBlankAndNaN,
            blankAndNaNReplaceText:
              additionalFormatSettings.blankAndNaNReplaceText,
          };

          if (!settings.format.additionalShow) {
            formatProperties = {
              displayUnit: settings.format.displayUnit,
              decimalPlaces: settings.format.decimalPlaces,
              suppressBlankAndNaN: settings.format.suppressBlankAndNaN,
              blankAndNaNReplaceText: settings.format.blankAndNaNReplaceText,
            };
            additionalFormatSettings.componentType = settings.format.mainComponentType
            additionalFormatSettings.invertVariance = settings.format.mainInvertVariance
          }

          switch (additionalFormatSettings.componentType) {
            case "measure": {
              additionalMeasure.dataLabel = prepareMeasureText(
                value,
                valueType,
                dataValue.objects
                  ? <string>dataValue.objects[0]["general"]["formatString"]
                  : valueFormatter.getFormatStringByColumn(dataValue.source),
                formatProperties.displayUnit,
                formatProperties.decimalPlaces,
                false,
                formatProperties.suppressBlankAndNaN,
                formatProperties.blankAndNaNReplaceText,
                host.locale
              );
              break;
            }
            case "changeOver": {
              if (dataGroup.isPercentage && additionalMeasure.isPercentage) {
                additionalMeasure.dataLabel =
                  prepareMeasureText(
                    additionalMeasure.calculatedValue * 100,
                    { numeric: true },
                    "#,0.00",
                    1,
                    formatProperties.decimalPlaces,
                    true,
                    false,
                    "",
                    host.locale
                  ) + "ppt";
              } else {
                additionalMeasure.dataLabel = prepareMeasureText(
                  additionalMeasure.calculatedValue,
                  valueType,
                  dataValue.objects
                    ? <string>dataValue.objects[0]["general"]["formatString"]
                    : valueFormatter.getFormatStringByColumn(dataValue.source),
                  formatProperties.displayUnit,
                  formatProperties.decimalPlaces,
                  true,
                  formatProperties.suppressBlankAndNaN,
                  formatProperties.blankAndNaNReplaceText,
                  host.locale
                );
              }
              break;
            }
            case "percentageChangeOver": {
              additionalMeasure.dataLabel =
                prepareMeasureText(
                  additionalMeasure.calculatedValue * 100,
                  { numeric: true },
                  "#,0.00",
                  1,
                  formatProperties.decimalPlaces,
                  true,
                  false,
                  "",
                  host.locale
                ) + "%";
              break;
            }
            case "percentageOver": {
              additionalMeasure.dataLabel =
                prepareMeasureText(
                  additionalMeasure.calculatedValue * 100,
                  { numeric: true },
                  "#,0.00",
                  1,
                  formatProperties.decimalPlaces,
                  false,
                  false,
                  "",
                  host.locale
                ) + "%";
              break;
            }
          }

          dataGroup.additionalMeasures.push(additionalMeasure);
        }
        if (dataValue.source.roles["tooltips"]) {
          dataGroup.tooltipValues.push({
            displayName: dataValue.source.displayName,
            dataLabel: prepareMeasureText(
              value,
              valueType,
              dataValue.objects
                ? <string>dataValue.objects[0]["general"]["formatString"]
                : valueFormatter.getFormatStringByColumn(dataValue.source),
              1,
              0,
              false,
              false,
              "",
              "ru-RU"
            ),
          });
        }
      }

      // add selectionId
      if (category) {
        dataGroup.selectionId = host
          .createSelectionIdBuilder()
          .withCategory(category, i)
          .createSelectionId();
      } else {
        dataGroup.selectionId = host
          .createSelectionIdBuilder()
          .withMeasure(dataCategorical.values[0].source.queryName)
          .createSelectionId();
      }
      dataGroups.push(dataGroup);
    }
    // console.log(dataGroups);
  }

  // transform settings
  if (!settings.alignment.show_additional_horizontal) {
    settings.alignment.horizontalMainMeasure = settings.alignment.horizontal;
    settings.alignment.horizontalCategory = settings.alignment.horizontal;
    settings.alignment.horizontalAdditionalMeasureName =
      settings.alignment.horizontal;
    settings.alignment.horizontalAdditionalMeasureValue =
      settings.alignment.horizontal;
  }

  if (!settings.alignment.show_additional_vertical) {
    settings.alignment.verticalAdditionalMeasure = settings.alignment.vertical;
    settings.alignment.verticalMainMeasure = settings.alignment.vertical;
    settings.alignment.verticalCategory = settings.alignment.vertical;
  }

  if (!settings.font.additionalShow) {
    const fontSettings = settings.font;
    const allFontSettings = {
      fontFamily: fontSettings.fontFamily,
      textSize: fontSettings.textSize,
      isItalic: fontSettings.isItalic,
      isBold: fontSettings.isBold,
      isUnderline: fontSettings.isUnderline,
    };
    updateFontSetting(allFontSettings, settings.font, "main");
    updateFontSetting(
      allFontSettings,
      settings.font,
      "category",
      fontSettings.wordWrap_
    );
    updateFontSetting(
      allFontSettings,
      settings.font,
      "additionalName",
      fontSettings.wordWrap_
    );
    updateFontSetting(allFontSettings, settings.font, "additionalValue");
  }

  // console.log(settings);

  return { settings, dataGroups };
}

function updateFontSetting(
  allFontSettings: IFontProperties,
  fontSettings: Font,
  typeLabel: string,
  wordWrapSetting = null
) {
  switch (typeLabel) {
    case "main":
      fontSettings.mainFontFamily = allFontSettings.fontFamily;
      fontSettings.mainTextSize = allFontSettings.textSize;
      fontSettings.mainIsItalic = allFontSettings.isItalic;
      fontSettings.mainIsBold = allFontSettings.isBold;
      fontSettings.mainIsUnderline = allFontSettings.isUnderline;
      break;

    case "category":
      fontSettings.categoryFontFamily = allFontSettings.fontFamily;
      fontSettings.categoryTextSize = allFontSettings.textSize;
      fontSettings.categoryIsItalic = allFontSettings.isItalic;
      fontSettings.categoryIsBold = allFontSettings.isBold;
      fontSettings.categoryIsUnderline = allFontSettings.isUnderline;
      fontSettings.wordWrap_ = wordWrapSetting;
      break;

    case "additionalName":
      fontSettings.additionalNameFontFamily = allFontSettings.fontFamily;
      fontSettings.additionalNameTextSize = allFontSettings.textSize;
      fontSettings.additionalNameIsItalic = allFontSettings.isItalic;
      fontSettings.additionalNameIsBold = allFontSettings.isBold;
      fontSettings.additionalNameIsUnderline = allFontSettings.isUnderline;
      fontSettings.additionalNameWordWrap_ = wordWrapSetting;
      break;

    case "additionalValue":
      fontSettings.additionalValueFontFamily = allFontSettings.fontFamily;
      fontSettings.additionalValueTextSize = allFontSettings.textSize;
      fontSettings.additionalValueIsItalic = allFontSettings.isItalic;
      fontSettings.additionalValueIsBold = allFontSettings.isBold;
      fontSettings.additionalValueIsUnderline = allFontSettings.isUnderline;
      break;

    default:
      break;
  }
}
