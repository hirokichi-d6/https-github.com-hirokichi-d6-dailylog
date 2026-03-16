export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(value);

export const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(new Date(value));

export const formatFileSize = (value: number) => {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatTemperatureRange = (
  temperature: number,
  temperatureMin: number | null,
  temperatureMax: number | null
) => {
  if (temperatureMin !== null && temperatureMax !== null) {
    if (temperatureMin === temperatureMax) {
      return String(temperatureMin) + "\u2103";
    }

    return String(temperatureMin) + "\u301C" + String(temperatureMax) + "\u2103";
  }

  if (temperatureMax !== null) {
    return String(temperatureMax) + "\u2103";
  }

  if (temperatureMin !== null) {
    return String(temperatureMin) + "\u2103";
  }

  return String(temperature) + "\u2103";
};