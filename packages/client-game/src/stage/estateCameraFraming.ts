export const estateOverviewZoom = (width: number, height: number) =>
  Math.min(width / 1640, Math.max(240, height - 230) / 1120);

export const estateInspectionZoom = (options: {
  width: number;
  height: number;
  roomWidth: number;
  roomHeight: number;
  overviewZoom: number;
}) =>
  Math.max(
    options.overviewZoom,
    Math.min(
      (options.width - 48) / (options.roomWidth + 110),
      Math.max(240, options.height - 245) / (options.roomHeight + 150),
      1.8,
    ),
  );
