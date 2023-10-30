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

export class Grid {
  public percentageWidth: number = 50;
  public wireframe: string = "top";
  public showMeasureName: boolean = true;
  public labelAsMeasurename: boolean = false;
  public position: string = "topCenter";
  public cardsPerRow: number = 5;
  public cardsMargin: number = 15;
  public layoutType: string = "vertical";
}

export class Alignment {
  public vertical: string = "middle";
  public horizontal: string = "center";
  public show_additional_vertical: boolean = true;
  public show_additional_horizontal: boolean = true;
  public verticalMainMeasure: string = "middle";
  public verticalAdditionalMeasure: string = "middle";
  public verticalAdditionalMeasureName: string = "left";
  public horizontalMainMeasure: string = "center";
  public horizontalAdditionalMeasureName: string = "left";
  public horizontalAdditionalMeasureValue: string = "right";
  public horizontalCategory: string = "center";
  public verticalCategory: string = "middle";
}

export class Background {
  public layoutShow: boolean = false;
  public backFill: string = "#ffffff";
  public transparency: number = 0;
  public borderShow: boolean = false;
  public borderFill: string = "#ffffff";
  public borderWeight: number = 1;
  public roundEdges: number = 0;
}

export class Font {
  public fontFamily: string =
    "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public wordWrap_: boolean = false;
  public textSize: number = 12;
  public isItalic: boolean = false;
  public isBold: boolean = false;
  public isUnderline: boolean = false;

  public additionalShow: boolean = true;
  public categoryFontFamily: string =
    "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public categoryWordWrap_: boolean = false;
  public categoryTextSize: number = 18;
  public categoryIsItalic: boolean = false;
  public categoryIsBold: boolean = false;
  public categoryIsUnderline: boolean = false;

  public mainFontFamily: string =
    "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public mainTextSize: number = 32;
  public mainIsItalic: boolean = false;
  public mainIsBold: boolean = false;
  public mainIsUnderline: boolean = false;

  public additionalNameFontFamily: string =
    "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public additionalNameWordWrap_: boolean = false;
  public additionalNameTextSize: number = 12;
  public additionalNameIsItalic: boolean = false;
  public additionalNameIsBold: boolean = false;
  public additionalNameIsUnderline: boolean = false;

  public additionalValueFontFamily: string =
    "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public additionalValueTextSize: number = 18;
  public additionalValueIsItalic: boolean = false;
  public additionalValueIsBold: boolean = false;
  public additionalValueIsUnderline: boolean = false;
}

export class Format {
  public displayUnit: number = 0;
  public decimalPlaces: number = 0;
  public suppressBlankAndNaN: boolean = true;
  public blankAndNaNReplaceText: string = "0";

  public additionalShow: boolean = true;
  public mainShow: boolean = true;
  public mainDisplayUnit: number = 1000;
  public mainDecimalPlaces: number = 0;
  public mainSuppressBlankAndNaN: boolean = true;
  public mainBlankAndNaNReplaceText: string = "0";
}

export class AdditiionalFormat {
  public metadata: string;
  public measureDisplayName: string;
  public displayUnit: number = 0;
  public decimalPlaces: number = 0;
  public suppressBlankAndNaN: boolean = true;
  public blankAndNaNReplaceText: string = "0";
  public componentType: string = "percentageChangeOver";
  public invertVariance: boolean = false;
}

export class Color {
  public color: string = "#333333";
  public mainColor: string = "#333333";

  public mainShow: boolean = false;
  public additionalShow: boolean = false;
}

export class AdditiionalColor {
  public metadata: string;
  public measureDisplayName: string;
  public componentType: string = "percentageChangeOver";
  public invertVariance: boolean = false;
  public unmatchedColor = { solid: { color: "#000000" } };
  public conditionFormatting: boolean = false;
  public condition1: boolean = true;
  public comparisonOperator1: string = ">=";
  public condition2: boolean = true;
  public comparisonOperator2: string = "<";
  public condition3: boolean = false;
  public comparisonOperator3: string = ">";
  public value1: number = 0;
  public value2: number = 0;
  public value3: number = null;
  public assignColor1 = { solid: { color: "#008864" } };
  public assignColor2 = { solid: { color: "#CB5033" } };
  public assignColor3 = { solid: { color: "#333333" } };
}
export class BulletChart {
  public show = false;
  public mainColor = "";
  public targetColor = "#ffffff";
  public borderShow: boolean = false;
  public borderFill: string = "#ffffff";
  public borderWeight: number = 1;
  public roundEdges: number = 1;
  public targetLineWeight: number = 3;
  public targetLineColor = "#333333";
  public targetLineShow = false;
}
export class CardSettings extends DataViewObjectsParser {
  public grid: Grid = new Grid();
  public alignment: Alignment = new Alignment();
  public background: Background = new Background();
  public font: Font = new Font();
  public format: Format = new Format();
  public additionalFormat: AdditiionalFormat[] = [];
  public color: Color = new Color();
  public additionalColor: AdditiionalColor[] = [];
  public constants: Constants = new Constants();
  public bulletChart: BulletChart = new BulletChart();
}

export class Constants {
  public categoryPaddingTop = 15;
  public categoryPaddingSide = 15;
  public mainMeasurePaddingSide = 15;
  public mainMeasurePaddingBottom = 15;
  public mainMeasurePaddingTop = 15;
  public additionalPaddingLeft = 15;
  public additionalPaddingRight = 15;
  public additionalPaddingTop = 15;
  public additionalPaddingBottom = 15;
  public marginOfMeasure = 0;
}
