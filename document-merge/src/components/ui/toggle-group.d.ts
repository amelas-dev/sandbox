import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
declare const ToggleGroup: React.ForwardRefExoticComponent<(ToggleGroupPrimitive.ToggleGroupSingleProps | ToggleGroupPrimitive.ToggleGroupMultipleProps) & React.RefAttributes<HTMLDivElement>>;
declare const ToggleGroupItem: React.ForwardRefExoticComponent<Omit<ToggleGroupPrimitive.ToggleGroupItemProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export { ToggleGroup, ToggleGroupItem };
