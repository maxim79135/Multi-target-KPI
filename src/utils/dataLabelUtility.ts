"use strict";

import powerbi from "powerbi-visuals-api";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

const localizedUnits = {
  "ru-RU_K": " тыс.",
  "ru-RU_M": " млн",
  "ru-RU_bn": " млрд",
  "ru-RU_T": " трлн",
};

function formatMeasure(data, properties) {
  const formatter = valueFormatter.create(properties);
  return formatter.format(data);
}

function localizeUnit(value: string, unit: string, culture: string): string {
  let localizedUnit = localizedUnits[culture + "_" + unit];
  if (localizeUnit) {
    return value.replace(unit, localizedUnit);
  } else return value;
}

export function prepareMeasureText(
  value: any,
  valueType: string,
  format: string,
  displayUnit: number,
  precision: number,
  addPlusforPositiveValue: boolean,
  suppressBlankAndNaN: boolean,
  blankAndNaNReplaceText: string,
  culture: string
): string {
  let valueFormatted: string = "";
  if (suppressBlankAndNaN) valueFormatted = blankAndNaNReplaceText;
  if (!(suppressBlankAndNaN && value == null)) {
    if ((valueType = "numeric")) {
      if (!(isNaN(value as number) && suppressBlankAndNaN)) {
        valueFormatted = formatMeasure(value as number, {
          format: format,
          value: displayUnit === 0 ? (value as number) : displayUnit,
          precision: precision,
          allowFormatBeautification: false,
          cultureSelector: culture,
        });
        if (!isNaN(value) && displayUnit == 1) {
          valueFormatted = valueFormatted.replace(",", ".");
          valueFormatted = Number(valueFormatted).toFixed(precision);
        }

        if (culture != "en-US") {
          valueFormatted = localizeUnit(valueFormatted, "K", culture);
          valueFormatted = localizeUnit(valueFormatted, "M", culture);
          valueFormatted = localizeUnit(valueFormatted, "bn", culture);
          valueFormatted = localizeUnit(valueFormatted, "T", culture);
        }
        if (addPlusforPositiveValue && (value as number) > 0)
          valueFormatted = "+" + valueFormatted;
      }
    } else {
      valueFormatted = formatMeasure(
        (valueType = "dateTime" ? new Date(value as string) : value),
        {
          format: format,
          cultureSelector: culture,
        }
      );
    }
  }
  return valueFormatted;
}
