import type { Artboard, ArtboardGroup, GeneratedImage } from '../../types';

export const addGeneratedArtboard = (
  artboards: Artboard[],
  image: GeneratedImage,
  dims: { width: number; height: number },
  label: string,
): Artboard[] => {
  const x = 50 + (artboards.length * 50);
  const y = 50 + (artboards.length * 50);
  return [
    ...artboards,
    {
      id: image.id,
      x,
      y,
      width: dims.width,
      height: dims.height,
      image,
      history: [image],
      label,
      groupId: undefined,
      isNew: true,
    },
  ];
};

export const addBatchArtboard = (
  artboards: Artboard[],
  image: GeneratedImage,
  dims: { width: number; height: number },
  label: string,
  groupId: string,
  x: number,
  y: number,
): Artboard[] => [
  ...artboards,
  {
    id: image.id,
    x,
    y,
    width: dims.width,
    height: dims.height,
    image,
    label,
    groupId,
    history: [image],
    isNew: true,
  },
];

export const replaceRegeneratedArtboard = (
  artboards: Artboard[],
  id: string,
  image: GeneratedImage,
  dims: { width: number; height: number },
): Artboard[] => artboards.map(board => {
  if (board.id !== id) return board;
  const newHistory = [...(board.history || (board.image ? [board.image] : [])), image];
  return {
    ...board,
    image,
    history: newHistory,
    width: dims.width,
    height: dims.height,
    isNew: true,
  };
});

export const updateBatchGroupBounds = (
  groups: ArtboardGroup[],
  groupId: string,
  width: number,
  height: number,
): ArtboardGroup[] => groups.map(group => (
  group.id === groupId
    ? { ...group, width, height: Math.max(group.height, height) }
    : group
));
