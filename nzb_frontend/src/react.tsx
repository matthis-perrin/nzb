import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SVGAttributes,
} from 'react';

type Custom<
  Props,
  Attribute extends HTMLAttributes<Element>,
  Element extends HTMLElement | SVGElement
> = FC<Props & Omit<DetailedHTMLProps<Attribute, Element>, 'ref'>>;

export type DivProps = Omit<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  'ref'
>;

export type InputProps = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'ref'
>;

export type CustomDiv<Props> = Custom<Props, HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
export type CustomButton<Props> = Custom<
  Props,
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;
export type CustomInput<Props> = Custom<
  Props,
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;
export type CustomLabel<Props> = Custom<
  Props,
  LabelHTMLAttributes<HTMLLabelElement>,
  HTMLLabelElement
>;
export type CustomAnchor<Props> = Custom<
  Props,
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>;
export type CustomSvg<Props> = Custom<Props, SVGAttributes<SVGElement>, SVGElement>;
export type CustomImg<Props> = Custom<Props, ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

// eslint-disable-next-line no-null/no-null
export const NULL_REF = null;
