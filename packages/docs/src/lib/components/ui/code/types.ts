/*
	Installed from @ieedan/shadcn-svelte-extras
*/

import type { WithChildren, WithoutChildren } from 'bits-ui';
import type { HTMLAttributes } from 'svelte/elements';
import type { CodeVariant } from '$lib/components/ui/code';
import type { CopyButtonProps } from '$lib/components/ui/copy-button';
import type { SupportedLanguage } from './shiki';

export type CodeRootPropsWithoutHTML = WithChildren<{
	ref?: HTMLDivElement | null;
	variant?: CodeVariant;
	lang?: SupportedLanguage;
	code: string;
	class?: string;
	hideLines?: boolean;
	highlight?: (number | [number, number])[];
}>;

export type CodeRootProps = CodeRootPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLDivElement>>;

export type CodeOverflowPropsWithoutHTML = WithChildren<{
	collapsed?: boolean;
}>;

export type CodeOverflowProps = CodeOverflowPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLDivElement>>;

export type CodeCopyButtonProps = Omit<CopyButtonProps, 'text'>;
