import React from 'react';
import {
  AlertDialog,
  Badge,
  Box,
  Button as RadixButton,
  Card as RadixCard,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Flex,
  Heading,
  IconButton as RadixIconButton,
  ScrollArea,
  Select,
  Separator,
  Switch,
  Tabs,
  Text,
  TextArea,
  TextField as RadixTextField,
  Theme,
  Tooltip,
} from '@radix-ui/themes';
import type { IconName } from '../IconLoader';
import IconLoader from '../IconLoader';

export { Badge, Box, Flex, Heading, ScrollArea, Separator, Tabs, Text, Theme };

export type ThemeProviderProps = {
  appearance: 'light' | 'dark';
  children: React.ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ appearance, children }) => (
  <Theme
    appearance={appearance}
    accentColor="ruby"
    grayColor="sage"
    radius="medium"
    scaling="95%"
    panelBackground="solid"
  >
    {children}
  </Theme>
);

export type ButtonProps = React.ComponentProps<typeof RadixButton> & {
  iconName?: IconName;
  trailingIconName?: IconName;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ iconName, trailingIconName, children, ...props }, ref) => {
    if (props.asChild) {
      const child = React.Children.only(children);
      if (React.isValidElement<{ children?: React.ReactNode }>(child) && (iconName || trailingIconName)) {
        return (
          <RadixButton ref={ref} {...props}>
            {React.cloneElement(child, undefined, (
              <>
                {iconName && <IconLoader name={iconName} size={15} />}
                {child.props.children}
                {trailingIconName && <IconLoader name={trailingIconName} size={15} />}
              </>
            ))}
          </RadixButton>
        );
      }

      return (
        <RadixButton ref={ref} {...props}>
          {child}
        </RadixButton>
      );
    }

    return (
      <RadixButton ref={ref} {...props}>
        {iconName && <IconLoader name={iconName} size={15} />}
        {children}
        {trailingIconName && <IconLoader name={trailingIconName} size={15} />}
      </RadixButton>
    );
  },
);
Button.displayName = 'Button';

export type IconButtonProps = React.ComponentProps<typeof RadixIconButton> & {
  iconName: IconName;
  label: string;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ iconName, label, ...props }, ref) => (
    <RadixIconButton ref={ref} aria-label={label} title={label} {...props}>
      <IconLoader name={iconName} size={16} />
    </RadixIconButton>
  ),
);
IconButton.displayName = 'IconButton';

export const Card = RadixCard;

export type DialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeLabel?: string;
};

const dialogSizeClass = {
  sm: 'sm:!max-w-md',
  md: 'sm:!max-w-2xl',
  lg: 'sm:!max-w-4xl',
  xl: 'sm:!max-w-6xl',
  full: 'sm:!max-w-[min(1180px,calc(100vw-48px))]',
};

export const DialogShell: React.FC<DialogShellProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeLabel = 'Close',
}) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Content className={`mx-auto my-0 box-border !w-[calc(100vw-16px)] !max-w-[calc(100vw-16px)] sm:!w-[min(100vw-32px,100%)] ${dialogSizeClass[size]} max-h-[calc(100dvh-16px)] overflow-hidden p-0`}>
      <Flex direction="column" className="max-h-[calc(100dvh-16px)]">
        <Flex align="start" justify="between" gap="4" className="border-b border-[var(--gray-5)] px-5 py-4">
          <Box className="min-w-0">
            <Dialog.Title>{title}</Dialog.Title>
            {description && (
              <Dialog.Description color="gray">{description}</Dialog.Description>
            )}
          </Box>
          <Dialog.Close>
            <IconButton iconName="x" label={closeLabel} variant="ghost" color="gray" />
          </Dialog.Close>
        </Flex>
        <Box className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {children}
        </Box>
        {footer && (
          <Flex justify="end" gap="3" className="border-t border-[var(--gray-5)] px-5 py-4">
            {footer}
          </Flex>
        )}
      </Flex>
    </Dialog.Content>
  </Dialog.Root>
);

export type AlertDialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
};

export const AlertDialogShell: React.FC<AlertDialogShellProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
}) => (
  <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Content maxWidth="420px">
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description size="2" color="gray">
        {description}
      </AlertDialog.Description>
      <Flex gap="3" justify="end" mt="5">
        <AlertDialog.Cancel>
          <Button variant="soft" color="gray">{cancelLabel}</Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action>
          <Button color={destructive ? 'red' : 'ruby'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </AlertDialog.Action>
      </Flex>
    </AlertDialog.Content>
  </AlertDialog.Root>
);

export type MenuItem = {
  label: React.ReactNode;
  iconName?: IconName;
  shortcut?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  mobileApiEntry?: boolean;
  onSelect?: () => void;
};

const MenuItemContent: React.FC<MenuItem> = ({ iconName, label, shortcut }) => (
  <Flex align="center" gap="2" justify="between" className="min-w-0">
    <Flex align="center" gap="2" className="min-w-0">
      {iconName && <IconLoader name={iconName} size={14} />}
      <Text className="truncate">{label}</Text>
    </Flex>
    {shortcut && <Text size="1" color="gray">{shortcut}</Text>}
  </Flex>
);

export const DropdownMenuShell: React.FC<{
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: 'start' | 'center' | 'end';
}> = ({ trigger, items, align = 'end' }) => (
  <DropdownMenu.Root modal={false}>
    <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>
    <DropdownMenu.Content align={align} variant="soft">
      {items.map((item, index) => (
        <DropdownMenu.Item
          key={index}
          color={item.destructive ? 'red' : undefined}
          disabled={item.disabled}
          onSelect={item.onSelect}
          data-mobile-menu-api-entry={item.mobileApiEntry ? true : undefined}
        >
          <MenuItemContent {...item} />
        </DropdownMenu.Item>
      ))}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
);

export const ContextMenuShell: React.FC<{
  children: React.ReactNode;
  items: MenuItem[];
}> = ({ children, items }) => (
  <ContextMenu.Root>
    <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
    <ContextMenu.Content variant="soft">
      {items.map((item, index) => (
        <ContextMenu.Item
          key={index}
          color={item.destructive ? 'red' : undefined}
          disabled={item.disabled}
          onSelect={item.onSelect}
          data-mobile-menu-api-entry={item.mobileApiEntry ? true : undefined}
        >
          <MenuItemContent {...item} />
        </ContextMenu.Item>
      ))}
    </ContextMenu.Content>
  </ContextMenu.Root>
);

export type SelectFieldOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export const SelectField: React.FC<{
  label?: React.ReactNode;
  description?: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectFieldOption[];
  disabled?: boolean;
  placeholder?: string;
}> = ({ label, description, value, onValueChange, options, disabled, placeholder }) => (
  <Box>
    {label && <Text as="label" size="1" weight="bold" color="gray">{label}</Text>}
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger placeholder={placeholder} className="mt-1 w-full" />
      <Select.Content>
        {options.map(option => (
          <Select.Item key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
    {description && <Text as="p" size="1" color="gray" mt="1">{description}</Text>}
  </Box>
);

export const TextFieldControl: React.FC<{
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  value: string | number;
  onValueChange: (value: string) => void;
  type?: React.ComponentProps<typeof RadixTextField.Root>['type'];
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}> = ({ label, description, error, value, onValueChange, type = 'text', placeholder, disabled, autoFocus, className, onBlur, onKeyDown }) => (
  <Box>
    {label && <Text as="label" size="1" weight="bold" color="gray">{label}</Text>}
    <RadixTextField.Root
      mt="1"
      value={value}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={className}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onChange={event => onValueChange(event.target.value)}
    />
    {description && <Text as="p" size="1" color="gray" mt="1">{description}</Text>}
    {error && <Text as="p" size="1" color="red" mt="1">{error}</Text>}
  </Box>
);

export const TextField = TextFieldControl;

export const TextAreaField: React.FC<{
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
}> = ({ label, description, error, value, onValueChange, placeholder, disabled, rows = 4, className }) => (
  <Box>
    {label && <Text as="label" size="1" weight="bold" color="gray">{label}</Text>}
    <TextArea
      mt="1"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={className}
      onChange={event => onValueChange(event.target.value)}
    />
    {description && <Text as="p" size="1" color="gray" mt="1">{description}</Text>}
    {error && <Text as="p" size="1" color="red" mt="1">{error}</Text>}
  </Box>
);

export const SwitchField: React.FC<{
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ label, description, checked, onCheckedChange, disabled }) => (
  <Flex align="center" justify="between" gap="3">
    <Box>
      <Text size="2" weight="medium">{label}</Text>
      {description && <Text as="p" size="1" color="gray">{description}</Text>}
    </Box>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </Flex>
);

export const TabsShell: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: React.ReactNode; disabled?: boolean }[];
  children?: React.ReactNode;
}> = ({ value, onValueChange, items, children }) => (
  <Tabs.Root value={value} onValueChange={onValueChange}>
    <Tabs.List className="w-full">
      {items.map(item => (
        <Tabs.Trigger key={item.value} value={item.value} disabled={item.disabled} className="flex-1">
          {item.label}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
    {children}
  </Tabs.Root>
);

export const TooltipShell: React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
}> = ({ content, children }) => (
  <Tooltip content={content}>
    {children}
  </Tooltip>
);

export const ScrollPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <ScrollArea type="auto" scrollbars="vertical" className={className}>
    {children}
  </ScrollArea>
);
