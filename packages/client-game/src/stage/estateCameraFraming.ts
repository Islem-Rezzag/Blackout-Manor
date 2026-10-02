export const estateWorldViewport = (width: number, height: number) => {
  const top = Math.min(width <= 800 ? 348 : 208, height * 0.42);
  const bottom = Math.min(124, height * 0.2);
  return { x: 0, y: top, width, height: Math.max(1, height - top - bottom) };
};

export const estateOverviewZoom = (width: number, height: number) =>
  Math.min(width / 1640, estateWorldViewport(width, height).height / 1000);

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
      estateWorldViewport(options.width, options.height).height /
        (options.roomHeight + 150),
      1.8,
    ),
  );
