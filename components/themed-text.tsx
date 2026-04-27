import { Text, type TextProps } from 'react-native';





export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({ className, type = 'default', ...rest }: ThemedTextProps) {
  let typeClasses = '';

  switch (type) {
    case 'default':
      typeClasses = 'text-base leading-6 text-gray-900 dark:text-white';
      break;
    case 'title':
      typeClasses = 'text-3xl font-bold leading-8 text-gray-900 dark:text-white';
      break;
    case 'defaultSemiBold':
      typeClasses = 'text-base font-semibold leading-6 text-gray-900 dark:text-white';
      break;
    case 'subtitle':
      typeClasses = 'text-xl font-bold text-gray-900 dark:text-white';
      break;
    case 'link':
      typeClasses = 'text-base leading-7 text-blue-600 dark:text-blue-400';
      break;
  }

  return <Text className={`${typeClasses} ${className || ''}`} {...rest} />;
}
