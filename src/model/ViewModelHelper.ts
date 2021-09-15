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
import { CardSettings, AdditionalItem } from "../settings";
import { IAdditionalMeasure, ICardViewModel, IDataGroup } from "./ViewModel";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { getValue } from "../utils/objectEnumerationUtility";
import { prepareMeasureText } from "../utils/dataLabelUtility";
import DataView = powerbi.DataView;

import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import ValueTypeDescriptor = powerbi.ValueTypeDescriptor;
function parseSettings(dataView: DataView): CardSettings {
  return <CardSettings>CardSettings.parse(dataView);
}

function getAdditionalSettings(
  value: DataViewValueColumn,
  settings: CardSettings
): AdditionalItem {
  let additionalSetting: AdditionalItem;
  additionalSetting = settings.additionalItems.find(
    (i) => i.metadata === value.source.queryName
  );
  if (additionalSetting) return additionalSetting;
  else {
    additionalSetting = new AdditionalItem();
    additionalSetting.measureDisplayName = value.source.displayName;
    additionalSetting.metadata = value.source.queryName;
    additionalSetting.componentType = <string>(
      getValue(
        value.source.objects,
        "additional",
        "componentType",
        additionalSetting.componentType
      )
    );
    additionalSetting.textSize = <number>(
      getValue(
        value.source.objects,
        "additional",
        "textSize",
        additionalSetting.textSize
      )
    );
    additionalSetting.fontFamily = <string>(
      getValue(
        value.source.objects,
        "additional",
        "fontFamily",
        additionalSetting.fontFamily
      )
    );
    additionalSetting.displayUnit = <number>(
      getValue(
        value.source.objects,
        "additional",
        "displayUnit",
        additionalSetting.displayUnit
      )
    );
    additionalSetting.decimalPlaces = <number>(
      getValue(
        value.source.objects,
        "additional",
        "decimalPlaces",
        additionalSetting.decimalPlaces
      )
    );
    additionalSetting.invertVariance = <boolean>(
      getValue(
        value.source.objects,
        "additional",
        "invertVariance",
        additionalSetting.invertVariance
      )
    );
    additionalSetting.suppressBlankAndNaN = <boolean>(
      getValue(
        value.source.objects,
        "additional",
        "suppressBlankAndNaN",
        additionalSetting.suppressBlankAndNaN
      )
    );
    additionalSetting.blankAndNaNReplaceText = <string>(
      getValue(
        value.source.objects,
        "additional",
        "blankAndNaNReplaceText",
        additionalSetting.blankAndNaNReplaceText
      )
    );
    additionalSetting.isBold = <boolean>(
      getValue(
        value.source.objects,
        "additional",
        "isBold",
        additionalSetting.isBold
      )
    );
    additionalSetting.isItalic = <boolean>(
      getValue(
        value.source.objects,
        "additional",
        "isItalic",
        additionalSetting.isItalic
      )
    );
    additionalSetting.componentTypeForColor = <string>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "componentTypeForColor",
        additionalSetting.componentTypeForColor
      )
    );
    additionalSetting.unmatchedColor = getValue(
      value.source.objects,
      "additionalMeasureColors",
      "unmatchedColor",
      additionalSetting.unmatchedColor
    );
    if (additionalSetting.unmatchedColor["solid"])
      additionalSetting.unmatchedColor =
        additionalSetting.unmatchedColor["solid"]["color"];

    additionalSetting.conditionFormatting = <boolean>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "conditionFormatting",
        additionalSetting.conditionFormatting
      )
    );
    settings.additionalItems.push(additionalSetting);
    return additionalSetting;
  }
}

function getValueType(valueType: ValueTypeDescriptor): string {
  let result: string = "";
  if (valueType.numeric || valueType.integer) result = "numeric";
  if (valueType.dateTime) result = "dateTime";
  return result;
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
            ? mainMeasureValue - additionalMeasureValue
            : additionalMeasureValue - mainMeasureValue;
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
  return result;
}

export function visualTransform(
  options: VisualUpdateOptions,
  host: IVisualHost
): ICardViewModel {
  let dataViews: DataView[] = options.dataViews;
  let dataGroups: IDataGroup[] = [];
  let settings: CardSettings = parseSettings(dataViews[0]);
  if (
    dataViews &&
    dataViews[0] &&
    dataViews[0].categorical &&
    dataViews[0].categorical.values
  ) {
    let dataCategorical = dataViews[0].categorical;
    let category = dataCategorical.categories
      ? dataCategorical.categories[dataCategorical.categories.length - 1]
      : null;
    let categories = category ? category.values : [""];

    for (let i = 0; i < categories.length; i++) {
      let dataGroup: IDataGroup = { additionalMeasures: [] };

      for (let ii = 0; ii < dataCategorical.values.length; ii++) {
        let dataValue = dataCategorical.values[ii];
        let value: any = dataValue.values[i];
        let valueType = dataValue.source.type;
        if (dataValue.source.roles["Main Measure"]) {
          dataGroup.displayName = category
            ? categories[i].toString()
            : dataValue.source.displayName;
          dataGroup.mainMeasureValue =
            valueType.numeric || valueType.integer ? value : null;
          dataGroup.mainMeasureDataLabel = prepareMeasureText(
            value,
            getValueType(valueType),
            dataValue.source.format,
            settings.dataLabel.displayUnit,
            settings.dataLabel.decimalPlaces,
            false,
            settings.dataLabel.suppressBlankAndNaN,
            settings.dataLabel.blankAndNaNReplaceText,
            host.locale
          );
          dataGroup.isPercentage =
            dataValue.source &&
            dataValue.source.format &&
            dataValue.source.format.indexOf("%") != -1;
        }
        if (dataValue.source.roles["additional"]) {
          let additionalMeasure: IAdditionalMeasure = {};
          let additionalSettings = getAdditionalSettings(dataValue, settings);
          additionalMeasure.displayName = additionalSettings.measureDisplayName;
          additionalMeasure.measureValue =
            valueType.numeric || valueType.integer ? value : null;

          additionalMeasure.isPercentage =
            dataValue.source &&
            dataValue.source.format &&
            dataValue.source.format.indexOf("%") != -1;
          additionalMeasure.calculatedValue = calculateAdditionalValue(
            dataGroup.mainMeasureValue,
            additionalMeasure.measureValue,
            additionalSettings.componentType,
            additionalSettings.invertVariance
          );
          if (!additionalSettings.conditionFormatting) {
            additionalMeasure.labelFill = additionalSettings.unmatchedColor;
          }

          switch (additionalSettings.componentType) {
            case "measure": {
              additionalMeasure.dataLabel = prepareMeasureText(
                value,
                getValueType(valueType),
                dataValue.source.format,
                additionalSettings.displayUnit,
                additionalSettings.decimalPlaces,
                false,
                additionalSettings.suppressBlankAndNaN,
                additionalSettings.blankAndNaNReplaceText,
                host.locale
              );
              break;
            }
            case "changeOver": {
              if (dataGroup.isPercentage && additionalMeasure.isPercentage) {
                additionalMeasure.dataLabel =
                  prepareMeasureText(
                    additionalMeasure.calculatedValue * 100,
                    "numeric",
                    "#,0.00",
                    1,
                    additionalSettings.decimalPlaces,
                    true,
                    false,
                    "",
                    host.locale
                  ) + "ppt";
              } else {
                additionalMeasure.dataLabel = prepareMeasureText(
                  additionalMeasure.calculatedValue,
                  getValueType(valueType),
                  dataValue.source.format,
                  additionalSettings.displayUnit,
                  additionalSettings.decimalPlaces,
                  true,
                  additionalSettings.suppressBlankAndNaN,
                  additionalSettings.blankAndNaNReplaceText,
                  host.locale
                );
              }
              break;
            }
            case "percentageChangeOver": {
              additionalMeasure.dataLabel =
                prepareMeasureText(
                  additionalMeasure.calculatedValue * 100,
                  "numeric",
                  "#,0.00",
                  1,
                  additionalSettings.decimalPlaces,
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
                  "numeric",
                  "#,0.00",
                  1,
                  additionalSettings.decimalPlaces,
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
      }
      dataGroups.push(dataGroup);
    }
  }

  return { settings, dataGroups };
}
