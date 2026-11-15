// Story types for Lume's edl-docs stories (CSF3, the Storybook format the
// tool reads). @edl-studio/docs ships no story types, and it lives outside
// the app's node_modules, so they are declared here.
import type { ComponentClass, ReactNode } from 'react';

// Function components, forwardRef/memo components (callable exotic
// components) and class components.
type PropsOf<C> = C extends (props: infer P) => unknown ? P : C extends ComponentClass<infer P> ? P : Record<string, unknown>;

export interface StoryContext {
  args: Record<string, unknown>;
  globals: Record<string, string>;
}

export interface ArgType {
  control?: 'text' | 'boolean' | 'number' | 'select' | 'radio' | 'color' | 'object' | false | { type: string };
  options?: readonly unknown[];
  description?: string;
  table?: { disable?: boolean };
  name?: string;
}

interface Annotations<P> {
  args?: Partial<P>;
  argTypes?: { [K in keyof P]?: ArgType } & Record<string, ArgType>;
  parameters?: {
    layout?: 'centered' | 'padded' | 'fullscreen';
    docs?: { description?: { component?: string; story?: string } };
    [key: string]: unknown;
  };
  decorators?: Array<(Story: () => ReactNode, context: StoryContext) => ReactNode>;
  render?: (args: P, context: StoryContext) => ReactNode;
  tags?: string[];
}

export interface Meta<C = unknown> extends Annotations<PropsOf<C>> {
  title: string;
  component?: C;
}

export interface StoryObj<C = unknown> extends Annotations<PropsOf<C>> {
  name?: string;
}
