import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MobileBottomNav from '../MobileBottomNav';

describe('MobileBottomNav', () => {
  it('shows the canvas artboard count badge and switches panes', () => {
    const onChange = vi.fn();

    render(<MobileBottomNav activePane="config" onChange={onChange} lang="zh" artboardCount={3} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /画布/ }));

    expect(onChange).toHaveBeenCalledWith('canvas');
  });
});
