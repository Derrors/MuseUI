import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GalleryManager from '../GalleryManager';
import type { GeneratedImage } from '../../types';

vi.mock('../../services/idbHistoryService', () => ({
  getHistoryPaginated: vi.fn(),
  saveImageToHistory: vi.fn(),
}));

const { getHistoryPaginated } = await import('../../services/idbHistoryService');

const createStickerSheet = (): GeneratedImage => ({
  id: 'sheet-1',
  url: 'data:image/png;base64,c2hlZXQ=',
  prompt: 'sticker sheet',
  timestamp: 1,
  details: {
    platform: 'Sticker',
    resolution: '1024x1024',
    style: 'Sticker',
    tokens: {} as any,
    fullPrompt: 'sticker sheet',
    sticker: {
      kind: 'sticker',
      transparentWorkflow: true,
      backgroundRemoved: true,
      backgroundColor: 'white',
      hasStickerBorder: true,
      hasText: false,
      hasReferenceImage: false,
      layoutMode: 'collection',
      isCollection: true,
      collectionCount: 1,
      collectionItems: [
        {
          id: 'item-1',
          url: 'data:image/png;base64,aXRlbQ==',
          prompt: 'child sticker',
          splitIndex: 0,
          splitMethod: 'manual',
        },
      ],
    },
  },
});

describe('GalleryManager sticker canvas restore behavior', () => {
  beforeEach(() => {
    vi.mocked(getHistoryPaginated).mockResolvedValue({
      items: [createStickerSheet()],
      hasMore: false,
      total: 1,
      page: 1,
      pageSize: 20,
    } as any);
  });

  it('adds sticker children to canvas without closing the gallery', async () => {
    const sheet = createStickerSheet();
    const onAddBatch = vi.fn();
    const onClose = vi.fn();

    render(
      <GalleryManager
        history={[sheet]}
        onUpdateHistory={vi.fn()}
        onSelect={vi.fn()}
        onAddBatch={onAddBatch}
        onClose={onClose}
        lang="en"
        onAddNotification={vi.fn()}
        projects={[]}
        currentProjectId={null}
      />,
    );

    fireEvent.click(await screen.findByAltText('gallery'));
    fireEvent.click(await screen.findByRole('button', { name: 'Canvas' }));

    expect(onAddBatch).toHaveBeenCalledWith(expect.any(Array), { closeGallery: false });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Design Details')).toBeInTheDocument();
  });

  it('restores ordinary zoomed images with the default close behavior', async () => {
    const sheet = createStickerSheet();
    const onAddBatch = vi.fn();
    const onClose = vi.fn();

    render(
      <GalleryManager
        history={[sheet]}
        onUpdateHistory={vi.fn()}
        onSelect={vi.fn()}
        onAddBatch={onAddBatch}
        onClose={onClose}
        lang="en"
        onAddNotification={vi.fn()}
        projects={[]}
        currentProjectId={null}
      />,
    );

    fireEvent.click(await screen.findByAltText('gallery'));
    fireEvent.click(await screen.findByRole('button', { name: 'Restore to Canvas' }));

    expect(onAddBatch).toHaveBeenCalledWith([sheet]);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
