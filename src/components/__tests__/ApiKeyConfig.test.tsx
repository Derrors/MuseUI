import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import ApiKeyConfig from '../ApiKeyConfig';
import { ThemeProvider } from '../ui';

const renderWithTheme = (ui: ReactElement) => render(
  <ThemeProvider appearance="light">
    {ui}
  </ThemeProvider>,
);

describe('ApiKeyConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows image edits endpoint preview and save status changes', async () => {
    renderWithTheme(<ApiKeyConfig lang="zh" />);

    await waitFor(() => {
      expect(screen.getAllByText((_, element) => (
        element?.tagName === 'CODE' && Boolean(element.textContent?.includes('/images/edits'))
      )).length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByPlaceholderText('https://api.openai.com/v1'), {
      target: { value: 'https://proxy.example/v1' },
    });

    expect(screen.getByText('有未保存更改')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(screen.getByText('已保存到浏览器本地')).toBeInTheDocument();
    });
  });
});
