import { Text, type TextProps } from 'react-native';





export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({ className, type = 'default', ...rest }: ThemedTextProps) {
  let typeClasses = '';

  switch (type) {
    case 'default':
      typeClasses = 'text-base leading-6 text-foreground';
      break;
    case 'title':
      typeClasses = 'text-3xl font-bold leading-8 text-foreground';
      break;
    case 'defaultSemiBold':
      typeClasses = 'text-base font-semibold leading-6 text-foreground';
      break;
    case 'subtitle':
      typeClasses = 'text-xl font-medium text-foreground';
      break;
    case 'link':
      typeClasses = 'text-base leading-7 text-primary-500';
      break;
  }

  return <Text className={`${typeClasses} ${className || ''}`} {...rest} />;
}
